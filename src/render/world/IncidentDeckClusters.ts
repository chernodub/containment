import {laneWorklight} from '../lighting/LaneWorklight';

// Silhouettes of pieces shed by the fixture. Each pair shares the shape
// language of one machine, and is painted into the existing clipped skin.
const debris:Record<string,readonly [string,string]>={
 'awakening-bay':['M-38 -9l17 -6 12 5 20 -3 22 6 -9 13 -19 -4 -15 4 -14 -5 -13 2Z','M-29 -7l18 9m-3 -12l17 10m0 -10l15 9'],
 'passenger-vault':['M-44 -11h71l12 7 -4 11h-76Z','M-33 -6h55m-52 8h55m-40 -11v13'],
 'residential-gallery':['M-39 -6q14 -15 28 -2l-7 12 -17 2Zm39 9q8 -18 24 -11l10 13 -18 5Z','M-32 -7q9 -6 16 -1M9 1q7 -6 16 0'],
 'communal-atrium':['M-39 6Q-21 -6 -3 -2Q2 -19 16 -18Q14 -6 3 -1L33 6l5 7 -33 -10Q-9 13 -22 11l9 -9Z','M-29 7Q-7 -3 32 8'],
 'crew-checkpoint':['M-36 -9h17l7 6 39 -2 8 6 -53 3 -17 6Z','M-27 -4v10m12 -6 41 -1'],
 armory:['M-37 -7h54l17 5 -4 8h-68Z','M-27 -5v8m9 -8v8m9 -8v8m9 -8v8m9 -8v8'],
 'transmission-chamber':['M-42 -8h29l10 8h35v9H-8l-10 -8h-24Z','M-37 -4h23l10 9h32'],
 'safety-interlock-station':['M-36 -10h22v12l28 -8v-6h20v18H11v-6l-26 10h-21Z','M-29 -6v8m8 -8v8m40 -9v8m7 -8v8'],
 'coolant-plant':['M-38 5Q-25 -9 -12 -6T9 -4Q21 -12 35 -5L19 3Q4 -1 -4 8T-38 5Z','M-30 3q12 -8 22 -4'],
 'service-shaft-landing':['M-40 -3Q-25 -17 -13 -8T12 1Q21 -9 37 -6L40 -1Q26 -3 17 6T-12 0Q-23 -11 -38 4Z','M-30 -6q9 -5 17 2m22 8q10 2 21 -8'],
 'manual-control-chamber':['M-38 -8h22v8h31v-5h22v13H9v-4h-32v-4h-15Z','M-31 -4v4m57 -2v5'],
 'overload-floor':['M-37 -6l20 -5 18 8 34 -3v9L0 7l-18 -9 -19 5Z','M-30 -3l14 -4 17 9 29 -3'],
};

export function paintIncidentClusters(c:CanvasRenderingContext2D,id:string){
 const lamp=laneWorklight(id),profile=debris[id];if(!lamp||!profile)return;
 c.save();c.translate(lamp.x,lamp.z);c.rotate(-lamp.angle);
 for(const [x,z,angle,scale] of [[-10,-30,-.23,.82],[12,30,.31,.99]]){
  c.save();c.translate(x,z);c.rotate(angle);c.scale(scale,scale);
  c.fillStyle='#586166';c.fill(new Path2D(profile[0]));
  c.strokeStyle='#74766d';c.lineWidth=2.4;c.stroke(new Path2D(profile[1]));
  c.restore();
 }
 c.restore();
}
