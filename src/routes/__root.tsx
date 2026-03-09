import { useState, useRef, useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { LoginDrawer } from "@/components/LoginDrawer";
import { ReadingHistoryDrawer } from "@/components/ReadingHistoryDrawer";
import { LogIn, LogOut, ChevronDown, RotateCcw, History } from "lucide-react";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(
    api.queries.currentUser,
    isAuthenticated ? {} : "skip"
  );
  const currentProgress = useQuery(
    api.queries.getCurrentUserProgress,
    isAuthenticated ? {} : "skip"
  );
  const startFresh = useMutation(api.mutations.startFresh);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [runName, setRunName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmingReset(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.10] bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/VerseTrack Favicon.jpeg" alt="VerseTrack" className="size-8 rounded" />
            <h1 className="text-lg font-semibold tracking-tight">
              VerseTrack
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-7 w-16 animate-pulse rounded-lg bg-white/[0.08]" />
            ) : isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-white/[0.10]"
                >
                  {currentUser?.name ?? "Account"}
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/[0.12] bg-background shadow-lg py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setHistoryOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/[0.10]"
                    >
                      <History className="size-3.5" />
                      Reading History
                    </button>
                    {!confirmingReset ? (
                      <button
                        onClick={() => setConfirmingReset(true)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/[0.10]"
                      >
                        <RotateCcw className="size-3.5" />
                        Start Fresh
                      </button>
                    ) : (
                      <div className="px-3 py-2 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Name this reading plan (optional):
                        </p>
                        <input
                          type="text"
                          value={runName}
                          onChange={(e) => setRunName(e.target.value)}
                          placeholder="e.g. 2025 Read-Through"
                          className="w-full rounded-md border border-white/[0.12] bg-white/[0.06] px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await startFresh({ name: runName.trim() || undefined });
                              } catch {
                                // no progress to archive
                              }
                              setRunName("");
                              setConfirmingReset(false);
                              setMenuOpen(false);
                            }}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                          >
                            Archive & Reset
                          </button>
                          <button
                            onClick={() => {
                              setConfirmingReset(false);
                              setRunName("");
                            }}
                            className="rounded-md bg-white/[0.10] px-2.5 py-1 text-xs text-foreground/80 hover:bg-white/[0.15] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-white/[0.08] my-1" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/[0.10]"
                    >
                      <LogOut className="size-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLoginOpen(true)}
              >
                <LogIn className="size-4" data-icon="inline-start" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <Outlet />
      </main>

      <LoginDrawer open={loginOpen} onOpenChange={setLoginOpen} />

      {currentProgress?.userId && (
        <ReadingHistoryDrawer
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          userId={currentProgress.userId}
        />
      )}
    </div>
  );
}
