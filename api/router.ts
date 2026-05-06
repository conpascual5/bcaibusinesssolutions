import { createRouter, publicQuery, adminQuery, authedQuery } from "./middleware.ts";
import { searchRouter } from "./searches.ts";
import { authRouter } from "./auth.ts";
import { userRouter } from "./users.ts";
import { settingsRouter } from "./settings.ts";
import { imageRouter } from "./images.ts";
import { chatRouter } from "./chat.ts";
import { setupRouter } from "./setup.ts";
import { salesWizardSaveRouter } from "./sales-wizard-saves.ts";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  debug: createRouter({
    auth: publicQuery.query(({ ctx }) => ({
      authenticated: !!ctx.user,
      userId: ctx.user?.userId ?? null,
      email: ctx.user?.email ?? null,
      isAdmin: ctx.user?.isAdmin ?? null,
      hasAuthHeader: !!ctx.req.headers.get("authorization") || !!ctx.req.headers.get("Authorization"),
    })),
    testAdmin: adminQuery.query(() => ({ isAdmin: true, message: "Admin access working" })),
    testAuthed: authedQuery.query(({ ctx }) => ({ 
      userId: ctx.user.userId, 
      email: ctx.user.email,
      isAdmin: ctx.user.isAdmin,
    })),
  }),
  search: searchRouter,
  auth: authRouter,
  user: userRouter,
  settings: settingsRouter,
  image: imageRouter,
  chat: chatRouter,
  setup: setupRouter,
  salesWizardSaves: salesWizardSaveRouter,
});

export type AppRouter = typeof appRouter;
