import {defineConfig} from 'vite';
export default defineConfig({
 base:'./',server:{host:'0.0.0.0',allowedHosts:['terminal.local']},
 build:{target:'es2022',rolldownOptions:{output:{codeSplitting:{groups:[{
  // These shared dependencies already load on title. Keep one shared request
  // while actual ability/kit construction stays behind its gameplay import.
  name:'presentation-shared',
  test:/\/(?:three\/build\/three\.core\.js|three\/examples\/jsm\/loaders\/GLTFLoader\.js|src\/render\/(?:world\/WorldDressing|RoomModelCache|camera\/CameraRig)\.ts|src\/game\/roguelike\/authoredRoomTopologies\.ts)$/,
 }]}}}},
});
