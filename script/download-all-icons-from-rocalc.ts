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
const BASE_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

// Headers HTTP obligatorios para las peticiones
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Ensure directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function downloadIcon(jobId: number, className: string): Promise<boolean> {
  const url = `${BASE_URL}/icon_jobs_${jobId}.png`;
  const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  
  try {
    console.log(`Descargando ${className} (ID: ${jobId}) desde rocalc.cc...`);
    const response = await fetch(url, {
      headers: HTTP_HEADERS
    });
    
    if (!response.ok) {
      console.error(`  ❌ Error HTTP: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength === 0 || buffer.byteLength < 100) {
      console.error(`  ❌ Error: Archivo vacío o inválido (${buffer.byteLength} bytes)`);
      return false;
    }
    
    // Verificar que es un PNG válido (debe empezar con 89 50 4E 47)
    const pngHeader = new Uint8Array(buffer.slice(0, 4));
    const isValidPNG = pngHeader[0] === 0x89 && 
                       pngHeader[1] === 0x50 && 
                       pngHeader[2] === 0x4E && 
                       pngHeader[3] === 0x47;
    
    if (!isValidPNG) {
      console.error(`  ❌ Error: No es un PNG válido (header: ${Array.from(pngHeader).map(b => b.toString(16).padStart(2, '0')).join(' ')})`);
      return false;
    }
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`  ✅ Descargado: ${buffer.byteLength} bytes (PNG válido)`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    return false;
  }
}

async function main() {
  console.log('📥 Descargando todos los iconos desde rocalc.cc...\n');
  console.log('Nota: Esta fuente tiene las clases modernas más actualizadas\n');
  
  // Get unique job IDs
  const uniqueJobIds = new Set(Object.values(JOB_IDS));
  const jobIdToClass = new Map<number, string[]>();
  
  // Map job IDs to class names
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
    
    // Pausa para no saturar el servidor
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Descargados: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
  
  if (successCount > 0) {
    console.log(`\n🎉 ${successCount} iconos descargados desde rocalc.cc!`);
  }
}

main().catch(console.error);
