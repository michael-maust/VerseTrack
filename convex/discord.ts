"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

async function sendDiscordMessage(botToken: string, channelId: string, content: string) {
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord API error: ${response.status} - ${error}`);
  }
}

function formatChapterRanges(chapters: { book: string; chapter: number }[]): string {
  const byBook: Record<string, number[]> = {};
  for (const { book, chapter } of chapters) {
    if (!byBook[book]) byBook[book] = [];
    byBook[book].push(chapter);
  }

  const parts: string[] = [];
  for (const [book, chaps] of Object.entries(byBook)) {
    chaps.sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = chaps[0];
    let end = chaps[0];

    for (let i = 1; i < chaps.length; i++) {
      if (chaps[i] === end + 1) {
        end = chaps[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = chaps[i];
        end = chaps[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    parts.push(`${book} ${ranges.join(", ")}`);
  }

  return parts.join(", ");
}

export const notifyReadingLogged = internalAction({
  args: {
    userName: v.string(),
    chapters: v.array(
      v.object({
        book: v.string(),
        chapter: v.number(),
      })
    ),
  },
  handler: async (_ctx, { userName, chapters }) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!botToken || !channelId) return;

    const reading = formatChapterRanges(chapters);
    const message = `📖 **${userName}** just finished reading **${reading}**!`;
    await sendDiscordMessage(botToken, channelId, message);
  },
});

const REMINDER_MESSAGES = [
  "Make sure to get in the Word today, **{name}**! 📖",
  "Hey **{name}**, don't forget your Bible reading today! 🙏",
  "**{name}**, have you read Scripture today? There's still time! ✝️",
  "A gentle nudge, **{name}** — open up the Bible today! 📜",
  "**{name}**, your reading group is counting on you — get in the Word today! 💪",
];

export const sendDailyReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!botToken || !channelId) return;

    const usersToRemind = await ctx.runQuery(
      internal.discordHelpers.getUsersWhoHaventReadToday
    );

    for (const user of usersToRemind) {
      const template = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
      const message = template.replace("{name}", user.name);
      await sendDiscordMessage(botToken, channelId, message);
    }
  },
});
