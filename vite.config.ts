/// <reference types="vitest/config" />

import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import Icons from "unplugin-icons/vite";

export default defineConfig({
    plugins: [tailwindcss(), sveltekit(), Icons({ compiler: "svelte" })],
    test: {
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        includeSource: ["src/**/*.{js,ts}"],
    },
    define: {
        "import.meta.vitest": "undefined",
    },
});
