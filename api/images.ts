import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";

export const imageRouter = createRouter({
  generate: authedQuery
    .input(
      z.object({
        prompt: z.string().min(1).max(1000),
        imageSize: z.enum(["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"]).default("square_hd"),
        numImages: z.number().min(1).max(4).default(1),
        style: z.enum(["auto", "cinematic", "digital-art", "photographic", "anime", "fantasy-art", "comic-book", "low-poly", "line-art", "pixel-art", "3d-model", "watercolor", "isometric", "craft-clay", "origami", "modeling-compound"]).default("auto"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data: falSetting } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "fal_api_key")
        .single();
      const apiKey = falSetting?.value ?? "";

      if (!apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "FAL_API_KEY not configured. Ask an admin to set it in Settings." });
      }

      const response = await fetch("https://fal.run/fal-ai/flux-pro/v1.1-ultra", {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input.prompt,
          image_size: input.imageSize,
          num_images: input.numImages,
          style: input.style === "auto" ? undefined : input.style,
          enable_safety_checker: false,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("fal.ai error:", response.status, errBody);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Image generation failed: ${errBody}` });
      }

      const data: any = await response.json();

      // Save images to Supabase
      const savedImages: any[] = [];
      if (data.images) {
        for (const img of data.images) {
          const { data: inserted, error } = await supabase
            .from("images")
            .insert({
              user_id: ctx.user.userId,
              url: img.url,
              prompt: input.prompt,
              width: img.width ?? 0,
              height: img.height ?? 0,
              content_type: img.content_type ?? "image/jpeg",
            })
            .select("id, url, width, height, content_type")
            .single();

          if (!error && inserted) {
            savedImages.push(inserted);
          }
        }
      }

      return {
        seed: data.seed ?? null,
        images: savedImages,
        prompt: input.prompt,
      };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", ctx.user.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[images.list] error:", error.message);
      throw new Error("Failed to fetch images");
    }

    return (data ?? []).map((img: any) => ({
      id: img.id,
      userId: img.user_id,
      url: img.url,
      prompt: img.prompt,
      width: img.width,
      height: img.height,
      contentType: img.content_type,
      createdAt: img.created_at,
    }));
  }),

  delete: authedQuery
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data: img, error: fetchError } = await supabase
        .from("images")
        .select("id, user_id")
        .eq("id", input.imageId)
        .single();

      if (fetchError || !img) throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      if (img.user_id !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your image" });
      }

      const { error } = await supabase.from("images").delete().eq("id", input.imageId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete image" });

      return { success: true };
    }),
});
