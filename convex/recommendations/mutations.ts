import { mutation, internalMutation, MutationCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import type { Id, Doc } from '../_generated/dataModel';

// ── Formality helpers (mirrors chat/mutations.ts) ─────────────────────────────

type FormalityLevel = 'casual' | 'smart_casual' | 'formal' | 'evening';

const FORMALITY_ORDER: FormalityLevel[] = ['casual', 'smart_casual', 'formal', 'evening'];

const FORMALITY_KEYWORDS: Record<FormalityLevel, string[]> = {
  casual: [
    'sweatpants', 'hoodie', 'sneakers', 'track pants', 't-shirt', 'tee',
    'joggers', 'slides', 'flip-flops', 'cargo', 'denim', 'jeans', 'casual',
    'streetwear', 'athleisure', 'sporty', 'relaxed', 'everyday', 'weekend',
  ],
  smart_casual: [
    'chinos', 'polo', 'loafers', 'blazer', 'cardigan', 'khaki', 'button-up',
    'smart', 'brunch', 'date', 'work', 'office', 'business casual', 'preppy',
    'classic', 'timeless', 'versatile', 'refined',
  ],
  formal: [
    'dress pants', 'dress shirt', 'oxford', 'heels', 'boots', 'formal',
    'suit', 'tailored', 'professional', 'meeting', 'interview', 'elegant',
    'sophisticated', 'polished', 'structured',
  ],
  evening: [
    'gown', 'cocktail dress', 'tuxedo', 'evening', 'black tie', 'red carpet',
    'glamorous', 'luxe', 'party', 'gala', 'wedding', 'prom', 'ball',
  ],
};

function getFormalityLevel(item: Doc<'items'>): FormalityLevel {
  const text = [
    item.name.toLowerCase(),
    item.subcategory?.toLowerCase() ?? '',
    ...item.tags.map((t) => t.toLowerCase()),
    ...(item.occasion ?? []).map((o) => o.toLowerCase()),
  ].join(' ');

  for (const level of [...FORMALITY_ORDER].reverse()) {
    if (FORMALITY_KEYWORDS[level].some((kw) => text.includes(kw))) return level;
  }
  return 'smart_casual';
}

function formalityScore(item1: Doc<'items'>, item2: Doc<'items'>): number {
  const diff = Math.abs(
    FORMALITY_ORDER.indexOf(getFormalityLevel(item1)) -
      FORMALITY_ORDER.indexOf(getFormalityLevel(item2))
  );
  if (diff === 0) return 25;
  if (diff === 1) return 10;
  return -20;
}

function coherenceScore(item: Doc<'items'>, existing: Doc<'items'>[]): number {
  if (existing.length === 0) return 100;
  const scores = existing.map((e) => {
    let s = formalityScore(item, e);
    const sharedOccasions = (item.occasion ?? []).filter((o) =>
      (e.occasion ?? []).includes(o)
    );
    s += sharedOccasions.length * 15;
    const sharedTags = item.tags.filter((t) => e.tags.includes(t));
    s += sharedTags.length * 5;
    return s;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ── Occasion → formality mapping ─────────────────────────────────────────────

const OCCASION_FORMALITY: Record<string, FormalityLevel> = {
  work: 'smart_casual',
  office: 'smart_casual',
  meeting: 'formal',
  date: 'smart_casual',
  weekend: 'casual',
  casual: 'casual',
  gym: 'casual',
  travel: 'casual',
  golf: 'smart_casual',
  wedding: 'evening',
  party: 'evening',
  concert: 'smart_casual',
  brunch: 'smart_casual',
};

function occasionToFormality(occasion: string): FormalityLevel {
  const lower = occasion.toLowerCase();
  for (const [key, level] of Object.entries(OCCASION_FORMALITY)) {
    if (lower.includes(key)) return level;
  }
  return 'smart_casual';
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function getMondayTimestamp(ts: number): number {
  const d = new Date(ts);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since last Monday
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - diff);
  return d.getTime();
}

function getDayTimestamp(ts: number): number {
  const d = new Date(ts);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

// ── Wardrobe formality helpers (wardrobeItems schema differs from items) ─────

function wardrobeFormalityLevel(item: Doc<'wardrobeItems'>): FormalityLevel {
  const raw = (item.formality ?? '').toLowerCase().replace('-', '_');
  if (raw.includes('evening') || raw.includes('black_tie')) return 'evening';
  if (raw.includes('formal') && !raw.includes('semi')) return 'formal';
  if (raw.includes('semi_formal') || raw.includes('smart')) return 'smart_casual';
  if (raw.includes('casual') || raw.includes('athletic')) return 'casual';
  return 'smart_casual';
}

function wardrobeCategoryBucket(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('top') || c.includes('shirt') || c.includes('tee')) return 'top';
  if (c.includes('bottom') || c.includes('pant') || c.includes('short') || c.includes('skirt') || c.includes('jean')) return 'bottom';
  if (c.includes('dress')) return 'dress';
  if (c.includes('shoe') || c.includes('boot') || c.includes('sneaker')) return 'shoes';
  if (c.includes('outer') || c.includes('jacket') || c.includes('coat')) return 'outerwear';
  if (c.includes('accessor')) return 'accessory';
  return c;
}

async function selectWardrobeItemsForOccasion(
  db: MutationCtx['db'],
  userId: Id<'users'>,
  occasion: string,
  stylePreferences: string[]
): Promise<Id<'wardrobeItems'>[]> {
  const targetFormality = occasionToFormality(occasion);
  const prefs = stylePreferences.map((p) => p.toLowerCase());
  const recentlyUsed = await getRecentlyUsedWardrobeIds(db, userId);

  const wardrobe = await db
    .query('wardrobeItems')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();

  if (wardrobe.length < 2) return [];

  const scored = wardrobe.map((item) => {
    const formalityDiff = Math.abs(
      FORMALITY_ORDER.indexOf(wardrobeFormalityLevel(item)) -
        FORMALITY_ORDER.indexOf(targetFormality)
    );
    const tagText = [item.description, ...item.tags].join(' ').toLowerCase();
    const styleMatch = prefs.some((p) => p && tagText.includes(p)) ? 15 : 0;
    // Softer penalty on wardrobe since users have limited items — we'd rather
    // repeat a wardrobe piece than show nothing. Enough bias to prefer fresh
    // combos when there are multiple viable options.
    const recentPenalty = recentlyUsed.has(item._id) ? -25 : 0;
    return {
      item,
      bucket: wardrobeCategoryBucket(item.category),
      score:
        30 - formalityDiff * 10 + styleMatch + recentPenalty + Math.random() * 15,
    };
  }).sort((a, b) => b.score - a.score);

  const outfit: typeof scored = [];
  const usedBuckets = new Set<string>();
  const priority = ['top', 'bottom', 'dress', 'shoes', 'outerwear', 'accessory'];

  // Sample from top candidates per bucket instead of always picking the top 1.
  const TOP_N_PER_BUCKET = 5;

  for (const bucket of priority) {
    if (outfit.length >= 4) break;
    if ((bucket === 'top' || bucket === 'bottom') && usedBuckets.has('dress')) continue;
    if (usedBuckets.has(bucket)) continue;
    const bucketCandidates = scored.filter(
      (s) => s.bucket === bucket && !usedBuckets.has(s.bucket)
    );
    if (bucketCandidates.length === 0) continue;
    const poolSize = Math.min(TOP_N_PER_BUCKET, bucketCandidates.length);
    const pick = bucketCandidates[Math.floor(Math.random() * poolSize)];
    outfit.push(pick);
    usedBuckets.add(pick.bucket);
  }

  if (outfit.length < 2) return [];
  return outfit.map((s) => s.item._id);
}

// ── History helpers ──────────────────────────────────────────────────────────
// Used to avoid repeating items that the user recently saw in a recommendation.

const HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RECENT_PENALTY = 80; // heavy enough to bump recent items out of the top pool

async function getRecentlyUsedItemIds(
  db: MutationCtx['db'],
  userId: Id<'users'>
): Promise<Set<string>> {
  const cutoff = Date.now() - HISTORY_WINDOW_MS;
  const recent = await db
    .query('recommendations')
    .withIndex('by_user_and_created', (q) =>
      q.eq('userId', userId).gte('createdAt', cutoff)
    )
    .collect();
  const ids = new Set<string>();
  for (const r of recent) {
    for (const id of r.itemIds) ids.add(id);
  }
  return ids;
}

async function getRecentlyUsedWardrobeIds(
  db: MutationCtx['db'],
  userId: Id<'users'>
): Promise<Set<string>> {
  const cutoff = Date.now() - HISTORY_WINDOW_MS;
  const recent = await db
    .query('recommendations')
    .withIndex('by_user_and_created', (q) =>
      q.eq('userId', userId).gte('createdAt', cutoff)
    )
    .collect();
  const ids = new Set<string>();
  for (const r of recent) {
    for (const id of r.wardrobeItemIds ?? []) ids.add(id);
  }
  return ids;
}

// Fisher–Yates in-place shuffle. Used to randomize the candidate pool before
// scoring so the same head-of-index items don't dominate every run.
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Core item selection for a single occasion ─────────────────────────────────

async function selectItemsForOccasion(
  db: MutationCtx['db'],
  userId: Id<'users'>,
  gender: 'male' | 'female' | 'unisex',
  occasion: string,
  styleProfile: unknown
): Promise<Id<'items'>[]> {
  const targetFormality = occasionToFormality(occasion);
  const recentlyUsed = await getRecentlyUsedItemIds(db, userId);

  // Pull a wider, shuffled pool so items outside the head of the index get a
  // fair shot. Take more than we need, then randomize before scoring.
  const genderItems = await db
    .query('items')
    .withIndex('by_active_and_gender', (q) => q.eq('isActive', true).eq('gender', gender))
    .take(500);

  const unisexItems = await db
    .query('items')
    .withIndex('by_active_and_gender', (q) => q.eq('isActive', true).eq('gender', 'unisex'))
    .take(250);

  const pool = shuffle([...genderItems, ...unisexItems]);
  if (pool.length === 0) return [];

  // Score each item against the target occasion formality
  const scored = pool
    .filter((item) => item.inStock)
    .map((item) => {
      const formalityDiff = Math.abs(
        FORMALITY_ORDER.indexOf(getFormalityLevel(item)) -
          FORMALITY_ORDER.indexOf(targetFormality)
      );
      // Tag/occasion relevance
      const occasionMatch = (item.occasion ?? []).some((o) =>
        o.toLowerCase().includes(occasion.toLowerCase())
      )
        ? 20
        : 0;

      // Style profile color alignment (basic)
      let profileBonus = 0;
      if (
        styleProfile &&
        typeof styleProfile === 'object' &&
        'aestheticPreferences' in (styleProfile as Record<string, unknown>)
      ) {
        const sp = styleProfile as { aestheticPreferences?: { colorPalette?: string[] } };
        const palette = sp.aestheticPreferences?.colorPalette ?? [];
        const hasMatch = item.colors.some((c) =>
          palette.some((p) => c.toLowerCase().includes(p) || p.includes(c.toLowerCase()))
        );
        if (hasMatch) profileBonus = 10;
      }

      // Penalize items already shown to this user in the last 30 days so the
      // selector reaches for fresh picks.
      const recentPenalty = recentlyUsed.has(item._id) ? -RECENT_PENALTY : 0;

      // Add jitter so ties break differently each run and we don't funnel into
      // the same top-N bucket every week.
      const jitter = Math.random() * 15;

      return {
        item,
        score:
          30 - formalityDiff * 10 + occasionMatch + profileBonus + recentPenalty + jitter,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Build a coherent outfit: 1 top + 1 bottom (or dress/outfit) + 1 shoes + optional accessory
  const outfit: Doc<'items'>[] = [];
  const usedCategories = new Set<string>();

  // Priority order for category filling
  const categoryPriority = ['top', 'bottom', 'dress', 'outfit', 'shoes', 'outerwear', 'accessory'];

  // Widen the top-N so more of the catalog rotates through the selection. Even
  // when only a handful of candidates survive coherence filtering, sampling
  // from ~10 instead of 3 gives us meaningfully more variety.
  const TOP_N = 10;

  for (const priority of categoryPriority) {
    if (outfit.length >= 4) break;

    // If we already have a dress/outfit, skip tops/bottoms
    if (
      (priority === 'top' || priority === 'bottom') &&
      (usedCategories.has('dress') || usedCategories.has('outfit'))
    ) {
      continue;
    }

    // Only one item per category
    if (usedCategories.has(priority)) continue;

    const candidates = scored.filter(
      ({ item }) =>
        item.category === priority &&
        !usedCategories.has(item.category) &&
        coherenceScore(item, outfit) >= 0
    );

    if (candidates.length > 0) {
      const poolSize = Math.min(TOP_N, candidates.length);
      const pick = candidates[Math.floor(Math.random() * poolSize)];
      outfit.push(pick.item);
      usedCategories.add(pick.item.category);
    }
  }

  // Need at least 2 items to be a valid recommendation
  if (outfit.length < 2) return [];

  return outfit.map((i) => i._id);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Internal: generate recommendations for a single user.
 * Called by the weekly cron via generateWeeklyRecommendationsForAll.
 */
export const generateWeeklyRecommendations = internalMutation({
  args: { userId: v.id('users') },
  returns: v.null(),
  handler: async (
    ctx: MutationCtx,
    args: { userId: Id<'users'> }
  ): Promise<null> => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.isActive) return null;

    // Determine occasions to generate recs for
    let occasions: string[] = user.occasions ?? [];
    if (occasions.length === 0) {
      // Fall back to style preferences as occasion hints
      occasions = (user.stylePreferences ?? []).slice(0, 3);
    }
    if (occasions.length === 0) {
      occasions = ['casual', 'work'];
    }

    const gender = user.gender === 'prefer-not-to-say' ? 'unisex' : (user.gender ?? 'unisex');
    const weekOf = getMondayTimestamp(Date.now());
    const expiresAt = weekOf + 7 * 24 * 60 * 60 * 1000;

    // Check if we already generated this week
    const existingThisWeek = await ctx.db
      .query('recommendations')
      .withIndex('by_user_and_created', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('weekOf'), weekOf))
      .first();

    if (existingThisWeek) {
      console.log(`[RECS] Already generated this week for user ${args.userId}`);
      return null;
    }

    // Generate one recommendation per occasion (up to 5)
    const createdIds: Id<'recommendations'>[] = [];
    for (const occasion of occasions.slice(0, 5)) {
      const itemIds = await selectItemsForOccasion(
        ctx.db,
        args.userId,
        gender as 'male' | 'female' | 'unisex',
        occasion,
        user.styleProfile
      );

      if (itemIds.length >= 2) {
        const recId = await ctx.db.insert('recommendations', {
          userId: args.userId,
          itemIds,
          occasion,
          nimaComment: '', // filled by generateComments action
          status: 'pending_comment',
          weekOf,
          createdAt: Date.now(),
          expiresAt,
        });
        createdIds.push(recId);
      }
    }

    // Trigger comment generation if we created any recommendations
    if (createdIds.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.recommendations.actions.generateComments,
        { userId: args.userId }
      );
      await ctx.scheduler.runAfter(
        2000,
        internal.notifications.actions.sendDailyMatchesNotification,
        { userId: args.userId, count: createdIds.length }
      );
    }

    return null;
  },
});

/**
 * Internal: generate recommendations for ALL active users with a style profile.
 * Triggered by the weekly cron job.
 */
export const generateWeeklyRecommendationsForAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx: MutationCtx, _args: Record<string, never>): Promise<null> => {
    const users = await ctx.db.query('users').collect();
    const eligible = users.filter(
      (u) => u.isActive && (u.styleProfile || (u.stylePreferences ?? []).length > 0)
    );

    const runAt = Date.now();
    for (const user of eligible) {
      await ctx.scheduler.runAfter(
        0,
        internal.recommendations.mutations.generateWeeklyRecommendations,
        { userId: user._id }
      );
    }

    console.log(
      `[RECS] Scheduled weekly recommendation generation for ${eligible.length} users ` +
        `at ${new Date(runAt).toISOString()} ` +
        `(${new Date(runAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT). ` +
        `Users will receive recommendations within a few seconds.`
    );
    return null;
  },
});

/**
 * Internal: generate DAILY wardrobe-mix recommendations for a single user.
 * Picks combos from the user's own wardrobeItems, filtered by their saved
 * occasions + stylePreferences. Inserts records with isWardrobeMix=true and
 * empty itemIds so the feed renders purely wardrobe-sourced combos.
 */
export const generateDailyWardrobeRecommendations = internalMutation({
  args: { userId: v.id('users') },
  returns: v.object({
    created: v.number(),
    skipped: v.boolean(),
  }),
  handler: async (
    ctx: MutationCtx,
    args: { userId: Id<'users'> }
  ): Promise<{ created: number; skipped: boolean }> => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.isActive) return { created: 0, skipped: true };

    // Need at least 2 wardrobe items to form a combo
    const wardrobeCount = await ctx.db
      .query('wardrobeItems')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .take(2);
    if (wardrobeCount.length < 2) return { created: 0, skipped: true };

    // Occasions: user-saved first, fall back to style prefs, then defaults
    let occasions: string[] = user.occasions ?? [];
    if (occasions.length === 0) {
      occasions = (user.stylePreferences ?? []).slice(0, 3);
    }
    if (occasions.length === 0) {
      occasions = ['casual', 'work'];
    }

    const dayOf = getDayTimestamp(Date.now());
    const expiresAt = dayOf + 24 * 60 * 60 * 1000;

    // Skip if we already generated for today
    const existingToday = await ctx.db
      .query('recommendations')
      .withIndex('by_user_and_created', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field('weekOf'), dayOf),
          q.eq(q.field('isWardrobeMix'), true)
        )
      )
      .first();

    if (existingToday) return { created: 0, skipped: true };

    const createdIds: Id<'recommendations'>[] = [];
    for (const occasion of occasions.slice(0, 3)) {
      const wardrobeItemIds = await selectWardrobeItemsForOccasion(
        ctx.db,
        args.userId,
        occasion,
        user.stylePreferences ?? []
      );

      if (wardrobeItemIds.length >= 2) {
        const recId = await ctx.db.insert('recommendations', {
          userId: args.userId,
          itemIds: [],
          wardrobeItemIds,
          isWardrobeMix: true,
          occasion,
          nimaComment: '',
          status: 'pending_comment',
          weekOf: dayOf,
          createdAt: Date.now(),
          expiresAt,
        });
        createdIds.push(recId);
      }
    }

    if (createdIds.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.recommendations.actions.generateComments,
        { userId: args.userId }
      );
      await ctx.scheduler.runAfter(
        2000,
        internal.notifications.actions.sendDailyMatchesNotification,
        { userId: args.userId, count: createdIds.length }
      );
    }

    return { created: createdIds.length, skipped: false };
  },
});

