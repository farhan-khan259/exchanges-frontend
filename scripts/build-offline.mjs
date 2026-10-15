import { build } from 'esbuild';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const portablePath=value=>value.replaceAll('\\','/');
await mkdir(path.join(root,'frontend/public'),{recursive:true});
await build({entryPoints:[path.join(root,'frontend/offline-runtime/entry.ts')],outfile:path.join(root,'frontend/public/offline-engine.js'),bundle:true,format:'iife',globalName:'KhataOfflineEngine',platform:'browser',target:'es2022',minify:true,plugins:[{name:'reuse-financial-engine',setup(b){
  b.onResolve({filter:/^express$/},()=>({path:path.join(root,'frontend/offline-runtime/router.ts')}));
  b.onResolve({filter:/^node:crypto$/},()=>({path:path.join(root,'frontend/offline-runtime/crypto.ts')}));
  b.onResolve({filter:/^\.\/core\.js$/},args=>portablePath(args.importer).includes('/backend/src/')?({path:path.join(root,'frontend/offline-runtime/core.ts')}):undefined);
  b.onResolve({filter:/^exceljs$/},()=>({path:path.join(root,'node_modules/exceljs/dist/exceljs.min.js')}));
  b.onResolve({filter:/^pdfkit$/},()=>({path:path.join(root,'node_modules/pdfkit/js/pdfkit.standalone.js')}));
  b.onLoad({filter:/backend[\\/]src[\\/](khata|reports)\.ts$/},async args=>({contents:(await readFile(args.path,'utf8')).replaceAll(/await (book|bookbook)\.xlsx\.write\(res\);\s*res\.end\(\);/g,'res.end(await $1.xlsx.writeBuffer());'),loader:'ts'}));
  b.onLoad({filter:/backend[\\/]src[\\/]print\.ts$/},async args=>{
    let code=await readFile(args.path,'utf8');
    code=code.replace(/import path from "node:path";\n/,'').replace(/import \{ fileURLToPath \} from "node:url";\n/,'').replace(/const fonts = .*;\n/,'');
    code=code.replace(/path\.join\(fonts, "(Regular|Bold)\.ttf"\)/g,'globalThis.__khataFonts.$1');
    code=code.replace('doc.pipe(res);','const chunks=[]; doc.on("data", c=>chunks.push(c)); doc.on("end",()=>{const size=chunks.reduce((s,c)=>s+c.length,0),out=new Uint8Array(size);let at=0;for(const c of chunks){out.set(c,at);at+=c.length;}res.end(out);});');
    return {contents:code,loader:'ts'};
  });
}}]});
