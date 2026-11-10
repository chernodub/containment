import {readFileSync} from 'node:fs';
export const uiSource=['shell.ts','application.ts','screens/ScreenManager.ts','hud/Hud.ts'].map(path=>readFileSync(new URL('../src/ui/'+path,import.meta.url),'utf8')).join('\n');
