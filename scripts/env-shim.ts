/**
 * Stand-in for SvelteKit's `$env/dynamic/private` virtual module so the seed
 * and screenshot scripts can import `$db` under tsx (see scripts/tsconfig.json).
 * The app only reads `env.DATABASE_URL`, which is a plain process env var.
 */
export const env = process.env as Record<string, string | undefined>;
