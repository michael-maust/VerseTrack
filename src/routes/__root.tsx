import { useState, useRef, useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { LoginDrawer } from "@/components/LoginDrawer";
import { LogIn, LogOut, ChevronDown } from "lucide-react";

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
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
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
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-white/[0.12] bg-background shadow-lg">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/[0.10]"
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
    </div>
  );
}
