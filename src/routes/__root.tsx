import { useState } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { LoginDrawer } from "@/components/LoginDrawer";
import { LogReadingDrawer } from "@/components/LogReadingDrawer";
import { BookOpen, LogIn, LogOut, Plus } from "lucide-react";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [loginOpen, setLoginOpen] = useState(false);
  const [logReadingOpen, setLogReadingOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-amber-500" />
            <h1 className="text-lg font-semibold tracking-tight">
              VerseTrack
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogReadingOpen(true)}
              >
                <Plus className="size-4" data-icon="inline-start" />
                Log Reading
              </Button>
            )}

            {isLoading ? (
              <div className="h-7 w-16 animate-pulse rounded-lg bg-white/[0.04]" />
            ) : isAuthenticated ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => signOut()}
                title="Sign out"
              >
                <LogOut className="size-4" />
              </Button>
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
      {isAuthenticated && (
        <LogReadingDrawer
          open={logReadingOpen}
          onOpenChange={setLogReadingOpen}
        />
      )}
    </div>
  );
}
