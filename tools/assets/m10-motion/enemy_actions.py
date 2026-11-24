"""Original M10 creature actions baked onto the retained source armatures.

Run: blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,brute
Only animation tracks are exported. Native roots, edit bones and source meshes
are never edited. Pole-biased CCD uses the original named IK foot/claw controls.
"""
from pathlib import Path
import math
from fnmatch import fnmatchcase
import sys
import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import import_rig, source_pose, apply_pose, new_action, key_pose, export_motion, replace_motion_clips

ROOT = Path(__file__).resolve().parents[3]
FWD = Vector((1, 0, 0))
UP = Vector((0, -1, 0))
SIDE = Vector((0, 0, 1))


def smooth(t):
    t = max(0., min(1., t))
    return t*t*(3.-2.*t)


def between(t, keys):
    if t <= keys[0][0]: return keys[0][1]
    for (a, va), (b, vb) in zip(keys, keys[1:]):
        if t <= b:
            k = smooth((t-a)/(b-a))
            return va+(vb-va)*k
    return keys[-1][1]


class Creature:
    """Author world-space bone poses without changing the imported rest basis."""
    def __init__(self, arm, family):
        self.arm, self.family = arm, family
        self.base = source_pose(arm, 'stand')
        apply_pose(arm, self.base)
        self.names = [b.name for b in arm.data.bones]
        self.base_matrices = {b.name:b.matrix.copy() for b in arm.pose.bones}
        self.children = {b.name:[b.name]+[c.name for c in b.children_recursive] for b in arm.data.bones}
        self.rest = {b.name:b.matrix_local.copy() for b in arm.data.bones}
        self.center={'crawler':'chest','brute':'chest','stalker':'torso','spitter':'bum','carrier':'body'}[family]
        self.height={'crawler':.70,'brute':4.8,'stalker':1.9,'spitter':4.0,'carrier':10.5}[family]
        self.width={'crawler':1.45,'brute':4.8,'stalker':3.0,'spitter':7.8,'carrier':13.6}[family]
        self.legs = []
        self.arms = []
        if family == 'crawler':
            for i in range(6):
                self.add_leg((f'leg{i}_upper',f'leg{i}_lower'), f'IKleg{i}', i)
        elif family == 'brute':
            for index, (row, side) in enumerate((('front','r'),('front','l'),('back','r'),('back','l'))):
                self.add_leg((f'leg.{row}.{side}', f'foot.{row}.{side}'), f'ik.foot.{row}.{side}', index)
            for s in ['r','l']:
                self.arms.append(self.chain((f'shoulder.{s}',f'forearm.{s}',f'claw.{s}'), f'ik.claw.{s}', -1 if s=='r' else 1))
        if family=='stalker':
            for index,(row,side) in enumerate((('front','R'),('front','L'),('back','R'),('back','L'))):
                names=tuple(f'leg_{row}_{segment}.{side}' for segment in ['up','up1','mid','lo','lo1'])
                self.legs.append(self.chain(names,None,index))
            for side in ['R','L']:
                self.arms.append(self.chain(tuple(f'{name}.{side}' for name in ['arm_up','arm_mid','claw']),None,-1 if side=='R' else 1))
        elif family=='spitter':
            for index,(row,side) in enumerate((('m','R'),('m','L'),('b','R'),('b','L'))):
                names=tuple(f'leg_{row}{segment}.{side}'for segment in ['',*range(1,8)])
                self.legs.append(self.chain(names,None,index))
            for side in ['R','L']:
                self.arms.append(self.chain(tuple(f'{name}.{side}'for name in ['hand','hand1','hand2','claw']),None,-1 if side=='R' else 1))
        elif family=='carrier':
            for index,(row,side) in enumerate((('front','R'),('front','L'),('middle','R'),('middle','L'),('back','R'),('back','L'))):
                names=tuple(f'leg_{row}{segment}.{side}'for segment in ['','.001','.002','.003','.004'])
                self.legs.append(self.chain(names,None,index))
            for side in ['R','L']:
                self.arms.append(self.chain(tuple(f'{name}.{side}'for name in ['upper_arm','upper_arm.001','upper_arm.002','claw']),None,-1 if side=='R' else 1))
        if family in ('crawler','stalker','brute'):
            self.fit_blade()
        self.antennae = [n for n in self.names if n.startswith('antenna_') and n.endswith('0')]
        self.reset()
        self.pose('m10-idle',0,3.2)
        self.idle_start={n:m.copy() for n,m in self.m.items()}
        self.reset()

    def fit_blade(self):
        # The fused crescent extends past the retained claw bone's tail and
        # bends sideways. Measure the blade on the untouched production skin.
        mesh=bpy.data.objects.get(f'k11-{self.family}-base')
        claw=self.legs[0] if self.family=='crawler' else self.arms[0]
        self.loaded_blade=dict(claw)
        name=claw['bones'][-1]
        group=mesh.vertex_groups.get(name) if mesh else None
        if group is None:return
        to_arm=self.arm.matrix_world.inverted_safe() @ mesh.matrix_world
        points=np.array([tuple(to_arm @ v.co) for v in mesh.data.vertices
                         if any(g.group==group.index and g.weight>.8 for g in v.groups)])
        if len(points)<3:return
        rest=self.rest[name]
        distances=np.linalg.norm(points-np.array(rest.translation),axis=1)
        distal=points[distances>=np.percentile(distances,95)].mean(axis=0)
        _,vectors=np.linalg.eigh(np.cov(points.T))
        self.loaded_blade['tip_local']=rest.inverted_safe() @ Vector(distal)
        self.loaded_blade['rest']=self.base_matrices[name] @ self.loaded_blade['tip_local']
        self.loaded_blade['face_normal']=rest.to_quaternion().inverted() @ Vector(vectors[:,0])

    def add_leg(self, names, target, index):
        if all(n in self.base_matrices for n in names) and target in self.base_matrices:
            self.legs.append(self.chain(names,target,index))

    def chain(self, names, target, index):
        tip = self.base_matrices[target].translation.copy() if target else self.arm.pose.bones[names[-1]].tail.copy()
        return {'bones':names,'target':target,'tip_local':self.base_matrices[names[-1]].inverted_safe()@tip,
                'rest':tip,'index':index}

    def reset(self):
        self.m = {n:m.copy() for n,m in self.base_matrices.items()}

    def transform(self, name, matrix):
        if name not in self.m: return
        for child in self.children[name]: self.m[child] = matrix @ self.m[child]

    def rotate(self, name, axis, angle):
        if name not in self.m or abs(angle)<1e-8: return
        p = self.m[name].translation
        self.transform(name, Matrix.Translation(p) @ Quaternion(axis,angle).to_matrix().to_4x4() @ Matrix.Translation(-p))

    def move(self, name, delta):
        if name in self.m: self.transform(name, Matrix.Translation(delta))

    def scale(self, name, amount):
        if name not in self.m: return
        p = self.m[name].translation
        self.transform(name, Matrix.Translation(p) @ Matrix.Scale(amount,4) @ Matrix.Translation(-p))

    def squash(self, name, up=1., side=1., forward=1.):
        if name not in self.m:return
        matrix=self.m[name]
        axes=[matrix.to_quaternion()@Vector(v) for v in [(1,0,0),(0,1,0),(0,0,1)]]
        up_axis=max(range(3),key=lambda i:abs(axes[i].dot(UP)))
        side_axis=max((i for i in range(3) if i!=up_axis),key=lambda i:abs(axes[i].dot(SIDE)))
        values=[forward,forward,forward];values[up_axis]=up;values[side_axis]=side
        self.transform(name,matrix@Matrix.Diagonal(Vector((*values,1.)))@matrix.inverted_safe())

    def solve(self, chain, target, iterations=9):
        names = chain['bones']
        for _ in range(iterations):
            for name in reversed(names):
                pivot = self.m[name].translation
                end = self.m[names[-1]] @ chain['tip_local']
                a, b = end-pivot, target-pivot
                if a.length<1e-7 or b.length<1e-7: continue
                q = a.normalized().rotation_difference(b.normalized())
                if q.angle>.85: q=Quaternion(q.axis,.85)
                self.transform(name, Matrix.Translation(pivot) @ q.to_matrix().to_4x4() @ Matrix.Translation(-pivot))
        # Keep the original named IK controller keyed as well as deformation bones.
        control = chain['target']
        if control:self.m[control].translation = target

    def plant(self, targets=None):
        for leg in self.legs:
            target = targets.get(leg['index'],leg['rest']) if targets else leg['rest']
            self.solve(leg,target,7)

    def hammer(self, reach=1., strike=0., spread=1.):
        if not self.arms: return
        if self.family!='brute':return self.family_reach(reach,strike)
        head = self.m.get('head',self.m[self.center]).translation
        for arm in self.arms:
            side = arm['index']
            # Actual claw endpoint (three links), not the wrist joint. The latter
            # made M9 fists dangle even when a wrist was nominally above the head.
            raised = head + UP*self.height*.40 + SIDE*side*self.width*.42 - FWD*self.width*.05
            slam = self.m[self.center].translation + FWD*self.width*.53 - UP*self.height*.48 + SIDE*side*self.width*.22
            desired = arm['rest'].lerp(raised,reach).lerp(slam,strike)
            self.rotate(arm['bones'][0],FWD,side*.12*reach*spread)
            self.solve(arm,desired,14)

    def family_reach(self, reach, strike):
        head=self.m['head'].translation
        H,W=self.height,self.width
        for arm in self.arms:
            side=arm['index']
            if self.family=='stalker':
                ready=head+FWD*W*.08+SIDE*side*W*.22+UP*H*.05
                release=head+FWD*W*.62+SIDE*side*W*.30-UP*H*.20
            elif self.family=='spitter':
                ready=head-FWD*W*.12+SIDE*side*W*.28-UP*H*.35
                release=head+FWD*W*.10+SIDE*side*W*.35-UP*H*.45
            else:
                if getattr(self,'current_action','') in ['m10-windup','m10-strike']:
                    ready=head-FWD*W*.08+SIDE*side*W*.35+UP*H*(.16 if side<0 else -.04)
                else:ready=head-FWD*W*.05+SIDE*side*W*.27+UP*H*.10
                release=head+FWD*W*.35+SIDE*side*W*.20-UP*H*.45
            self.solve(arm,arm['rest'].lerp(ready,reach).lerp(release,strike),14)

    def mouth(self, amount, time=0.):
        self.rotate('jaw',SIDE,.65*amount)
        if self.family not in ['crawler','brute']:
            for name in self.names:
                if name.startswith('mandible'):
                    side=-1 if name.endswith('.R') else 1
                    self.rotate(name,UP,side*.28*amount)
        for n in self.antennae:
            sign=-1 if 'right' in n else 1
            self.rotate(n,UP,sign*(.24*amount+.07*math.sin(time*3.)))

    def commit(self):
        for bone in self.arm.pose.bones:
            parent = bone.parent
            kwargs = {'parent_matrix':self.m[parent.name], 'parent_matrix_local':self.rest[parent.name]} if parent else {}
            bone.matrix_basis = bone.bone.convert_local_to_pose(self.m[bone.name],self.rest[bone.name],invert=True,**kwargs)
        bpy.context.view_layer.update()

    def elemental(self, element, t, terminal, targets):
        H,W=self.height,self.width
        # Live reactions regain their feet. Death carries the final load
        # through the seam into the prepared physical body.
        settle=1 if terminal else 1-between(t,[(0,0),(.70,0),(1,1)])
        if element=='ice':
            crack=between(t,[(0,0),(.26,0),(.43,1),(.59,.85),(1,.82)])
            self.rotate(self.center,FWD,.67*crack)
            self.rotate('head',UP,-.46*crack)
            self.squash(self.center,1-.13*crack,1+.10*crack)
            for leg in self.legs:
                i=leg['index'];side=1 if i%2 else -1
                targets[i]=leg['rest']+SIDE*W*side*.17*crack+UP*H*(.38 if i%2==0 else .02)*crack
            return
        if element=='fire':
            recoil=between(t,[(0,0),(.13,1),(.33,.41),(.58,0),(1,0)])
            flail=between(t,[(0,0),(.21,1),(.45,-.92),(.62,.48),(.71,0),(1,0)])
            curl=between(t,[(0,0),(.33,0),(.64,.85),(.83,1),(1,1)])*settle
            self.rotate(self.center,SIDE,-.43*recoil+.69*curl)
            self.rotate(self.center,FWD,.42*flail+.60*curl)
            self.rotate('head',SIDE,.62*curl-.30*recoil)
            self.move(self.center,UP*H*(.12*recoil-.39*curl))
            self.mouth(.85*recoil+.46*abs(flail))
        elif element=='arc':
            recoil=between(t,[(0,0),(.07,1),(.28,.96),(.40,.65),(.46,1),(.55,0),(1,0)])
            flail=0
            curl=between(t,[(0,0),(.45,0),(.64,1),(.75,.88),(1,1)])*settle
            self.rotate(self.center,SIDE,-.58*recoil+.43*curl)
            self.rotate(self.center,FWD,.27*recoil-.83*curl)
            self.move(self.center,UP*H*(.14*recoil-.38*curl))
            self.rotate('head',SIDE,-.49*recoil+.34*curl)
        else:
            recoil=between(t,[(0,0),(.11,1),(.28,.70),(.52,.21),(1,0)])
            flail=0
            curl=between(t,[(0,0),(.14,.27),(.44,1),(.62,.86),(1,1)])*settle
            self.rotate(self.center,SIDE,-.57*recoil+.90*curl)
            self.rotate(self.center,FWD,-.33*curl)
            self.move(self.center,UP*H*(.13*recoil-.38*curl))
            self.rotate('head',SIDE,.62*curl)
        centre=self.m[self.center].translation
        for leg in self.legs:
            i=leg['index'];side=1 if i%2 else -1;rest=leg['rest']
            whip=max(0,side*flail)
            rigid=.28*recoil if element=='arc' else 0
            fold=.28 if element=='kinetic' and i==0 else .48
            targets[i]=rest.lerp(centre,fold*curl)+SIDE*side*W*(rigid+.14*whip)
            if element=='kinetic' and i==0:targets[i]+=SIDE*side*W*.22*curl
            targets[i]+=UP*H*(.68*whip+.18*curl)+FWD*W*(.16*side*flail-.18*recoil)
        for arm in self.arms:
            side=arm['index'];rest=arm['rest']
            target=rest.lerp(centre,.67*curl)+UP*H*(.39*recoil+.36*side*flail)
            target+=SIDE*W*side*(.19*recoil+.24*abs(flail))
            self.solve(arm,target)

    def cleaver(self, action, t, targets):
        # Tip targets are relative to the standing head. During extraction the
        # centre can move around a planted blade without taking it along.
        H,W=self.height,self.width
        if action=='m10-windup':
            # CREATURE22: the cleaver loads wide and high, clear of the crown, leaving a dark gap under the arm
            # CREATURE23: the cleaver loads forward and low beside the jaw, pointing at the victim, a deck gap behind it
            keys=[(0, .10,-.20,.03, .01),(.29, .70,.05,.10,.28),
                  (.63,.62,.42,.08,.52), (1,.58,.66,.04,.85)]
        elif action=='m10-strike':
            keys=[(0,.44,.71,-.17,-.48),(.28,.04,.82,-.64,-.83),
                  (.74,-.44,.62,-.90,-1),(1,-.52,.47,-.89,-.88)]
        else:
            keys=[(0,-.52,.47,-.89,-.88),(.24,-.61,.34,-.96,-1.12),
                  (.49,-.48,.69,-.72,-.82),(.75,.03,.38,-.54,-.31),(1,.28,.14,-.25,0)]
        side,forward,height,twist=[between(t,[(k[0],k[i]) for k in keys]) for i in range(1,5)]
        wind=action=='m10-windup'
        sunk=(.045+.13*math.sin(math.pi*t)) if wind else .24*min(1,abs(twist))
        self.rotate(self.center,UP,twist*.78*(.35 if wind else 1))   # CREATURE23: the long axis stays on the victim while loading
        self.rotate(self.center,SIDE,-.23*twist)
        self.rotate(self.center,FWD,(-.12 if wind else .24)*abs(twist))
        self.move(self.center,-UP*H*sunk+SIDE*W*.055*twist)
        self.rotate('head',UP,-.60*twist)
        self.rotate('head',SIDE,.62*max(0,-twist))
        if wind:   # CREATURE22: jaw forward and low under the raised cleaver
            jaw=smooth(min(1,t/.6))
            self.rotate('head',SIDE,.45*jaw)
            self.move('head',FWD*W*.18*jaw-UP*H*.06*jaw)
        head=self.base_matrices['head'].translation
        for arm in self.arms:
            if arm['index']<0:
                arm=self.loaded_blade
                goal=head-SIDE*W*side+FWD*W*forward+UP*H*height
                if not wind:
                    # Aim the end of the actual blade at the foot plane. The
                    # legacy IK handle sits partway up this curved cleaver.
                    deck=min(leg['rest'].dot(UP) for leg in self.legs)
                    pin=(smooth(t/.20) if action=='m10-strike' else 1-smooth((t-.47)/.44))
                    goal+=UP*(deck+H*.035-goal.dot(UP))*pin
            else:
                goal=arm['rest']+SIDE*W*(.12+.12*abs(twist))-FWD*W*.26*twist+UP*H*.20*twist
                if not wind:
                    tucked=head-FWD*W*.22+SIDE*W*.49-UP*H*.28
                    goal=goal.lerp(tucked,min(1,abs(twist))*.76)
            mix=smooth(t/.22) if wind else (1-smooth((t-.76)/.24)) if action=='m10-recovery' else 1
            self.solve(arm,arm['rest'].lerp(goal,mix),14)
        for leg in self.legs:
            i=leg['index']
            catch=max(0,-twist) if i==1 else 0
            targets[i]=leg['rest']+FWD*W*.21*catch+SIDE*W*(.08 if i%2 else -.05)*abs(twist)

    def aiming_limbs(self, action, t, targets):
        # Crawler has a front leg pair; the Spitter aims with its neck/jaw
        # and carries the leading forelimb clear of the firing line.
        wind=action=='m10-windup'
        if wind:
            load=between(t,[(0,.13),(.28,.54),(.59,.79),(1,1)]);reach=0
        elif action=='m10-strike':
            load=0;reach=between(t,[(0,1),(.26,1.14),(1,.86)])
        else:
            load=0;reach=between(t,[(0,.86),(.32,1),(.64,.67),(1,0)])
        H,W=self.height,self.width
        self.rotate(self.center,UP,(.39 if self.family=='crawler' else 0.)*load*.35-.31*reach)   # CREATURE23: face the victim
        self.rotate(self.center,FWD,-.32*load+.27*reach)
        self.rotate(self.center,SIDE,.29*load+.32*reach)
        self.rotate('head',UP,-.39*load+.24*reach)
        self.move(self.center,-UP*H*(.13*load+.18*reach))
        self.mouth(.62*load+.87*reach)
        if self.family=='crawler':
            self.rotate(self.center,UP,.12*load-.47*reach)
            self.rotate(self.center,FWD,-.34*load+.43*reach)
            for leg in self.legs:
                i=leg['index']
                if i in (0,5):
                    lead=i==0
                    # CREATURE22: the striking foreleg is drawn wide and back (a gap beside the shield), not over the head
                    # CREATURE23: the striking hook projects forward beside the jaw, low, a gap between it and the head
                    targets[i]=leg['rest']+SIDE*W*(-.42 if lead else .24)*load+SIDE*W*(-.29 if lead else .09)*reach
                    targets[i]+=FWD*W*((.62 if lead else .14)*load+(.62 if lead else .04)*reach)
                    targets[i]+=UP*H*((.16 if lead else .06)*load+.07*reach)
            if load>0:self.move('head',FWD*W*.10*load)
        else:
            self.rotate('spine2',SIDE,-.52*load+.27*reach)
            self.move('neck',FWD*W*.18*load)   # CREATURE23: gland and mouth thrust toward the victim
            self.rotate('head',SIDE,-.23*load)
            for arm in self.arms:
                side=arm['index']
                self.solve(arm,arm['rest']+SIDE*W*side*(.23*load+.07*reach)+
                           UP*H*(.45 if side<0 else .10)*load+FWD*W*(.31*reach-.11*load),14)

    def commitment(self, action, t, targets):
        """Cock, open, release, bury, then extract on the three native clocks."""
        H,W=self.height,self.width
        stalker=self.family=='stalker'
        brute=self.family=='brute'
        wind=action=='m10-windup'
        striking=action=='m10-strike'
        if wind:
            load=between(t,[(0,.13),(.23,.44),(.50,.62),(.76,1),(1,.91)])
            open_arm=between(t,[(0,.12),(.22,.59),(.48,.86),(.79,1),(1,.96)])
            pull=between(t,[(0,0),(.27,.60),(.53,.36),(.85,1),(1,.88)])
            drive=bury=0
        elif striking:
            load=open_arm=0
            pull=between(t,[(0,-.67),(.35,-1),(1,-.75)])
            drive=between(t,[(0,.93),(.17,1.16),(.43,1),(1,.84)])
            bury=between(t,[(0,.15),(.37,.48),(1,.88)])
        else:
            load=open_arm=0
            drive=between(t,[(0,.84),(.23,.90),(.55,.70),(.76,.35),(1,0)])
            bury=between(t,[(0,.88),(.24,1),(.58,.84),(.78,.40),(1,0)])
            pull=between(t,[(0,-.75),(.20,-1),(.55,-.61),(.83,.13),(1,0)])
        pitch= (.38 if stalker else -.40 if brute else -.33)*load
        self.rotate(self.center,SIDE,pitch+(.33 if brute else -.19)*drive+.28*bury)
        self.rotate(self.center,UP,(.48 if brute else .23)*pull*(.3 if wind else 1))
        self.rotate(self.center,FWD,(-.20 if brute else .19)*load-.22*bury)
        self.move(self.center,-UP*H*((.23 if stalker else .12)*load+.18*bury)
                  -FWD*W*.043*load)
        if stalker and wind:   # CREATURE22: head and leading plate thrust forward clear of the body
            self.move('neck_hi',FWD*W*.30*load)
            self.rotate('neck_lo',SIDE,.30*load)
        if stalker:
            self.squash(self.center,1-.20*load-.08*drive,1+.10*load,1-.09*load+.19*drive)
            self.rotate('big_butt',SIDE,-.33*load+.22*bury)
            self.rotate('neck_lo',SIDE,-.45*load+.42*bury)
            self.rotate('chest',FWD,-.25*load-.36*bury)
            self.rotate('chest',UP,-.55*pull)
        self.rotate('head',SIDE,.26*load+.39*bury)
        self.mouth(.65*load+.75*drive+.25*bury)
        head=self.m['head'].translation
        for arm in self.arms:
            side=arm['index']
            lead=side<0
            if stalker:
                if lead:arm=self.loaded_blade
                self.rotate(arm['bones'][0],FWD,side*((.80 if lead else .36)*open_arm-.20*bury))   # CREATURE22: loaded shoulder rolls out
                # Swing the wrist away from the crown before raising the edge.
                sweep=between(t,[(0,.26),(.32,.42),(.64,.62),(1,.70)]) if wind else 0
                # CREATURE23: the striking scythe tip projects ahead of the head toward the victim, slightly wide and
                # low, leaving a deck-coloured gap between blade and head
                ready=head+FWD*W*(sweep if lead else .22)+SIDE*W*side*(.62 if lead else .38)+UP*H*(.02 if lead else -.41)
                contact=head+FWD*W*(1.02 if lead else .13)+SIDE*W*side*(.54 if lead else -.02)-UP*H*(.34+.31*bury)
            elif brute:
                ready=head-FWD*W*(.24 if lead else .11)+SIDE*W*side*(.61 if lead else .36)+UP*H*(.62 if lead else .12)
                bed=self.base_matrices['head'].translation
                contact=bed+FWD*W*(.55 if lead else .12)+SIDE*W*side*(.37 if lead else .46)-UP*H*(.84 if lead else .24)
                self.rotate('head',SIDE,.13*bury if lead else 0)
            else:
                ready=head+FWD*W*(.58 if lead else -.10)+SIDE*W*side*(.48 if lead else .24)+UP*H*(.04 if lead else .05)   # CREATURE23: hooked member forward
                contact=head+FWD*W*(.68 if lead else .33)+SIDE*W*side*(.05 if lead else .36)-UP*H*.38
            reach=open_arm if lead else open_arm**1.5
            self.solve(arm,arm['rest'].lerp(ready,reach).lerp(contact,min(1.12,drive+.26*bury)),14)
        for leg in self.legs:
            i=leg['index'];side=-1 if i%2==0 else 1
            rest=leg['rest']
            if self.family=='carrier':
                splay=between(t,[(0,0),(.25 if i%2==0 else .48,.72),(.77,1),(1,.98)]) if wind else drive
                targets[i]=rest+SIDE*W*side*(.19 if i<2 else .13)*splay-FWD*W*.05*splay
            elif i<2:
                catch=bury if i==0 else .25*bury
                targets[i]=rest+FWD*W*(.19*catch-.08*load)+SIDE*side*W*.075*load
                if not wind:targets[i]+=UP*H*(.12*math.sin(math.pi*t) if i==1 else 0)
            else:
                targets[i]=rest-FWD*W*.08*load+SIDE*side*W*.065*load
            if stalker and not wind and not striking and i==1:
                # The trailing foot drags, then crosses and catches the hips
                # while the leading scythe is still in the deck.
                step=between(t,[(0,0),(.20,.18),(.45,1),(.68,.40),(.78,0),(1,0)])
                targets[i]+=UP*H*.32*step+SIDE*W*.19*step-FWD*W*.24*step
                self.rotate('big_butt',FWD,-.26*step)

    def show_edge(self, action, t):
        # Roll about the actual blade axis after FK/IK. Neither socket nor tip
        # is translated by exposing the broad face of the loaded limb.
        if self.family=='crawler':limb=self.loaded_blade
        elif self.family in ('stalker','brute'):limb=self.loaded_blade
        else:limb=next((a for a in self.arms if a['index']<0),None)
        if not limb:return
        name=limb['bones'][-1]
        axis=self.m[name] @ limb['tip_local']-self.m[name].translation
        if axis.length>.0001:
            face=between(t,[(0,.15),(.42,.82),(1,1)]) if action=='m10-windup' else -(.58 if action=='m10-strike' else .58*(1-t))
            if action=='m10-windup' and self.family=='brute':
                face*=.35   # CREATURE23: edge toward the camera less; the cleaver reads as a pointer, not a sail
                self.rotate(name,SIDE,.85*smooth(min(1,t/.6)))   # pitch the cleaver tip forward at the victim
            axis.normalize()
            if 'face_normal' in limb and action=='m10-windup':
                normal=self.m[name].to_quaternion() @ limb['face_normal']
                across=normal-axis*normal.dot(axis)
                above=UP-axis*UP.dot(axis)
                if above.dot(across)<0:above.negate()
                roll=math.atan2(axis.dot(across.cross(above)),across.dot(above))
                self.rotate(name,axis,face*roll)
            else:
                self.rotate(name,axis,face*.82)

    def lag_brood(self, history):
        # The rear mantle skins to tail / tail.001 / tip. Let the thorax
        # lead it by two 30 Hz drawings, also when banking on a side hit.
        centre=self.m[self.center]
        q=centre.to_quaternion()
        if history:
            then=history[0]
            delta=then.to_quaternion() @ q.inverted()
            swing=Quaternion().slerp(delta,.72)
            for name,rotation in [('tail',swing),('tail.001',Quaternion().slerp(delta,.27))]:
                pivot=self.m[name].translation
                self.transform(name,Matrix.Translation(pivot) @ rotation.to_matrix().to_4x4() @ Matrix.Translation(-pivot))
            dy=(then.translation-centre.translation).dot(UP)
            self.move('tail',UP*max(-self.height*.06,min(self.height*.06,dy*.43)))
            self.commit()
        history.append(centre.copy())
        if len(history)>2:history.pop(0)

    def waiting(self, t, targets):
        phase=t*math.tau
        wave=math.sin(phase)
        # One purposeful weight shift followed by a pause at the slot.
        load=between(t,[(0,0),(.13,.10),(.34,1),(.55,.92),(.80,0),(1,0)])
        H,W=self.height,self.width
        if self.family=='crawler':
            self.move(self.center,SIDE*W*.19*load-UP*H*.23*load)
            self.rotate(self.center,UP,.26*wave)
            self.mouth(.85*load)
        elif self.family=='stalker':
            self.move(self.center,SIDE*W*.23*wave-UP*H*.09*load)
            self.rotate('neck_lo',UP,-.24*wave)
            for arm in self.arms:
                side=arm['index']
                self.solve(arm,arm['rest']+SIDE*W*side*(.13+.12*wave)
                           +FWD*W*side*.18*wave+UP*H*(.17+.14*side*wave))
        elif self.family=='brute':
            self.move(self.center,FWD*W*.13*load-UP*H*.15*load)
            self.rotate(self.center,FWD,.21*load)
            self.rotate('shoulder.r',UP,-.46*load)
            self.rotate('shoulder.r',SIDE,-.31*wave)
            self.rotate('head',UP,.21*load)
        elif self.family=='spitter':
            self.move(self.center,SIDE*W*.14*load)
            self.rotate('head',SIDE,-.22*load)
            self.squash('head',1+.24*load,1+.15*load,1-.09*load)
            self.mouth(.70*load)
        else:
            self.rotate(self.center,FWD,.18*wave)
            self.rotate('tail',SIDE,-.38*load)
            self.squash('tail',1+.13*load,1-.23*load,1-.12*load)
        for leg in self.legs:
            i=leg['index']
            step=math.sin(phase+(i%2)*math.pi)*load
            if self.family=='brute' and i!=0:continue
            if self.family=='carrier':continue
            offset=FWD*W*.20*load if self.family=='brute' else SIDE*W*.15*step
            targets[i]=leg['rest']+offset+UP*H*.14*max(0,step)

    def pose(self, action, t, seconds):
        self.reset()
        self.current_action=action
        H,W = self.height,self.width
        crawler = self.family == 'crawler'
        targets = {}
        if action=='m10-exposed':
            # Keep the impact footprint until the final fifth of native recovery.
            release=smooth((t-.79)/.21)
            self.pose('m10-recovery',.14*smooth(t/.27)+.86*release,seconds)
            limb=getattr(self,'loaded_blade',None) or self.arms[0]
            tip=self.m[limb['bones'][-1]] @ limb['tip_local']
            feet={leg['index']:self.m[leg['bones'][-1]] @ leg['tip_local'] for leg in self.legs}
            weight=smooth(t/.16)*(1-release)
            roll={'crawler':.38,'stalker':-.44,'brute':.42,'spitter':-.35,'carrier':.32}[self.family]
            self.rotate(self.center,FWD,roll*weight)
            self.move(self.center,(-UP*H*.13+SIDE*W*roll*.22)*weight)
            self.rotate('head',UP,-.43*weight)
            if self.family=='carrier':self.rotate('tail',SIDE,-.39*weight)
            if self.family=='spitter':self.mouth(.73*weight)
            self.plant(feet)
            self.solve(limb,tip,14)
            if release:
                self.m={n:m.lerp(self.idle_start[n],release) for n,m in self.m.items()}
            self.commit()
            return
        if action=='m10-feint':
            self.pose('m10-windup',min(1,t/.54)/3,1.)
            release=smooth((t-.54)/.46)
            self.m={n:m.lerp(self.idle_start[n],release) for n,m in self.m.items()}
            self.commit()
            return
        if action=='m10-waiting':
            self.waiting(t,targets)
        elif action == 'm10-idle':
            breath=math.sin(t*math.tau)
            shift=math.sin(t*math.tau*.5)
            self.rotate(self.center,FWD,.055*shift)
            self.rotate(self.center,SIDE,.035*breath)
            self.move(self.center,UP*H*.035*(1+breath))
            self.scale(self.center,1+.018*breath)
            self.rotate('head',UP,.20*math.sin(t*math.tau))
            self.rotate('neck',SIDE,-.05*breath)
            self.mouth(.12+.06*breath,t*seconds)
            if crawler:
                for leg in self.legs:
                    i=leg['index']
                    if i in [0,5]:
                        lift=max(0.,math.sin(t*math.tau*2+(0 if i==0 else math.pi)))
                        targets[i]=leg['rest']+UP*H*.15*lift+FWD*W*.06*lift
            else:
                for arm in self.arms:
                    desired=arm['rest']+UP*H*.10*(.5+.5*breath)+SIDE*arm['index']*W*.025*shift
                    self.solve(arm,desired)
        elif action == 'm10-run':
            phase=t*math.tau
            self.move(self.center,UP*H*(.025+.025*math.cos(phase*2)))
            self.rotate(self.center,FWD,.075*math.sin(phase))
            self.rotate(self.center,SIDE,.11 if crawler else .07)
            for leg in self.legs:
                i=leg['index'];opposite=(i%2) if crawler else (0 if i in [0,3] else 1)
                cycle=(t+.5*opposite)%1
                swing=cycle<.42
                x=between(cycle,[(0,-.5),(.42,.5),(1,-.5)])
                lift=math.sin(math.pi*cycle/.42) if swing else 0
                targets[i]=leg['rest']+FWD*x*W*(.68 if crawler else .62)+UP*max(0,lift)*H*(.28 if crawler else .13)
            self.rotate('head',SIDE,-.08*math.sin(phase*2))
            if not crawler:
                for arm in self.arms:
                    desired=arm['rest']+UP*H*.12+FWD*W*.09*math.sin(phase+arm['index']*math.pi/2)
                    self.solve(arm,desired)
        elif action=='m10-wall-stun':
            # CREATURE22: the helm rests forward against the wall, crown up and visible from above
            self.move(self.center,-UP*H*.18)
            self.rotate(self.center,SIDE,.22)
            self.rotate('head',SIDE,-.12)   # CREATURE23: crown tips up in profile above the shoulder line
            self.move('head',FWD*W*.18+UP*H*.07)
            head=self.base_matrices['head'].translation
            deck=min(leg['rest'].dot(UP) for leg in self.legs)
            for arm in self.arms:
                tip=head+FWD*W*.49+SIDE*arm['index']*W*.40
                tip+=UP*(deck+.09*H-tip.dot(UP))
                self.solve(arm,tip,16)
        elif action in ('m10-windup','m10-strike','m10-recovery'):
            if self.family=='brute':self.cleaver(action,t,targets)
            elif self.family in ('crawler','spitter'):self.aiming_limbs(action,t,targets)
            else:self.commitment(action,t,targets)
        elif self.family=='carrier' and action=='m10-brood':
            # CREATURE22 Matron pod release: abdomen arches up, head lowers, legs brace wide
            arch=between(t,[(0,0),(.35,1),(.8,1),(1,.85)])
            self.rotate('tail',SIDE,.62*arch)   # CREATURE23: the carapace lifts clear of the floor where the pod emerges
            self.rotate('body.002',SIDE,.26*arch)
            self.rotate('head',SIDE,.42*arch)
            self.move(self.center,UP*H*.06*arch)
            for leg in self.legs:
                i=leg['index'];side=-1 if i%2==0 else 1
                targets[i]=leg['rest']+SIDE*W*side*.10*arch
        elif self.family=='carrier' and action=='m10-stagger':
            tip=between(t,[(0,0),(.12,.82),(.28,1),(.49,.91),(.73,.61),(.89,-.10),(1,0)])
            step=between(t,[(0,0),(.18,0),(.37,1),(.65,.85),(1,0)])
            self.rotate(self.center,FWD,.62*tip)
            self.rotate(self.center,UP,-.49*tip)
            self.rotate('body.001',SIDE,-.24*tip)
            self.move(self.center,-UP*H*.27*tip+SIDE*W*.085*step)
            self.rotate('tail',SIDE,-.43*tip+.13*step)
            self.rotate('head',SIDE,.40*tip)
            for leg in self.legs:
                i=leg['index']
                targets[i]=leg['rest']+SIDE*W*(.27 if i%2 else -.055)*step
                if i in (1,3):targets[i]+=UP*H*.24*math.sin(math.pi*t)*step
            for arm in self.arms:
                side=arm['index']
                self.solve(arm,arm['rest']+SIDE*W*.25*side*tip-UP*H*.19*tip)
        elif action.startswith('m10-hit-') or action=='m10-stagger':
            rifle='-rifle-' in action
            heavy='heavy' in action or action=='m10-stagger'
            direction=action.rsplit('-',1)[-1] if action!='m10-stagger' else 'front'
            vector={'front':-FWD,'back':FWD,'left':-SIDE,'right':SIDE}.get(direction,-FWD)
            # The impacted side goes soft first. The far contact holds the
            # silhouette against the deck until the catching foot lands.
            hit=between(t,[(0,0),(.16,1),(.40,.86),(.70,.30),(.87,-.11),(1,0)])
            catch=between(t,[(0,0),(.22,.10),(.47,1),(.68,.83),(1,0)])
            if rifle:
                # After the plate snaps back, retain the twisted edge and drag
                # the struck leg through a full native walking step.
                hit=between(t,[(0,0),(.034,1.22),(.17,1),(.34,.66),(.73,.60),(1,0)])
                catch=between(t,[(0,0),(.08,.85),(.26,1),(.68,.72),(.84,.58),(1,0)])
            heavy_body=self.family in ('brute','carrier')
            roll=(.51 if heavy_body else .74) * (1.15 if heavy else 1)
            self.move(self.center, vector*W*(.11 if heavy else .069)*max(0,hit)
                      - UP*H*(.19 if heavy_body else .16)*max(0,hit))
            self.rotate(self.center,SIDE,vector.x*roll*hit)
            self.rotate(self.center,FWD,-vector.z*roll*hit)
            turn=(.83 if heavy else .47) if crawler else (.34 if heavy else .18)
            if rifle:
                turn = (.83 if crawler else .69) * (1 if direction in ('front','right') else -1)
                self.move(self.center,-vector*W*.16*catch)
                self.rotate(self.center,FWD,(.30 if direction in ('right','front') else -.30)*catch)
            self.rotate(self.center,UP,turn*hit+(.29*catch if crawler and heavy else 0))
            if crawler:
                self.squash(self.center,1-.17*max(0,hit),1+.13*max(0,hit),1-.05*max(0,hit))
            self.rotate('head',SIDE,-vector.x*.29*hit)
            self.rotate('tail',SIDE,-.32*vector.x*hit+.18*catch)
            self.mouth(.65*max(0,hit))
            if rifle:
                missed=min(self.legs,key=lambda leg:leg['rest'].dot(vector))['index']
            for leg in self.legs:
                i=leg['index'];rest=leg['rest']
                near=(rest-self.base_matrices[self.center].translation).dot(vector)<0
                fold=(.46 if near else .07)*max(0,hit)
                targets[i]=rest.lerp(self.m[self.center].translation,fold)
                if near:
                    targets[i]+=UP*H*.17*catch - vector*W*(.20 if heavy else .08)*catch
                    if rifle and i == missed:
                        targets[i]+=UP*H*.78*catch-vector*W*.37*catch
                elif i%2==0:
                    targets[i]+=vector*W*(.21 if heavy else .085)*catch
                if crawler and i in (0,5):
                    # Split the front pair on impact; the catching claw rakes
                    # outward while the tucked one trails behind the shell.
                    sign=1 if i==5 else -1
                    targets[i]+=SIDE*sign*W*(.34 if heavy else .17)*catch
                    if i==0:targets[i]+=UP*H*(.52 if heavy else .28)*max(0,hit)
            for arm in self.arms:
                s=arm['index']
                desired=arm['rest']+vector*W*.19*hit+SIDE*W*.08*s*catch
                desired+=UP*H*(.22 if s<0 else -.18)*max(0,hit)
                self.solve(arm,desired)
        elif action in ['m10-burning','m10-shocked','m10-frozen']:
            if action=='m10-burning':
                beat=math.sin(t*math.tau*2)
                self.rotate(self.center,SIDE,.23+.23*beat)
                self.rotate(self.center,FWD,.32*math.sin(t*math.tau))
                self.move(self.center,UP*H*.08*(1+beat))
                self.mouth(.9)
                for leg in self.legs:
                    phase=(t*2+leg['index']*.5)%1
                    targets[leg['index']]=leg['rest']+UP*H*.52*max(0,math.sin(phase*math.tau))
                if not crawler:
                    head=self.m['head'].translation
                    for arm in self.arms:
                        side=arm['index'];reach=.72+.22*math.sin(t*math.tau+side*math.pi/2)
                        cover=head+UP*H*.12+SIDE*side*W*.40+FWD*W*.13*math.sin(t*math.tau*2+side)
                        self.solve(arm,arm['rest'].lerp(cover,reach),14)
                    self.rotate('head',UP,.25*math.sin(t*math.tau))
            elif action=='m10-shocked':
                beat=math.sin(t*math.tau*5)
                self.rotate(self.center,FWD,.24*beat);self.rotate(self.center,SIDE,.22*beat)
                self.move(self.center,UP*H*.08*max(0,beat))
                self.mouth(.55)
                for leg in self.legs: targets[leg['index']]=leg['rest']+UP*H*.35*max(0,beat*(-1 if leg['index']%2 else 1))
                if not crawler:self.hammer(.65+.25*beat)
            else:
                self.rotate(self.center,SIDE,-.13);self.mouth(.45)
                for leg in self.legs:
                    if leg['index']%2==0:targets[leg['index']]=leg['rest']+UP*H*.18
        elif action.startswith('m10-overdrive-') or action in ('m10-death-burn','m10-death-arc','m10-death-frost','m10-death-kinetic'):
            suffix=action.rsplit('-',1)[-1]
            self.elemental({'burn':'fire','frost':'ice'}.get(suffix,suffix),t,'-death-' in action,targets)
        elif action.startswith('m10-death-'):
            style=action[len('m10-death-'):]
            fall=between(t,[(0,0),(.15,.08),(.38,.62),(.7,1),(1,1)])
            drop=H*.67
            if self.family not in ['crawler','brute']:
                ground=min(-leg['rest'].y for leg in self.legs)
                drop=min(drop,max(H*.15,-self.base_matrices[self.center].translation.y-ground-H*.15))
            self.move(self.center,-UP*drop*fall+FWD*W*.08*min(1,t*4))
            self.rotate(self.center,SIDE,.75*fall)
            self.rotate(self.center,FWD,-.34*fall)
            curl=fall
            if style=='acid':
                self.rotate(self.center,SIDE,.30*fall);curl=fall*1.15
                self.move(self.center,-UP*H*.10*fall)
            else:self.mouth(.35*(1-t))
            for leg in self.legs:
                rest=leg['rest'];center=self.m[self.center].translation
                target=rest.lerp(center,.46*max(0,curl))+UP*H*(.1+.12*(leg['index']%2))*max(0,curl)
                targets[leg['index']]=target
            if not crawler:
                for arm in self.arms:
                    center=self.m[self.center].translation
                    desired=arm['rest'].lerp(center,.70*min(1,max(0,curl)))+UP*H*.12
                    self.solve(arm,desired)
        elif action=='m10-spawn':
            low=between(t,[(0,1),(.20,.95),(.40,.82),(.64,.50),(.90,.13),(1,0)])
            self.move(self.center,-UP*H*(.70 if crawler else .56)*low)
            self.rotate(self.center,SIDE,(.58 if crawler else .36)*low)
            self.rotate(self.center,FWD,.23*math.sin(t*math.tau)*low)
            self.scale(self.center,1-.12*low)
            self.mouth(.7*low)
            for leg in self.legs:
                i=leg['index'];lead=i in ([0,5] if crawler else [0,1])
                delay=(.12 if i%2 else 0)+(.18 if i==len(self.legs)-1 else 0)
                limb_t=max(0,(t-delay)/(1-delay))
                reach=between(limb_t,[(0,0),(.14,1),(.35,1),(.55,.7),(.85,0),(1,0)]) if lead else between(limb_t,[(0,0),(.36,0),(.55,1),(.82,.5),(1,0)])
                side=-1 if i%2==0 else 1
                targets[i]=leg['rest']+FWD*W*(.40 if lead else -.18)*reach+UP*H*(max(0,math.sin(limb_t/.42*math.pi))*.35 if lead and limb_t<.42 else .20*reach if not lead else 0)+SIDE*W*.06*side*low
            if not crawler:
                for arm in self.arms:
                    arm_t=max(0,(t-(.16 if arm['index']>0 else 0))/(.84 if arm['index']>0 else 1))
                    pull=between(arm_t,[(0,0),(.14,1),(.46,1),(.80,.2),(1,0)])
                    desired=arm['rest']+FWD*W*.40*pull-UP*H*.30*pull+UP*H*.18*math.sin(t*math.pi)
                    self.solve(arm,desired)
        if self.family in ('brute','carrier') and action.startswith('m10-death-'):
            # Land on the near shoulder. Keep the far pair spread beyond the
            # mantle so their contact points survive the physics handoff.
            fall=between(t,[(0,0),(.28,.08),(.57,.94),(.69,1),(1,1)])
            self.rotate(self.center,FWD,.96*fall)
            self.move(self.center,UP*H*.18*fall+SIDE*W*.08*fall)
            self.rotate('head',UP,-.52*fall)
            self.rotate('head',SIDE,-.38*fall)
            for leg in self.legs:
                i=leg['index']
                side=1 if leg['rest'].dot(SIDE)>self.base_matrices[self.center].translation.dot(SIDE) else -1
                land=leg['rest']+SIDE*W*side*.24+FWD*W*(.12 if i<2 else -.12)
                targets[i]=targets.get(i,leg['rest']).lerp(land,fall)
            for arm in self.arms:
                side=arm['index']
                tip=self.m[arm['bones'][-1]] @ arm['tip_local']
                land=arm['rest']+SIDE*W*side*.29+FWD*W*(.27 if side<0 else -.13)
                self.solve(arm,tip.lerp(land,fall))
        self.plant(targets)
        if action in ('m10-windup','m10-strike','m10-recovery'):self.show_edge(action,t)
        if action=='m10-spawn' and hasattr(self,'idle_start'):
            settle=smooth((t*seconds-(seconds-.08))/.08)
            if settle>0:
                self.m={n:matrix.lerp(self.idle_start[n],settle) for n,matrix in self.m.items()}
        self.commit()


