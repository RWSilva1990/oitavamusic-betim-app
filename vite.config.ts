import { fileURLToPath, URL } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

const androidSpaBuild = process.env.ANDROID_SPA_BUILD === "true";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tanstackStart(
      androidSpaBuild
        ? {
            spa: {
              enabled: true,
            },
          }
        : {},
    ),
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
});
