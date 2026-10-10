import { Decimal } from "decimal.js";
import { LocalStore, type Row } from "./store";
export const D=(v:any)=>new Decimal(v);
Decimal.set({precision:40,rounding:Decimal.ROUND_HALF_UP});
export const money=(v:any)=>D(v).toDecimalPlaces(2).toFixed(2);
export function check(v:any,message:string,status=400):asserts v{if(!v)throw Object.assign(new Error(message),{status});}
export const hash=(s:string)=>s;
export let db:LocalStore;
export function setStore(store:LocalStore){db=store;}
export function permit(a:Row,key:string){check(!a.platformAdmin&&a.tenantId&&a.permissions.includes(key),"Permission denied",403);}
export function scope(a:Row,branchId?:string){check(a.tenantId,"Business account required",403);if(branchId&&a.branchId)check(branchId===a.branchId,"Branch access denied",403);return {tenantId:a.tenantId,...(a.branchId?{branchId:a.branchId}:branchId?{branchId}:{})};}
export async function atomic(a:Row,p:string,fn:any){permit(a,p);check(!a.mustChangePassword,"Change your temporary password first",403);return db.transaction(tx=>fn(tx,a));}
export async function audit(tx:LocalStore,a:Row,action:string,entityType:string,entityId:string,metadata:any={},branchId?:string){return tx.auditEvent.create({data:{tenantId:a.tenantId,branchId:branchId||a.branchId,actorId:a.id,action,entityType,entityId,metadata}});}
