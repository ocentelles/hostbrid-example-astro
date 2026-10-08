// Original preflight: dist-only HTTP server, no SPA fallback, no dependencies.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
const root=resolve(new URL('../dist/',import.meta.url).pathname),artifacts=process.env.ASTRO_PREFLIGHT_ARTIFACTS||'/tmp/hostbrid-astro-preflight';await mkdir(artifacts,{recursive:true});
let posts=0;const requests=[];
const server=createServer(async(req,res)=>{if(req.method==='POST')posts++;if(req.method!=='GET'){res.writeHead(405);res.end();return;}try{const url=new URL(req.url,'http://localhost');let p=resolve(root,'.'+decodeURIComponent(url.pathname));assert.ok(p===root||p.startsWith(root+'/'));if((await stat(p)).isDirectory())p=join(p,'index.html');const b=await readFile(p);res.writeHead(200,{'Content-Type':{'.html':'text/html','.css':'text/css','.svg':'image/svg+xml'}[extname(p)]||'application/octet-stream'});res.end(b);requests.push({path:url.pathname,status:200});}catch{res.writeHead(404);res.end('Not found');requests.push({path:req.url,status:404});}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));const profile=await mkdtemp(join(tmpdir(),'astro-original-chrome-'));
const chrome=spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});let ws;const results=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/json/version`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const tab=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});const evaluate=async expression=>{const x=await cdp('Runtime.evaluate',{expression,returnByValue:true});assert.ok(!x.exceptionDetails);return x.result.value;};await cdp('Page.enable');await cdp('Runtime.enable');
 for(const width of [390,1280])for(const route of ['/','/notas/primera-noche/']){
  const response=await fetch(origin+route);assert.equal(response.status,200);const html=await response.text();assert.match(html,/<meta name="description" content="[^"]+"/);assert.match(html,/<link rel="canonical" href="https:\/\//);assert.match(html,/<meta property="og:image"/);assert.doesNotMatch(html,/<script\b/);
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});await cdp('Page.navigate',{url:origin+route});let dom;
  for(let i=0;i<100;i++){dom=await evaluate(`({ready:document.readyState,h1:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].map(i=>i.complete&&i.naturalWidth>0),color:getComputedStyle(document.body).color,links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))})`);if(dom.ready==='complete'&&dom.images.length&&dom.images.every(Boolean))break;await new Promise(r=>setTimeout(r,100));}
  assert.ok(dom.h1);assert.equal(dom.overflow,false);assert.ok(dom.images.length&&dom.images.every(Boolean));assert.equal(dom.color,'rgb(24, 52, 72)');for(const path of [...new Set(dom.links)].filter(h=>h.startsWith('/')&&!h.includes('#')))assert.equal((await fetch(origin+path)).status,200,path);
  const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}),name=`astro-${width}-${route==='/'?'home':'note'}.png`;await writeFile(join(artifacts,name),Buffer.from(shot.data,'base64'));
  await evaluate(`document.querySelector('a[href="${route==='/'?'/notas/primera-noche/':'/'}"]').click()`);await new Promise(r=>setTimeout(r,250));assert.equal(await evaluate('location.pathname'),route==='/'?'/notas/primera-noche/':'/');results.push({width,route,status:200,metadata_static:true,css:true,images:true,links:true,navigation:true,overflow:false,screenshot:join(artifacts,name)});
 }
 for(const path of ['/no-existe/','/missing-asset.svg','/_astro/missing.css'])assert.equal((await fetch(origin+path)).status,404,path);assert.equal(posts,0);await writeFile(join(artifacts,'verification.json'),JSON.stringify({results,negative_404:true,post_requests:posts,requests},null,2)+'\n');console.log(JSON.stringify({cases:results.length,negative_404:true,posts,artifacts}));
}finally{if(ws)ws.close();chrome.kill('SIGTERM');await new Promise(r=>chrome.once('exit',r));await new Promise(r=>server.close(r));await rm(profile,{recursive:true,force:true});}
