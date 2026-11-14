# E7 ten-mood value reference

All reference captures use native calm setup, the same marine rig/idle pose,
fixed simulation clock, default long-lens tilt and fixed internal resolution.
Room hull/hero/HUD constraints remain native, so camera positions necessarily
follow each room's authored spawn. No post-capture exposure or color normalization.

| Environment | Key / shadow distribution | Source hierarchy / response |
|---|---|---|
| Cryogenics | High rear cross-key; dark clean release lane | Narrow pod strips, frosted seals, dry matte floor |
| Habitation | Cold dim lane, isolated warm cabin pools | Amber domestic practicals; warm cloth beside cold steel |
| Security | High hard inspection key with adjacent shadow | White inspection hardware, localized red alarms; dry steel |
| Cargo | High sodium key crossing container canyons | Orange overhead pools, dark ribbed walls, worn matte bays |
| Communications | Low broad illumination, coherent small equipment groups | Cyan/green screens, dark rack recesses, quiet service floor |
| Engineering | Low raking yellow service key | Steam silhouettes; consoles remain subordinate to service hardware |
| Maintenance | Teal cross-light against shaft depth | Wet steel and seepage, green fluorescents, dark lower structure |
| Infested | Failing human fill; isolated organ sources | Thick dark folded tissue, luminous green cysts/magenta wounds |
| Containment | Reverse cross-key, restrained ambient | Repeated coherent field emitters; ceramic/shadow separation |
| Reactor | Core key, cooler load-bearing structure | Lower hot peak and dry dark supports reserve combat flash headroom |

Acceptance uses I10: Rec.709 weighted sRGB PNG code values (not linear luminance),
legal projected floor samples, raised surfaces excluded, no normalization;
calm and canonical combat02 medians50–80, nominal shadow p5 12–28.
Raw per-phase excursions must remain reported even if the canonical pair passes.
