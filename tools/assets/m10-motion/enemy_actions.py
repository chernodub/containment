"""Original M10 creature actions baked onto the retained source armatures.

Run: blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,brute
Only animation tracks are exported. Native roots, edit bones and source meshes
are never edited. Pole-biased CCD uses the original named IK foot/claw controls.
"""
from pathlib import Path
import math
import sys
import bpy
from mathutils import Matrix, Quaternion, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import import_rig, source_pose, apply_pose, new_action, key_pose, export_motion

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
        elif action in ['m10-windup','m10-strike','m10-recovery']:
            if action=='m10-windup':
                coil=between(t,[(0,0),(.16,.55),(.42,1),(1,1)]);strike=0.;recover=0.
            elif action=='m10-strike':
                coil=0.
                strike=between(t,[(0,1),(.18,1.08),(.60,.65),(1,.34)]);recover=0.
            else:
                coil=0.;strike=.34*(1-t);recover=between(t,[(0,1),(.55,.85),(.90,.40),(.98,.24),(1,0)])
            rear={'crawler':.42,'brute':-.24,'stalker':.42,'spitter':-.28,'carrier':-.18}[self.family]
            extension={'crawler':.48,'brute':.42,'stalker':-.35,'spitter':.30,'carrier':.40}[self.family]
            height={'crawler':-.34,'brute':.10,'stalker':-.28,'spitter':.08,'carrier':.10}[self.family]
            self.rotate(self.center,SIDE,rear*coil+extension*strike)
            self.rotate(self.center,FWD,-.17*recover)
            self.move(self.center,UP*H*(height*coil-.10*strike-.035*recover))
            # Native footprint-scaled travel belongs to EnemyMotion, once only.
            self.mouth(coil*.8+strike*.5)
            if crawler and coil:self.squash(self.center,up=1-.27*coil,side=1+.18*coil,forward=1-.06*coil)
            elif self.family=='stalker' and coil:self.squash(self.center,up=1-.18*coil,side=1+.12*coil)
            elif self.family=='spitter':
                self.rotate('spine2',SIDE,-.18*coil)
                self.scale('bum',1+.05*coil)
            elif self.family=='carrier':
                self.rotate('body.001',SIDE,-.12*coil)
                if action in ['m10-windup','m10-strike']:
                    # The broad brood shell follows the main body joint. Rear
                    # that connected mass, with a loaded asymmetric claw guard.
                    self.rotate(self.center,SIDE,-.24*coil)
                    self.rotate(self.center,FWD,.12*coil)
                    self.rotate('body.001',SIDE,-.14*coil)
                    self.move(self.center,UP*H*.04*coil)
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
                if self.family=='carrier' and action in ['m10-windup','m10-strike']:
                    for leg in self.legs:
                        i=leg['index'];side=-1 if i%2==0 else 1
                        lateral=.12 if i<2 else .09 if i<4 else .05
                        forward=-.08 if i<2 else .03 if i<4 else -.10
                        targets[i]=leg['rest']+SIDE*side*W*lateral*coil+FWD*W*forward*coil
                        if i==0:targets[i]+=UP*H*.10*coil
                if recover:
                    for leg in self.legs:
                        if leg['index']==0: targets[0]=leg['rest']+UP*H*.12*recover+FWD*W*.12*recover
        elif action.startswith('m10-hit-') or action=='m10-stagger':
            heavy='heavy' in action or action=='m10-stagger'
            direction=action.rsplit('-',1)[-1] if action!='m10-stagger' else 'front'
            vector={'front':-FWD,'back':FWD,'left':-SIDE,'right':SIDE}.get(direction,-FWD)
            hit=between(t,[(0,0),(.10,1),(.20,1),(.36,.62),(.62,-.18),(.88,.05),(1,0)])
            lift=between(t,[(0,0),(.14,1),(.3,.85),(.62,0),(1,0)]) if heavy and crawler else 0
            travel=max(0,hit)*(1-smooth((t*seconds-.17)/.08))
            self.move(self.center,vector*W*(.16 if heavy else .085)*travel+UP*H*.46*lift)
            self.rotate(self.center,SIDE,vector.x*(.72 if heavy else .38)*hit)
            self.rotate(self.center,FWD,-vector.z*(.82 if heavy else .42)*hit)
            self.rotate(self.center,UP,(.42 if crawler and heavy else .14)*hit)
            self.rotate('head',SIDE,-vector.x*.28*hit)
            self.mouth(.5*max(0,hit))
            for leg in self.legs:
                i=leg['index']
                targets[i]=leg['rest']+UP*H*((.40*lift)+(.13 if i%2==0 else .03)*max(0,hit))+vector*W*.10*hit
            if not crawler:
                for arm in self.arms:
                    target=arm['rest']+vector*W*.15*hit+UP*H*.17*max(0,hit)
                    self.solve(arm,target)
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
        elif action.startswith('m10-death-'):
            style=action[len('m10-death-'):]
            fall=between(t,[(0,0),(.15,.08),(.38,.62),(.7,1),(1,1)])
            drop=H*(.45 if crawler and style=='burn' else .67)
            if self.family not in ['crawler','brute']:
                ground=min(-leg['rest'].y for leg in self.legs)
                drop=min(drop,max(H*.15,-self.base_matrices[self.center].translation.y-ground-H*.15))
            self.move(self.center,-UP*drop*fall+FWD*W*.08*min(1,t*4))
            self.rotate(self.center,SIDE,(.20 if crawler and style=='burn' else .75)*fall)
            self.rotate(self.center,FWD,-.34*fall)
            curl=fall
            if style=='burn':
                curl=between(t,[(0,0),(.12,.65),(.30,1),(1,1)])
                self.rotate(self.center,SIDE,(.12 if crawler else .40)*curl)
                if crawler:self.rotate(self.center,FWD,1.45*fall)
                self.rotate('head',SIDE,.75*curl);self.rotate('neck',SIDE,.32*curl)
                self.mouth(.55*(1-t))
            elif style=='arc':
                pulse=math.sin(t*math.tau*8)*max(0,1-t/.45)
                self.rotate(self.center,FWD,.40*pulse);self.rotate(self.center,SIDE,.30*pulse)
                self.move(self.center,UP*H*.24*max(0,pulse))
                curl+=pulse*.35;self.mouth(.95)
            elif style=='frost':
                # Rigid terminal brace; runtime fracture owns the separation.
                self.rotate(self.center,SIDE,-.20*(1-fall));curl=-.30*(1-fall)+fall
                self.mouth(.55)
            elif style=='acid':
                self.rotate(self.center,SIDE,.30*fall);curl=fall*1.15
                self.move(self.center,-UP*H*.10*fall)
            else:self.mouth(.35*(1-t))
            for leg in self.legs:
                rest=leg['rest'];center=self.m[self.center].translation
                target=rest.lerp(center,.46*max(0,curl))+UP*H*(.1+.12*(leg['index']%2))*max(0,curl)
                if style=='arc':target+=UP*H*.22*math.sin(t*math.tau*8+leg['index']*math.pi)
                if style=='burn' and crawler:
                    i=leg['index'];fold=center+FWD*W*(.20-.18*(i%3))+SIDE*W*(.14 if i>=3 else -.10)+UP*H*(.05 if i>=3 else -.05)
                    target=rest.lerp(fold,min(1,curl))
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
    **{f'm10-hit-{weight}-{direction}':(.28 if weight=='light' else .60)
       for weight in ['light','heavy'] for direction in ['front','right','back','left']},
    'm10-stagger':.72,'m10-burning':1.2,'m10-shocked':.8,'m10-frozen':.6,
    **{f'm10-death-{style}':1.25 for style in ['none','frost','burn','arc','acid']},
    'm10-spawn':1.1,
}


def author(family):
    arm=import_rig(family)
    creature=Creature(arm,family)
    for name,seconds in DURATIONS.items():
        new_action(arm,name,seconds)
        last=1+round(seconds*60)
        # Actual bone keys at30Hz; exporter resamples the keyed animation at60Hz.
        frames=list(range(1,last+1,2))
        if frames[-1]!=last:frames.append(last)
        for frame in frames:
            bpy.context.scene.frame_set(frame)
            creature.pose(name,(frame-1)/(last-1),seconds)
            key_pose(arm,frame)
        print('M10 authored',family,name,seconds,flush=True)
    output=ROOT/'public/assets/models/motion'/f'{family}-motion.glb'
    export_motion(arm,output,list(DURATIONS))


if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--'in sys.argv else []
    families=next((a.split('=',1)[1] for a in args if a.startswith('--families=')),'crawler,brute').split(',')
    for family in families:author(family)
