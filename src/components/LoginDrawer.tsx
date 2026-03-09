import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface LoginDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = "signIn" | "signUp" | "forgot" | "resetVerification";

export function LoginDrawer({ open, onOpenChange }: LoginDrawerProps) {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<Mode>("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setShowPassword(false);
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    if (mode === "signUp") {
      const password = formData.get("password") as string;
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === "signIn" || mode === "signUp") {
        formData.set("flow", mode);
        await signIn("password", formData);
        onOpenChange(false);
      } else if (mode === "forgot") {
        formData.set("flow", "reset");
        const email = formData.get("email") as string;
        await signIn("password", formData);
        setResetEmail(email);
        switchMode("resetVerification");
      } else if (mode === "resetVerification") {
        formData.set("flow", "reset-verification");
        formData.set("email", resetEmail);
        await signIn("password", formData);
        onOpenChange(false);
      }
    } catch {
      const messages: Record<Mode, string> = {
        signIn: "Invalid email or password.",
        signUp: "Could not create account. Try a different email.",
        forgot: "Could not send reset code. Check your email.",
        resetVerification: "Invalid code or password. Try again.",
      };
      setError(messages[mode]);
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Mode, string> = {
    signIn: "Welcome Back",
    signUp: "Join VerseTrack",
    forgot: "Reset Password",
    resetVerification: "Enter Reset Code",
  };

  const descriptions: Record<Mode, string> = {
    signIn: "Sign in to track your reading progress.",
    signUp: "Create an account to start tracking.",
    forgot: "Enter your email to receive a reset code.",
    resetVerification: `We sent a code to ${resetEmail}`,
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader>
          <DrawerTitle>{titles[mode]}</DrawerTitle>
          <DrawerDescription>{descriptions[mode]}</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-6">
          {/* Sign Up: name fields */}
          {mode === "signUp" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          )}

          {/* Email field (signIn, signUp, forgot) */}
          {(mode === "signIn" || mode === "signUp" || mode === "forgot") && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
          )}

          {/* Password field (signIn, signUp) */}
          {(mode === "signIn" || mode === "signUp") && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm password (signUp only) */}
          {mode === "signUp" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Reset verification: code + new password */}
          {mode === "resetVerification" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">Reset Code</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="Enter code from email"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} size="lg" className="mt-1">
            {loading
              ? "Loading..."
              : {
                  signIn: "Sign In",
                  signUp: "Create Account",
                  forgot: "Send Reset Code",
                  resetVerification: "Reset Password",
                }[mode]}
          </Button>

          {/* Navigation links */}
          <div className="flex flex-col items-center gap-1.5">
            {mode === "signIn" && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signUp")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Don't have an account? Sign up
                </button>
              </>
            )}
            {mode === "signUp" && (
              <button
                type="button"
                onClick={() => switchMode("signIn")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}
            {(mode === "forgot" || mode === "resetVerification") && (
              <button
                type="button"
                onClick={() => switchMode("signIn")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
