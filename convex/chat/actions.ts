'use node';

/**
 * Chat Actions
 * Actions for AI-driven chat workflows including look generation and image creation
 */

import { action, internalAction, ActionCtx } from '../_generated/server';
import { api, internal } from '../_generated/api';
import { v } from 'convex/values';
import type { Id, Doc } from '../_generated/dataModel';
import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// ============================================================================
// Nima System Prompt (shared with /api/chat/route.ts)
// ============================================================================

function buildUserContext(userData: {
  gender?: string;
  stylePreferences?: string[];
  budgetRange?: string;
  shirtSize?: string;
  waistSize?: string;
  shoeSize?: string;
  shoeSizeUnit?: string;
  country?: string;
  currency?: string;
  firstName?: string;
  age?: string;
} | undefined): string {
  if (!userData) return '\n\n## User Profile:\n⚠️ No user profile available - ask for basic preferences.';

  const contextParts: string[] = [];
  
  if (userData.firstName) {
    contextParts.push(`👤 User's name: ${userData.firstName} (ALWAYS address them by this name)`);
  }
  
  if (userData.gender) {
    if (userData.gender === 'male') {
      contextParts.push(`⚠️ GENDER: MALE - Only suggest masculine clothing (shirts, pants, suits, sneakers, boots). NO dresses, skirts, or feminine items.`);
    } else if (userData.gender === 'female') {
      contextParts.push(`⚠️ GENDER: FEMALE - Can suggest dresses, skirts, tops, heels, and any clothing items.`);
    } else {
      contextParts.push(`⚠️ GENDER: Not specified - Suggest gender-neutral options only.`);
    }
  } else {
    contextParts.push(`⚠️ GENDER: Not specified - Suggest gender-neutral options only.`);
  }
  
  if (userData.age) contextParts.push(`Age: ${userData.age}`);
  if (userData.stylePreferences && userData.stylePreferences.length > 0) {
    contextParts.push(`Style preferences: ${userData.stylePreferences.join(', ')}`);
  }
  if (userData.budgetRange) {
    const budgetLabels: Record<string, string> = { low: 'Budget-conscious', mid: 'Mid-range', premium: 'Premium/Luxury' };
    contextParts.push(`Budget: ${budgetLabels[userData.budgetRange] || userData.budgetRange}`);
  }
  if (userData.shirtSize) contextParts.push(`Shirt size: ${userData.shirtSize}`);
  if (userData.waistSize) contextParts.push(`Waist size: ${userData.waistSize}`);
  if (userData.shoeSize && userData.shoeSizeUnit) contextParts.push(`Shoe size: ${userData.shoeSize} ${userData.shoeSizeUnit}`);
  if (userData.country) contextParts.push(`Location: ${userData.country}`);
  if (userData.currency) contextParts.push(`Preferred currency: ${userData.currency}`);

  return `\n\n## User Profile (USE THIS DATA - DO NOT ASK AGAIN):\n${contextParts.join('\n')}`;
}

