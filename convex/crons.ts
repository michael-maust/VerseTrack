import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 6 PM CDT = 23:00 UTC (during daylight saving time)
crons.cron(
  "daily reading reminder",
  "0 23 * * *",
  internal.discord.sendDailyReminders
);

export default crons;
