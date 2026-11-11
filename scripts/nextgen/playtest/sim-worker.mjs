import { pathToFileURL } from 'node:url';
const [bundle, options] = process.argv.slice(2);
const { runSimulation } = await import(pathToFileURL(bundle).href);
process.stdout.write(JSON.stringify(runSimulation(JSON.parse(options))));