const NIMA_SYSTEM_PROMPT = `You are Nima, a warm, confident AI personal stylist. You already know the user's style profile — use it, don't ask about it.

## Your Personality
- Warm, direct, and fashion-savvy — like a stylish friend, not an interviewer
- Casual conversational tone with occasional emojis ✨💫
- Concise: 1-3 sentences max per response
- Address users by name when you know it

## Critical: Do NOT Over-Question
You have the user's full style profile. Do NOT ask about things you already know (gender, style preferences, budget, sizes). For occasions, use your best judgement and search immediately — only ask a single quick question if the request is genuinely ambiguous. If there's ANY reasonable interpretation, just go with it and search.

## Wardrobe vs. New — Smart Handling
The system tells you whether the user has wardrobe items (see "User's Wardrobe" section below).

**If the user HAS wardrobe items** and makes their FIRST styling request, ask once whether they want:
- **New pieces** from the catalogue
- **Their wardrobe** (items they already own)
- **Both** — mix wardrobe pieces with fresh finds
Then trigger [MATCH_ITEMS] immediately in the SAME response with the appropriate source.

**If the user has NO wardrobe items (empty wardrobe):**
- NEVER ask about wardrobe — just use source=new
- If they explicitly ask to use their wardrobe (e.g. "style what I have", "from my wardrobe"), tell them:
  "You don't have any items in your wardrobe yet! Upload some pieces in the Wardrobe tab and I'll style them for you. For now, let me pull fresh looks from the catalogue."
  Then trigger [MATCH_ITEMS:occasion|new]

Skip the wardrobe/new question if:
- They've already specified (e.g. "from my wardrobe", "new outfit", "something new")
- It's a follow-up in an ongoing conversation
- Their wardrobe is empty (just default to new)

## Default Behaviour
- When a user specifies new/wardrobe/both → trigger [MATCH_ITEMS:occasion|source] in the SAME response, immediately
- If they have wardrobe items listed, reference them naturally
- Only ask a follow-up question if the occasion is truly unclear (e.g. "outfit" with no other context)

## MATCH_ITEMS occasion string — CRITICAL RULES
The occasion string must include a formality signal so item filtering works correctly:
- Formal/professional: MUST include one of: interview, formal, professional, suit, corporate, business
- Smart casual: MUST include one of: work, office, date, brunch, dinner, smart, semi-formal
- Casual/streetwear: MUST include one of: casual, concert, festival, streetwear, weekend, hangout, beach, gym, party
- Evening/black-tie: MUST include one of: wedding, gala, evening, cocktail, prom

WRONG: [MATCH_ITEMS:travis scott look|both] — no formality signal
RIGHT: [MATCH_ITEMS:travis scott concert streetwear casual|both]

## Examples
- User: "I need an outfit for a date" → Ask wardrobe/new first, then on next message: "Perfect! [MATCH_ITEMS:romantic date smart casual dinner|new]"
- User: "New work outfits" → "Sharp! [MATCH_ITEMS:work office professional business|new]"
- User: "Job interview outfit from my wardrobe" → "Let's make you look unstoppable! [MATCH_ITEMS:job interview formal professional|wardrobe]"
- User: "Casual weekend look, mix old and new" → "Easy vibes! [MATCH_ITEMS:casual weekend hangout|both]"
- User: "Festival outfit" → Ask wardrobe/new, then: "Let's go wild! [MATCH_ITEMS:music festival streetwear casual|new]"
- User: "Travis Scott concert" → Ask wardrobe/new, then: "Let's get hyped! [MATCH_ITEMS:travis scott concert streetwear casual hype|new]"

## CRITICAL: Gender-Appropriate Suggestions
- MALE: NEVER suggest dresses, skirts, blouses, heels, or feminine items
- FEMALE: dresses, skirts, tops, heels are all fine
- Unknown: gender-neutral only

## Special Commands (MUST appear at END of response)
- [MATCH_ITEMS:occasion|source] — triggers look generation. source MUST be one of: new | wardrobe | both
- [REMIX_LOOK:source_occasion|twist] — remix a saved look style

## Wardrobe Integration
If the user has wardrobe items listed below, actively reference them when relevant.
`;

// Message type for the action
const chatMessageValidator = v.object({
  role: v.union(v.literal('user'), v.literal('assistant')),
  content: v.string(),
});

const userDataValidator = v.object({
  gender: v.optional(v.string()),
  stylePreferences: v.optional(v.array(v.string())),
  budgetRange: v.optional(v.string()),
  shirtSize: v.optional(v.string()),
  waistSize: v.optional(v.string()),
  shoeSize: v.optional(v.string()),
  shoeSizeUnit: v.optional(v.string()),
  country: v.optional(v.string()),
  currency: v.optional(v.string()),
  firstName: v.optional(v.string()),
  age: v.optional(v.string()),
});

const wardrobeItemValidator = v.object({
  description: v.string(),
  category: v.string(),
  color: v.string(),
  formality: v.string(),
});

/**
 * Send a chat message to Nima and get an AI response (non-streaming)
 * Used by React Native since it can't use the web streaming /api/chat route
 */
