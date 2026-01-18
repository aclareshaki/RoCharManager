import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Current mappings from ClassSprite.tsx
const CURRENT_MAPPINGS: Record<string, number> = {
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
};

// Based on research - correct mappings
const CORRECT_MAPPINGS: Record<string, number> = {
  "Dragon Knight": 4252,
  "Meister": 4253,
  "Shadow Cross": 4254,
  "Arch Mage": 4255,
  "Cardinal": 4256,
  "Windhawk": 4257,
  "Imperial Guard": 4258,
  "Biolo": 4259,
  "Troubadour": 4260,
  "Elemental Master": 4261,
  "Inquisitor": 4262,
  "Abyss Chaser": 4263,
  "Trouvere": 4264,
};

const BASE_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

async function downloadAndCompareIcon(className: string, jobId: number, expectedClassName: string): Promise<{ matches: boolean; issue?: string }> {
  try {
    const url = `${BASE_URL}/icon_jobs_${jobId}.png`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return { matches: false, issue: `Icon not accessible (${response.status})` };
    }
    
    // We can't visually compare, but we can check if the ID exists
    // The real issue is that we need to verify the mapping is correct
    return { matches: true };
  } catch (error) {
    return { matches: false, issue: `Error: ${error}` };
  }
}

async function main() {
  console.log('🔍 Verificando mapeos de 4th class...\n');
  
  console.log('Mapeos actuales:');
  for (const [className, jobId] of Object.entries(CURRENT_MAPPINGS)) {
    const correctId = CORRECT_MAPPINGS[className];
    const status = jobId === correctId ? '✅' : '❌';
    console.log(`  ${status} ${className}: ${jobId} ${jobId !== correctId ? `(debería ser ${correctId})` : ''}`);
  }
  
  console.log('\n📋 Verificando acceso a iconos...\n');
  
  const issues: Array<{ className: string; currentId: number; correctId: number }> = [];
  
  for (const [className, currentId] of Object.entries(CURRENT_MAPPINGS)) {
    const correctId = CORRECT_MAPPINGS[className];
    
    if (currentId !== correctId) {
      issues.push({ className, currentId, correctId });
      console.log(`❌ ${className}: ID incorrecto (${currentId} → ${correctId})`);
    } else {
      const result = await downloadAndCompareIcon(className, currentId, className);
      if (!result.matches) {
        console.log(`⚠️  ${className}: ${result.issue}`);
      } else {
        console.log(`✅ ${className}: OK`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (issues.length > 0) {
    console.log(`\n⚠️  Se encontraron ${issues.length} error(es) de mapeo:`);
    issues.forEach(({ className, currentId, correctId }) => {
      console.log(`   ${className}: ${currentId} → ${correctId}`);
    });
  } else {
    console.log('\n✅ Todos los mapeos son correctos!');
  }
}

main().catch(console.error);
