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
import { BIBLE_BOOKS } from "@/data/bible";

interface BookDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  bookName: string;
}

export function BookDetailDrawer({
  open,
  onOpenChange,
  userId,
  bookName,
}: BookDetailDrawerProps) {
  const chaptersRead = useQuery(
    api.queries.getBookChapters,
    open ? { userId, book: bookName } : "skip"
  );

  const book = BIBLE_BOOKS.find((b) => b.name === bookName);
  const totalChapters = book?.chapters ?? 0;
  const readSet = new Set(chaptersRead ?? []);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{bookName}</DrawerTitle>
          <DrawerDescription>
            {readSet.size} of {totalChapters} chapters read
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {Array.from({ length: totalChapters }, (_, i) => i + 1).map(
              (ch) => {
                const isRead = readSet.has(ch);
                return (
                  <div
                    key={ch}
                    className={`
                      flex items-center justify-center rounded-lg h-10 text-sm font-medium
                      transition-colors select-none
                      ${
                        isRead
                          ? "bg-gradient-to-br from-amber-500/20 to-green-500/20 text-green-400 border border-green-500/20"
                          : "bg-white/[0.07] text-muted-foreground border border-white/[0.10]"
                      }
                    `}
                  >
                    {ch}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
