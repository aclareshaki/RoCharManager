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

// Fuentes de iconos
const SOURCES = [
  {
    name: 'RoCalc',
    url: (jobId: number) => `https://www.rocalc.cc/assets/demo/images/jobs/icon_jobs_${jobId}.png`
  },
  {
    name: 'Divine Pride',
    url: (jobId: number) => `https://static.divine-pride.net/images/jobs/png/${jobId}.png`
  }
];

// Headers HTTP obligatorios
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

function isValidPNG(buffer: ArrayBuffer): boolean {
  const header = new Uint8Array(buffer.slice(0, 4));
  return header[0] === 0x89 && 
         header[1] === 0x50 && 
         header[2] === 0x4E && 
         header[3] === 0x47;
}

async function checkIconFile(jobId: number): Promise<{ exists: boolean; valid: boolean; size: number; hash: string }> {
  const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  
  if (!fs.existsSync(filePath)) {
    return { exists: false, valid: false, size: 0, hash: '' };
  }
  
  const buffer = fs.readFileSync(filePath);
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const valid = isValidPNG(buffer.buffer);
  
  return { 
    exists: true, 
    valid, 
    size: buffer.length,
    hash: hash.substring(0, 8)
  };
}

async function downloadFromSource(source: typeof SOURCES[0], jobId: number): Promise<{ success: boolean; size: number }> {
  const url = source.url(jobId);
  
  try {
    const response = await fetch(url, {
      headers: HTTP_HEADERS
    });
    
    if (!response.ok) {
      return { success: false, size: 0 };
    }
    
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength === 0 || buffer.byteLength < 100) {
      return { success: false, size: 0 };
    }
    
    if (!isValidPNG(buffer)) {
      return { success: false, size: 0 };
    }
    
    const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    return { success: true, size: buffer.byteLength };
  } catch (error) {
    return { success: false, size: 0 };
  }
}

async function fixIcon(jobId: number, className: string): Promise<boolean> {
  const check = await checkIconFile(jobId);
  
  if (check.exists && check.valid && check.size > 500) {
    console.log(`  ✅ ${className} (ID: ${jobId}): Válido (${check.size} bytes, hash: ${check.hash})`);
    return true;
  }
  
  if (check.exists && !check.valid) {
    console.log(`  ⚠️  ${className} (ID: ${jobId}): Corrupto o inválido (${check.size} bytes)`);
  } else if (!check.exists) {
    console.log(`  ❌ ${className} (ID: ${jobId}): No existe`);
  } else {
    console.log(`  ⚠️  ${className} (ID: ${jobId}): Tamaño sospechoso (${check.size} bytes)`);
  }
  
  console.log(`  📥 Intentando descargar...`);
  
  for (const source of SOURCES) {
    const result = await downloadFromSource(source, jobId);
    
    if (result.success) {
      console.log(`    ✅ Descargado desde ${source.name}: ${result.size} bytes`);
      return true;
    } else {
      console.log(`    ❌ ${source.name}: No disponible`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

async function main() {
  console.log('🔍 Verificando y corrigiendo iconos corruptos o faltantes...\n');
  
  // Get unique job IDs
  const uniqueJobIds = new Set(Object.values(JOB_IDS));
  const jobIdToClass = new Map<number, string[]>();
  
  for (const [className, jobId] of Object.entries(JOB_IDS)) {
    if (!jobIdToClass.has(jobId)) {
      jobIdToClass.set(jobId, []);
    }
    jobIdToClass.get(jobId)!.push(className);
  }
  
  let fixedCount = 0;
  let failedCount = 0;
  let okCount = 0;
  
  for (const jobId of uniqueJobIds) {
    const classes = jobIdToClass.get(jobId)!;
    const className = classes[0];
    
    const check = await checkIconFile(jobId);
    if (check.exists && check.valid && check.size > 500) {
      okCount++;
      continue;
    }
    
    const success = await fixIcon(jobId, className);
    
    if (success) {
      fixedCount++;
    } else {
      failedCount++;
      console.log(`  ❌ No se pudo descargar ${className} (ID: ${jobId})\n`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ OK: ${okCount}`);
  console.log(`   🔧 Corregidos: ${fixedCount}`);
  console.log(`   ❌ Fallidos: ${failedCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 ${fixedCount} icono(s) corregido(s)!`);
  }
  
  if (failedCount > 0) {
    console.log(`\n⚠️  ${failedCount} icono(s) aún necesitan corrección manual.`);
  }
}

main().catch(console.error);
