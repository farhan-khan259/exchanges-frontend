import { useEffect, useState } from "react";
import { Cloud, CloudOff, Download, RefreshCw, Upload, Smartphone, ShieldCheck } from "lucide-react";
import { Modal, type Row } from "./shared";
import { activate, cancelPending, deviceState, download, exportBackup, isSyncing, repricePendingSale, restoreBackup, retryPending, syncMessage, syncNow, type DeviceState } from "./offline";
export function OfflinePanel({user}:{user:Row}){
  const [state,setState]=useState<DeviceState|null>(null),[open,setOpen]=useState(false),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[install,setInstall]=useState<any>(null),[online,setOnline]=useState(navigator.onLine),[tick,setTick]=useState(0),[shellReady,setShellReady]=useState(false);
  useEffect(()=>{if("serviceWorker" in navigator)void navigator.serviceWorker.ready.then(()=>setShellReady(true));const update=()=>{void deviceState().then(setState).catch(e=>setMessage(e.message));setOnline(navigator.onLine);setTick(t=>t+1);};const prompt=(e:any)=>{e.preventDefault();setInstall(e);};update();window.addEventListener("khata-offline-changed",update);window.addEventListener("online",update);window.addEventListener("offline",update);window.addEventListener("beforeinstallprompt",prompt);return ()=>{window.removeEventListener("khata-offline-changed",update);window.removeEventListener("online",update);window.removeEventListener("offline",update);window.removeEventListener("beforeinstallprompt",prompt);};},[user.id]);
  async function act(fn:()=>Promise<any>){setBusy(true);setMessage("");try{const result=await fn();if(result?.ok===false)throw new Error(result.error);setMessage("Completed successfully.");}catch(e:any){setMessage(e.message);}finally{setBusy(false);}}
  const pending=state?.queue.length||0,issue=state?.queue.find(q=>q.error);
  return <><div className={"sync-strip "+(!online||issue?"sync-warning":"")} data-sync-version={tick}>
    <span>{online?<Cloud size={16}/>:<CloudOff size={16}/>} {!state?"Preparing offline data…":!online?"Offline · saved on this device":isSyncing()?"Syncing…":issue?"Sync needs review":pending?"Saved on device":(shellReady?"Saved to cloud · offline ready":"Saved to cloud · preparing offline app")}{pending>0&&` · ${pending} pending`}</span>
    <button onClick={()=>setOpen(true)}>Backup &amp; Sync</button>
  </div>
  {open&&<Modal title="Backup & Device Sync" onClose={()=>setOpen(false)}><div className="sync-panel">
    <p>Your business account works across devices. Sign in to the same account online on a new device to download cloud records.</p>
    <div className="sync-facts"><span><ShieldCheck size={20}/>Encrypted device storage</span><span>{pending} unsynced entries</span><span>Last cloud save: {state?.lastSynced?new Date(state.lastSynced).toLocaleString():"Not prepared yet"}</span></div>
    <div className="sync-actions"><button className="primary" disabled={busy||!online} onClick={()=>act(()=>state?syncNow():activate(user))}><RefreshCw size={16}/>Save / Sync Now</button>{install&&<button disabled={busy} onClick={()=>act(async()=>{await install.prompt();setInstall(null);})}><Smartphone size={16}/>Install App</button>}</div>
    {(syncMessage||message)&&<div className="notice" role="status">{message||syncMessage}</div>}
    {issue&&<div className="sync-issue"><h3>Pending entry needs review</h3><p>{issue.path} · {new Date(issue.at).toLocaleString()}</p><p>{issue.error}</p><p>This entry has not been confirmed by the server. Server balances have not been overwritten.</p><div className="sync-actions"><button disabled={busy||!online} onClick={()=>act(retryPending)}>Retry</button>{issue.path==="/give"&&<button disabled={busy||!online} onClick={()=>{if(confirm("Keep the agreed selling rate and recalculate this pending sale using the current server stock cost?"))void act(repricePendingSale);}}>Use current stock cost &amp; retry</button>}<button disabled={busy} onClick={()=>act(cancelPending)}>Remove unsynced entries</button></div></div>}
    <hr/><h3>Password-protected backup</h3><p>Includes downloaded records and unsynced entries. Keep the backup password safe; it cannot be recovered. Restoring never replaces cloud financial records.</p>
    <label className="sync-password">Backup password<input type="password" autoComplete="new-password" minLength={12} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 12 characters"/></label>
    <div className="sync-actions"><button disabled={busy||!state} onClick={()=>act(async()=>download(await exportBackup(password),"Khata_OS_Backup_"+new Date().toISOString().slice(0,10)+".json"))}><Download size={16}/>Download Backup</button><label className="button sync-upload"><Upload size={16}/>Restore Backup<input type="file" accept=".json" disabled={busy||!state} onChange={e=>{const file=e.target.files?.[0];if(file)void act(()=>restoreBackup(file,password));e.target.value="";}}/></label></div>
    <small>Offline access is renewed when connected (up to 7 days). Clearing browser/app data before syncing can remove pending entries. A new device needs internet for its first login.</small>
  </div></Modal>}
  </>;
}
