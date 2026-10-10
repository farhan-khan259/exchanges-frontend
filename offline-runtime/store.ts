import { Decimal } from "decimal.js";
export type Row = Record<string, any>;
export const models = ["tenant","subscription","branch","settings","currency","customer","khataPosition","khataEntry","khataStockEntry","khataCashEntry","auditEvent","idempotency","user"];
const defaults: Record<string, Row> = {
  tenant: {status:"ACTIVE"}, branch:{active:true}, currency:{active:true,precision:4},
  customer:{mobile:"",notes:"",identityType:null,identityNo:null,status:"ACTIVE"},
  khataPosition:{quantity:"0",cost:"0"}, khataEntry:{pkrAmount:"0",cashDelta:"0",realizedProfit:"0",paymentMode:"CREDIT",currencyCode:null,foreignAmount:null,rate:null,stockCost:null,originalId:null,note:""},
  khataStockEntry:{khataEntryId:null,originalId:null}, khataCashEntry:{khataEntryId:null,originalId:null},
};
let seed = "", counter = 0, clock = new Date();
export function context(key:string,at:string) { seed=key;counter=0;clock=new Date(at); }
export function uuid() {
  const raw=seed.replaceAll("-","");
  if (/^[a-f0-9]{32}$/i.test(raw)) { const c=++counter,tail=((parseInt(raw.slice(24),16)+c)>>>0).toString(16).padStart(8,"0");const hex=raw.slice(0,24)+tail;return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`; }
  let h=2166136261; for (const c of `${seed}:${++counter}`) h=Math.imul(h^c.charCodeAt(0),16777619);
  let hex=""; for(let n=0;n<32;n++){h^=h<<13;h^=h>>>17;h^=h<<5;hex+=(h>>>0).toString(16).slice(-1);}
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20)}`;
}
function match(row:Row,where:Row={}) :boolean {
  return Object.entries(where).every(([k,v]:[string,any])=>{
    if(k==="OR") return v.some((w:Row)=>match(row,w));
    if(k==="AND") return (Array.isArray(v)?v:[v]).every((w:Row)=>match(row,w));
    if(k.includes("_"))return match(row,v);
    const r=row[k];
    if(v!==null&&typeof v==="object"&&!(v instanceof Date))return Object.entries(v).every(([op,x]:[string,any])=>{
      if(op==="mode")return true;
      if(op==="in")return x.includes(r);
      if(op==="not")return r!==x;
      if(op==="contains")return String(r||"").toLowerCase().includes(String(x).toLowerCase());
      if(op==="gte")return r>=x;
      if(op==="lte")return r<=x;
      if(op==="lt")return r<x;
      if(op==="gt")return r>x;
      if(op==="equals")return r===x;
      throw new Error(`Unsupported local filter ${op}`);
    });
    return v instanceof Date ? r?.getTime()===v.getTime() : r===v;
  });
}
const immutable = new Set(["khataEntry","khataStockEntry","khataCashEntry","auditEvent","idempotency"]);
class Collection {
  constructor(private store:LocalStore,private name:string){}
  private list(){return this.store.rows[this.name] ||= [];}
  async findMany(args:Row={}){
    let rows=this.list().filter(r=>match(r,args.where));
    if(args.orderBy){const order=(Array.isArray(args.orderBy)?args.orderBy:[args.orderBy]).flatMap((o:Row)=>Object.entries(o));rows=rows.slice().sort((a,b)=>{for(const [k,d] of order as any){if(a[k]<b[k])return d==="desc"?1:-1;if(a[k]>b[k])return d==="desc"?-1:1;}return a.id.localeCompare(b.id);});}
    rows=rows.slice(args.skip||0,args.take? (args.skip||0)+args.take:undefined);
    return rows.map(r=>args.select?Object.fromEntries(Object.keys(args.select).filter(k=>args.select[k]).map(k=>[k,r[k]])):{...r});
  }
  async findFirst(args:Row={}){return (await this.findMany({...args,take:1}))[0]||null;}
  async findUnique(args:Row){return this.findFirst(args);}
  async findUniqueOrThrow(args:Row){const r=await this.findFirst(args);if(!r)throw Object.assign(new Error("Record unavailable"),{status:404});return r;}
  async count(args:Row={}){return this.list().filter(r=>match(r,args.where)).length;}
  async create(args:Row){const r={...defaults[this.name],id:uuid(),createdAt:new Date(clock),...args.data};if(this.name==="khataPosition")r.updatedAt=new Date(clock);this.validate(r);this.list().push(r);return {...r};}
  async update(args:Row){if(immutable.has(this.name))throw new Error("Financial records are append-only");const old=await this.findUniqueOrThrow({where:args.where});const r={...old,...args.data};this.validate(r);const i=this.list().findIndex(x=>x.id===old.id);this.list()[i]=r;return {...r};}
  async upsert(args:Row){const r=await this.findFirst({where:args.where});return r?this.update({where:{id:r.id},data:args.update}):this.create({data:args.create});}
  async aggregate(args:Row){const rows=await this.findMany({where:args.where});return {_sum:Object.fromEntries(Object.keys(args._sum||{}).map(k=>[k,rows.reduce((s,r)=>s.plus(r[k]||0),new Decimal(0)).toString()]))};}
  async groupBy(args:Row){const groups=new Map<string,Row[]>();for(const r of await this.findMany({where:args.where})){const key=JSON.stringify(args.by.map((k:string)=>r[k]));groups.set(key,[...(groups.get(key)||[]),r]);}return [...groups.values()].map(rows=>({...Object.fromEntries(args.by.map((k:string)=>[k,rows[0][k]])),_sum:Object.fromEntries(Object.keys(args._sum).map(k=>[k,rows.reduce((s,r)=>s.plus(r[k]||0),new Decimal(0)).toString()]))}));}
  private validate(r:Row){
    if(r.tenantId&&r.tenantId!==this.store.actor.tenantId)throw new Error("Cross-account local record blocked");
    if(r.branchId&&this.store.actor.branchId&&r.branchId!==this.store.actor.branchId)throw new Error("Branch access denied");
    if(this.name==="khataPosition"&&(new Decimal(r.quantity).lt(0)||new Decimal(r.cost).lt(0)))throw new Error("Not enough currency in stock");
    if(this.name==="customer"&&this.list().some(x=>x.id===r.id&&x!==r)&&!r.id)throw new Error("Duplicate customer");
  }
}
export class LocalStore {
  [key:string]:any;
  rows:Record<string,Row[]>;
  constructor(rows:Record<string,Row[]>,public actor:Row){this.rows=structuredClone(rows);for(const list of Object.values(this.rows))for(const r of list)for(const k of ["createdAt","updatedAt","startsAt","expiresAt"])if(r[k])r[k]=new Date(r[k]);for(const m of models)this[m]=new Collection(this,m);}
  async transaction<T>(fn:(tx:LocalStore)=>Promise<T>){const previous=structuredClone(this.rows);try{return await fn(this);}catch(e){this.rows=previous;throw e;}}
  async lockTenant(){ }
}
