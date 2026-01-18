import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración para Turso Cloud o local
const databaseUrl = process.env.DATABASE_URL;
const databaseAuthToken = process.env.DATABASE_AUTH_TOKEN;

let client;

if (databaseUrl && databaseAuthToken) {
  // Usar Turso Cloud
  client = createClient({ 
    url: databaseUrl,
    authToken: databaseAuthToken
  });
} else {
  // Fallback a base de datos local
  const databasePath = "file:" + path.resolve(__dirname, "..", "local.db");
  client = createClient({ 
    url: databasePath 
  });
}

export const db = drizzle(client, { schema });