import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
  }).index("email", ["email"]),

  readingProgress: defineTable({
    userId: v.id("users"),
    book: v.string(),
    chapter: v.number(),
    dateRead: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_book", ["userId", "book"])
    .index("by_user_book_chapter", ["userId", "book", "chapter"]),
});
