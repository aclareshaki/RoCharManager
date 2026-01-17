import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Ruta a donde están definidos tus personajes y tablas
  schema: "./shared/schema.ts",
  // Carpeta donde se guardarán los cambios de la base de datos
  out: "./drizzle",
  // Usamos el driver de libsql para que funcione en Windows sin errores
  dialect: "sqlite",
  dbCredentials: {
    url: "file:./local.db",
  },
});