import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeos correctos verificados
const CORRECT_4TH_CLASS: Record<string, number> = {
  "Dragon Knight": 4252,
  "Meister": 4253,
  "Shadow Cross": 4254,
  "Arch Mage": 4255,
  "Cardinal": 4256,
  "Windhawk": 4257,
  "Imperial Guard": 4258,
  "Biolo": 4259,
  "Abyss Chaser": 4260,
  "Elemental Master": 4261,
  "Inquisitor": 4262,
  "Troubadour": 4263,
  "Trouvere": 4264,
};

// Mapeos actuales del código
const CURRENT_MAPPINGS: Record<string, number> = {
  "Dragon Knight": 4252,
  "Arch Mage": 4255,
  "Windhawk": 4257,
  "Cardinal": 4256,
  "Meister": 4253,
  "Shadow Cross": 4254,
  "Imperial Guard": 4258,
  "Biolo": 4259,
  "Troubadour": 4263,
  "Trouvere": 4264,
  "Inquisitor": 4262,
  "Abyss Chaser": 4260,
  "Elemental Master": 4261,
};

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');
const BASE_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

async function verifyAllMappings() {
  console.log('🔍 Verificación completa de mapeos de 4th class...\n');
  
  const errors: Array<{ className: string; currentId: number; correctId: number }> = [];
  const correct: string[] = [];
  
  // Verificar cada clase
  for (const [className, correctId] of Object.entries(CORRECT_4TH_CLASS)) {
    const currentId = CURRENT_MAPPINGS[className];
    
    if (currentId === undefined) {
      console.log(`⚠️  ${className}: No encontrado en mapeos actuales`);
    } else if (currentId !== correctId) {
      errors.push({ className, currentId, correctId });
      console.log(`❌ ${className}: ${currentId} → debería ser ${correctId}`);
    } else {
      correct.push(className);
      // Verificar que el icono existe
      const iconPath = path.join(ICONS_DIR, `icon_jobs_${correctId}.png`);
      if (fs.existsSync(iconPath)) {
        console.log(`✅ ${className}: ${correctId} (icono presente)`);
      } else {
        console.log(`⚠️  ${className}: ${correctId} (icono faltante)`);
      }
    }
  }
  
  // Verificar si hay IDs duplicados o conflictos
  console.log('\n🔍 Verificando duplicados...\n');
  const idToClasses = new Map<number, string[]>();
  
  for (const [className, jobId] of Object.entries(CURRENT_MAPPINGS)) {
    if (!idToClasses.has(jobId)) {
      idToClasses.set(jobId, []);
    }
    idToClasses.get(jobId)!.push(className);
  }
  
  let hasDuplicates = false;
  for (const [jobId, classes] of idToClasses.entries()) {
    if (classes.length > 1) {
      hasDuplicates = true;
      console.log(`⚠️  Job ID ${jobId} está asignado a múltiples clases: ${classes.join(', ')}`);
    }
  }
  
  if (!hasDuplicates) {
    console.log('✅ No hay IDs duplicados');
  }
  
  console.log('\n📊 Resumen:');
  console.log(`   ✅ Correctos: ${correct.length}`);
  console.log(`   ❌ Errores: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errores encontrados:');
    errors.forEach(({ className, currentId, correctId }) => {
      console.log(`   ${className}: ${currentId} → ${correctId}`);
    });
  } else {
    console.log('\n🎉 Todos los mapeos de 4th class son correctos!');
  }
}

verifyAllMappings().catch(console.error);
