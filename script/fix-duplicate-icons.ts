import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');
const BASE_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

// Iconos que necesitan ser corregidos
const FIX_ICONS = [
  { name: "Novice", jobId: 0 },
  { name: "Sage", jobId: 16 },
  { name: "Arch Bishop", jobId: 4057 },
];

// Headers HTTP obligatorios para las peticiones
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function downloadIcon(jobId: number, className: string): Promise<boolean> {
  const url = `${BASE_URL}/icon_jobs_${jobId}.png`;
  const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  
  try {
    console.log(`Descargando ${className} (ID: ${jobId}) desde ${url}...`);
    const response = await fetch(url, {
      headers: HTTP_HEADERS
    });
    
    if (!response.ok) {
      console.error(`  ❌ Error HTTP: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength === 0) {
      console.error(`  ❌ Error: Archivo vacío`);
      return false;
    }
    
    // Guardar el archivo
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    // Verificar que el archivo se guardó correctamente
    const stats = fs.statSync(filePath);
    console.log(`  ✅ Descargado y guardado: ${stats.size} bytes`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    return false;
  }
}

async function verifyIcon(jobId: number): Promise<{ size: number; hash: string }> {
  const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  const crypto = await import('crypto');
  
  if (!fs.existsSync(filePath)) {
    return { size: 0, hash: '' };
  }
  
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const size = buffer.length;
  
  return { size, hash };
}

async function main() {
  console.log('Corrigiendo iconos duplicados...\n');
  
  // Primero, verificar los hashes actuales
  console.log('Hashes actuales:');
  for (const { name, jobId } of FIX_ICONS) {
    const check = await verifyIcon(jobId);
    console.log(`  ${name} (ID: ${jobId}): ${check.hash.substring(0, 16)}... (${check.size} bytes)`);
  }
  
  console.log('\nDescargando iconos correctos...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { name, jobId } of FIX_ICONS) {
    const success = await downloadIcon(jobId, name);
    if (success) {
      successCount++;
      
      // Verificar el nuevo hash
      const check = await verifyIcon(jobId);
      console.log(`  Nuevo hash: ${check.hash.substring(0, 16)}...\n`);
    } else {
      failCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Descargados: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
  
  if (successCount === FIX_ICONS.length) {
    console.log(`\n🎉 Todos los iconos han sido corregidos!`);
    
    // Verificar que ahora son diferentes
    console.log('\nVerificando que los iconos son diferentes...');
    const hashes = new Set<string>();
    for (const { name, jobId } of FIX_ICONS) {
      const check = await verifyIcon(jobId);
      hashes.add(check.hash);
      console.log(`  ${name}: ${check.hash.substring(0, 16)}...`);
    }
    
    if (hashes.size === FIX_ICONS.length) {
      console.log('\n✅ Todos los iconos son únicos!');
    } else {
      console.log(`\n⚠️  Algunos iconos aún son idénticos (${hashes.size} únicos de ${FIX_ICONS.length})`);
    }
  }
}

main().catch(console.error);