/**
 * Internal: daily cron entrypoint. Schedules per-user wardrobe generation
 * for all eligible users.
 */
export const generateDailyWardrobeForAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx: MutationCtx, _args: Record<string, never>): Promise<null> => {
    const users = await ctx.db.query('users').collect();
    const eligible = users.filter((u) => u.isActive);

    const runAt = Date.now();
    for (const user of eligible) {
      await ctx.scheduler.runAfter(
        0,
        internal.recommendations.mutations.generateDailyWardrobeRecommendations,
        { userId: user._id }
      );
    }
    console.log(
      `[RECS] Scheduled daily wardrobe generation for ${eligible.length} users ` +
        `at ${new Date(runAt).toISOString()} ` +
        `(${new Date(runAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT). ` +
        `Users will receive recommendations within a few seconds.`
    );
    return null;
  },
});

/**
 * Public: first-run trigger. When the user opens the For You page, generates
 * today's wardrobe matches immediately if they don't already exist.
 */
export const runDailyNow = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    created: v.number(),
    reason: v.optional(v.string()),
  }),
  handler: async (
    ctx: MutationCtx,
    _args: Record<string, never>
  ): Promise<{ success: boolean; created: number; reason?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { success: false, created: 0, reason: 'not_authenticated' };

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();
    if (!user) return { success: false, created: 0, reason: 'user_not_found' };

    const result = await ctx.runMutation(
      internal.recommendations.mutations.generateDailyWardrobeRecommendations,
      { userId: user._id }
    );

    return { success: !result.skipped, created: result.created };
  },
});

