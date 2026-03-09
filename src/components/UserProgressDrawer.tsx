import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ProgressBar } from "@/components/ProgressBar";
import { BookDetailDrawer } from "@/components/BookDetailDrawer";
import { BIBLE_BOOKS, TOTAL_CHAPTERS } from "@/data/bible";

interface UserProgressDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  userName: string;
  chaptersRead: number;
}

export function UserProgressDrawer({
  open,
  onOpenChange,
  userId,
  userName,
  chaptersRead,
}: UserProgressDrawerProps) {
  const history = useQuery(
    api.queries.getUserReadingHistory,
    open ? { userId } : "skip"
  );
  const bookProgress = useQuery(
    api.queries.getUserBookProgress,
    open ? { userId } : "skip"
  );

  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  // Group recent history by date
  const recentByDate = (history ?? []).reduce(
    (acc, entry) => {
      const dateStr = new Date(entry.dateRead).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(entry);
      return acc;
    },
    {} as Record<string, typeof history>
  );

  const recentDates = Object.keys(recentByDate).slice(0, 5);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="mx-auto max-w-lg max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{userName}</DrawerTitle>
            <DrawerDescription>
              {chaptersRead} of {TOTAL_CHAPTERS} chapters read (
              {((chaptersRead / TOTAL_CHAPTERS) * 100).toFixed(1)}%)
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto space-y-6">
            {/* Recent Reading */}
            {recentDates.length > 0 && (
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  Recent Reading
                </h3>
                <div className="space-y-2">
                  {recentDates.map((date) => {
                    const entries = recentByDate[date]!;
                    // Group by book
                    const byBook: Record<string, number[]> = {};
                    for (const e of entries) {
                      if (!byBook[e.book]) byBook[e.book] = [];
                      byBook[e.book].push(e.chapter);
                    }
                    return (
                      <div
                        key={date}
                        className="flex items-start gap-3 rounded-lg bg-white/[0.06] px-3 py-2"
                      >
                        <span className="shrink-0 text-xs text-muted-foreground mt-0.5 w-12">
                          {date}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(byBook).map(([book, chapters]) => {
                            chapters.sort((a, b) => a - b);
                            const ranges = formatChapterRanges(chapters);
                            return (
                              <span
                                key={book}
                                className="inline-block rounded-md bg-white/[0.08] px-2 py-0.5 text-xs text-foreground/80"
                              >
                                {book} {ranges}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Book-by-book progress */}
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Books
              </h3>
              <div className="space-y-1">
                {BIBLE_BOOKS.map((book) => {
                  const read = bookProgress?.[book.name]?.length ?? 0;
                  const pct = (read / book.chapters) * 100;
                  return (
                    <button
                      key={book.name}
                      onClick={() => setSelectedBook(book.name)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.07]"
                    >
                      <span className="text-sm text-foreground/90 w-36 shrink-0 truncate">
                        {book.name}
                      </span>
                      <div className="flex-1">
                        <ProgressBar
                          percentage={pct}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
                        {read}/{book.chapters}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {selectedBook && (
        <BookDetailDrawer
          open={!!selectedBook}
          onOpenChange={(o) => {
            if (!o) setSelectedBook(null);
          }}
          userId={userId}
          bookName={selectedBook}
        />
      )}
    </>
  );
}

function formatChapterRanges(chapters: number[]): string {
  if (chapters.length === 0) return "";
  const ranges: string[] = [];
  let start = chapters[0];
  let end = chapters[0];

  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i] === end + 1) {
      end = chapters[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = chapters[i];
      end = chapters[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}
