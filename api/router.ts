import { createRouter, publicQuery, adminQuery, authedQuery } from "./middleware";
import { searchRouter } from "./searches";
import { authRouter } from "./auth";
import { userRouter } from "./users";
import { settingsRouter } from "./settings";
import { imageRouter } from "./images";
import { chatRouter } from "./chat";
import { setupRouter } from "./setup";

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
});

export type AppRouter = typeof appRouter;