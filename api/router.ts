import { createRouter, publicQuery, adminQuery, authedQuery } from "./middleware.js";
import { searchRouter } from "./searches.js";
import { authRouter } from "./auth.js";
import { userRouter } from "./users.js";
import { settingsRouter } from "./settings.js";
import { imageRouter } from "./images.js";
import { chatRouter } from "./chat.js";
import { setupRouter } from "./setup.js";

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