DURATIONS = {
    'm10-exposed':1.,'m10-waiting':1.6,'m10-feint':.25,'m10-idle':3.2,'m10-run':.64,'m10-windup':1.,'m10-strike':.16,'m10-recovery':1.,
    **{f'm10-hit-{weight}-{direction}':(.18 if weight=='light' else .39)
       for weight in ['light','heavy'] for direction in ['front','right','back','left']},
    'm10-stagger':.72,'m10-burning':1.2,'m10-shocked':.8,'m10-frozen':.6,
    **{f'm10-death-{style}':1.25 for style in ['none','frost','burn','arc','acid']},
    **{f'm10-overdrive-{element}':.42 for element in ('kinetic','fire','arc')},
    'm10-death-kinetic':.40,
    'm10-spawn':1.1,
}
FAMILY_CLIPS = {'carrier': {'m10-brood': .6}}   # CREATURE22: family-only clips


def author(family, patterns=None):
    arm=import_rig(family)
    creature=Creature(arm,family)
    takes = {name: seconds for name,seconds in DURATIONS.items() if not patterns or any(fnmatchcase(name,p) for p in patterns)}
    for name,seconds in FAMILY_CLIPS.get(family,{}).items():
        if not patterns or any(fnmatchcase(name,p) for p in patterns):takes[name]=seconds
    if family=='brute' and (not patterns or any(fnmatchcase('m10-wall-stun',p) for p in patterns)):
        takes['m10-wall-stun']=.10
    if family in ('stalker','crawler','brute','carrier','spitter'):
        for direction in ('front','right','back','left'):
            name=f'm10-hit-rifle-{direction}'
            if not patterns or any(fnmatchcase(name,p) for p in patterns): takes[name]=.18
    for name,seconds in takes.items():
        new_action(arm,name,seconds)
        last=1+round(seconds*60)
        # Actual bone keys at30Hz; exporter resamples the keyed animation at60Hz.
        frames=list(range(1,last+1,2))
        if frames[-1]!=last:frames.append(last)
        history=[]
        for frame in frames:
            bpy.context.scene.frame_set(frame)
            creature.pose(name,(frame-1)/(last-1),seconds)
            if family=='carrier':creature.lag_brood(history)
            key_pose(arm,frame)
        print('M10 authored',family,name,seconds,flush=True)
    output=ROOT/'public/assets/models/motion'/f'{family}-motion.glb'
    if output.exists():
        selected=ROOT/'tools/assets/m10-motion/.build'/output.name
        selected.parent.mkdir(parents=True, exist_ok=True)
        export_motion(arm,selected,list(takes))
        replace_motion_clips(output,selected)
    else:
        export_motion(arm,output,list(takes))


if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--'in sys.argv else []
    families=next((a.split('=',1)[1] for a in args if a.startswith('--families=')),'crawler,brute').split(',')
    selection=next((a.split('=',1)[1].split(',') for a in args if a.startswith('--clips=')),None)
    for family in families:author(family,selection)
