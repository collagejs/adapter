import { defineConfig, defineProject } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { playwright } from "@vitest/browser-playwright";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    build: {
        minify: false,
        outDir: "dist",
        lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: "index",
        },
        rollupOptions: {
            external: [/^vue(\/.*)?$/, "@collagejs/core", "@collagejs/adapter"],
        },
    },
    test: {
        projects: [
            defineProject({
                // Remove plugins once Vitest v5 is released.
                plugins: [vue()],
                test: {
                    name: "Component",
                    include: ["**/*.test.ts"],
                    exclude: ["**/*.mocked.test.ts"],
                    setupFiles: ["vitest-browser-vue"],
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        // https://vitest.dev/config/browser/playwright
                        instances: [{ browser: "chromium", headless: true }],
                    },
                },
            }),
            defineProject({
                // Remove plugins once Vitest v5 is released.
                plugins: [vue()],
                test: {
                    name: "Mocked Vue",
                    include: ["**/*.mocked.test.ts"],
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        // https://vitest.dev/config/browser/playwright
                        instances: [{ browser: "chromium", headless: true }],
                    },
                },
            }),
        ],
    },
});
