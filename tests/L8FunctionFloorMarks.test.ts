import{describe,it,expect}from'vitest';
import{SHIP_ARCHITECTURE_PLANS}from'../src/game/roguelike/shipArchitectureLayouts';
import{ROOM_TEMPLATES}from'../src/game/roguelike/roomTemplates';
import{addKitFloorAftermath}from'../src/render/world/KitFloorAftermath';
const bespoke=new Set(['residential-gallery','crew-checkpoint','relay-racks']);
describe('function-tied ship floor annotations',()=>{
 it.each(Object.entries(SHIP_ARCHITECTURE_PLANS).filter(([id])=>!bespoke.has(id)))('%s puts its working annotation at a real opening, without detached patches or scatter',(id,plan)=>{
  const marks:{a:{x:number;y:number};b:{x:number;y:number};kind:string}[]=[];
  const proof=addKitFloorAftermath(ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],id,[],{
   valid:()=>true,quad:()=>{throw Error('Detached floor rectangle is not a door annotation');},patch:()=>{throw Error('Detached floor patch is not a door annotation');},
   segment:(ax,az,bx,bz,width,color,kind)=>{expect(width).toBeLessThanOrEqual(.035);marks.push({a:{x:ax*32,y:az*32},b:{x:bx*32,y:bz*32},kind});return true;},
  });
  expect(proof.admitted).toBeGreaterThan(3);expect(new Set(marks.map(m=>m.kind)).size).toBeGreaterThanOrEqual(3);
  const distance=(p:{x:number;y:number},g:typeof plan.openings[number])=>{const dx=g.to.x-g.from.x,dy=g.to.y-g.from.y,t=Math.max(0,Math.min(1,((p.x-g.from.x)*dx+(p.y-g.from.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-g.from.x-dx*t,p.y-g.from.y-dy*t);};
  expect(plan.openings.some(g=>marks.every(m=>distance(m.a,g)<=15&&distance(m.b,g)<=15))).toBe(true);
  for(const mark of marks){expect(mark.kind).toContain(proof.idea);expect(Math.hypot(mark.b.x-mark.a.x,mark.b.y-mark.a.y)).toBeLessThanOrEqual(48);}
 });
});
