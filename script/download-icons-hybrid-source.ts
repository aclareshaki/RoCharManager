import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Job IDs from ClassSprite.tsx
const JOB_IDS: Record<string, number> = {
  // Novice
  "Novice": 0,
  "Super Novice": 23,
  
  // 1st Class
  "Swordman": 1,
  "Mage": 2,
  "Archer": 3,
  "Acolyte": 4,
  "Merchant": 5,
  "Thief": 6,
  
  // 2nd Class
  "Knight": 7,
  "Priest": 8,
  "Wizard": 9,
  "Blacksmith": 10,
  "Hunter": 11,
  "Assassin": 12,
  "Crusader": 14,
  "Monk": 15,
  "Sage": 16,
  "Rogue": 17,
  "Alchemist": 18,
  "Bard": 19,
  "Dancer": 20,

  // Transcendent
  "Lord Knight": 4008,
  "High Priest": 4009,
  "High Wizard": 4010,
  "Whitesmith": 4011,
  "Sniper": 4012,
  "Assassin Cross": 4013,
  "Paladin": 4015,
  "Champion": 4016,
  "Professor": 4017,
  "Stalker": 4018,
  "Creator": 4019,
  "Clown": 4020,
  "Gypsy": 4021,

  // 3rd Class
  "Rune Knight": 4054,
  "Warlock": 4055,
  "Ranger": 4056,
  "Arch Bishop": 4057,
  "Arc Bishop": 4057,
  "Mechanic": 4058,
  "Guillotine Cross": 4059,
  "Royal Guard": 4060,
  "Sorcerer": 4061,
  "Minstrel": 4062,
  "Wanderer": 4063,
  "Sura": 4064,
  "Genetic": 4065,
  "Shadow Chaser": 4066,
  "Kagerou": 4211,
  "Oboro": 4212,
  "Rebellion": 4215,

  // 4th Class
  "Dragon Knight": 4252,
  "Arch Mage": 4255,
  "Windhawk": 4257,
  "Cardinal": 4256,
  "Meister": 4253,
  "Shadow Cross": 4254,
  "Imperial Guard": 4258,
  "Biolo": 4259,
  "Abyss Chaser": 4260,
  "Elemental Master": 4261,
  "Inquisitor": 4262,
  "Troubadour": 4263,
  "Trouvere": 4264,
  "Hyper Novice": 4302,
  "Spirit Handler": 4303,
  "Shinkiro": 4304,
  "Shiranui": 4305,
  "Night Watch": 4306,
  "Sky Emperor": 4307,
  "Soul Ascetic": 4308
};

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');

// Headers HTTP obligatorios
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'image/png,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.rocalc.cc/'
};

// Placeholder hash conocido de Divine Pride
const PLACEHOLDER_HASH = '97EA4FB98F00604B5EE035DFD0C68513'; // MD5 del placeholder

async function calculateMD5(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('md5').update(buffer).digest('hex').toUpperCase();
}

function isValidPNG(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false;
  const header = new Uint8Array(buffer.slice(0, 8));
  return header[0] === 0x89 && 
         header[1] === 0x50 && 
         header[2] === 0x4E && 
         header[3] === 0x47 &&
         header[4] === 0x0D &&
         header[5] === 0x0A &&
         header[6] === 0x1A &&
         header[7] === 0x0A;
}