/**
 * Internal: update a recommendation with the AI-generated comment and mark it active.
 */
export const updateComment = internalMutation({
  args: {
    recommendationId: v.id('recommendations'),
    nimaComment: v.string(),
  },
  returns: v.null(),
  handler: async (
    ctx: MutationCtx,
    args: { recommendationId: Id<'recommendations'>; nimaComment: string }
  ): Promise<null> => {
    await ctx.db.patch(args.recommendationId, {
      nimaComment: args.nimaComment,
      status: 'active',
    });
    return null;
  },
});

/**
 * Internal: mark expired recommendations as expired.
 */
export const cleanupExpired = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx: MutationCtx, _args: Record<string, never>): Promise<null> => {
    const now = Date.now();
    const expired = await ctx.db
      .query('recommendations')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .collect();

    for (const rec of expired) {
      if (rec.status !== 'tried_on' && rec.status !== 'expired') {
        await ctx.db.patch(rec._id, { status: 'expired' });
      }
    }
    return null;
  },
});

/**
 * Public: dismiss a recommendation (hides it from the feed; sets status to expired).
 */
export const dismissRecommendation = mutation({
  args: { recommendationId: v.id('recommendations') },
  returns: v.null(),
  handler: async (
    ctx: MutationCtx,
    args: { recommendationId: Id<'recommendations'> }
  ): Promise<null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const rec = await ctx.db.get(args.recommendationId);
    if (!rec) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();
    if (!user || rec.userId !== user._id) throw new Error('Not authorized');

    await ctx.db.patch(args.recommendationId, { status: 'expired' });
    return null;
  },
});

