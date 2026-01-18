import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../shared/schema";
import path from "path";
import { fileURLToPath } from "url";
import { accounts, characters } from "../shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const databaseUrl = process.env.DATABASE_URL;
const databaseAuthToken = process.env.DATABASE_AUTH_TOKEN;

if (!databaseUrl || !databaseAuthToken) {
  console.error("❌ Error: DATABASE_URL y DATABASE_AUTH_TOKEN deben estar definidos en .env");
  process.exit(1);
}

async function migrateToTurso() {
  console.log("🚀 Iniciando migración de local.db a Turso...\n");

  // Conectar a la base de datos local
  const localDbPath = path.resolve(__dirname, "..", "local.db");
  const localClient = createClient({ 
    url: `file:${localDbPath}`
  });
  const localDb = drizzle(localClient, { schema });

  // Conectar a Turso
  const tursoClient = createClient({
    url: databaseUrl,
    authToken: databaseAuthToken
  });
  const tursoDb = drizzle(tursoClient, { schema });

  try {
    // Leer todas las cuentas de la base de datos local
    console.log("📖 Leyendo cuentas de local.db...");
    const localAccounts = await localDb.select().from(accounts);
    console.log(`   ✓ Encontradas ${localAccounts.length} cuentas\n`);

    if (localAccounts.length === 0) {
      console.log("⚠️  No hay datos para migrar.");
      return;
    }

    // Verificar si ya hay datos en Turso
    const existingAccounts = await tursoDb.select().from(accounts);
    if (existingAccounts.length > 0) {
      console.log(`⚠️  Advertencia: Ya existen ${existingAccounts.length} cuentas en Turso.`);
      console.log("   ¿Deseas continuar? Esto podría crear duplicados.");
      // Por seguridad, continuamos pero el usuario debe estar consciente
    }

    // Migrar cuentas
    console.log("📤 Migrando cuentas a Turso...");
    const accountIdMap = new Map<number, number>(); // Mapeo de IDs locales a IDs de Turso

    for (const account of localAccounts) {
      try {
        // Insertar cuenta sin el ID (para que Turso genere uno nuevo)
        const result = await tursoDb.insert(accounts).values({
          name: account.name,
          sortOrder: account.sortOrder,
        }).returning({ id: accounts.id });

        const newId = result[0]?.id;
        if (newId) {
          accountIdMap.set(account.id, newId);
          console.log(`   ✓ Cuenta "${account.name}" migrada (ID local: ${account.id} → ID Turso: ${newId})`);
        }
      } catch (error) {
        console.error(`   ❌ Error al migrar cuenta "${account.name}":`, error);
      }
    }

    console.log(`\n✅ ${accountIdMap.size} cuentas migradas exitosamente\n`);

    // Leer todos los personajes de la base de datos local
    console.log("📖 Leyendo personajes de local.db...");
    const localCharacters = await localDb.select().from(characters);
    console.log(`   ✓ Encontrados ${localCharacters.length} personajes\n`);

    // Migrar personajes
    console.log("📤 Migrando personajes a Turso...");
    let successCount = 0;
    let errorCount = 0;

    for (const character of localCharacters) {
      try {
        // Obtener el nuevo ID de cuenta mapeado
        const newAccountId = accountIdMap.get(character.accountId);
        
        if (!newAccountId) {
          console.error(`   ⚠️  Personaje "${character.name}" tiene accountId ${character.accountId} que no existe en el mapeo. Saltando...`);
          errorCount++;
          continue;
        }

        // Insertar personaje con el nuevo accountId
        await tursoDb.insert(characters).values({
          accountId: newAccountId,
          name: character.name,
          class: character.class,
          lvl: character.lvl,
        });

        successCount++;
        if (successCount % 10 === 0) {
          console.log(`   ✓ ${successCount} personajes migrados...`);
        }
      } catch (error) {
        console.error(`   ❌ Error al migrar personaje "${character.name}":`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Migración completada:`);
    console.log(`   - Cuentas: ${accountIdMap.size} migradas`);
    console.log(`   - Personajes: ${successCount} migrados exitosamente`);
    if (errorCount > 0) {
      console.log(`   - Errores: ${errorCount} personajes no pudieron migrarse`);
    }

    // Verificar los datos migrados
    console.log("\n🔍 Verificando datos en Turso...");
    const tursoAccounts = await tursoDb.select().from(accounts);
    const tursoCharacters = await tursoDb.select().from(characters);
    console.log(`   ✓ Cuentas en Turso: ${tursoAccounts.length}`);
    console.log(`   ✓ Personajes en Turso: ${tursoCharacters.length}`);

  } catch (error) {
    console.error("\n❌ Error durante la migración:", error);
    throw error;
  } finally {
    // Cerrar conexiones
    await localClient.close();
    await tursoClient.close();
  }
}

// Ejecutar la migración
migrateToTurso()
  .then(() => {
    console.log("\n🎉 ¡Migración completada exitosamente!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Error fatal:", error);
    process.exit(1);
  });
