import { useState, useEffect, useCallback, useRef } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getUserInfo,
  setUserInfo,
  clearAllTokens,
  type StoredUserInfo,
} from './auth-storage';

// Complete any pending auth sessions on app start
WebBrowser.maybeCompleteAuthSession();

// ---------- Constants ----------

const WORKOS_CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID!;
const REDIRECT_URI = process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI!;

const WORKOS_AUTH_URL = 'https://api.workos.com/user_management/authorize';
const WORKOS_TOKEN_URL = 'https://api.workos.com/user_management/authenticate';

// ---------- PKCE Helpers ----------

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  // Use Math.random as a fallback; expo-crypto is used for the challenge
  for (let i = 0; i < length; i++) {
    randomValues[i] = Math.floor(Math.random() * chars.length);
  }
  return Array.from(randomValues, (v) => chars[v % chars.length]).join('');
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  // Convert standard base64 to base64url
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------- Token Refresh ----------

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const response = await fetch(WORKOS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: WORKOS_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('[AUTH] Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    console.error('[AUTH] Token refresh error:', error);
    return null;
  }
}

// ---------- JWT Helpers ----------

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to ms
    // Consider expired 60 seconds before actual expiry
    return Date.now() >= exp - 60_000;
  } catch {
    return true;
  }
}

// ---------- Main Auth Hook ----------

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: StoredUserInfo | null;
}

/**
 * Main auth hook for Convex's ConvexProviderWithAuth.
 * 
 * Manages the full WorkOS OAuth PKCE flow:
 * 1. Loads persisted tokens from secure storage on mount
 * 2. Provides signIn/signUp to launch the WorkOS hosted login
 * 3. Handles the deep link callback with code exchange
 * 4. Provides fetchAccessToken for Convex's auth system
 * 5. Handles silent token refresh
 */
export function useAuthFromWorkOS() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  const codeVerifierRef = useRef<string | null>(null);

  // Load persisted auth state on mount
  useEffect(() => {
    let mounted = true;

    async function loadPersistedAuth() {
      try {
        const [token, userInfo] = await Promise.all([
          getAccessToken(),
          getUserInfo(),
        ]);

        if (mounted && token && userInfo) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            const storedRefreshToken = await getRefreshToken();
            if (storedRefreshToken) {
              const refreshed = await refreshAccessToken(storedRefreshToken);
              if (refreshed) {
                await setAccessToken(refreshed.accessToken);
                await setRefreshToken(refreshed.refreshToken);
                setState({
                  isLoading: false,
                  isAuthenticated: true,
                  user: userInfo,
                });
                return;
              }
            }
            // Refresh failed — clear everything
            await clearAllTokens();
            setState({ isLoading: false, isAuthenticated: false, user: null });
          } else {
            setState({
              isLoading: false,
              isAuthenticated: true,
              user: userInfo,
            });
          }
        } else {
          setState({ isLoading: false, isAuthenticated: false, user: null });
        }
      } catch (error) {
        console.error('[AUTH] Failed to load persisted auth:', error);
        if (mounted) {
          setState({ isLoading: false, isAuthenticated: false, user: null });
        }
      }
    }

    loadPersistedAuth();
    return () => { mounted = false; };
  }, []);

  // Fetch access token for Convex
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}): Promise<string | null> => {
      try {
        const token = await getAccessToken();
        if (!token) return null;

        // Force refresh if requested or token is expired
        if (forceRefreshToken || isTokenExpired(token)) {
          const storedRefreshToken = await getRefreshToken();
          if (!storedRefreshToken) return null;

          const refreshed = await refreshAccessToken(storedRefreshToken);
          if (refreshed) {
            await setAccessToken(refreshed.accessToken);
            await setRefreshToken(refreshed.refreshToken);
            return refreshed.accessToken;
          }

          // Refresh failed — sign out
          await clearAllTokens();
          setState({ isLoading: false, isAuthenticated: false, user: null });
          return null;
        }

        return token;
      } catch (error) {
        console.error('[AUTH] fetchAccessToken error:', error);
        return null;
      }
    },
    []
  );

  return {
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    fetchAccessToken,
  };
}

// ---------- Auth Actions (used by sign-in/sign-up screens) ----------

/**
 * Launch the WorkOS AuthKit hosted login page.
 * Opens an in-app browser, and handles the OAuth PKCE flow.
 * 
 * @param mode - 'sign-in' or 'sign-up'
 * @returns The auth result with tokens and user info, or null if cancelled/failed
 */
export async function launchWorkOSAuth(mode: 'sign-in' | 'sign-up' = 'sign-in'): Promise<{
  accessToken: string;
  refreshToken: string;
  user: StoredUserInfo;
} | null> {
  try {
    // Generate PKCE challenge
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await createCodeChallenge(codeVerifier);

    // Build authorization URL
    console.log('[AUTH] Using Redirect URI:', REDIRECT_URI);
    console.log('[AUTH] Client ID:', WORKOS_CLIENT_ID);

    const params = new URLSearchParams({
      client_id: WORKOS_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      provider: 'authkit',
      ...(mode === 'sign-up' ? { screen_hint: 'sign-up' } : {}),
    });

    const authUrl = `${WORKOS_AUTH_URL}?${params.toString()}`;

    // Open in-app browser
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

    if (result.type !== 'success' || !result.url) {
      console.log('[AUTH] Auth session cancelled or failed:', result.type);
      return null;
    }

    // Extract authorization code from callback URL
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (!code) {
      console.error('[AUTH] No authorization code in callback URL');
      return null;
    }

    // Exchange code for tokens via Convex Action (avoids CORS)
    // We use a temporary ConvexHttpClient here since this is a standalone function
    // outside of the React component tree.
    const convex = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL!);
    
    // Call the action defined in convex/auth.ts
    const tokenData = await convex.action(api.auth.exchangeWorkOSCode, {
      code,
      code_verifier: codeVerifier,
      redirect_uri: REDIRECT_URI,
    });

    const accessToken: string = tokenData.access_token;
    const refreshTokenValue: string = tokenData.refresh_token;
    const workosUser = tokenData.user;

    if (!accessToken || !workosUser) {
      console.error('[AUTH] Missing tokens or user in response');
      return null;
    }

    // Build user info
    const userInfo: StoredUserInfo = {
      id: workosUser.id,
      email: workosUser.email,
      firstName: workosUser.first_name || undefined,
      lastName: workosUser.last_name || undefined,
      profilePictureUrl: workosUser.profile_picture_url || undefined,
      emailVerified: workosUser.email_verified ?? false,
    };

    // Persist tokens and user info
    await Promise.all([
      setAccessToken(accessToken),
      setRefreshToken(refreshTokenValue),
      setUserInfo(userInfo),
    ]);

    return { accessToken, refreshToken: refreshTokenValue, user: userInfo };
  } catch (error) {
    console.error('[AUTH] launchWorkOSAuth error:', error);
    return null;
  }
}

/**
 * Sign out — clear all persisted tokens.
 */
export async function signOut(): Promise<void> {
  await clearAllTokens();
}