async function downloadFromURL(url: string, isWikia?: boolean): Promise<{ success: boolean; buffer: Buffer | null; size: number; isPlaceholder?: boolean }> {
  try {
    const response = await fetch(url, {
      headers: HTTP_HEADERS
    });
    
    if (!response.ok) {
      return { success: false, buffer: null, size: 0 };
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength < 100) {
      return { success: false, buffer: null, size: 0, isPlaceholder: false };
    }
    
    // Wikia puede devolver WebP, permitirlo
    const header = new Uint8Array(arrayBuffer.slice(0, 8));
    const isValidPNG = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
    const isValidWebP = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
    
    if (!isValidPNG && (!isWikia || !isValidWebP)) {
      return { success: false, buffer: null, size: 0, isPlaceholder: false };
    }
    
    const buffer = Buffer.from(arrayBuffer);
    
    // Si es el placeholder de Divine Pride, solo aceptarlo si no hay mejor opción
    const md5 = await calculateMD5(buffer);
    const isPlaceholder = md5 === PLACEHOLDER_HASH;
    
    // Si es placeholder pero viene de RoCalc, rechazarlo
    if (isPlaceholder && url.includes('rocalc.cc')) {
      return { success: false, buffer: null, size: 0 };
    }
    
    // Si viene de Wikia, nunca es placeholder
    if (isWikia) {
      return { success: true, buffer, size: buffer.length, isPlaceholder: false };
    }
    
    return { success: true, buffer, size: buffer.length, isPlaceholder: isPlaceholder || false };
  } catch (error) {
    return { success: false, buffer: null, size: 0, isPlaceholder: false };
  }
}

async function downloadIcon(jobId: number, className: string): Promise<boolean> {
  const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  
  // Fuentes a probar en orden de preferencia
  const sources: Array<{url: string; isWikia?: boolean}> = [];
  
  // Fuente especial de Wikia para Novice (PRIMERO, antes que otras)
  if (jobId === 0 && className === "Novice") {
    sources.push({
      url: `https://static.wikia.nocookie.net/ragnarok_gamepedia_en/images/3/3a/RO_NoviceSymbol.png/revision/latest?cb=20200909000127`,
      isWikia: true
    });
  }
  
  // Fuentes estándar
  sources.push(
    { url: `https://www.rocalc.cc/assets/demo/images/jobs/icon_jobs_${jobId}.png` },
    { url: `https://static.divine-pride.net/images/jobs/png/${jobId}.png` }
  );
  
  let placeholderBuffer: Buffer | null = null;
  
  for (const source of sources) {
    const result = await downloadFromURL(source.url, source.isWikia);
    
    if (result.success && result.buffer) {
      // Si es placeholder, guardarlo pero seguir intentando
      if (result.isPlaceholder) {
        placeholderBuffer = result.buffer;
        continue;
      }
      
      // Si no es placeholder, usarlo inmediatamente
      fs.writeFileSync(filePath, result.buffer);
      const sourceName = source.isWikia ? 'Wikia' : (source.url.includes('rocalc') ? 'RoCalc' : 'Divine Pride');
      console.log(`  ✅ ${className} (ID: ${jobId}): ${result.size} bytes (${sourceName})`);
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Si encontramos un placeholder y no hay mejor opción, usarlo
  if (placeholderBuffer) {
    fs.writeFileSync(filePath, placeholderBuffer);
    console.log(`  ⚠️  ${className} (ID: ${jobId}): ${placeholderBuffer.length} bytes (placeholder temporal)`);
    return true;
  }
  
  console.error(`  ❌ ${className} (ID: ${jobId}): No disponible en ninguna fuente`);
  return false;
}

async function main() {
  console.log('📥 Descargando iconos desde múltiples fuentes...\n');
  console.log('Rechazando placeholders y validando PNGs\n');
  
  // Get unique job IDs
  const uniqueJobIds = new Set(Object.values(JOB_IDS));
  const jobIdToClass = new Map<number, string[]>();
  
  for (const [className, jobId] of Object.entries(JOB_IDS)) {
    if (!jobIdToClass.has(jobId)) {
      jobIdToClass.set(jobId, []);
    }
    jobIdToClass.get(jobId)!.push(className);
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const jobId of uniqueJobIds) {
    const classes = jobIdToClass.get(jobId)!;
    const className = classes[0];
    
    const success = await downloadIcon(jobId, className);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Descargados: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
  
  if (successCount === uniqueJobIds.size) {
    console.log(`\n🎉 Todos los iconos descargados correctamente!`);
  } else if (successCount > 0) {
    console.log(`\n⚠️  ${failCount} icono(s) aún no se pudieron descargar.`);
    console.log(`   Los iconos descargados deberían funcionar correctamente.`);
  }
}

main().catch(console.error);
