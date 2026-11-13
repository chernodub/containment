import type {RigId} from '../../game/abilities/contract';

export const RIG_FANTASIES: Readonly<Record<RigId, string>> = {
  breacher: 'BECOME THE BREACH.',
  cryo: 'STILL. SHATTER. SURVIVE.',
  pyro: 'LEAVE NOTHING STANDING.',
  arc: 'COMMAND THE CURRENT.',
};

const equipment: Readonly<Record<RigId, {label: string; back: string; front: string}>> = {
  breacher: {
    label: 'Heavy ram plate and a forearm shield projector',
    back: '<path class="rig-plate" d="m99 104-29 16-19 77 30 44 41-24 4-89Zm244 0 29 16 19 77-30 44-41-24-4-89Z"/><path class="rig-edge" d="m63 185 18-53 20-11m277 64-18-53-20-11"/>',
    front: '<path class="rig-heavy-plate" d="m154 158 66-18 66 18 14 82-80 44-80-44Z"/><path class="rig-highlight" d="m153 171 67-18 67 18-7 25-60 27-60-27Z"/><path class="rig-ink" d="m163 205 57 25 57-25m-57 25v35"/><path class="rig-energy" d="m184 178 24 10-24 10m48-20 24 10-24 10"/><g class="rig-projector"><path class="rig-plate" d="m84 195 39 8 4 57-47 8-23-31Z"/><path class="rig-energy rig-idle-energy" d="m74 227 12-13 23 5 2 28-26 5-11-12Z"/><path class="rig-shield-field rig-idle-energy" d="m38 160 71 23 19 89-67 18-39-68Z"/></g>',
  },
  cryo: {
    label: 'Twin coolant tanks, pressure pipes and shoulder frost vents',
    back: '<g class="rig-coolant-tanks"><path class="rig-plate" d="m97 72 28-13 20 15 2 139-47 10-15-23V97Zm218 2 20-15 28 13 12 25-3 103-15 23-47-10Z"/><path class="rig-highlight" d="m104 84 18-8 11 8v103l-25 7Zm232 0 11-8 18 8-4 110-25-7Z"/><path class="rig-energy rig-idle-energy" d="M116 103v60m232-60v60"/><path class="rig-ink" d="m92 105 50-7m-47 76 48-10m165-66 50 7m-49 59 48 10"/></g>',
    front: '<path class="rig-plate" d="m145 164 75-20 75 20-11 94-64 29-64-29Z"/><path class="rig-highlight" d="m155 175 65-17 65 17-13 32-52 20-52-20Z"/><path class="rig-energy rig-idle-energy" d="M220 168v49m-22-37 44 25m0-25-44 25"/><path class="rig-vent" d="m99 133 28-3 12 33-33 8Zm214-3 28 3-7 38-33-8Z"/><path class="rig-energy" d="m107 140 20-2m-18 11 22-2m-19 11 23-3m178-17 20 2m-24 7 22 2m-26 6 23 3"/><path class="rig-coolant-vapor" d="M110 121q-16-16 0-33m9 31q-9-14 2-24m209 26q16-16 0-33m-9 31q9-14-2-24"/>',
  },
  pyro: {
    label: 'Armored fuel reservoirs and paired ignition nozzles',
    back: '<g class="rig-fuel-tanks"><path class="rig-plate" d="m90 80 22-17 28 13 8 131-32 24-29-23-8-106Zm210-4 28-13 22 17 11 22-8 106-29 23-32-24Z"/><path class="rig-highlight" d="m94 93 17-13 17 8 4 80-36 8Zm218-5 17-8 17 13-2 83-36-8Z"/><path class="rig-energy rig-idle-energy" d="m101 108 16-2 2 33-16 3Zm222-2 16 2-2 34-16-3Z"/><path class="rig-ink" d="m88 183 49-10m166 0 49 10"/></g>',
    front: '<path class="rig-plate" d="m145 160 75-16 75 16-9 102-66 27-66-27Z"/><path class="rig-highlight" d="m157 170 63-12 63 12-9 30-54 18-54-18Z"/><path class="rig-energy rig-ignition" d="m220 172-13 23 5-2-4 13 13 5 11-10-4-16-4 7Z"/><path class="rig-hose" d="M110 186q-17 63 48 58m172-58q17 63-48 58"/><path class="rig-plate" d="m79 194 36 4 10 34-43 9-19-19Zm246 4 36-4 16 28-19 19-43-9Z"/><path class="rig-nozzle" d="m76 213 38-6 5 17-37 8Zm245-6 38 6-6 19-37-8Z"/><path class="rig-energy rig-ignition" d="m63 223-8 11m1-15-14 8m335-4 8 11m-1-15 14 8"/>',
  },
  arc: {
    label: 'Paired induction coils and a charged chest capacitor bank',
    back: '<path class="rig-plate" d="m98 101 12-40 32 2 16 51-16 68-42-6Zm244 0-12-40-32 2-16 51 16 68 42-6Z"/><g class="rig-coils"><path d="m108 79 34-2m-38 15 42-2m-45 16 47-3m-46 17 42-4m-39 17 35-4m156-52 34 2m-38 11 42 2m-44 13 47 3m-46 10 42 4m-39 9 35 4"/></g><path class="rig-arc rig-idle-energy" d="m107 57-5-18 18 8 8-26m193 36 11-16-18 4-3-26"/>',
    front: '<path class="rig-plate" d="m145 161 75-17 75 17-7 99-68 30-68-30Z"/><path class="rig-highlight" d="m158 172 62-13 62 13-12 29-50 18-50-18Z"/><g class="rig-capacitors"><path class="rig-vent" d="m174 220 20 7 2 36-20-8Zm36 11h20v38h-20Zm36-4 20-7-2 35-20 8Z"/><path class="rig-energy rig-idle-energy" d="m181 230 6 2 1 20m29-13h6v20m29-27 6-2-1 22"/></g><path class="rig-energy rig-idle-energy" d="m225 165-20 26h15l-6 17 22-27h-15Z"/><path class="rig-arc rig-idle-energy" d="m92 186 20 7-10 13 19 10m227-30-20 7 10 13-19 10"/>',
  },
};

