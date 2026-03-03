import { config } from "dotenv";

// Load test environment variables BEFORE any module that reads process.env.
// This must happen before the db/client module is imported.
config({ path: ".env.test" });
