# G3 UI integration request (UI stream ownership)

The renderer adds `inkOutlines` (`off | silhouette | full`), `adaptiveResolution` and `stylizedShading`. Native controls are generated automatically. Full choices are exported as `GRAPHICS_OPTION_CHOICES` from `src/render/graphicsOptions.ts`.

Required small settings hook: in `src/ui/settings.ts`, import `GRAPHICS_OPTION_CHOICES`; `graphicsChoices(key)` should first return a copy of the matching entry, before its preset-derived fallback. Currently `off` is absent from both ink presets and cannot be chosen/persisted through the UI, although the renderer validates and supports it.

The existing 1280×720 no-inner-scroll fit assertion detects 744 px of settings content inside a 660 px drawer after the three additive controls. Keep that assertion. The UI owner needs a compact arrangement/disclosure for the additional native labelled controls, including keyboard focus and all hints. The 1920×1080 exact 16-control presentation pin is updated to the full graphics metadata count plus six non-graphics controls; this retains completeness instead of silently omitting new options.

No src/ui file is changed by G3. The native UI test's old assumption that every string option accepts `low` now selects a valid non-default choice for that option and checks the full persisted graphics object. Persistence, reduced-motion, keyboard/mouse, screen fit and input assertions remain.