/**
 * Public: permanently delete a recommendation. Unlike dismiss (which only
 * marks the record expired), this removes the row entirely.
 */
export const deleteRecommendation = mutation({
  args: { recommendationId: v.id('recommendations') },
  returns: v.null(),
  handler: async (
    ctx: MutationCtx,
    args: { recommendationId: Id<'recommendations'> }
  ): Promise<null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const rec = await ctx.db.get(args.recommendationId);
    if (!rec) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();
    if (!user || rec.userId !== user._id) throw new Error('Not authorized');

    await ctx.db.delete(args.recommendationId);
    return null;
  },
});

/**
 * Public: mark a recommendation as tried_on (called when user taps "Try it On").
 */
export const markTriedOn = mutation({
  args: { recommendationId: v.id('recommendations') },
  returns: v.null(),
  handler: async (
    ctx: MutationCtx,
    args: { recommendationId: Id<'recommendations'> }
  ): Promise<null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const rec = await ctx.db.get(args.recommendationId);
    if (!rec) throw new Error('Recommendation not found');

    // Verify ownership
    const user = await ctx.db
      .query('users')
      .withIndex('by_workos_user_id', (q) => q.eq('workosUserId', identity.subject))
      .unique();
    if (!user || rec.userId !== user._id) throw new Error('Not authorized');

    await ctx.db.patch(args.recommendationId, { status: 'tried_on' });
    return null;
  },
});
