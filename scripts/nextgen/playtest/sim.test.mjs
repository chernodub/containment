import { describe, expect, it } from 'vitest';
import { CameraObserver, runSimulation, summarizeSimulations } from './sim-core.ts';
import { compareCampaigns } from './sim-compare.mjs';
import { actorMetrics } from './sim-metrics.mjs';
import * as T from 'three';
import {DepthRenderer} from '../../../src/render/DepthRenderer';
import {CameraRig} from '../../../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget} from '../../../src/render/camera/CombatFraming';
import {roomFocus} from '../../../src/render/roomFraming';
import {ROOM_TEMPLATES} from '../../../src/game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../../../src/game/roguelike/storyRooms';

describe('simulation camera parity',()=>{
    it.each([...ROOM_STORY_ROUTE.map(room=>[room.templateId,false]),['reactor-vault',true]])('%s matches production follow, boss framing, safe inset, visibility and pointer projection',(templateId,bossActive)=>{
        const room=ROOM_TEMPLATES[templateId],width=1920,height=1080,view=COMBAT_VIEW_HEIGHT;
        const observer=new CameraObserver(4.7),camera=new T.PerspectiveCamera(28,width/height,.1,160),rig=new CameraRig();
        const probe=Object.assign(Object.create(DepthRenderer.prototype),{
            camera,cameraRig:rig,player:{height:2.05,root:new T.Group()},queen:null,
            screenPoint:new T.Vector3(),screenTarget:new T.Vector3(),focus:new T.Vector3(),visiblePoint:new T.Vector3(),
            raycaster:new T.Raycaster(),ground:new T.Plane(new T.Vector3(0,1,0),0),actors:new Map(),
            canvas:{getBoundingClientRect:()=>({left:0,top:0,width,height})},
        });
        const game={roomRevision:1,status:'playing',node:{templateId},geometry:{bounds:{width:room.width,height:room.height},playerSpawn:room.spawn},
            player:{x:room.spawn.x,y:room.spawn.y,angle:0,radius:16},
            boss:{snapshot:{active:bossActive,defeated:false,x:room.width*.65,y:room.height*.45}},targets:()=>[],};
        const initial=roomFocus(room.spawn.x/32,room.spawn.y/32,room.width/32,room.height/32,view*width/height,view,templateId);
        rig.reset(initial.x,initial.z);
        const desired=new T.Vector3(),framed={x:0,z:0};
        const positions=[room.spawn,...[16,room.width/2,room.width-16].flatMap(x=>[16,room.height/2,room.height-16].map(y=>({x,y})))];
        for(const [frame,position]of positions.entries()){
            Object.assign(game.player,position,{angle:frame*Math.PI/4});game.status=frame===4?'paused':'playing';
            const dt=frame%3===0?.1:frame%3===1?1/60:0,p=game.player,b=game.boss.snapshot,zoom=bossActive?.78:1;
            if(frame>0){observer.rig.kick(p.angle,.12);rig.kick(p.angle,.12);observer.rig.addTrauma(.34);rig.addTrauma(.34);}
            observer.update(game,dt);
            combatFocusTarget(p.x/32,p.y/32,p.angle,b.x/32,b.y/32,bossActive,false,desired);
            roomFocus(desired.x,desired.z,room.width/32,room.height/32,view*width/height/zoom,view/zoom,templateId,framed);
            rig.update(game.status==='paused'?0:Math.min(dt,.05),framed.x,framed.z,1,false);rig.apply(camera,zoom,view,1);
            if(bossActive)probe.protectBossFraming(p.x/32,p.y/32,p.radius/32,b.x/32,b.y/32);
            probe.protectPlayerFraming(p.x/32,p.y/32,p.radius/32);
            camera.matrixWorld.elements.forEach((value,i)=>expect(observer.camera.matrixWorld.elements[i]).toBeCloseTo(value,10));
            expect(observer.camera.zoom).toBeCloseTo(camera.zoom,10);expect(observer.rig.focus.distanceTo(rig.focus)).toBeLessThan(1e-10);
            for(const target of [position,{x:room.width/2,y:room.height/2}]){
                expect(observer.visible(target.x,target.y)).toBe(probe.visible(target.x,target.y));
                const screen=observer.project(target.x,target.y,0),actual=probe.pointer(screen.x,screen.y),simulated=observer.pointer(screen,game,{});
                expect(simulated.x).toBeCloseTo(actual.x,9);expect(simulated.y).toBeCloseTo(actual.y,9);
            }
            if(bossActive)probe.queen={height:4.7};
        }
    });
});

