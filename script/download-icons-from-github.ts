import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../client/public/images/jobs/icons');
const GITHUB_REPO = 'alisonrag/vue-visual-simulator';
const GITHUB_BRANCH = 'main';

// Headers HTTP obligatorios
const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/vnd.github.v3+json'
};

interface GitHubTreeItem {
  path: string;
  type: string;
  url?: string;
  sha?: string;
}

async function fetchGitHubTree(): Promise<GitHubTreeItem[]> {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`;
    const response = await fetch(url, { headers: HTTP_HEADERS });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.tree || [];
  } catch (error: any) {
    console.error(`Error fetching GitHub tree: ${error.message}`);
    return [];
  }
}

async function findIconFiles(): Promise<string[]> {
  console.log('🔍 Buscando archivos de iconos en el repositorio...\n');
  
  const tree = await fetchGitHubTree();
  
  // Buscar archivos PNG relacionados con jobs/icons
  const iconFiles = tree.filter(item => 
    item.type === 'blob' && 
    item.path && 
    (item.path.includes('icon') || item.path.includes('job')) &&
    item.path.endsWith('.png')
  );
  
  console.log(`📁 Encontrados ${iconFiles.length} archivos potenciales de iconos`);
  
  // Mostrar algunos ejemplos
  iconFiles.slice(0, 10).forEach(item => {
    console.log(`   - ${item.path}`);
  });
  
  if (iconFiles.length > 10) {
    console.log(`   ... y ${iconFiles.length - 10} más`);
  }
  
  return iconFiles.map(item => item.path);
}

async function downloadFileFromGitHub(filePath: string, jobId?: number): Promise<boolean> {
  try {
    // URL raw de GitHub para archivos
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;
    
    const response = await fetch(rawUrl, {
      headers: HTTP_HEADERS
    });
    
    if (!response.ok) {
      return false;
    }
    
    const buffer = await response.arrayBuffer();
    
    if (buffer.byteLength === 0 || buffer.byteLength < 100) {
      return false;
    }
    
    // Si se proporciona jobId, usar ese nombre, sino extraer del path
    let fileName: string;
    if (jobId !== undefined) {
      fileName = `icon_jobs_${jobId}.png`;
    } else {
      // Intentar extraer el job ID del nombre del archivo
      const match = filePath.match(/(\d+)\.png$/);
      if (match) {
        fileName = `icon_jobs_${match[1]}.png`;
      } else {
        fileName = path.basename(filePath);
      }
    }
    
    const filePathLocal = path.join(ICONS_DIR, fileName);
    fs.writeFileSync(filePathLocal, Buffer.from(buffer));
    
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('📥 Descargando iconos desde GitHub...\n');
  console.log(`Repositorio: ${GITHUB_REPO}\n`);
  
  const iconFiles = await findIconFiles();
  
  if (iconFiles.length === 0) {
    console.log('\n❌ No se encontraron archivos de iconos en el repositorio.');
    console.log('💡 Intentando rutas comunes...');
    
    // Intentar rutas comunes
    const commonPaths = [
      'public/images/jobs/icons',
      'public/img/jobs',
      'src/assets/icons/jobs',
      'public/icons'
    ];
    
    // Por ahora, simplemente reportar que no se encontraron
    return;
  }
  
  console.log(`\n📥 Descargando ${iconFiles.length} archivos...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const filePath of iconFiles) {
    const success = await downloadFileFromGitHub(filePath);
    
    if (success) {
      successCount++;
      console.log(`  ✅ ${path.basename(filePath)}`);
    } else {
      failCount++;
      console.log(`  ❌ ${path.basename(filePath)}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Descargados: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
}

main().catch(console.error);