export const sendChatMessage = action({
  args: {
    messages: v.array(chatMessageValidator),
    userData: v.optional(userDataValidator),
    wardrobeItems: v.optional(v.array(wardrobeItemValidator)),
  },
  returns: v.object({
    content: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx: ActionCtx,
    args: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      userData?: {
        gender?: string;
        stylePreferences?: string[];
        budgetRange?: string;
        shirtSize?: string;
        waistSize?: string;
        shoeSize?: string;
        shoeSizeUnit?: string;
        country?: string;
        currency?: string;
        firstName?: string;
        age?: string;
      };
      wardrobeItems?: Array<{
        description: string;
        category: string;
        color: string;
        formality: string;
      }>;
    }
  ): Promise<{ content: string; success: boolean; error?: string }> => {
    try {
      // Verify user is authenticated
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { content: '', success: false, error: 'Not authenticated' };
      }

      // Build system prompt with user context
      const userContext = buildUserContext(args.userData);
      let wardrobeContext: string;
      if (args.wardrobeItems && args.wardrobeItems.length > 0) {
        const itemLines = args.wardrobeItems.map(
          (item) => `- ${item.description} (${item.category}, ${item.color}, ${item.formality})`
        );
        wardrobeContext = `\n\n## User's Wardrobe (${args.wardrobeItems.length} items):\n${itemLines.join('\n')}\nThe user has wardrobe items — you may ask whether they want looks from their wardrobe, new catalogue items, or both.`;
      } else {
        wardrobeContext = `\n\n## User's Wardrobe:\n⚠️ EMPTY — the user has NOT uploaded any wardrobe items. Do NOT ask about wardrobe vs. new. Always use source=new. If they specifically ask to use their wardrobe, tell them to upload items first in the Wardrobe tab.`;
      }
      const systemPrompt = NIMA_SYSTEM_PROMPT + userContext + wardrobeContext;

      // Get OpenAI provider
      const vercelGatewayKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
      const openai = vercelGatewayKey
        ? createOpenAI({ apiKey: vercelGatewayKey, baseURL: 'https://api.vercel.ai/v1' })
        : createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Call GPT (non-streaming for RN compatibility)
      const result = await generateText({
        model: openai('gpt-4.1'),
        system: systemPrompt,
        messages: args.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        maxOutputTokens: 500,
      });

      console.log('[CHAT:SEND_MESSAGE] AI response generated successfully');
      console.log('[CHAT:SEND_MESSAGE] Raw AI response text:', result.text);

      // Log whether MATCH_ITEMS tag is present and what source it specifies
      const tagMatch = result.text.match(/\[MATCH_ITEMS:([^\]]+)\]/);
      if (tagMatch) {
        const parts = tagMatch[1].split('|');
        console.log(`[CHAT:SEND_MESSAGE] MATCH_ITEMS tag found — occasion: "${parts[0]}", source: "${parts[1] ?? 'MISSING'}"`);
      } else {
        console.log('[CHAT:SEND_MESSAGE] No MATCH_ITEMS tag in AI response');
      }

      // Log wardrobe context that was sent to the AI
      console.log(`[CHAT:SEND_MESSAGE] Wardrobe items provided: ${args.wardrobeItems?.length ?? 0}`);

      return {
        content: result.text,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CHAT:SEND_MESSAGE] Error:', error);
      return {
        content: '',
        success: false,
        error: errorMessage,
      };
    }
  },
});

/**
 * Generate images for looks created from chat
 * This is a public action that can be called from the client
 * Generates images for multiple looks in sequence
 */
export const generateChatLookImages = action({
  args: {
    lookIds: v.array(v.id('looks')),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(
      v.object({
        lookId: v.id('looks'),
        success: v.boolean(),
        error: v.optional(v.string()),
      })
    ),
  }),
  handler: async (
    ctx: ActionCtx,
    args: { lookIds: Id<'looks'>[] }
  ): Promise<{
    success: boolean;
    results: Array<{
      lookId: Id<'looks'>;
      success: boolean;
      error?: string;
    }>;
  }> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        results: [],
      };
    }

    // Get user ID from identity
    const user = await ctx.runQuery(api.users.queries.getUserByWorkosId, {
      workosUserId: identity.subject,
    });

    if (!user) {
      return {
        success: false,
        results: [],
      };
    }

    console.log(`[CHAT:GENERATE_IMAGES] Scheduling image generation for ${args.lookIds.length} looks`);

    // Schedule each look generation as an independent task.
    // Running them sequentially via ctx.runAction causes the parent action's auth token
    // to expire (~30s) before looks 2 and 3 start. Scheduling gives each look its own
    // execution context with a fresh auth state.
    const results: Array<{
      lookId: Id<'looks'>;
      success: boolean;
      error?: string;
    }> = [];

    for (const lookId of args.lookIds) {
      await ctx.scheduler.runAfter(0, internal.workflows.actions.generateLookImage, {
        lookId,
        userId: user._id,
      });
      results.push({ lookId, success: true });
      console.log(`[CHAT:GENERATE_IMAGES] Scheduled image generation for look ${lookId}`);
    }

    console.log(`[CHAT:GENERATE_IMAGES] Scheduled ${args.lookIds.length} look generations`);

    return {
      success: true,
      results,
    };
  },
});

/**
 * AI Fallback for outfit composition
 * Uses GPT to intelligently compose outfits when rule-based matching fails or needs creativity
 */
