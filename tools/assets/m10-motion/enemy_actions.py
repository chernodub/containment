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
        self.antennae = [n for n in self.names if n.startswith('antenna_') and n.endswith('0')]
        self.reset()
        self.pose('m10-idle',0,3.2)
        self.idle_start={n:m.copy() for n,m in self.m.items()}
        self.reset()

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
            self.rotate(self.center,FWD,-.52*curl)
            self.move(self.center,UP*H*(.13*recoil-.38*curl))
            self.rotate('head',SIDE,.62*curl)
        centre=self.m[self.center].translation
        for leg in self.legs:
            i=leg['index'];side=1 if i%2 else -1;rest=leg['rest']
            whip=max(0,side*flail)
            rigid=.28*recoil if element=='arc' else 0
            targets[i]=rest.lerp(centre,.48*curl)+SIDE*side*W*(rigid+.14*whip)
            targets[i]+=UP*H*(.68*whip+.18*curl)+FWD*W*(.16*side*flail-.18*recoil)
        for arm in self.arms:
            side=arm['index'];rest=arm['rest']
            target=rest.lerp(centre,.67*curl)+UP*H*(.39*recoil+.36*side*flail)
            target+=SIDE*W*side*(.19*recoil+.24*abs(flail))
            self.solve(arm,target)

    def commitment(self, action, t, targets):
        """Cock, open, release, bury, then extract on the three native clocks."""
        H,W=self.height,self.width
        stalker=self.family=='stalker'
        brute=self.family=='brute'
        wind=action=='m10-windup'
        striking=action=='m10-strike'
        if wind:
            load=between(t,[(0,.13),(.23,.44),(.50,.62),(.76,1),(1,.91)])
            open_arm=between(t,[(0,.05),(.22,.27),(.48,.68),(.79,.90),(1,1)])
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
        self.rotate(self.center,UP,(.48 if brute else .23)*pull)
        self.rotate(self.center,FWD,(-.20 if brute else .19)*load-.22*bury)
        self.move(self.center,-UP*H*((.23 if stalker else .12)*load+.18*bury)
                  -FWD*W*.043*load)
        if stalker:
            self.squash(self.center,1-.20*load-.08*drive,1+.10*load,1-.09*load+.19*drive)
            self.rotate('big_butt',SIDE,-.33*load+.22*bury)
            self.rotate('neck_lo',SIDE,-.45*load+.42*bury)
            self.rotate('chest',FWD,.18*load-.27*bury)
        self.rotate('head',SIDE,.26*load+.39*bury)
        self.mouth(.65*load+.75*drive+.25*bury)
        head=self.m['head'].translation
        for arm in self.arms:
            side=arm['index']
            lead=side<0
            if stalker:
                self.rotate(arm['bones'][0],FWD,side*(.36*open_arm-.20*bury))
                ready=head-FWD*W*(.38 if lead else .25)+SIDE*W*side*(.55 if lead else .37)+UP*H*(.53 if lead else .15)
                contact=head+FWD*W*(.76 if lead else .59)+SIDE*W*side*(.33 if lead else .17)-UP*H*(.34+.31*bury)
            elif brute:
                ready=head-FWD*W*(.24 if lead else .11)+SIDE*W*side*(.61 if lead else .36)+UP*H*(.62 if lead else .12)
                bed=self.base_matrices['head'].translation
                contact=bed+FWD*W*(.55 if lead else .12)+SIDE*W*side*(.37 if lead else .46)-UP*H*(.84 if lead else .24)
                self.rotate('head',SIDE,.13*bury if lead else 0)
            else:
                ready=head-FWD*W*.18+SIDE*W*side*.42+UP*H*(.32 if lead else .13)
                contact=head+FWD*W*.46+SIDE*W*side*.29-UP*H*.30
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

    def pose(self, action, t, seconds):
        self.reset()
        self.current_action=action
        H,W = self.height,self.width
        crawler = self.family == 'crawler'
        targets = {}
        if action == 'm10-idle':
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
        elif self.family in ('stalker','brute','carrier') and action in ('m10-windup','m10-strike','m10-recovery'):
            self.commitment(action,t,targets)
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
        elif action in ['m10-windup','m10-strike','m10-recovery']:
            if action=='m10-windup':
                coil=between(t,[(0,0),(.16,.55),(.42,1),(1,1)]);strike=0.;recover=0.
            elif action=='m10-strike':
                coil=0.
                strike=between(t,[(0,1),(.18,1.08),(.60,.65),(1,.34)]);recover=0.
            else:
                coil=0.;strike=.34*(1-t);recover=between(t,[(0,1),(.55,.85),(.90,.40),(.98,.24),(1,0)])
            rear=.42 if crawler else -.28
            extension=.48 if crawler else .30
            height=-.34 if crawler else .08
            self.rotate(self.center,SIDE,rear*coil+extension*strike)
            self.rotate(self.center,FWD,-.17*recover)
            self.move(self.center,UP*H*(height*coil-.10*strike-.035*recover))
            # Native footprint-scaled travel belongs to EnemyMotion, once only.
            self.mouth(coil*.8+strike*.5)
            if crawler and coil:self.squash(self.center,up=1-.27*coil,side=1+.18*coil,forward=1-.06*coil)
            elif self.family=='spitter':
                self.rotate('spine2',SIDE,-.18*coil)
                self.scale('bum',1+.05*coil)
            if crawler:
                for leg in self.legs:
                    i=leg['index'];front=i in [0,5];s=-1 if i<3 else 1
                    if front:
                        targets[i]=leg['rest']+UP*H*(.28*coil+.12*strike+.18*recover)+FWD*W*(-.34*coil+.62*strike-.08*recover)+SIDE*s*W*.08*coil
                    elif coil and i in [2,3]:
                        targets[i]=leg['rest']-FWD*W*.04*coil+SIDE*s*W*.07*coil
                    elif recover and i in [1,4]:
                        targets[i]=leg['rest']+UP*H*.18*recover+FWD*W*.08*s*recover
            else:
                self.hammer(coil,strike*.85)
                self.rotate('head',SIDE,-.40*coil+.23*strike)
                if recover:
                    for leg in self.legs:
                        if leg['index']==0: targets[0]=leg['rest']+UP*H*.12*recover+FWD*W*.12*recover
        elif action.startswith('m10-hit-') or action=='m10-stagger':
            heavy='heavy' in action or action=='m10-stagger'
            direction=action.rsplit('-',1)[-1] if action!='m10-stagger' else 'front'
            vector={'front':-FWD,'back':FWD,'left':-SIDE,'right':SIDE}.get(direction,-FWD)
            # The impacted side goes soft first. The far contact holds the
            # silhouette against the deck until the catching foot lands.
            hit=between(t,[(0,0),(.16,1),(.40,.86),(.70,.30),(.87,-.11),(1,0)])
            catch=between(t,[(0,0),(.22,.10),(.47,1),(.68,.83),(1,0)])
            heavy_body=self.family in ('brute','carrier')
            roll=(.51 if heavy_body else .74) * (1.15 if heavy else 1)
            self.move(self.center, vector*W*(.11 if heavy else .069)*max(0,hit)
                      - UP*H*(.19 if heavy_body else .16)*max(0,hit))
            self.rotate(self.center,SIDE,vector.x*roll*hit)
            self.rotate(self.center,FWD,-vector.z*roll*hit)
            turn=(.83 if heavy else .47) if crawler else (.34 if heavy else .18)
            self.rotate(self.center,UP,turn*hit+(.29*catch if crawler and heavy else 0))
            if crawler:
                self.squash(self.center,1-.17*max(0,hit),1+.13*max(0,hit),1-.05*max(0,hit))
            self.rotate('head',SIDE,-vector.x*.29*hit)
            self.rotate('tail',SIDE,-.32*vector.x*hit+.18*catch)
            self.mouth(.65*max(0,hit))
            for leg in self.legs:
                i=leg['index'];rest=leg['rest']
                near=(rest-self.base_matrices[self.center].translation).dot(vector)<0
                fold=(.46 if near else .07)*max(0,hit)
                targets[i]=rest.lerp(self.m[self.center].translation,fold)
                if near:
                    targets[i]+=UP*H*.17*catch - vector*W*(.20 if heavy else .08)*catch
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
        self.plant(targets)
        if action=='m10-spawn' and hasattr(self,'idle_start'):
            settle=smooth((t*seconds-(seconds-.08))/.08)
            if settle>0:
                self.m={n:matrix.lerp(self.idle_start[n],settle) for n,matrix in self.m.items()}
        self.commit()


DURATIONS = {
    'm10-idle':3.2,'m10-run':.64,'m10-windup':1.,'m10-strike':.16,'m10-recovery':1.,
    **{f'm10-hit-{weight}-{direction}':(.18 if weight=='light' else .39)
       for weight in ['light','heavy'] for direction in ['front','right','back','left']},
    'm10-stagger':.72,'m10-burning':1.2,'m10-shocked':.8,'m10-frozen':.6,
    **{f'm10-death-{style}':1.25 for style in ['none','frost','burn','arc','acid']},
    **{f'm10-overdrive-{element}':.42 for element in ('kinetic','fire','arc')},
    'm10-death-kinetic':.40,
    'm10-spawn':1.1,
}


def author(family, patterns=None):
    arm=import_rig(family)
    creature=Creature(arm,family)
    takes = {name: seconds for name,seconds in DURATIONS.items() if not patterns or any(fnmatchcase(name,p) for p in patterns)}
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
