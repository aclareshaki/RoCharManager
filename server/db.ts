import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = "file:" + path.resolve(__dirname, "..", "local.db");

const client = createClient({ 
  url: databasePath 
});

export const db = drizzle(client, { schema });