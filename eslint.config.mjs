import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Estado local de `wrangler dev` (nunca se versiona, ver .gitignore).
    ".wrangler/**",
    // Portado 1:1 desde el sitio original (storage-shim.js) — no se relintea/reescribe.
    "public/**",
    // Supabase Edge Functions (runtime Deno, no forman parte de la app Next.js).
    "supabase/**",
    // Sitio original (vanilla JS/HTML/CSS), archivado tras el cutover a Next.js —
    // no se relintea/reescribe, se conserva solo como referencia histórica.
    "legacy/**",
  ]),
]);

export default eslintConfig;
