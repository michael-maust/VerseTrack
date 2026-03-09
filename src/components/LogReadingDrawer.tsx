import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import confetti from "canvas-confetti";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { BIBLE_BOOKS, OT_BOOKS, NT_BOOKS } from "@/data/bible";

interface LogReadingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogReadingDrawer({ open, onOpenChange }: LogReadingDrawerProps) {
  const currentUser = useQuery(api.queries.getCurrentUserProgress);
  const markChapters = useMutation(api.mutations.markChaptersRead);
  const unmarkChapters = useMutation(api.mutations.unmarkChaptersRead);

  // Local toggle state: set of "Book:Chapter" keys
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const alreadyRead = currentUser?.bookProgress ?? {};

  const isChapterRead = useCallback(
    (book: string, chapter: number) => {
      return alreadyRead[book]?.includes(chapter) ?? false;
    },
    [alreadyRead]
  );

  const isToggled = useCallback(
    (book: string, chapter: number) => {
      return toggled.has(`${book}:${chapter}`);
    },
    [toggled]
  );

  const getChapterState = useCallback(
    (book: string, chapter: number) => {
      const wasRead = isChapterRead(book, chapter);
      const wasToggled = isToggled(book, chapter);
      // If toggled, flip the state
      return wasToggled ? !wasRead : wasRead;
    },
    [isChapterRead, isToggled]
  );

  function toggleChapter(book: string, chapter: number) {
    const key = `${book}:${chapter}`;
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectAllInBook(book: string, totalChapters: number) {
    setToggled((prev) => {
      const next = new Set(prev);
      // Check if all unread chapters would be selected
      let allSelected = true;
      for (let ch = 1; ch <= totalChapters; ch++) {
        const wasRead = isChapterRead(book, ch);
        const key = `${book}:${ch}`;
        if (!wasRead && !next.has(key)) {
          allSelected = false;
          break;
        }
      }

      for (let ch = 1; ch <= totalChapters; ch++) {
        const wasRead = isChapterRead(book, ch);
        const key = `${book}:${ch}`;
        if (allSelected) {
          // Deselect all toggles for this book
          next.delete(key);
        } else {
          // Select all unread chapters
          if (!wasRead) {
            next.add(key);
          }
        }
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (toggled.size === 0) return;
    setSubmitting(true);

    try {
      const toMark: { book: string; chapter: number }[] = [];
      const toUnmark: { book: string; chapter: number }[] = [];

      for (const key of toggled) {
        const [book, chStr] = key.split(":");
        const chapter = parseInt(chStr, 10);
        const wasRead = isChapterRead(book, chapter);

        if (wasRead) {
          toUnmark.push({ book, chapter });
        } else {
          toMark.push({ book, chapter });
        }
      }

      if (toMark.length > 0) {
        await markChapters({ chapters: toMark });
      }
      if (toUnmark.length > 0) {
        await unmarkChapters({ chapters: toUnmark });
      }

      // Fire confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#22c55e", "#3b82f6", "#a855f7"],
      });

      setToggled(new Set());
      setTimeout(() => onOpenChange(false), 800);
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const changesCount = toggled.size;

  function renderBookSection(books: typeof BIBLE_BOOKS, label: string) {
    return (
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 px-1">
          {label}
        </h3>
        <Accordion>
          {books.map((book) => {
            const readCount = alreadyRead[book.name]?.length ?? 0;
            const toggledForBook = Array.from(toggled).filter((k) =>
              k.startsWith(`${book.name}:`)
            ).length;

            return (
              <AccordionItem key={book.name} value={book.name}>
                <AccordionTrigger className="px-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="truncate">{book.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {readCount}/{book.chapters}
                    </span>
                    {toggledForBook > 0 && (
                      <span className="rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.5 text-[10px] font-medium">
                        +{toggledForBook}
                      </span>
                    )}
                    {readCount === book.chapters && (
                      <span className="ml-auto mr-2 shrink-0 flex items-center justify-center size-5 rounded-full bg-green-500/20">
                        <Check className="size-3 text-green-400" />
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-2">
                    <button
                      type="button"
                      onClick={() =>
                        selectAllInBook(book.name, book.chapters)
                      }
                      className="mb-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                    >
                      Select all
                    </button>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                      {Array.from(
                        { length: book.chapters },
                        (_, i) => i + 1
                      ).map((ch) => {
                        const active = getChapterState(book.name, ch);
                        const hasChange = isToggled(book.name, ch);

                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => toggleChapter(book.name, ch)}
                            className={`
                              flex items-center justify-center rounded-lg h-9 text-sm font-medium
                              transition-all duration-150 select-none cursor-pointer
                              ${
                                active
                                  ? "bg-gradient-to-br from-amber-500/25 to-green-500/25 text-green-400 border border-green-500/25"
                                  : "bg-white/[0.07] text-muted-foreground border border-white/[0.10] hover:bg-white/[0.12]"
                              }
                              ${hasChange ? "ring-1 ring-amber-500/40 scale-[1.02]" : ""}
                            `}
                          >
                            {ch}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Log Reading</DrawerTitle>
          <DrawerDescription>
            Select the chapters you've read today.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {renderBookSection(OT_BOOKS, "Old Testament")}
          {renderBookSection(NT_BOOKS, "New Testament")}
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={changesCount === 0 || submitting}
            size="lg"
            className="w-full"
          >
            {submitting
              ? "Saving..."
              : changesCount > 0
                ? `Submit ${changesCount} chapter${changesCount !== 1 ? "s" : ""}`
                : "Select chapters to log"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
