import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join, dirname, resolve} from 'node:path';

/** Architecture-aware source audit for the few recovery/bootstrap invariants. */
function collect(directory: string): string[] {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collect(path) : path.endsWith('.ts') ? [path] : [];
  });
}
export const uiSource = collect(fileURLToPath(new URL('../src/ui/', import.meta.url)))
  .map(path => readFileSync(path, 'utf8')).join('\n');

function cssFile(path: string): string {
  return readFileSync(path, 'utf8').replace(/@import\s+['"]([^'"]+)['"];?/g,
    (_match, relative: string) => cssFile(resolve(dirname(path), relative)));
}
/** Same cascade as the production CSS entry, including split design tokens. */
export const uiCss = cssFile(fileURLToPath(new URL('../src/style.css', import.meta.url)))
  .replace(/url\(['"]?\/fonts\/([^)'"\s]+)['"]?\)/g, (_match, name: string) =>
    `url(data:font/ttf;base64,${readFileSync(new URL('../public/fonts/' + name, import.meta.url)).toString('base64')})`);
