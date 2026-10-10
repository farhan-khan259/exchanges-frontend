type Handler=(req:any,res:any,next:()=>void)=>any;
type Route={method?:string,path?:string,handler:Handler};
export class LocalRouter {
  routes:Route[]=[];
  use(value:Handler|LocalRouter){if(value instanceof LocalRouter)this.routes.push(...value.routes);else this.routes.push({handler:value});}
  get(path:string,handler:Handler){this.routes.push({method:"GET",path,handler});}
  post(path:string,handler:Handler){this.routes.push({method:"POST",path,handler});}
  patch(path:string,handler:Handler){this.routes.push({method:"PATCH",path,handler});}
  async dispatch(req:any,res:any){
    for(const route of this.routes){
      if(!route.method){await route.handler(req,res,()=>{});continue;}
      if(route.method!==req.method)continue;
      const a=route.path!.split("/"),b=req.path.split("/");if(a.length!==b.length)continue;
      const params:Record<string,string>={};if(!a.every((p,i)=>p.startsWith(":")?(params[p.slice(1)]=decodeURIComponent(b[i]),true):p===b[i]))continue;
      req.params=params;await route.handler(req,res,()=>{});return;
    }
    throw new Error("This operation needs an internet connection");
  }
}
export const Router=()=>new LocalRouter();
