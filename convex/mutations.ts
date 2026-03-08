import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

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
      }
    }
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email!))
      .first();

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
