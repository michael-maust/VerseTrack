import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { TOTAL_CHAPTERS } from "@/data/bible";
import { Pencil, Check, X } from "lucide-react";

interface ReadingHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
}

export function ReadingHistoryDrawer({
  open,
  onOpenChange,
  userId,
}: ReadingHistoryDrawerProps) {
  const runs = useQuery(
    api.queries.getReadingRuns,
    open ? { userId } : "skip"
  );
  const renameRun = useMutation(api.mutations.renameReadingRun);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Reading History</DrawerTitle>
          <DrawerDescription>
            Your past reading sessions
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-3">
          {runs === undefined ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl bg-white/[0.06] border border-white/[0.08] p-4 space-y-2"
                >
                  <div className="h-4 w-40 rounded bg-white/[0.08]" />
                  <div className="h-3 w-24 rounded bg-white/[0.08]" />
                </div>
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">
                No past reading sessions yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                When you start fresh, your progress will be saved here.
              </p>
            </div>
          ) : (
            runs.map((run, index) => {
              const completedDate = new Date(run.completedAt);
              const entries = run.entries;

              const startDate = entries.length > 0
                ? new Date(Math.min(...entries.map((e) => e.dateRead)))
                : completedDate;

              const bookCounts: Record<string, number> = {};
              for (const entry of entries) {
                bookCounts[entry.book] = (bookCounts[entry.book] ?? 0) + 1;
              }

              const booksStarted = Object.keys(bookCounts).length;
              const pct = ((run.totalChaptersRead / TOTAL_CHAPTERS) * 100).toFixed(1);
              const isEditing = editingId === run._id;
              const displayName = run.name || `Reading Plan ${runs.length - index}`;

              return (
                <div
                  key={run._id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.05] p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 rounded-md border border-white/[0.12] bg-white/[0.06] px-2 py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameRun({ runId: run._id, name: editName.trim() });
                              setEditingId(null);
                            } else if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            renameRun({ runId: run._id, name: editName.trim() });
                            setEditingId(null);
                          }}
                          className="rounded p-0.5 text-green-400 hover:bg-white/[0.10] transition-colors"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded p-0.5 text-muted-foreground hover:bg-white/[0.10] transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-foreground/90 flex-1">
                          {displayName}
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(run._id);
                            setEditName(run.name || "");
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-white/[0.10] hover:text-foreground/80 transition-colors"
                        >
                          <Pencil className="size-3" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">
                      {run.totalChaptersRead} chapters ({pct}%)
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {booksStarted} book{booksStarted !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(startDate)} – {formatDate(completedDate)}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {Object.entries(bookCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([book, count]) => (
                        <span
                          key={book}
                          className="inline-block rounded-md bg-white/[0.08] px-2 py-0.5 text-xs text-foreground/70"
                        >
                          {book} ({count})
                        </span>
                      ))}
                    {Object.keys(bookCounts).length > 10 && (
                      <span className="inline-block rounded-md bg-white/[0.08] px-2 py-0.5 text-xs text-foreground/50">
                        +{Object.keys(bookCounts).length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
