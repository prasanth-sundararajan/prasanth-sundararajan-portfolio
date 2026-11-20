# Demo videos

Drop screen recordings here with these exact file names. Each case study page and project card
already has a video slot that shows the file automatically; when a file is missing the slot stays hidden.

| File | Shown on |
|---|---|
| `slotease.mp4` | `case-studies/slotease.html` and the SlotEase card in `index.html` |
| `reviewlens.mp4` | `case-studies/reviewlens.html` and the ReviewLens card |
| `datapilot.mp4` | `case-studies/datapilot.html` and the DataPilot card |
| `launchscout.mp4` | `case-studies/launchscout.html` and the LaunchScout card |

Tips:

- H.264 video in an MP4 container plays everywhere. Keep each clip short (30 to 90 seconds) and under ~15 MB.
- Videos play muted, so add captions or on-screen text if narration matters.
- The project screenshot in `assets/` is used as the poster image, so no thumbnail is needed.
- The page checks the file with a `HEAD` request and only shows the player when the server answers with a
  `video/*` content type, so nginx must serve `.mp4` as `video/mp4` (the default `mime.types` does).
