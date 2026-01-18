import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Current Job IDs from ClassSprite.tsx
const CURRENT_JOB_IDS: Record<string, number> = {
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

// Correct Job IDs based on research
const CORRECT_JOB_IDS: Record<string, number> = {
  // 4th Class - verified
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

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');
const BASE_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

async function checkIcon(jobId: number, className: string): Promise<{ exists: boolean; accessible: boolean }> {
  const iconPath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  const remoteUrl = `${BASE_URL}/icon_jobs_${jobId}.png`;
  
  const localExists = fs.existsSync(iconPath);
  
  try {
    const response = await fetch(remoteUrl);
    return { exists: localExists, accessible: response.ok };
  } catch {
    return { exists: localExists, accessible: false };
  }
}

async function main() {
  console.log('Verifying 4th class Job IDs and icons...\n');
  
  const issues: Array<{ className: string; currentId: number; correctId: number | null; reason: string }> = [];
  
  // Check 4th class mappings
  for (const [className, currentId] of Object.entries(CURRENT_JOB_IDS)) {
    if (className in CORRECT_JOB_IDS) {
      const correctId = CORRECT_JOB_IDS[className];
      if (currentId !== correctId) {
        issues.push({
          className,
          currentId,
          correctId,
          reason: `Incorrect ID: should be ${correctId}, currently ${currentId}`
        });
      }
    }
  }
  
  // Check all icons
  console.log('Checking icon accessibility...\n');
  const iconIssues: Array<{ className: string; jobId: number; issue: string }> = [];
  
  for (const [className, jobId] of Object.entries(CURRENT_JOB_IDS)) {
    const result = await checkIcon(jobId, className);
    
    if (!result.exists && !result.accessible) {
      iconIssues.push({ className, jobId, issue: 'Missing and not accessible' });
    } else if (!result.exists) {
      iconIssues.push({ className, jobId, issue: 'Missing locally' });
    } else if (!result.accessible) {
      iconIssues.push({ className, jobId, issue: 'Not accessible remotely' });
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n📊 Verification Results:\n');
  
  if (issues.length > 0) {
    console.log('❌ Job ID Mapping Issues:');
    issues.forEach(({ className, currentId, correctId, reason }) => {
      console.log(`   ${className}: ${reason}`);
    });
    console.log('');
  } else {
    console.log('✅ All Job ID mappings are correct!\n');
  }
  
  if (iconIssues.length > 0) {
    console.log('⚠️  Icon Issues:');
    iconIssues.forEach(({ className, jobId, issue }) => {
      console.log(`   ${className} (ID: ${jobId}): ${issue}`);
    });
    console.log('');
  } else {
    console.log('✅ All icons are present and accessible!\n');
  }
  
  if (issues.length === 0 && iconIssues.length === 0) {
    console.log('🎉 Everything is correct!');
  } else {
    console.log(`\nFound ${issues.length} mapping issue(s) and ${iconIssues.length} icon issue(s).`);
  }
}

main().catch(console.error);
