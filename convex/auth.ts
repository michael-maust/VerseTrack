import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: (params.email as string).toLowerCase().trim(),
          firstName: (params.firstName as string | undefined) ?? "",
          lastName: (params.lastName as string | undefined) ?? "",
          name: `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim(),
        };
      },
    }),
  ],
});
