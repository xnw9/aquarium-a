`ambiance-recode.mp4` — the aquarium footage. 1280x720, H.264/AAC, ~2.3 Mbps, 80 MB, 4:54.

Re-encoded from a 292 MB 1920x1080 source with:

    ffmpeg -i ambiance.mp4 -vf scale=-2:720 -c:v libx264 -crf 20 -preset slow \
           -c:a aac -b:a 128k -movflags +faststart ambiance-recode.mp4

Constraints to respect if this is ever replaced:

- Under 100 MB. GitHub rejects larger files and Pages does not serve Git LFS content.
- `-movflags +faststart`, or playback won't begin until the whole file has downloaded.
- Lowercase filename. Pages is case-sensitive; Windows is not.
- A video too big to fit under 100 MB would have to be split into parts and chained in
  JS on the `ended` event, replacing the native `loop` attribute the page uses now.
- Each committed version is kept in git history, so replacing the video grows the repo
  by another ~80 MB. Removing one needs a history rewrite (`git filter-repo`) and a
  force push.
