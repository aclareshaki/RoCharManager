import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');

// Headers HTTP obligatorios
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Mapeo de nombres de clase a nombres de archivo en Wikia
// Basado en el patrón visto: RO_NoviceSymbol.png
const WIKIA_ICON_NAMES: Record<string, string> = {
  "Novice": "RO_NoviceSymbol.png"
  // Podríamos agregar más si encontramos los nombres correctos
};

async function downloadFromWikia(className: string, jobId: number): Promise<boolean> {
  const iconName = WIKIA_ICON_NAMES[className];
  if (!iconName) {
    return false;
  }
  
  // El enlace que proporcionó el usuario
  // https://static.wikia.nocookie.net/ragnarok_gamepedia_en/images/3/3a/RO_NoviceSymbol.png/revision/latest?cb=20200909000127
  // Patrón general: https://static.wikia.nocookie.net/ragnarok_gamepedia_en/images/[hash]/[filename]/revision/latest?cb=[timestamp]
  
  // Para Novice, usamos el enlace directo proporcionado
  const url = className === "Novice" 
    ? "https://static.wikia.nocookie.net/ragnarok_gamepedia_en/images/3/3a/RO_NoviceSymbol.png/revision/latest?cb=20200909000127"
    : null;
  
  if (!url) {
    return false;
  }
  
  try {
    console.log(`  Intentando descargar desde Wikia: ${url}`);
    const response = await fetch(url, {
      headers: HTTP_HEADERS
    });
    
    if (!response.ok) {
      console.log(`    ❌ Error HTTP: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength === 0 || buffer.byteLength < 100) {
      return false;
    }
    
    // Verificar PNG - Wikia puede devolver WebP, verificar ambos
    const header = new Uint8Array(buffer.slice(0, 8));
    const isValidPNG = header[0] === 0x89 && 
                       header[1] === 0x50 && 
                       header[2] === 0x4E && 
                       header[3] === 0x47;
    
    // Verificar WebP (RIFF....WEBP)
    const isValidWebP = header[0] === 0x52 && 
                        header[1] === 0x49 && 
                        header[2] === 0x46 && 
                        header[3] === 0x46;
    
    if (!isValidPNG && !isValidWebP) {
      console.log(`    ❌ No es PNG ni WebP válido (header: ${Array.from(header.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ')})`);
      return false;
    }
    
    const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    console.log(`    ✅ Descargado desde Wikia: ${buffer.byteLength} bytes`);
    return true;
  } catch (error: any) {
    console.log(`    ❌ Error: ${error?.message || error}`);
    return false;
  }
}

async function main() {
  console.log('📥 Descargando icono de Novice desde Wikia...\n');
  
  const success = await downloadFromWikia("Novice", 0);
  
  if (success) {
    console.log('\n✅ Icono de Novice descargado correctamente desde Wikia!');
  } else {
    console.log('\n❌ No se pudo descargar el icono desde Wikia.');
  }
}

main().catch(console.error);
