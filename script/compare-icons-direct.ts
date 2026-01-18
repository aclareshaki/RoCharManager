import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

const TEST_ICONS = [
  { name: "Novice", jobId: 0 },
  { name: "Sage", jobId: 16 },
  { name: "Arch Bishop", jobId: 4057 },
];

async function fetchAndHash(jobId: number): Promise<{ size: number; hash: string; url: string }> {
  const url = `${BASE_URL}/icon_jobs_${jobId}.png`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
    
    return {
      size: buffer.byteLength,
      hash,
      url
    };
  } catch (error) {
    throw error;
  }
}

async function main() {
  console.log('Comparando iconos directamente desde rocalc.cc...\n');
  
  const results: Array<{ name: string; jobId: number; size: number; hash: string; url: string }> = [];
  
  for (const { name, jobId } of TEST_ICONS) {
    try {
      console.log(`Obteniendo ${name} (ID: ${jobId})...`);
      const result = await fetchAndHash(jobId);
      results.push({ name, jobId, ...result });
      console.log(`  ✅ Tamaño: ${result.size} bytes, Hash: ${result.hash.substring(0, 16)}...`);
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📊 Comparación de hashes:');
  const uniqueHashes = new Set(results.map(r => r.hash));
  
  if (uniqueHashes.size === results.length) {
    console.log('✅ Todos los iconos son diferentes');
  } else {
    console.log(`⚠️  Algunos iconos son idénticos (${uniqueHashes.size} únicos de ${results.length})`);
    
    // Agrupar por hash
    const hashGroups = new Map<string, string[]>();
    for (const result of results) {
      if (!hashGroups.has(result.hash)) {
        hashGroups.set(result.hash, []);
      }
      hashGroups.get(result.hash)!.push(`${result.name} (${result.jobId})`);
    }
    
    console.log('\nGrupos de iconos idénticos:');
    for (const [hash, classes] of hashGroups.entries()) {
      if (classes.length > 1) {
        console.log(`  ${hash.substring(0, 16)}...: ${classes.join(', ')}`);
      }
    }
  }
  
  console.log('\n💡 Si todos los iconos son idénticos, puede ser que:');
  console.log('   1. rocalc.cc esté sirviendo un icono por defecto para estos IDs');
  console.log('   2. Estos Job IDs realmente compartan el mismo icono');
  console.log('   3. Necesites usar una fuente diferente de iconos');
}

main().catch(console.error);
