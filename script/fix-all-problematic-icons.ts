import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');

// Iconos problemáticos que necesitan ser corregidos
const PROBLEMATIC_ICONS = [
  { name: "Novice", jobId: 0 },
  { name: "Arch Bishop", jobId: 4057 },
];

// Fuentes alternativas (divine-pride parece funcionar)
const ALTERNATIVE_SOURCE = 'https://static.divine-pride.net/images/jobs/png';

// Headers HTTP obligatorios para las peticiones
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function downloadFromDivinePride(jobId: number, className: string): Promise<{ success: boolean; size: number; hash: string }> {
  const url = `${ALTERNATIVE_SOURCE}/${jobId}.png`;
  
  try {
    console.log(`  Descargando desde ${url}...`);
    const response = await fetch(url, {
      headers: HTTP_HEADERS
    });
    
    if (!response.ok) {
      return { success: false, size: 0, hash: '' };
    }
    
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength === 0 || buffer.byteLength < 100) {
      return { success: false, size: 0, hash: '' };
    }
    
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
    
    // Verificar que es diferente al actual
    const currentFile = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
    if (fs.existsSync(currentFile)) {
      const currentBuffer = fs.readFileSync(currentFile);
      const currentHash = crypto.createHash('sha256').update(currentBuffer).digest('hex');
      
      if (hash === currentHash) {
        console.log(`  ⚠️  Mismo hash que el archivo actual`);
        return { success: false, size: 0, hash: '' };
      }
    }
    
    // Guardar el archivo
    fs.writeFileSync(currentFile, Buffer.from(buffer));
    
    return { success: true, size: buffer.byteLength, hash };
  } catch (error) {
    return { success: false, size: 0, hash: '' };
  }
}

async function main() {
  console.log('Corrigiendo iconos problemáticos desde divine-pride.net...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { name, jobId } of PROBLEMATIC_ICONS) {
    console.log(`${name} (Job ID: ${jobId}):`);
    
    const result = await downloadFromDivinePride(jobId, name);
    
    if (result.success) {
      console.log(`  ✅ Descargado: ${result.size} bytes`);
      console.log(`  Hash: ${result.hash.substring(0, 16)}...`);
      successCount++;
    } else {
      console.log(`  ❌ No se pudo descargar o es idéntico al actual`);
      failCount++;
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`📊 Resumen:`);
  console.log(`   ✅ Corregidos: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
  
  if (successCount === PROBLEMATIC_ICONS.length) {
    console.log(`\n🎉 Todos los iconos han sido corregidos!`);
  }
}

main().catch(console.error);
