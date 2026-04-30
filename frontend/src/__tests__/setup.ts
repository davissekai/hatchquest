import "@testing-library/jest-dom";
import { config } from "dotenv";
import { existsSync } from "fs";

// Load .env.test if it exists (local dev).
// In CI, env vars are injected directly by the workflow — no file needed.
if (existsSync(".env.test")) {
  config({ path: ".env.test" });
}
