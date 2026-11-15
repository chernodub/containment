/** Typed geometry-fixture entry used by render-free prospective layout tests. */
export function stageGraphicsKiting(room:string,options?:{
 arena?:Readonly<{x:number;y:number}>;
 tier?:'high'|'low';
 live?:boolean;
}):Promise<void>;
