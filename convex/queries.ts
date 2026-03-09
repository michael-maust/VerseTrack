import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAllUsersProgress = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const usersWithProgress = await Promise.all(
      users.map(async (user) => {
        const progress = await ctx.db
          .query("readingProgress")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        return {
          userId: user._id,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          name: user.name ?? "Unknown",
          chaptersRead: progress.length,
        };
      })
    );

    return usersWithProgress.sort((a, b) => b.chaptersRead - a.chaptersRead);
  },
});

export const getUserReadingHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const progress = await ctx.db
      .query("readingProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Sort by dateRead descending
    progress.sort((a, b) => b.dateRead - a.dateRead);

    // Return last 100 entries
    return progress.slice(0, 100);
  },
});

export const getUserBookProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const progress = await ctx.db
      .query("readingProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Group by book
    const bookProgress: Record<string, number[]> = {};
    for (const entry of progress) {
      if (!bookProgress[entry.book]) {
        bookProgress[entry.book] = [];
      }
      bookProgress[entry.book].push(entry.chapter);
    }

    return bookProgress;
  },
});

export const getBookChapters = query({
  args: { userId: v.id("users"), book: v.string() },
  handler: async (ctx, { userId, book }) => {
    const progress = await ctx.db
      .query("readingProgress")
      .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("book", book))
      .collect();

    return progress.map((p) => p.chapter);
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return { name: user.name ?? "Unknown", firstName: user.firstName ?? "" };
  },
});

export const getCurrentUserProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const progress = await ctx.db
      .query("readingProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const bookProgress: Record<string, number[]> = {};
    for (const entry of progress) {
      if (!bookProgress[entry.book]) {
        bookProgress[entry.book] = [];
      }
      bookProgress[entry.book].push(entry.chapter);
    }

    return { userId: user._id, bookProgress };
  },
});
