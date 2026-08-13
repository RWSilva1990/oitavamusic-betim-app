import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  // Vite 8 can read the aliases declared in tsconfig.json natively.
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tanstackStart(), nitro(), viteReact(), tailwindcss()],
});