describe('render-free campaign player', () => {
    it('records censored fight state and recent decisions without turning a room timeout into a death', async () => {
        const report = runSimulation({rig: 'arc', seed: 1729, rooms: 1, maxRoomSeconds: 1.4, metrics: await actorMetrics()});
        expect(report.outcome).toBe('stalled');
        expect(report.deathRoom).toBeNull();
        expect(report.final.reason).toBe('max-room-seconds');
        expect(report.final.node.depth).toBe(0);
        expect(report.final.remaining).toBeGreaterThan(0);
        expect(report.final.enemies.length).toBeGreaterThan(0);
        for (const enemy of report.final.enemies) {
            expect(Number.isFinite(enemy.x + enemy.y + enemy.health)).toBe(true);
            expect(typeof enemy.clear).toBe('boolean');
            expect(typeof enemy.visible).toBe('boolean');
        }
        expect(report.final.combat.health).toBeGreaterThan(0);
        expect(report.final.resources).toHaveProperty('ammo');
        expect(report.final.abilities.rig).toBe('arc');
        expect(report.final.recentDecisions.length).toBeGreaterThan(0);
        expect(report.final.recentDecisions.length).toBeLessThanOrEqual(20);
        expect(report.final.noCombatProgressSeconds).toBeGreaterThanOrEqual(0);
        expect(report.final.stats).toEqual(report.stats);
    });

    it('keeps native/simulation discrepancies and rejects mismatched comparison cohorts', () => {
        const stats = {kills: {total: 12}, damageDealt: {weapon: 100, ability: 50, status: 0, boon: 0}, overdrivesUsed: 0, damageTaken: 10};
        const native = {rig: 'arc', seed: 1729, outcome: 'complete', wallSeconds: 50, stats, rooms: [{nodeId: '1729:v3-r0', depth: 0, result: 'clear', seconds: 30, damageTaken: 10, overdrives: 0}]};
        const simulated = {...native, wallSeconds: 2, stats: {...stats, damageTaken: 5}, rooms: [{...native.rooms[0], seconds: 35, damageTaken: 5}]};
        const comparison = compareCampaigns(native, simulated);
        expect(comparison.exactRoomTimes).toBe(0);
        expect(comparison.rooms[0]).toMatchObject({secondsDelta: 5, nativeDamageTaken: 10, simDamageTaken: 5});
        expect(comparison.wallSpeedup).toBe(25);
        expect(() => compareCampaigns(native, {...simulated, seed: 42})).toThrow('must match');
    });
    it('repeats actual seeded opening combat with earned resources and authoritative receipts', async () => {
        const metrics = await actorMetrics(), options = { rig: 'arc', seed: 1729, rooms: 1, metrics };
        const a = runSimulation(options), b = runSimulation(options);
        expect(a.outcome).toBe('room-limit');
        expect(a.rooms).toHaveLength(1);
        expect(a.rooms[0].result).toBe('clear');
        expect(a.rooms[0].seconds).toBeGreaterThan(1);
        expect(a.rooms[0].boons).toEqual(['breacher']);
        expect(a.stats.kills.total).toBe(12);
        expect(a.stats.overdrivesUsed).toBe(0);
        expect(a.stats.damageDealt.weapon).toBeGreaterThan(0);
        expect(a.stats.damageDealt.ability).toBeGreaterThan(0);
        expect(a.stats).toEqual(b.stats);
        expect(a.rooms).toEqual(b.rooms);
        expect(a.final.stats).toEqual(a.stats);
    }, 15000);
    it('aggregates only completed campaigns while preserving deaths and depth denominators', () => {
        const r = { rig: 'arc', seed: 42, outcome: 'dead', deathRoom: 9, wallSeconds: 1, stats: { overdrivesUsed: 2, damageDealt: { weapon: 100, ability: 50, status: 10, boon: 5 } }, rooms: [{ depth: 0, result: 'clear', seconds: 30, damageTaken: 5, overdrives: 0 }, { depth: 8, result: 'dead', seconds: 20, damageTaken: 70, overdrives: 1 }] };
        const sum = summarizeSimulations([r]);
        expect(sum.total.completionPct).toBe(0);
        expect(sum.total.deaths).toEqual({ '9': 1 });
        expect(sum.total.byDepth[8]).toMatchObject({ entered: 1, cleared: 0, medianSeconds: null, medianDamageTaken: 70 });
        expect(sum.total.medianRoomSeconds).toBe(30);
        expect(sum.total.medianRoomsPerOverdrive).toBe(.5);
    });
});
