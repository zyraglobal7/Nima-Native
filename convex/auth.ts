import { action } from './_generated/server';
import { v } from 'convex/values';

const WORKOS_TOKEN_URL = 'https://api.workos.com/user_management/authenticate';

/**
 * Exchange an authorization code for a WorkOS access token.
 * This is done server-side to avoid CORS issues on the client (web).
 */
export const exchangeWorkOSCode = action({
  args: {
    code: v.string(),
    code_verifier: v.string(),
    redirect_uri: v.string(),
  },
  handler: async (ctx, args) => {
    // These must be set in your Convex Dashboard environment variables
    const clientId = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID;
    
    // Note: WorkOS AuthKit doesn't strictly require a secret for implicit/PKCE flow
    // but the token endpoint might expect client_id at minimum.
    // If your WorkOS integration requires a secret, add WORKOS_API_KEY to env vars.
    
    if (!clientId) {
      throw new Error('Missing EXPO_PUBLIC_WORKOS_CLIENT_ID in Convex env vars');
    }

    const response = await fetch(WORKOS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: args.code,
        code_verifier: args.code_verifier,
        // Optional: client_secret if you decide to use it, but PKCE usually avoids it
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WorkOS Token Exchange Failed:', response.status, errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const data = await response.json();
    return data;
  },
});
