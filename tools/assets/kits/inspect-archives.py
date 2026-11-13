#!/usr/bin/env python3
"""Inspect untrusted archives and copy only static data. Never extract executable files."""
import hashlib,json,stat,zipfile
from pathlib import Path,PurePosixPath
root=Path(__file__).resolve().parents[2]/'assets-src'
for pack in ('kenney-space-station','kenney-furniture','kenney-nature'):
 folder=root/pack
 with zipfile.ZipFile(folder/'pack.zip') as archive:
  entries=archive.infolist()
  if len(entries)>10000 or sum(i.file_size for i in entries)>400_000_000: raise ValueError('archive budget')
  records=[]
  for entry in entries:
   path=PurePosixPath(entry.filename)
   if path.is_absolute() or '..' in path.parts or stat.S_ISLNK(entry.external_attr>>16): raise ValueError('unsafe path')
   records.append({'path':entry.filename,'bytes':entry.file_size})
  (folder/'archive-files.json').write_text(json.dumps(records,indent=2)+'\n')
  output=folder/'inspected'
  output.mkdir(exist_ok=False)
  for entry in entries:
   if entry.is_dir(): continue
   path=PurePosixPath(entry.filename)
   if path.suffix.lower() not in ('.glb','.gltf','.bin','.obj','.mtl','.png') and path.name.lower() not in ('license.txt','license.md'): continue
   if entry.file_size>20_000_000: raise ValueError('individual data budget')
   dest=output.joinpath(*path.parts);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(archive.read(entry))
  print(pack,'files',len(entries),'archive sha256',hashlib.sha256((folder/'pack.zip').read_bytes()).hexdigest())
  print('\n'.join(e.filename for e in entries if e.filename.lower().endswith('license.txt')))
  print('glb',len(list(output.rglob('*.glb'))),'gltf',len(list(output.rglob('*.gltf'))),'obj',len(list(output.rglob('*.obj'))))
