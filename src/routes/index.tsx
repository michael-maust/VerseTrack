import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ProgressBar } from "@/components/ProgressBar";
import { UserProgressDrawer } from "@/components/UserProgressDrawer";
import { TOTAL_CHAPTERS } from "@/data/bible";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated } = useConvexAuth();
  const usersProgress = useQuery(api.queries.getAllUsersProgress);

  const [selectedUser, setSelectedUser] = useState<{
    userId: Id<"users">;
    name: string;
    chaptersRead: number;
  } | null>(null);

  if (usersProgress === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl bg-white/[0.06] border border-white/[0.08] p-5 space-y-3"
          >
            <div className="h-4 w-32 rounded bg-white/[0.08]" />
            <div className="h-3 w-full rounded-full bg-white/[0.08]" />
          </div>
        ))}
      </div>
    );
  }

  if (usersProgress.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-white/[0.07] p-4 mb-4">
          <svg
            className="size-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-foreground/90">
          No readers yet
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in and start tracking your Bible reading progress.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {usersProgress.map((user, index) => {
          const percentage = (user.chaptersRead / TOTAL_CHAPTERS) * 100;

          return (
            <button
              key={user.userId}
              onClick={() => {
                if (isAuthenticated) {
                  setSelectedUser({
                    userId: user.userId,
                    name: user.name,
                    chaptersRead: user.chaptersRead,
                  });
                }
              }}
              disabled={!isAuthenticated}
              className={`
                animate-fade-in-up w-full text-left rounded-xl
                border border-white/[0.08] bg-white/[0.05] p-5
                transition-all duration-200
                ${
                  isAuthenticated
                    ? "hover:bg-white/[0.08] hover:border-white/[0.12] cursor-pointer"
                    : "cursor-default"
                }
              `}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-baseline justify-between mb-2.5">
                <span className="text-sm font-medium text-foreground/90">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {user.chaptersRead} / {TOTAL_CHAPTERS} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <ProgressBar percentage={percentage} showLabel={false} />
            </button>
          );
        })}
      </div>

      {selectedUser && (
        <UserProgressDrawer
          open={!!selectedUser}
          onOpenChange={(o) => {
            if (!o) setSelectedUser(null);
          }}
          userId={selectedUser.userId}
          userName={selectedUser.name}
          chaptersRead={selectedUser.chaptersRead}
        />
      )}
    </>
  );
}
