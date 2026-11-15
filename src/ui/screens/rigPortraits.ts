import type {RigId} from '../../game/abilities/contract';

export const RIG_FANTASIES: Readonly<Record<RigId, string>> = {
  breacher: 'BECOME THE BREACH.',
  cryo: 'STILL. SHATTER. SURVIVE.',
  pyro: 'LEAVE NOTHING STANDING.',
  arc: 'COMMAND THE CURRENT.',
};

const equipment: Readonly<Record<RigId, {label: string; pose: string; back: string; front: string}>> = {
  breacher: {
    label: 'Broad asymmetric ram shoulder and forearm shield projector',
    pose: 'rotate(-3 220 250)',
    back: '<g data-equipment="ram-shoulder"><path class="rig-heavy-plate" d="m66 87 67-12 54 47-16 73-63 31-56-39-9-59Z"/><path class="rig-highlight" d="m66 100 61-12 43 35-14 22-92-9Z"/><path class="rig-edge" d="m54 151 15-42 55-11m-64 69 49 37 43-22"/><path class="rig-ink" d="m76 140 26 42 48-19m-43-64 22 35"/></g><path class="rig-plate" d="m315 125 37 19 22 55-29 27-28-20-12-55Z"/>',
    front: '<path class="rig-heavy-plate" d="m154 158 66-18 66 18 14 82-80 44-80-44Z"/><path class="rig-highlight" d="m153 171 67-18 67 18-7 25-60 27-60-27Z"/><path class="rig-ink" d="m163 205 57 25 57-25m-57 25v35"/><path class="rig-energy" d="m184 178 24 10-24 10m48-20 24 10-24 10"/><g class="rig-projector"><path class="rig-plate" d="m84 195 39 8 4 57-47 8-23-31Z"/><path class="rig-energy rig-idle-energy" d="m74 227 12-13 23 5 2 28-26 5-11-12Z"/><path class="rig-shield-field rig-idle-energy" d="m38 160 71 23 19 89-67 18-39-68Z"/></g>',
  },
  cryo: {
    label: 'Raised asymmetric coolant vessel, looping pressure hose and outward shoulder frost vent',
    pose: 'rotate(2 220 250)',
    back: '<g class="rig-coolant-tanks" data-equipment="coolant-vessel"><path class="rig-plate" d="m83 40 24-14 27 14 12 27-6 153-41 12-29-24 1-142Z"/><path class="rig-highlight" d="m85 60 22-16 17 11 6 113-42 10Z"/><path class="rig-vent" d="M72 82 47 88 35 112 44 141 76 146 91 119Z"/><path class="rig-energy rig-idle-energy" d="M106 72v75"/><path class="rig-ink" d="m73 80 69-7m-69 103 65-11m-90-64 27-5m-29 16 28-5m-25 16 24-4"/><path class="rig-hose" d="M84 183C24 164 32 61 79 66"/><path class="rig-edge" d="M84 182C35 161 39 72 76 70"/></g>',
    front: '<path class="rig-plate" d="m145 164 75-20 75 20-11 94-64 29-64-29Z"/><path class="rig-highlight" d="m155 175 65-17 65 17-13 32-52 20-52-20Z"/><path class="rig-energy rig-idle-energy" d="M220 168v49m-22-37 44 25m0-25-44 25"/><path class="rig-vent" d="m102 132 31-4 17 37-41 13Z"/><path class="rig-energy" d="m112 142 19-3m-16 14 22-3m-18 14 23-4"/><path class="rig-hose" d="M85 197q-40 49 42 68"/><path class="rig-coolant-vapor" d="M39 100Q12 84 29 62m22 26Q29 66 44 50"/>',
  },
  pyro: {
    label: 'Twin squat fuel reservoirs, flat exhaust fins and a forward fuel nozzle rig',
    pose: 'rotate(-1.5 220 250)',
    back: '<g class="rig-fuel-tanks" data-equipment="twin-fuel-reservoirs"><path class="rig-nozzle" d="M77 85V64h28v20m231 0V64h28v21"/><path class="rig-plate" d="m61 88 30-12 32 12 18 26-6 118-42 19-37-24-10-112Zm255 0 31-12 32 12 16 27-9 112-38 24-42-19-6-118Z"/><path class="rig-highlight" d="m63 105 26-15 23 9 9 70-55 10Zm255-6 27-9 27 15-3 74-55-10Z"/><path class="rig-nozzle" d="M47 114 24 110v16l27 7m-1 5-26-3v16l30 7m337-44 25-4v16l-27 7m-1 5 28-3v16l-32 7"/><path class="rig-ink" d="m54 192 78-15m-76 37 77-16m174-21 78 15m-79 6 77 16"/><path class="rig-energy rig-idle-energy" d="m76 115 25-5 2 39-25 5Zm251-5 25 5-2 39-25-5Z"/></g>',
    front: '<path class="rig-plate" d="m145 160 75-16 75 16-9 102-66 27-66-27Z"/><path class="rig-highlight" d="m157 170 63-12 63 12-9 30-54 18-54-18Z"/><path class="rig-energy rig-ignition" d="m220 172-13 23 5-2-4 13 13 5 11-10-4-16-4 7Z"/><path class="rig-hose" d="M110 186q-17 63 48 58m172-58q17 63-48 58"/><path class="rig-plate" d="m79 194 36 4 10 34-43 9-19-19Zm246 4 36-4 16 28-19 19-43-9Z"/><g data-equipment="fuel-nozzle"><path class="rig-nozzle" d="m65 207 46-8 11 21-54 13-29-8-13-21 18-12 15 20Zm255-1 37 6-6 19-37-8Z"/><path class="rig-edge" d="m33 201 11-3 12 19-12 3Z"/></g><path class="rig-energy rig-ignition" d="m63 223-8 11m1-15-14 8m335-4 8 11m-1-15 14 8"/>',
  },
  arc: {
    label: 'Tall open induction coils, unequal antenna masts and a chest capacitor bank',
    pose: 'rotate(1 220 250)',
    back: '<g data-equipment="induction-array"><path class="rig-plate" d="m98 145 8-17h44l13 30-18 41-42-14Zm197-17h44l8 17-5 40-42 14-18-41Z"/><path class="rig-antenna" d="M127 137V15m-5 0h10M315 137V7m-5 0h10"/><g class="rig-coil-frames"><path d="M127 37C86 37 86 73 127 73S168 37 127 37Zm0 43c-41 0-41 36 0 36s41-36 0-36Zm188-59c-41 0-41 36 0 36s41-36 0-36Zm0 43c-41 0-41 36 0 36s41-36 0-36Z"/></g><g class="rig-coils"><path d="M102 49q-9 12 6 18m-6 25q-9 12 6 18m182-77q-9 12 6 18m-6 25q-9 12 6 18"/></g><path class="rig-arc rig-idle-energy" d="m148 32 17 13-11 13 17 13m-37 28 20 13-7 12m145-102-17 12 11 13-17 13"/></g>',
    front: '<path class="rig-plate" d="m145 161 75-17 75 17-7 99-68 30-68-30Z"/><path class="rig-highlight" d="m158 172 62-13 62 13-12 29-50 18-50-18Z"/><g class="rig-capacitors"><path class="rig-vent" d="m174 220 20 7 2 36-20-8Zm36 11h20v38h-20Zm36-4 20-7-2 35-20 8Z"/><path class="rig-energy rig-idle-energy" d="m181 230 6 2 1 20m29-13h6v20m29-27 6-2-1 22"/></g><path class="rig-energy rig-idle-energy" d="m225 165-20 26h15l-6 17 22-27h-15Z"/><path class="rig-arc rig-idle-energy" d="m92 186 20 7-10 13 19 10m227-30-20 7 10 13-19 10"/>',
  },
};