export const composeOutfitWithAI = internalAction({
  args: {
    userId: v.id('users'),
    occasion: v.optional(v.string()),
    context: v.optional(v.string()),
    availableItemIds: v.array(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      outfits: v.array(
        v.object({
          itemIds: v.array(v.string()),
          name: v.string(),
          occasion: v.string(),
          nimaComment: v.string(),
        })
      ),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (
    ctx: ActionCtx,
    args: {
      userId: Id<'users'>;
      occasion?: string;
      context?: string;
      availableItemIds: string[];
    }
  ): Promise<
    | {
        success: true;
        outfits: Array<{
          itemIds: string[];
          name: string;
          occasion: string;
          nimaComment: string;
        }>;
      }
    | { success: false; error: string }
  > => {
    console.log('[CHAT:AI_COMPOSE] Starting AI outfit composition');

    try {
      // Get user profile
      const user = await ctx.runQuery(api.users.queries.getUser, {
        userId: args.userId,
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Get available items
      const items: Array<{
        _id: string;
        name: string;
        category: string;
        subcategory?: string;
        colors: string[];
        tags: string[];
        occasion?: string[];
        price: number;
        currency: string;
      }> = [];

      for (const itemId of args.availableItemIds) {
        const item = await ctx.runQuery(api.items.queries.getItem, {
          itemId: itemId as Id<'items'>,
        });
        if (item) {
          items.push({
            _id: item._id,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            colors: item.colors,
            tags: item.tags,
            occasion: item.occasion,
            price: item.price,
            currency: item.currency,
          });
        }
      }

      if (items.length < 2) {
        return { success: false, error: 'Not enough items available' };
      }

      // Initialize OpenAI using AI SDK
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Build AI prompt
      const systemPrompt = `You are Nima, an expert fashion stylist with a fun, energetic personality.
Your task is to create 1-3 unique, stylish outfit combinations for a user based on their preferences.

User Profile:
- Gender preference: ${user.gender || 'not specified'}
- Style preferences: ${user.stylePreferences?.join(', ') || 'casual'}
- Budget range: ${user.budgetRange || 'mid'}
- Name: ${user.firstName || 'friend'}
${args.occasion ? `- Requested occasion: ${args.occasion}` : ''}
${args.context ? `- Additional context: ${args.context}` : ''}

Available Items (use these item IDs exactly):
${items.map((item) => `- ID: ${item._id}, Name: "${item.name}", Category: ${item.category}${item.subcategory ? `, Subcategory: ${item.subcategory}` : ''}, Colors: ${item.colors.join(', ')}, Tags: ${item.tags.join(', ')}, Price: ${item.price} ${item.currency}`).join('\n')}

CRITICAL RULES:
1. SETS/OUTFITS: If an item name contains "set", "suit", "matching", "and pants", "and trouser" - it's a COMPLETE OUTFIT. Only add shoes/accessories to it, NEVER add another top or bottom.
2. DRESSES: A dress is a complete outfit. Only add shoes, bags, jewelry, or accessories.
3. FORMALITY COHERENCE:
   - Casual items (sweatpants, hoodies, sneakers) go together
   - Formal items (dress shirts, dress pants, heels, boots) go together
   - DON'T mix formal shoes with casual sweatpants
   - DON'T add a kimono or cardigan over a complete set
4. GENDER RULES:
   ${user.gender === 'male' ? '- User is MALE: NEVER include dresses, skirts, blouses, heels.' : ''}
   ${user.gender === 'female' ? '- User is FEMALE: All items are allowed.' : ''}
5. NO DUPLICATE CATEGORIES: Only ONE top, ONE bottom, ONE pair of shoes per look.
6. LIMIT ITEMS: Each outfit should have 2-4 items max. Keep it clean and stylish.
7. OCCASION MATCHING: All items in a look should fit the requested occasion/venue.`;

      // Use AI SDK's generateObject for structured output
      const outfitSchema = z.object({
        outfits: z.array(
          z.object({
            itemIds: z.array(z.string()).describe('Array of item IDs from the available items'),
            name: z.string().describe('Creative name for the look'),
            occasion: z.string().describe('The occasion this outfit is best for'),
            nimaComment: z.string().describe('A short, fun comment about why this outfit works'),
          })
        ).min(1).max(3),
      });

      const { object: result } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: outfitSchema,
        system: systemPrompt,
        prompt: `Create stylish outfit combinations${args.occasion ? ` for ${args.occasion}` : ''}. Use ONLY the item IDs from the available items list.`,
        temperature: 0.7,
      });

      console.log('[CHAT:AI_COMPOSE] AI response:', JSON.stringify(result));

      const outfits = result.outfits;

      if (!outfits || outfits.length === 0) {
        return { success: false, error: 'No outfits generated' };
      }

      // Validate item IDs exist
      const validItemIds = new Set(items.map((i) => i._id));
      const validatedOutfits = outfits
        .filter((outfit) => {
          if (!outfit.itemIds || outfit.itemIds.length === 0) return false;
          return outfit.itemIds.every((id) => validItemIds.has(id));
        })
        .map((outfit) => ({
          itemIds: outfit.itemIds,
          name: outfit.name || 'Stylish Look',
          occasion: outfit.occasion || args.occasion || 'casual',
          nimaComment: outfit.nimaComment || 'A great look curated just for you!',
        }));

      if (validatedOutfits.length === 0) {
        return { success: false, error: 'No valid outfits generated' };
      }

      console.log(`[CHAT:AI_COMPOSE] Generated ${validatedOutfits.length} valid outfits`);

      return {
        success: true,
        outfits: validatedOutfits,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CHAT:AI_COMPOSE] Error:', error);
      return { success: false, error: errorMessage };
    }
  },
});

