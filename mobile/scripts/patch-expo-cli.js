import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, '../node_modules/@expo/cli/build/src/start/server/metro/externals.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Remplacement pour nettoyer les préfixes 'node:' et éliminer les noms contenant ':' comme 'node:sea'
  const originalPattern = `const NODE_STDLIB_MODULES = [
    "fs/promises",
    ...(_module.builtinModules || // @ts-expect-error
    (process.binding ? Object.keys(process.binding("natives")) : []) || []).filter((x)=>!/^_|^(internal|v8|node-inspect)\\/|\\//.test(x) && ![
            "sys"
        ].includes(x)
    ), 
].sort();`;

  const patchedReplacement = `const NODE_STDLIB_MODULES = [
    "fs/promises",
    ...(_module.builtinModules || // @ts-expect-error
    (process.binding ? Object.keys(process.binding("natives")) : []) || [])
    .map((x) => x.replace(/^node:/, ""))
    .filter((x)=>!/^_|^(internal|v8|node-inspect)\\/|\\//.test(x) && !x.includes(":") && ![
            "sys", "sea"
        ].includes(x)
    ), 
].sort();`;

  if (content.includes(originalPattern)) {
    content = content.replace(originalPattern, patchedReplacement);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[Patch Expo CLI] Patch appliqué avec succès sur externals.js (retrait de node:sea et filtrage des colons Windows).');
  } else if (content.includes('!x.includes(":")')) {
    console.log('[Patch Expo CLI] Le patch est déjà appliqué sur externals.js.');
  } else {
    // Regex fallback au cas où les espaces/retours à la ligne diffèrent légèrement
    const regexPattern = /const NODE_STDLIB_MODULES = \[[\s\S]*?\]\.sort\(\);/;
    if (regexPattern.test(content)) {
      content = content.replace(regexPattern, patchedReplacement);
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log('[Patch Expo CLI] Patch appliqué via regex sur externals.js.');
    } else {
      console.warn('[Patch Expo CLI] Impossible de localiser la déclaration NODE_STDLIB_MODULES dans externals.js.');
    }
  }
} else {
  console.warn(`[Patch Expo CLI] Fichier non trouvé : ${targetFile}`);
}

