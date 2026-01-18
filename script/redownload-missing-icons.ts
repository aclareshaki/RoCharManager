import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');
const BASE_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

// Clases problemáticas
const PROBLEMATIC_CLASSES = [
  { name: "Novice", jobId: 0 },
  { name: "Sage", jobId: 16 },
  { name: "Arc Bishop", jobId: 4057 },
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
    console.log(`Descargando ${className} (ID: ${jobId})...`);
    const response = await fetch(url, {
      headers: HTTP_HEADERS
    });
    
    if (!response.ok) {
      console.error(`  ❌ Error: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength === 0) {
      console.error(`  ❌ Error: Archivo vacío`);
      return false;
    }
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`  ✅ Descargado: ${buffer.byteLength} bytes`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    return false;
  }
}

async function checkIcon(jobId: number): Promise<{ exists: boolean; size: number; valid: boolean }> {
  const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  
  if (!fs.existsSync(filePath)) {
    return { exists: false, size: 0, valid: false };
  }
  
  const stats = fs.statSync(filePath);
  const size = stats.size;
  
  // Verificar que el archivo no esté vacío y tenga un tamaño razonable (al menos 100 bytes para un PNG)
  const valid = size > 100;
  
  return { exists: true, size, valid };
}

async function main() {
  console.log('Verificando iconos problemáticos...\n');
  
  for (const { name, jobId } of PROBLEMATIC_CLASSES) {
    const check = await checkIcon(jobId);
    
    console.log(`${name} (ID: ${jobId}):`);
    if (!check.exists) {
      console.log(`  ⚠️  Archivo no existe`);
      await downloadIcon(jobId, name);
    } else if (!check.valid) {
      console.log(`  ⚠️  Archivo inválido o corrupto (${check.size} bytes)`);
      await downloadIcon(jobId, name);
    } else {
      console.log(`  ✅ Archivo válido (${check.size} bytes)`);
    }
    console.log('');
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('Verificación completada.');
}

main().catch(console.error);
