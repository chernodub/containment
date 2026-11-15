import * as T from 'three';
import {describe,expect,it} from 'vitest';
import {ACT1_INTERIOR_PROFILES,buildAct1InteriorInlay} from './RoomInteriorAct1';
import {InteriorDeckChart} from './InteriorDeckGeometry';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';

const luminance=(r:number,g:number,b:number)=>r*.2126+g*.7152+b*.0722;

describe('first-nine functional interior inlays',()=>{
  it.each(Object.keys(ACT1_INTERIOR_PROFILES))('%s stays quiet, flush and inside its frozen legal deck',id=>{
    const profile=ACT1_INTERIOR_PROFILES[id];
    const t=ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES];
    const plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS]!;
    const original=JSON.stringify(plan),base=new T.Color(profile.deck),trim=new T.Color(profile.trim);
    const originalBase=base.clone(),originalTrim=trim.clone(),chart=new InteriorDeckChart(t);
    expect(buildAct1InteriorInlay(id,plan,chart,base,trim)).toBe(true);
    expect(chart.positions.length).toBeGreaterThan(54);
    const value=luminance(base.r,base.g,base.b);
    for(let i=0;i<chart.positions.length;i+=9) {
      const triangle=[0,1,2].map(n=>({x:chart.positions[i+n*3]*32,y:chart.positions[i+n*3+2]*32}));
      const center={x:triangle.reduce((sum,p)=>sum+p.x,0)/3,y:triangle.reduce((sum,p)=>sum+p.y,0)/3};
      expect(clearPolygonTopology(t,center,center,0),JSON.stringify(center)).toBe(true);
      expect(t.obstacles.some(r=>center.x>r.x+1e-6&&center.x<r.x+r.width-1e-6&&
        center.y>r.y+1e-6&&center.y<r.y+r.height-1e-6),JSON.stringify(center)).toBe(false);
    }
    for(let i=0;i<chart.positions.length;i+=3) {
      expect(chart.positions[i+1]).toBeLessThan(.022);
      expect(chart.positions[i+1]).toBeGreaterThan(0);
      expect(Math.abs(luminance(chart.colors[i],chart.colors[i+1],chart.colors[i+2])-value)).toBeLessThan(.08);
    }
    expect(base.equals(originalBase)).toBe(true);expect(trim.equals(originalTrim)).toBe(true);
    expect(JSON.stringify(plan)).toBe(original);
  });

  it('leaves unsupported rooms to their owning presentation stream',()=>{
    const t=ROOM_TEMPLATES['crew-checkpoint'],chart=new InteriorDeckChart(t);
    expect(buildAct1InteriorInlay('crew-checkpoint',SHIP_ARCHITECTURE_PLANS['crew-checkpoint']!,
      chart,new T.Color(0x657079),new T.Color(0xb8d0d0))).toBe(false);
    expect(chart.positions).toEqual([]);
  });
});
