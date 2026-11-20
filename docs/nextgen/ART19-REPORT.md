# ART19 guardian route illustrations

The first junction previews the two Coolant Plant encounters on the Port pump gallery deck. Plate-breaker shows a Warden and plated escort taking a blue-white plasma hit. Brood shows a Matron with two pods at different stages and an incoming rocket.

Re-render both stills and update their manifest entries with:

```sh
npm run studio -- '--only=^route-(plate-breaker|brood)$'
```

The output directory is `public/assets/ui/studio/`. Both stills are 640×360 WebP files.

| File | Bytes |
| --- | ---: |
| `route-plate-breaker.webp` | 19,504 |
| `route-brood.webp` | 25,448 |

The production build passed. The `art19-after` capture of `run15-junction-1` was reviewed at 1920×1080 and 480×270. At both sizes the Warden’s broad plates and the Matron’s clustered pods distinguish the two cards before reading the titles. The card crop clips the tallest Warden horn tips and the end of the Matron’s raised abdomen. The guardians and both pods remain visible.
