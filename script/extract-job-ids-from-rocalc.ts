import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL de rocalc.cc
const ROCALC_URL = 'https://www.rocalc.cc/#/';
const BASE_ICON_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

// Lista de Job IDs conocidos para verificar
const KNOWN_JOB_IDS = [
  // Novice
  0, 23,
  // 1st Class
  1, 2, 3, 4, 5, 6,
  // 2nd Class
  7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20,
  // Transcendent
  4008, 4009, 4010, 4011, 4012, 4013, 4015, 4016, 4017, 4018, 4019, 4020, 4021,
  // 3rd Class
  4054, 4055, 4056, 4057, 4058, 4059, 4060, 4061, 4062, 4063, 4064, 4065, 4066,
  4211, 4212, 4215,
  // 4th Class
  4252, 4253, 4254, 4255, 4256, 4257, 4258, 4259, 4260, 4261, 4262, 4263, 4264,
  4302, 4303, 4304, 4305, 4306, 4307, 4308
];

// Mapeo actual del código
const CURRENT_MAPPING: Record<string, number> = {
  "Novice": 0,
  "Super Novice": 23,
  "Swordman": 1,
  "Mage": 2,
  "Archer": 3,
  "Acolyte": 4,
  "Merchant": 5,
  "Thief": 6,
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
  "Dragon Knight": 4252,
  "Arch Mage": 4255,
  "Windhawk": 4257,
  "Cardinal": 4256,
  "Meister": 4253,
  "Shadow Cross": 4254,
  "Imperial Guard": 4258,
  "Biolo": 4259,
  "Troubadour": 4260,
  "Trouvere": 4264,
  "Inquisitor": 4262,
  "Abyss Chaser": 4263,
  "Elemental Master": 4261,
  "Hyper Novice": 4302,
  "Spirit Handler": 4303,
  "Shinkiro": 4304,
  "Shiranui": 4305,
  "Night Watch": 4306,
  "Sky Emperor": 4307,
  "Soul Ascetic": 4308
};

async function checkIconExists(jobId: number): Promise<boolean> {
  try {
    const url = `${BASE_ICON_URL}/icon_jobs_${jobId}.png`;
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function findCorrectMapping(): Promise<void> {
  console.log('Buscando mapeos correctos desde rocalc.cc...\n');
  console.log('Nota: Este script verifica qué iconos existen en rocalc.cc\n');
  console.log('Para obtener los nombres correctos, necesitarías inspeccionar manualmente\n');
  console.log('la página web o usar las herramientas de desarrollador del navegador.\n');
  
  console.log('Verificando iconos existentes en rocalc.cc...\n');
  
  const existingIcons: number[] = [];
  const missingIcons: number[] = [];
  
  for (const jobId of KNOWN_JOB_IDS) {
    const exists = await checkIconExists(jobId);
    if (exists) {
      existingIcons.push(jobId);
      process.stdout.write(`✅ ${jobId} `);
    } else {
      missingIcons.push(jobId);
      process.stdout.write(`❌ ${jobId} `);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`\n\n📊 Resumen:`);
  console.log(`   Iconos existentes: ${existingIcons.length}`);
  console.log(`   Iconos faltantes: ${missingIcons.length}`);
  
  if (missingIcons.length > 0) {
    console.log(`\n⚠️  Iconos no encontrados en rocalc.cc:`);
    missingIcons.forEach(id => console.log(`   - ${id}`));
  }
  
  console.log(`\n💡 Para obtener los nombres correctos:`);
  console.log(`   1. Abre https://www.rocalc.cc/#/ en tu navegador`);
  console.log(`   2. Abre las herramientas de desarrollador (F12)`);
  console.log(`   3. Inspecciona el selector de clases`);
  console.log(`   4. Busca los elementos que contienen los iconos y nombres`);
  console.log(`   5. Compara los nombres con los Job IDs en el código`);
}

// Función para generar un reporte de comparación
async function generateComparisonReport(): Promise<void> {
  console.log('\n📋 Generando reporte de comparación...\n');
  
  const issues: Array<{ className: string; currentId: number; issue: string }> = [];
  
  // Verificar cada mapeo
  for (const [className, jobId] of Object.entries(CURRENT_MAPPING)) {
    const exists = await checkIconExists(jobId);
    if (!exists) {
      issues.push({
        className,
        currentId: jobId,
        issue: `Icono no existe en rocalc.cc para este Job ID`
      });
    }
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Clases con problemas:');
    issues.forEach(({ className, currentId, issue }) => {
      console.log(`   ${className} (ID: ${currentId}): ${issue}`);
    });
  } else {
    console.log('✅ Todos los iconos existen en rocalc.cc');
  }
}

async function main() {
  await findCorrectMapping();
  await generateComparisonReport();
}

main().catch(console.error);
