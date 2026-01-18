import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROCALC_URL = 'https://www.rocalc.cc/#/';

async function fetchRocalcPage(): Promise<string> {
  try {
    console.log('Descargando página de rocalc.cc...');
    const response = await fetch(ROCALC_URL);
    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error descargando la página:', error);
    throw error;
  }
}

async function fetchRocalcAssets(): Promise<void> {
  try {
    // Intentar obtener el archivo JavaScript principal que contiene los mapeos
    const jsFiles = [
      'https://www.rocalc.cc/assets/index.js',
      'https://www.rocalc.cc/assets/demo/index.js',
    ];
    
    console.log('Intentando obtener archivos JavaScript...\n');
    
    for (const jsUrl of jsFiles) {
      try {
        const response = await fetch(jsUrl);
        if (response.ok) {
          const content = await response.text();
          // Buscar patrones de mapeo de clases
          const classPatterns = [
            /(?:class|job|name)[\s:=]+['"]([^'"]+)['"][\s,:\-]+(?:id|jobId|job_id)[\s:=]+(\d+)/gi,
            /(\d+)[\s,:\-]+(?:class|job|name)[\s:=]+['"]([^'"]+)['"]/gi,
            /['"]([^'"]+)['"][\s,:\-]+(\d+)/gi,
          ];
          
          console.log(`\nAnalizando ${jsUrl}...`);
          
          for (const pattern of classPatterns) {
            const matches = content.matchAll(pattern);
            let found = 0;
            for (const match of matches) {
              if (match[1] && match[2]) {
                console.log(`   Encontrado: ${match[1]} -> ${match[2]}`);
                found++;
                if (found > 20) break; // Limitar output
              }
            }
          }
        }
      } catch (e) {
        // Continuar con el siguiente archivo
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  console.log('🔍 Extrayendo mapeos de rocalc.cc...\n');
  console.log('Nota: Este proceso puede requerir inspección manual de la página.\n');
  
  // Intentar obtener información de los assets
  await fetchRocalcAssets();
  
  console.log('\n💡 Recomendación:');
  console.log('   Para obtener los mapeos exactos:');
  console.log('   1. Abre https://www.rocalc.cc/#/');
  console.log('   2. Abre DevTools (F12)');
  console.log('   3. Ve a la pestaña Network');
  console.log('   4. Filtra por JS');
  console.log('   5. Busca archivos que contengan "job" o "class"');
  console.log('   6. Inspecciona el código fuente de esos archivos');
  console.log('   7. Busca objetos o arrays que mapeen nombres a IDs');
}

main().catch(console.error);
