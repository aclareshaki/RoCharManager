import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');

// Fuentes alternativas para iconos
const ALTERNATIVE_SOURCES = [
  'https://static.divine-pride.net/images/jobs/png/16.png',
  'https://www.irowiki.org/wiki/images/jobs/16.png',
  'https://rathena.org/board/uploads/monthly_2020_01/16.png',
];

// Headers HTTP obligatorios para las peticiones
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function downloadFromSource(url: string, jobId: number): Promise<{ success: boolean; size: number; hash: string }> {
  try {
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
        console.log(`  ⚠️  Mismo hash que el archivo actual, probando otra fuente...`);
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
  console.log('Buscando icono correcto del Sage (Job ID 16)...\n');
  
  const jobId = 16;
  const currentFile = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  
  // Verificar el hash actual
  if (fs.existsSync(currentFile)) {
    const crypto = await import('crypto');
    const currentBuffer = fs.readFileSync(currentFile);
    const currentHash = crypto.createHash('sha256').update(currentBuffer).digest('hex');
    console.log(`Hash actual: ${currentHash.substring(0, 16)}... (${currentBuffer.length} bytes)\n`);
  }
  
  console.log('Intentando descargar desde fuentes alternativas...\n');
  
  let success = false;
  
  for (const url of ALTERNATIVE_SOURCES) {
    console.log(`Intentando: ${url}`);
    const result = await downloadFromSource(url, jobId);
    
    if (result.success) {
      console.log(`  ✅ Descargado: ${result.size} bytes`);
      console.log(`  Hash: ${result.hash.substring(0, 16)}...`);
      success = true;
      break;
    } else {
      console.log(`  ❌ No disponible o idéntico al actual`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  if (!success) {
    console.log('\n⚠️  No se pudo descargar desde las fuentes automáticas.');
    console.log('💡 Opciones manuales:');
    console.log('   1. Buscar manualmente "Ragnarok Online Sage icon" en Google Images');
    console.log('   2. Usar herramientas de desarrollo del navegador en rocalc.cc para ver el DOM');
    console.log('   3. Buscar en repositorios de sprites de RO');
  } else {
    console.log('\n🎉 Icono del Sage actualizado correctamente!');
  }
}

main().catch(console.error);
