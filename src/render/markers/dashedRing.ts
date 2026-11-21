import { RingGeometry } from 'three';

/** Keep six indices per sector so a charge sweep can advance its normal draw range. */
export function dashedRing(inner: number, outer: number, sectors: number) {
    const geometry = new RingGeometry(inner, outer, sectors);
    const indices = geometry.index!;
    for (let sector = 1; sector < sectors; sector += 2) {
        const first = sector * 6;
        for (let i = 1; i < 6; i++) indices.setX(first + i, indices.getX(first));
    }
    return geometry;
}
