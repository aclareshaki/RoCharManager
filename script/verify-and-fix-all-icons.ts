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

// Fuentes de iconos - probar en orden de preferencia
const SOURCES = [
  {
    name: 'Divine Pride',
    url: (jobId: number) => `https://static.divine-pride.net/images/jobs/png/${jobId}.png`
  },
  {
    name: 'RoCalc',
    url: (jobId: number) => `https://www.rocalc.cc/assets/demo/images/jobs/icon_jobs_${jobId}.png`
  }
];

// Headers HTTP obligatorios para las peticiones
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

interface IconStatus {
  jobId: number;
  className: string;
  exists: boolean;
  size: number;
  valid: boolean;
  needsDownload: boolean;
}

async function checkIcon(jobId: number, className: string): Promise<IconStatus> {
  const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  
  const exists = fs.existsSync(filePath);
  let size = 0;
  let valid = false;
  
  if (exists) {
    const stats = fs.statSync(filePath);
    size = stats.size;
    // Un PNG válido debe tener al menos 100 bytes
    valid = size > 100;
  }
  
  return {
    jobId,
    className,
    exists,
    size,
    valid,
    needsDownload: !exists || !valid
  };
}

async function downloadFromSource(source: typeof SOURCES[0], jobId: number, className: string): Promise<{ success: boolean; size: number }> {
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
    
    const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    return { success: true, size: buffer.byteLength };
  } catch (error) {
    return { success: false, size: 0 };
  }
}

async function downloadIcon(jobId: number, className: string): Promise<boolean> {
  console.log(`  Intentando descargar ${className} (ID: ${jobId})...`);
  
  for (const source of SOURCES) {
    const result = await downloadFromSource(source, jobId, className);
    
    if (result.success) {
      console.log(`    ✅ Descargado desde ${source.name}: ${result.size} bytes`);
      return true;
    } else {
      console.log(`    ❌ ${source.name}: No disponible`);
    }
    
    // Pequeña pausa entre intentos
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

async function main() {
  console.log('🔍 Verificando todos los iconos de clases...\n');
  
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
  
  // Verificar todos los iconos
  const statuses: IconStatus[] = [];
  for (const jobId of uniqueJobIds) {
    const classes = jobIdToClass.get(jobId)!;
    const className = classes[0];
    const status = await checkIcon(jobId, className);
    statuses.push(status);
  }
  
  // Mostrar estado inicial
  const missing = statuses.filter(s => !s.exists);
  const invalid = statuses.filter(s => s.exists && !s.valid);
  const valid = statuses.filter(s => s.exists && s.valid);
  
  console.log(`📊 Estado inicial:`);
  console.log(`   ✅ Válidos: ${valid.length}`);
  console.log(`   ⚠️  Inválidos: ${invalid.length}`);
  console.log(`   ❌ Faltantes: ${missing.length}`);
  console.log('');
  
  // Descargar iconos faltantes o inválidos
  const needsDownload = statuses.filter(s => s.needsDownload);
  
  if (needsDownload.length === 0) {
    console.log('✅ Todos los iconos están presentes y válidos!');
    return;
  }
  
  console.log(`📥 Descargando ${needsDownload.length} icono(s)...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const status of needsDownload) {
    const success = await downloadIcon(status.jobId, status.className);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log(`  ⚠️  No se pudo descargar ${status.className} (ID: ${status.jobId})`);
    }
    
    console.log('');
    // Pausa para no saturar los servidores
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  // Resumen final
  console.log(`\n📊 Resumen final:`);
  console.log(`   ✅ Descargados: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
  
  if (successCount > 0) {
    console.log(`\n🎉 ${successCount} icono(s) descargado(s) correctamente!`);
  }
  
  if (failCount > 0) {
    console.log(`\n⚠️  ${failCount} icono(s) no se pudieron descargar. Puede que necesites descargarlos manualmente.`);
  }
}

main().catch(console.error);
