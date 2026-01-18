import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Key classes to verify (especially Cardinal and others mentioned)
const KEY_CLASSES: Record<string, number> = {
  "Cardinal": 4255,
  "Royal Guard": 4060,
  "Imperial Guard": 4258,
  "Rune Knight": 4054,
  "Dragon Knight": 4252,
  "Arch Bishop": 4057,
  "Sura": 4064,
  "Inquisitor": 4262,
  "Ranger": 4056,
};

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');
const BASE_URL = 'https://www.rocalc.cc/assets/demo/images/jobs';

async function verifyIcon(className: string, jobId: number): Promise<boolean> {
  const localPath = path.join(ICONS_DIR, `icon_jobs_${jobId}.png`);
  const remoteUrl = `${BASE_URL}/icon_jobs_${jobId}.png`;
  
  // Check if local file exists
  const localExists = fs.existsSync(localPath);
  
  if (!localExists) {
    console.log(`❌ ${className} (ID: ${jobId}): Local file missing`);
    return false;
  }
  
  // Get local file size
  const localStats = fs.statSync(localPath);
  const localSize = localStats.size;
  
  try {
    // Fetch remote file to compare
    const response = await fetch(remoteUrl);
    
    if (!response.ok) {
      console.log(`⚠️  ${className} (ID: ${jobId}): Remote file not accessible (${response.status})`);
      return false;
    }
    
    const remoteBuffer = await response.arrayBuffer();
    const remoteSize = remoteBuffer.byteLength;
    
    // Read local file
    const localBuffer = fs.readFileSync(localPath);
    
    // Compare sizes first (quick check)
    if (localSize !== remoteSize) {
      console.log(`⚠️  ${className} (ID: ${jobId}): Size mismatch (Local: ${localSize}, Remote: ${remoteSize})`);
      // Still check content
    }
    
    // Compare content byte by byte
    const localArray = new Uint8Array(localBuffer);
    const remoteArray = new Uint8Array(remoteBuffer);
    
    if (localArray.length !== remoteArray.length) {
      console.log(`❌ ${className} (ID: ${jobId}): Content length mismatch`);
      return false;
    }
    
    let differences = 0;
    for (let i = 0; i < localArray.length; i++) {
      if (localArray[i] !== remoteArray[i]) {
        differences++;
      }
    }
    
    if (differences === 0) {
      console.log(`✅ ${className} (ID: ${jobId}): Icon matches perfectly (${localSize} bytes)`);
      return true;
    } else {
      console.log(`⚠️  ${className} (ID: ${jobId}): Content differs (${differences} bytes different)`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${className} (ID: ${jobId}): Error verifying - ${error}`);
    return false;
  }
}

async function main() {
  console.log('Verifying key class icons against rocalc.cc...\n');
  
  let verified = 0;
  let issues = 0;
  
  for (const [className, jobId] of Object.entries(KEY_CLASSES)) {
    const isCorrect = await verifyIcon(className, jobId);
    if (isCorrect) {
      verified++;
    } else {
      issues++;
    }
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Verification Summary:`);
  console.log(`   ✅ Verified: ${verified}`);
  console.log(`   ⚠️  Issues: ${issues}`);
  
  if (issues === 0) {
    console.log(`\n🎉 All key icons are correct!`);
  } else {
    console.log(`\n⚠️  Some icons may need to be re-downloaded.`);
  }
}

main().catch(console.error);