/** Original inked suit portraits use broad armor planes and rig-specific equipment. */
export function rigPortrait(rig: RigId): string {
  const kit = equipment[rig];
  return `<figure class="rig-portrait" data-portrait="${rig}" role="img" aria-label="${rig} combat marine. ${kit.label}."><svg viewBox="0 0 440 300" aria-hidden="true" focusable="false"><defs><linearGradient id="rig-steel-${rig}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5b7886"/><stop offset=".35" stop-color="#263c49"/><stop offset="1" stop-color="#0b1721"/></linearGradient><linearGradient id="rig-visor-${rig}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e7fbff"/><stop offset=".3" stop-color="currentColor"/><stop offset="1" stop-color="#35505e"/></linearGradient></defs><path class="rig-portrait-halo" d="m220 17 126 70v144l-126 70-126-70V87Z"/><path class="rig-portrait-guides" d="M17 258h406M32 49h70m236 0h70M220 6v22"/><g class="rig-portrait-marine" data-pose="${rig}" transform="${kit.pose}" stroke-linejoin="bevel">${kit.back}<path class="rig-body" d="m175 125-48 16-32 44 10 101h230l10-101-32-44-48-16Z"/><path class="rig-plate" d="m127 141 39-10 8 51-52 23-27-20Zm186 0-39-10-8 51 52 23 27-20Z"/><path class="rig-highlight" d="m132 146 26-8 4 14-36 16Zm176 0-26-8-4 14 36 16Z"/><path class="rig-neck" d="m189 112 62 0 12 42-43 17-43-17Z"/><path class="rig-ink" d="m184 138 36 12 36-12m-75 11 39 13 39-13"/><path class="rig-helmet" d="m180 49 20-15h40l20 15 10 46-15 27-35 15-35-15-15-27Z"/><path class="rig-highlight" d="m181 52 21-12h36l21 12 4 18-43-9-43 9Z"/><path class="rig-helmet-side" d="m173 74 14 8 3 28-13-14Zm94 0-14 8-3 28 13-14Z"/><path class="rig-visor" d="m184 70 36-4 36 4-5 25-31 8-31-8Z"/><path class="rig-visor-ink" d="m192 72 28-1 28 1m-27 1v20"/><path class="rig-plate" d="m194 101 26 8 26-8-4 17-22 10-22-10Z"/><path class="rig-energy" d="M211 116h18"/>${kit.front}<path class="rig-edge" d="m101 184 13-26 14-11m207 37-13-26-14-11M186 49l17-10h34l17 10"/><path class="rig-ink" d="M119 270h33m136 0h33"/></g><g class="rig-portrait-registration"><path d="M32 278v-14h14m348 14h14v-14M32 23V9h14m348 0h14v14"/><circle cx="220" cy="289" r="2"/></g></svg><figcaption><span>SUIT / ${rig.toUpperCase()}</span><span>LINK ESTABLISHED</span></figcaption></figure>`;
}
