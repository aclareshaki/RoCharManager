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
  "Arch Mage": 4253,
  "Windhawk": 4254,
  "Cardinal": 4255,
  "Meister": 4256,
  "Shadow Cross": 4257,
  "Imperial Guard": 4258,
  "Biolo": 4259,
  "Troubadour": 4260,
  "Trouvere": 4261,
  "Inquisitor": 4262,
  "Abyss Chaser": 4263,
  "Elemental Master": 4264,
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

// Ensure directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function downloadIcon(jobId: number, className: string): Promise<boolean> {
  const url = `${BASE_URL}/icon_jobs_${jobId}.png`;
  const filePath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`  ❌ Failed to download ${className} (ID: ${jobId}): ${response.status} ${response.statusText}`);
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`  ✅ Downloaded ${className} (ID: ${jobId})`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error downloading ${className} (ID: ${jobId}):`, error);
    return false;
  }
}

async function verifyIcon(jobId: number, className: string): Promise<{ exists: boolean; correct: boolean; needsDownload: boolean }> {
  const localPath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  const remoteUrl = `${BASE_URL}/icon_jobs_${jobId}.png`;
  
  const localExists = fs.existsSync(localPath);
  
  if (!localExists) {
    return { exists: false, correct: false, needsDownload: true };
  }
  
  try {
    // Check if remote file exists and compare
    const response = await fetch(remoteUrl);
    
    if (!response.ok) {
      return { exists: true, correct: false, needsDownload: false };
    }
    
    const remoteBuffer = await response.arrayBuffer();
    const localBuffer = fs.readFileSync(localPath);
    
    // Compare byte by byte
    const localArray = new Uint8Array(localBuffer);
    const remoteArray = new Uint8Array(remoteBuffer);
    
    if (localArray.length !== remoteArray.length) {
      return { exists: true, correct: false, needsDownload: true };
    }
    
    for (let i = 0; i < localArray.length; i++) {
      if (localArray[i] !== remoteArray[i]) {
        return { exists: true, correct: false, needsDownload: true };
      }
    }
    
    return { exists: true, correct: true, needsDownload: false };
  } catch (error) {
    return { exists: true, correct: false, needsDownload: false };
  }
}

async function main() {
  console.log('Verifying all class icons and downloading missing/incorrect ones...\n');
  
  // Get unique job IDs (some classes share the same ID)
  const uniqueJobIds = new Set(Object.values(JOB_IDS));
  const jobIdToClass = new Map<number, string[]>();
  
  // Map job IDs to class names
  for (const [className, jobId] of Object.entries(JOB_IDS)) {
    if (!jobIdToClass.has(jobId)) {
      jobIdToClass.set(jobId, []);
    }
    jobIdToClass.get(jobId)!.push(className);
  }
  
  const missing: Array<{ jobId: number; classes: string[] }> = [];
  const incorrect: Array<{ jobId: number; classes: string[] }> = [];
  const correct: Array<{ jobId: number; classes: string[] }> = [];
  
  // First, verify all icons
  console.log('Step 1: Verifying existing icons...\n');
  for (const jobId of uniqueJobIds) {
    const classes = jobIdToClass.get(jobId)!;
    const className = classes[0];
    
    const result = await verifyIcon(jobId, className);
    
    if (!result.exists) {
      missing.push({ jobId, classes });
      console.log(`⚠️  Missing: ${className} (ID: ${jobId})`);
    } else if (!result.correct) {
      incorrect.push({ jobId, classes });
      console.log(`❌ Incorrect: ${className} (ID: ${jobId})`);
    } else {
      correct.push({ jobId, classes });
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Download missing and incorrect icons
  const toDownload = [...missing, ...incorrect];
  
  if (toDownload.length === 0) {
    console.log(`\n✅ All icons are correct! (${correct.length} verified)`);
    return;
  }
  
  console.log(`\nStep 2: Downloading ${toDownload.length} missing/incorrect icon(s)...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { jobId, classes } of toDownload) {
    const className = classes[0];
    const success = await downloadIcon(jobId, className);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Correct: ${correct.length}`);
  console.log(`   ✅ Downloaded: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  
  if (failCount === 0) {
    console.log(`\n🎉 All icons are now up to date!`);
  } else {
    console.log(`\n⚠️  Some icons could not be downloaded.`);
  }
}

main().catch(console.error);
