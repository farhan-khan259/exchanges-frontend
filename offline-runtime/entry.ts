import { api } from "../../backend/src/khata";
import { LocalStore, context } from "./store";
import { setStore } from "./core";
async function execute(snapshot:any,actor:any,path:string,method="GET",body?:any,key="read",at=new Date().toISOString()){
  context(key,at);const store=new LocalStore(snapshot.rows,actor);setStore(store);
  const url=new URL(path,"https://local.invalid");let data:any,status=200;const headers:Record<string,string>={};
  let done!:()=>void;const finished=new Promise<void>(r=>done=r);
  const res:any={status:(v:number)=>(status=v,res),json:(v:any)=>{data=v;done();return res;},setHeader:(k:string,v:string)=>{headers[k.toLowerCase()]=v;},end:(v:any)=>{data=v;done();},write:()=>{}};
  await api.dispatch({actor,path:url.pathname,query:Object.fromEntries(url.searchParams),method,body,headers:{"idempotency-key":key,"x-offline-created-at":method!=="GET"?at:undefined}},res);
  await finished;
  return {data:data instanceof Uint8Array?null:JSON.parse(JSON.stringify(data)),bytes:data instanceof Uint8Array?data:undefined,headers,status,rows:store.rows};
}
export function setFonts(regular:ArrayBuffer,bold:ArrayBuffer){(globalThis as any).__khataFonts={Regular:new Uint8Array(regular),Bold:new Uint8Array(bold)};}

let serial=Promise.resolve();
export function runLocal(...args:any[]){const work=serial.then(()=>execute(...args as [any,any,string,string,any,string,string]));serial=work.catch(()=>{});return work;}
