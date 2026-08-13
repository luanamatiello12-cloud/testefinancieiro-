import { execSync } from "node:child_process";

// On Vercel, generate the Postgres (production) Prisma client for the API
// serverless function. Locally, leave the SQLite client alone — running
// `npm run dev` already generates it explicitly, and we don't want a plain
// `npm install` to silently swap the local dev client to the wrong provider.
if (process.env.VERCEL) {
  execSync("npm run generate:prod -w packages/database", { stdio: "inherit" });
}
