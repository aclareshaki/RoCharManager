import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');

// Job IDs problemáticos
const PROBLEMATIC_IDS = [
  { name: "Novice", id: 0 },
  { name: "Sage", id: 16 },
  { name: "Arch Bishop", id: 4057 },
];

async function analyzeIcons() {
  console.log('Analizando iconos problemáticos...\n');
  
  const crypto = await import('crypto');
  
  for (const { name, id } of PROBLEMATIC_IDS) {
    const filePath = path.join(ICONS_DIR, `icon_jobs_${id}.png`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${name} (ID: ${id}): Archivo no existe\n`);
      continue;
    }
    
    const buffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const stats = fs.statSync(filePath);
    
    // Leer los primeros bytes del PNG para verificar el header
    const pngHeader = buffer.slice(0, 8);
    const isPNG = pngHeader[0] === 0x89 && pngHeader[1] === 0x50 && 
                  pngHeader[2] === 0x4E && pngHeader[3] === 0x47;
    
    console.log(`${name} (ID: ${id}):`);
    console.log(`  Tamaño: ${stats.size} bytes`);
    console.log(`  Hash: ${hash.substring(0, 16)}...`);
    console.log(`  Formato PNG válido: ${isPNG ? '✅' : '❌'}`);
    
    // Comparar con otros iconos del mismo tamaño
    if (stats.size === 654) {
      console.log(`  ⚠️  Tamaño idéntico a otros iconos problemáticos (654 bytes)`);
    }
    console.log('');
  }
  
  // Verificar si todos tienen el mismo hash
  const hashes = new Set<string>();
  for (const { name, id } of PROBLEMATIC_IDS) {
    const filePath = path.join(ICONS_DIR, `icon_jobs_${id}.png`);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      hashes.add(hash);
    }
  }
  
  if (hashes.size === 1) {
    console.log('❌ TODOS los iconos tienen el mismo hash - son idénticos');
    console.log('   Esto sugiere que la fuente está sirviendo un icono placeholder genérico\n');
  } else {
    console.log(`✅ Los iconos son diferentes (${hashes.size} hashes únicos)\n`);
  }
  
  console.log('💡 Recomendación:');
  console.log('   - Visita https://www.rocalc.cc/#/ en tu navegador');
  console.log('   - Abre el selector de clases');
  console.log('   - Verifica visualmente si Novice, Sage y Arch Bishop tienen iconos diferentes');
  console.log('   - Si son diferentes visualmente pero tenemos el mismo archivo,');
  console.log('     la fuente podría estar usando JavaScript para cargar diferentes iconos');
}

analyzeIcons().catch(console.error);
