"""Loss-bounded glTF UV compaction for static P11 props (original MIT).

Normalized UNSIGNED_SHORT TEXCOORD_0 is native glTF2/Three.js, no extension.
At512 atlas resolution maximum quantization error is0.004 texel. Positions,
normals, colors and image bytes are copied unchanged. Only noninterleaved UV
views used exclusively by UV accessors are eligible.
"""
import json,struct,hashlib
from pathlib import Path

def compact_uv(path,manifest_path=None):
    path=Path(path);raw=path.read_bytes();json_len=struct.unpack_from('<I',raw,12)[0]
    doc=json.loads(raw[20:20+json_len]);binary=raw[28+json_len:]
    uv_ids={p['attributes']['TEXCOORD_0'] for m in doc['meshes'] for p in m['primitives'] if 'TEXCOORD_0' in p['attributes']}
    transformed={};saved=0
    for index in uv_ids:
        a=doc['accessors'][index];view_index=a['bufferView'];view=doc['bufferViews'][view_index]
        if a['componentType']!=5126 or a['type']!='VEC2' or a.get('byteOffset',0) or view.get('byteStride'):continue
        if any(j not in uv_ids and other.get('bufferView')==view_index for j,other in enumerate(doc['accessors'])):continue
        values=struct.unpack_from('<'+'f'*(a['count']*2),binary,view.get('byteOffset',0))
        if min(values)<0 or max(values)>1:continue
        data=struct.pack('<'+'H'*len(values),*(round(v*65535) for v in values))
        transformed[view_index]=data;a['componentType']=5123;a['normalized']=True
        for key in ('min','max'):
            if key in a:a[key]=[round(v*65535) for v in a[key]]
    chunks=[];offset=0
    for index,view in enumerate(doc['bufferViews']):
        payload=transformed.get(index,binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']])
        padding=(-offset)%4
        if padding:chunks.append(b'\0'*padding);offset+=padding
        view['byteOffset']=offset;view['byteLength']=len(payload);chunks.append(payload);offset+=len(payload)
    data=b''.join(chunks);doc['buffers'][0]['byteLength']=len(data);data+=b'\0'*((-len(data))%4)
    encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
    out=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(data))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(data),0x004e4942)+data
    path.write_bytes(out)
    if manifest_path:
        manifest_path=Path(manifest_path);manifest=json.loads(manifest_path.read_text());manifest['output']['bytes']=len(out);manifest['output']['sha256']=hashlib.sha256(out).hexdigest()
        manifest['uvEncoding']='normalized UNSIGNED_SHORT; maximum error0.004 atlas texel at512; native glTF2'
        manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    print('P11_UV_COMPACT',len(raw),len(out),'saved',len(raw)-len(out))
