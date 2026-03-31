import { internalQuery } from "./_generated/server";

export const getUsersWhoHaventReadToday = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    // Get start of today in UTC (cron runs in UTC — 6 PM CDT = 23:00 UTC)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const usersToRemind: { name: string }[] = [];

    for (const user of users) {
      // Skip anonymous or users without names
      if (user.isAnonymous || !user.firstName) continue;

      const progress = await ctx.db
        .query("readingProgress")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      const hasReadToday = progress.some((p) => p.dateRead >= startOfDay);

      if (!hasReadToday) {
        const displayName = user.firstName + (user.lastName ? ` ${user.lastName}` : "");
        usersToRemind.push({ name: displayName });
      }
    }

    return usersToRemind;
  },
});
