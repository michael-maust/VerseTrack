import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const markChaptersRead = mutation({
  args: {
    chapters: v.array(
      v.object({
        book: v.string(),
        chapter: v.number(),
      })
    ),
  },
  handler: async (ctx, { chapters }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const newlyMarked: { book: string; chapter: number }[] = [];

    for (const { book, chapter } of chapters) {
      // Check if already marked
      const existing = await ctx.db
        .query("readingProgress")
        .withIndex("by_user_book_chapter", (q) =>
          q.eq("userId", user._id).eq("book", book).eq("chapter", chapter)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("readingProgress", {
          userId: user._id,
          book,
          chapter,
          dateRead: now,
        });
        newlyMarked.push({ book, chapter });
      }
    }

    // Notify Discord if any new chapters were logged
    if (newlyMarked.length > 0) {
      const displayName =
        (user.firstName || "") + (user.lastName ? ` ${user.lastName}` : "") || user.name || "Someone";
      await ctx.scheduler.runAfter(0, internal.discord.notifyReadingLogged, {
        userName: displayName,
        chapters: newlyMarked,
      });
    }
  },
});

export const startFresh = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Collect all current reading progress
    const progress = await ctx.db
      .query("readingProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (progress.length === 0) {
      throw new Error("No reading progress to archive");
    }

    // Archive into a reading run
    await ctx.db.insert("readingRuns", {
      userId: user._id,
      name: name || undefined,
      completedAt: Date.now(),
      totalChaptersRead: progress.length,
      entries: progress.map((p) => ({
        book: p.book,
        chapter: p.chapter,
        dateRead: p.dateRead,
      })),
    });

    // Delete all current progress
    for (const entry of progress) {
      await ctx.db.delete(entry._id);
    }
  },
});

export const renameReadingRun = mutation({
  args: {
    runId: v.id("readingRuns"),
    name: v.string(),
  },
  handler: async (ctx, { runId, name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const run = await ctx.db.get(runId);
    if (!run || run.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(runId, { name: name || undefined });
  },
});

export const unmarkChaptersRead = mutation({
  args: {
    chapters: v.array(
      v.object({
        book: v.string(),
        chapter: v.number(),
      })
    ),
  },
  handler: async (ctx, { chapters }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    for (const { book, chapter } of chapters) {
      const existing = await ctx.db
        .query("readingProgress")
        .withIndex("by_user_book_chapter", (q) =>
          q.eq("userId", user._id).eq("book", book).eq("chapter", chapter)
        )
        .first();

      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }
  },
});
