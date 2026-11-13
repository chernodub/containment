import type {DepthGame} from '../DepthGame';
import {CombatSystem} from '../game/combat/CombatSystem';
import {progressionFor} from '../game/roguelike/progression';
import type {RunResources} from '../game/roguelike/types';

export type ShopService = 'heal' | 'armor' | 'ammo';
export type ShopResource = Readonly<{id: string; label: string; current: number; maximum: number; free: number; after: Readonly<Record<ShopService, number>>}>;
export type ShopProjection = Readonly<{credits: number; resources: readonly ShopResource[]; available: Readonly<Record<ShopService, boolean>>}>;

/** Detached public combat actions mirror recovery boons without changing the run.
 * The UI never applies this preview; claimResources remains the sole authority.
 */
export function getShopProjection(game: DepthGame): ShopProjection {
  const combat = game.combat, act = progressionFor(game.node).act;
  const source = typeof combat.getRunResources === 'function' ? combat.getRunResources() : {
    ...game.expedition.resources, ...combat.snapshot,
  } as RunResources;
  const preview = new CombatSystem();
  preview.setBuild(game.expedition.build);
  preview.restoreRunResources(source);
  const caps = preview.mutationResources();
  const allocate = (extra = false) => {
    const resources = preview.getRunResources(), ammo = {...resources.ammo};
    for (const [id, amount] of Object.entries({rifle:60+act*15, shotgun:18+act*6, plasma:24+act*6, rocket:2})) {
      const key = id as keyof typeof ammo;
      ammo[key] = {...ammo[key], reserve: Math.min(caps.maxReserve, ammo[key].reserve + Math.max(1, Math.round(amount*(extra?.65:1)/3)))};
    }
    preview.restoreRunResources({...resources, ammo, grenades: Math.min(6, resources.grenades+(extra?0:1))});
  };
  if (game.node.reward === 'healing') {preview.restoreHealth(35+act*5); preview.restoreArmor(15+act*5);}
  else if (game.node.reward === 'supplies') allocate();
  const free = preview.getRunResources();
  const paid = {} as Record<ShopService, RunResources>;
  for (const id of ['heal','armor','ammo'] as const) {
    preview.restoreRunResources(free);
    if (id === 'heal') preview.restoreHealth(30);
    else if (id === 'armor') preview.restoreArmor(25);
    else allocate(true);
    paid[id] = preview.getRunResources();
  }
  const row = (id: string, label: string, maximum: number, read: (r: RunResources)=>number): ShopResource => ({id,label,maximum,current:read(source),free:read(free),after:{heal:read(paid.heal),armor:read(paid.armor),ammo:read(paid.ammo)}});
  const resources = [row('health','Health',caps.maxHealth,r=>r.health),row('armor','Armor',caps.maxArmor,r=>r.armor),
    ...(['rifle','shotgun','plasma','rocket'] as const).map(id=>row(id,id[0].toUpperCase()+id.slice(1)+' reserve',caps.maxReserve,r=>r.ammo[id].reserve)),
    row('grenades','Grenades',6,r=>r.grenades)];
  const costs = {heal:100,armor:90,ammo:100};
  const available = Object.fromEntries((['heal','armor','ammo'] as const).map(id=>[id,typeof game.canPurchaseService === 'function' ? game.canPurchaseService(id) : source.credits>=costs[id] && resources.some(r=>r.after[id]>r.free)])) as Record<ShopService,boolean>;
  return {credits:source.credits,resources,available};
}