/** Original inked suit portraits use broad armor planes and rig-specific equipment. */
export function rigPortrait(rig: RigId): string {
  const kit = equipment[rig];
  return `<figure class="rig-portrait" data-portrait="${rig}" role="img" aria-label="${rig} combat marine. ${kit.label}."><svg viewBox="0 0 440 300" aria-hidden="true" focusable="false"><defs><linearGradient id="rig-steel-${rig}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5b7886"/><stop offset=".35" stop-color="#263c49"/><stop offset="1" stop-color="#0b1721"/></linearGradient><linearGradient id="rig-visor-${rig}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e7fbff"/><stop offset=".3" stop-color="currentColor"/><stop offset="1" stop-color="#35505e"/></linearGradient></defs><path class="rig-portrait-halo" d="m220 17 126 70v144l-126 70-126-70V87Z"/><path class="rig-portrait-guides" d="M17 258h406M32 49h70m236 0h70M220 6v22"/><g stroke-linejoin="bevel">${kit.back}<path class="rig-body" d="m175 125-48 16-32 44 10 101h230l10-101-32-44-48-16Z"/><path class="rig-plate" d="m127 141 39-10 8 51-52 23-27-20Zm186 0-39-10-8 51 52 23 27-20Z"/><path class="rig-highlight" d="m132 146 26-8 4 14-36 16Zm176 0-26-8-4 14 36 16Z"/><path class="rig-neck" d="m189 112 62 0 12 42-43 17-43-17Z"/><path class="rig-ink" d="m184 138 36 12 36-12m-75 11 39 13 39-13"/><path class="rig-helmet" d="m180 49 20-15h40l20 15 10 46-15 27-35 15-35-15-15-27Z"/><path class="rig-highlight" d="m181 52 21-12h36l21 12 4 18-43-9-43 9Z"/><path class="rig-helmet-side" d="m173 74 14 8 3 28-13-14Zm94 0-14 8-3 28 13-14Z"/><path class="rig-visor" d="m184 70 36-4 36 4-5 25-31 8-31-8Z"/><path class="rig-visor-ink" d="m192 72 28-1 28 1m-27 1v20"/><path class="rig-plate" d="m194 101 26 8 26-8-4 17-22 10-22-10Z"/><path class="rig-energy" d="M211 116h18"/>${kit.front}<path class="rig-edge" d="m101 184 13-26 14-11m207 37-13-26-14-11M186 49l17-10h34l17 10"/><path class="rig-ink" d="M119 270h33m136 0h33"/></g><g class="rig-portrait-registration"><path d="M32 278v-14h14m348 14h14v-14M32 23V9h14m348 0h14v14"/><circle cx="220" cy="289" r="2"/></g></svg><figcaption><span>SUIT / ${rig.toUpperCase()}</span><span>LINK ESTABLISHED</span></figcaption></figure>`;
}
