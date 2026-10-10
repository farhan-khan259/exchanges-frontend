import { Decimal } from "decimal.js";
type Row = Record<string, any>;
export type Operation = { key: string; path: string; method: string; body: any; at: string; result: Row; error?: string };
export type DeviceState = { schema: 1; account: string; actor: Row; snapshot: Row; view: Row; queue: Operation[]; idMap: Record<string,string>; lastSynced: string; acknowledged?: Record<string, {path:string;body:any;result:any}>; };
const available = () => typeof indexedDB !== "undefined" && !!globalThis.crypto?.subtle;
const allowed = (path:string,method:string) => (method==="POST" && /^\/(buy|give|payments|stock|parties|currencies|cash|(?:entries|stock|cash)\/[^/]+\/reverse)$/.test(path)) || (method==="PATCH" && /^\/(settings|parties\/[^/]+)$/.test(path));
let opened:Promise<IDBDatabase>|undefined;
function database(){return opened ||= new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open("khata-os-offline",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function get(key:string){const db=await database();return new Promise<any>((resolve,reject)=>{const r=db.transaction("kv").objectStore("kv").get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function put(key:string,value:any){const db=await database();return new Promise<void>((resolve,reject)=>{const tx=db.transaction("kv","readwrite");tx.objectStore("kv").put(value,key);tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error || new Error("Device storage is full. Export a backup."));});}
const encoder=new TextEncoder(),decoder=new TextDecoder();
async function deviceKey(account:string){let k=await get("key:"+account);if(!k){k=await crypto.subtle.generateKey({name:"AES-GCM",length:256},false,["encrypt","decrypt"]);await put("key:"+account,k);}return k as CryptoKey;}
async function readAccount(account:string):Promise<DeviceState|null>{const raw=await get("state:"+account);if(!raw)return null;const clear=await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.iv},await deviceKey(account),raw.bytes);return JSON.parse(decoder.decode(clear));}
async function writeAccount(state:DeviceState){const iv=crypto.getRandomValues(new Uint8Array(12)),bytes=await crypto.subtle.encrypt({name:"AES-GCM",iv},await deviceKey(state.account),encoder.encode(JSON.stringify(state)));await put("state:"+state.account,{iv,bytes});localEnabled=true;pendingCount=state.queue.length;}
const chains=new Map<string,Promise<any>>();
async function lock<T>(name:string,fn:()=>Promise<T>):Promise<T>{if(navigator.locks)return navigator.locks.request("khata:"+name,fn);const work=(chains.get(name)||Promise.resolve()).then(fn,fn);chains.set(name,work.catch(()=>{}));return work;}
const channel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("khata-os-offline"):null;
function emit(){window.dispatchEvent(new Event("khata-offline-changed"));channel?.postMessage("changed");}
channel?.addEventListener("message",()=>window.dispatchEvent(new Event("khata-offline-changed")));
let localEnabled=false,pendingCount=0;
export async function deviceState(){if(!available())return null;const account=await get("active");const state=account?await readAccount(account):null;localEnabled=!!state;pendingCount=state?.queue.length||0;return state;}
async function change<T>(fn:(s:DeviceState)=>Promise<T>):Promise<T>{return lock("state",async()=>{const s=await deviceState();if(!s)throw new Error("Connect and sign in to prepare this device first.");const result=await fn(s);await writeAccount(s);emit();return result;});}
export class NetworkFault extends Error {}
export class ApiFault extends Error {constructor(public status:number,message:string){super(message);}}
export async function remote(path:string,method="GET",body?:any,csrf="",key?:string,at?:string,targetAccount?:string){
  let r:Response;try{r=await fetch("/api"+path,{method,credentials:"same-origin",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json",...(csrf?{"X-CSRF-Token":csrf}:{}),...(key?{"Idempotency-Key":key}:{}),...(at?{"X-Offline-Created-At":at}:{}),...(targetAccount?{"X-Offline-Account":targetAccount}:{})},body:body===undefined?undefined:JSON.stringify(body)});}catch{throw new NetworkFault("Unable to reach the server");}
  const value=await r.json().catch(()=>null);if(!r.ok)throw new ApiFault(r.status,value?.error||"Server unavailable");return value;
}
type OfflineEngine = {runLocal:(...args:any[])=>Promise<any>;setFonts:(a:ArrayBuffer,b:ArrayBuffer)=>void};
let offlineEngine:Promise<OfflineEngine>|undefined;
function engine(){return offlineEngine||=(new Promise<OfflineEngine>((resolve,reject)=>{const script=document.createElement("script");script.src="/offline-engine.js";script.onload=()=>{const loaded=(globalThis as typeof globalThis & {KhataOfflineEngine?:OfflineEngine}).KhataOfflineEngine;if(loaded)resolve(loaded);else{script.remove();offlineEngine=undefined;reject(new Error("Offline engine did not initialize"));}};script.onerror=()=>{script.remove();offlineEngine=undefined;reject(new Error("Unable to load the offline engine"));};document.head.append(script);}));}
async function local(s:DeviceState,path:string,method="GET",body?:any,key="read",at?:string){return (await engine()).runLocal(s.view,s.actor,path,method,body,key,at);}
function mapped(value:any,map:Record<string,string>):any{if(typeof value==="string")return Object.hasOwn(map,value)?map[value]:value;if(Array.isArray(value))return value.map(x=>mapped(x,map));if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,mapped(v,map)]));return value;}
function mappedPath(path:string,map:Record<string,string>){const url=new URL(path,"https://local.invalid");const pathname=url.pathname.split("/").map(x=>Object.hasOwn(map,x)?map[x]:x).join("/");for(const [k,v] of url.searchParams)if(Object.hasOwn(map,v))url.searchParams.set(k,map[v]);return pathname+(url.search?"?"+url.searchParams.toString():"");}
async function project(s:DeviceState){
  const completed=s.snapshot.completedOperations||[];
  for(const op of s.queue){const accepted=completed.find((o:Row)=>o.key===op.key);if(accepted){for(const field of ["id","partyId","khataEntryId"])if(op.result?.[field]&&accepted[field])s.idMap[op.result[field]]=accepted[field];}}
  s.queue=s.queue.filter(op=>!completed.some((o:Row)=>o.key===op.key));
  s.view=structuredClone(s.snapshot);for(const op of s.queue){try{const body=mapped(op.body,s.idMap),path=mappedPath(op.path,s.idMap);const r=await local(s,path,op.method,body,op.key,op.at);s.view.rows=r.rows;}catch(e:any){op.error=e.message;break;}}}
export async function selectAccount(user:Row){
  if(!available())return;
  await lock("state",async()=>{if(user.platformAdmin||user.mustChangePassword){await put("active",null);localEnabled=false;pendingCount=0;return;}const account=user.tenantId+":"+user.id;await put("active",account);const saved=await readAccount(account);localEnabled=!!saved;pendingCount=saved?.queue.length||0;});
}
export async function activate(user:Row){
  if(!available()||user.platformAdmin||user.mustChangePassword)return;
  const account=user.tenantId+":"+user.id;await lock("state",async()=>{let s=await readAccount(account);if(s){s.actor=user;await writeAccount(s);}await put("active",account);});
  try{const snapshot=await remote("/sync/snapshot");if(snapshot.tenantId!==user.tenantId||snapshot.userId!==user.id)throw new Error("Account changed during download");await lock("state",async()=>{const current=await get("active");if(current!==account)return;let s=await readAccount(account);if(!s)s={schema:1,account,actor:user,snapshot,view:snapshot,queue:[],idMap:{},lastSynced:snapshot.savedAt};else {s.snapshot=snapshot;s.actor=user;s.lastSynced=snapshot.savedAt;await project(s);}await writeAccount(s);emit();});void navigator.storage?.persist();}catch(e:any){syncMessage=e.message;emit();}
  return {ok:!syncMessage,error:syncMessage};
}
export async function offlineIdentity(){const s=await deviceState();if(!s)return null;if(Date.now()>new Date(s.snapshot.offlineUntil).getTime())throw new Error("Connect and sign in again to renew offline access.");return {user:s.actor,csrf:""};}
export async function signOut(){if(!available())return;const s=await deviceState();if(s?.queue.length&&!window.confirm("Unsynced entries stay on this device. Sign in to the same account to sync them. Sign out?"))throw new Error("Sign-out cancelled");await put("active",null);localEnabled=false;pendingCount=0;emit();}
export async function localRequest(path:string,method:string,body?:any,key?:string){
  const s=await deviceState();if(!s)return undefined;
  if(method==="GET")return (await local(s,mappedPath(path,s.idMap))).data;
  if(!allowed(path,method))throw new Error("This action requires an online connection.");
  return change(async state=>{
    if(Date.now()>new Date(state.snapshot.offlineUntil).getTime())throw new Error("Connect and sign in again before adding offline entries.");
    if(state.queue.some(q=>q.error))throw new Error("Resolve the pending sync issue before adding more entries.");
    const opKey=key||crypto.randomUUID(),at=new Date().toISOString();
    const accepted=state.acknowledged?.[opKey];if(accepted){if(accepted.path!==path||JSON.stringify(accepted.body)!==JSON.stringify(body))throw new Error("Request key was used for different details");return accepted.result;}
    const existing=state.queue.find(q=>q.key===opKey);if(existing){if(existing.path!==path||JSON.stringify(existing.body)!==JSON.stringify(body))throw new Error("Request key was used for different details");return existing.result;}
    const result=await local(state,mappedPath(path,state.idMap),method,mapped(body,state.idMap),opKey,at);
    state.view.rows=result.rows;state.queue.push({key:opKey,path,method,body:structuredClone(body),at,result:result.data});
    return result.data;
  });
}
export let syncMessage="";
let syncing=false;
export const isSyncing=()=>syncing;
export async function syncNow(){
  if(!available()||!navigator.onLine)return;
  return lock("sync",async()=>{
    if(syncing)return;const s=await deviceState();if(!s)return;syncing=true;syncMessage="";emit();
    try{
      const identity=await remote("/auth/me");if(identity.user.id!==s.actor.id||identity.user.tenantId!==s.actor.tenantId)throw new Error("Sign in to the account that owns these pending entries.");
      for(let n=0;n<500;n++){
        const current=await deviceState();if(!current||current.account!==s.account)break;
        const op=current.queue[0];if(!op||op.error)break;
        let result:any;
        try{result=await remote(mappedPath(op.path,current.idMap),op.method,mapped(op.body,current.idMap),identity.csrf,op.key,op.at,current.account);}catch(e:any){if(e instanceof ApiFault && e.status>=400 && e.status<500){await change(async next=>{const q=next.queue.find(q=>q.key===op.key);if(q)q.error=e.message;});}throw e;}
        await change(async next=>{if(next.account!==s.account)throw new Error("Account changed during sync");const q=next.queue.find(q=>q.key===op.key);if(!q)return;for(const field of ["id","partyId","khataEntryId"])if(q.result?.[field]&&result?.[field])next.idMap[q.result[field]]=result[field];next.acknowledged ||= {};next.acknowledged[q.key]={path:q.path,body:q.body,result};const archive=Object.keys(next.acknowledged);if(archive.length>1000)delete next.acknowledged[archive[0]];next.queue=next.queue.filter(q=>q.key!==op.key);});
      }
      const snapshot=await remote("/sync/snapshot");if(snapshot.tenantId!==s.actor.tenantId||snapshot.userId!==s.actor.id)throw new Error("Account changed during download");await change(async next=>{if(next.account!==s.account)return;next.snapshot=snapshot;next.actor=identity.user;next.lastSynced=snapshot.savedAt;await project(next);});
      const status=await deviceState();if(status?.queue[0]?.error)syncMessage=status.queue[0].error;
    }catch(e:any){syncMessage=e.message;if(e instanceof ApiFault && [401,403].includes(e.status)){await lock("state",async()=>{const s=await deviceState();if(s){s.snapshot.offlineUntil=new Date().toISOString();await writeAccount(s);}await put("active",null);});window.dispatchEvent(new Event("khata-auth-required"));}}finally{syncing=false;emit();}
    return {ok:!syncMessage,error:syncMessage};
  });
}
export async function retryPending(){await change(async s=>{for(const q of s.queue)delete q.error;});return syncNow();}
export async function repricePendingSale(){
  const snapshot=await remote("/sync/snapshot");await change(async s=>{const q=s.queue[0];if(q?.path!=="/give")throw new Error("This is not a pending sale.");const engineModule=await engine();const current=await engineModule.runLocal(snapshot,s.actor,"/stock");const p=current.data.find((p:Row)=>p.currencyCode===q.body.currencyCode);if(!p||!Number(p.quantity))throw new Error("No available stock. Add stock online before retrying.");
    // Decimal cost is authoritative; preserve the agreed selling rate.
    q.body.saleRate ||= q.body.quotedRate;q.body.quotedRate=new Decimal(p.cost).div(p.quantity).toFixed(8);delete q.error;s.snapshot=snapshot;await project(s);
  });return syncNow();
}
export async function cancelPending(){await change(async s=>{if(!window.confirm("Remove ALL unsynced entries on this device? Synced server records remain intact. Export a backup first if needed."))return;s.queue=[];s.view=structuredClone(s.snapshot);});}
function base64(bytes:Uint8Array){let s="";for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return btoa(s);}
function unbase64(s:string){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
async function passwordKey(password:string,salt:Uint8Array){if(password.length<12)throw new Error("Use a backup password with at least 12 characters.");const raw=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt as BufferSource,iterations:250000,hash:"SHA-256"},raw,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);}
export async function exportBackup(password:string){const state=await deviceState();if(!state)throw new Error("No saved account on this device.");const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const bytes=await crypto.subtle.encrypt({name:"AES-GCM",iv},await passwordKey(password,salt),encoder.encode(JSON.stringify(state)));return new Blob([JSON.stringify({format:"khata-os-encrypted-backup",version:1,salt:base64(salt),iv:base64(iv),data:base64(new Uint8Array(bytes))})],{type:"application/json"});}
export async function restoreBackup(file:File,password:string){
  if(file.size>100*1024*1024)throw new Error("Backup exceeds 100 MB.");const envelope=JSON.parse(await file.text());if(envelope.format!=="khata-os-encrypted-backup"||envelope.version!==1)throw new Error("Invalid Khata OS backup.");let restored:DeviceState;
  try{const bytes=await crypto.subtle.decrypt({name:"AES-GCM",iv:unbase64(envelope.iv) as BufferSource},await passwordKey(password,unbase64(envelope.salt)),unbase64(envelope.data) as BufferSource);restored=JSON.parse(decoder.decode(bytes));}catch{throw new Error("Wrong backup password or damaged backup.");}
  await change(async s=>{if(restored.schema!==1||restored.account!==s.account||restored.actor.id!==s.actor.id||restored.actor.tenantId!==s.actor.tenantId)throw new Error("This backup belongs to a different account.");
    if(!Array.isArray(restored.queue)||restored.queue.some(q=>!allowed(q.path,q.method)||!/^[a-f0-9-]{36}$/i.test(q.key)||Number.isNaN(Date.parse(q.at))))throw new Error("Invalid pending operations in backup.");
    // Server records are never imported/overwritten. Only missing pending operations are replayed.
    const keys=new Set(s.queue.map(q=>q.key));s.queue.push(...restored.queue.filter(q=>!keys.has(q.key)&&!s.acknowledged?.[q.key]));s.idMap={...restored.idMap,...s.idMap};await project(s);
  });return {ok:true};
}
let started=false;
export function startOffline(){if(started)return;started=true;if(!available())return;
  document.addEventListener("click",async e=>{const a=(e.target as Element)?.closest?.("a[href]") as HTMLAnchorElement|null;if(!a)return;const url=new URL(a.href);if(url.origin!==location.origin||!/^\/api\/(?:reports\/export|cash\/export|stock\/export|parties\/[^/]+\/export|entries\/[^/]+\/receipt)$/.test(url.pathname))return;
    if(!localEnabled||(!pendingCount&&navigator.onLine&&!(window as any).KhataAndroid))return;e.preventDefault();const s=await deviceState();if(!s)return;
    try{const module=await engine();const [r,b]=await Promise.all([fetch("/fonts/Regular.ttf").then(r=>r.arrayBuffer()),fetch("/fonts/Bold.ttf").then(r=>r.arrayBuffer())]);module.setFonts(r,b);const result=await module.runLocal(s.view,s.actor,mappedPath(url.pathname.slice(4)+url.search,s.idMap));const blob=new Blob([result.bytes],{type:result.headers["content-type"]});download(blob,result.headers["content-disposition"]?.match(/filename="([^"]+)"/)?.[1]||"report.pdf");}catch(error:any){window.alert(error.message);}
  },true);
}
export function download(blob:Blob,name:string){if((window as any).KhataAndroid){void blob.arrayBuffer().then(buffer=>(window as any).KhataAndroid.saveFile(base64(new Uint8Array(buffer)),blob.type,name));return;}const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
