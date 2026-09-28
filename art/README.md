# Skybound art sources

`anime-explorer.blend` is the detailed, skinned portfolio explorer, customized in Blender 5.2.2 LTS from the CC0 **Sakurada Fumiriya** model by VRoid Project / pixiv Inc. See `../ASSETS.md` for publisher license, source mirror and SHA-256. Face, hair, body, clothing textures and rig are adapted from that base. The expedition mantle, collar, harness, brooch and Pixel robot are custom additions.

`sky-district.blend` contains the original research pavilion, platforms and a studio fallback render with the credited explorer. The surrounding explorable landscape is authored in `../city/sky-world.js`.

The earlier `wayfarer.blend` is retained as the source of the original robot companion. Its simplified human is not used on the new homepage.

## Rebuild the detailed explorer

From the repository root, download and extract the documented source:

```powershell
New-Item -ItemType Directory -Force .tmp/character-source | Out-Null
Invoke-WebRequest 'https://opengameart.org/sites/default/files/sakurada_fumiriya.zip' -OutFile .tmp/character-source/sakurada_fumiriya.zip
Expand-Archive .tmp/character-source/sakurada_fumiriya.zip .tmp/character-source/sakurada -Force
python scripts/prepare_anime_source.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python scripts/prepare_anime_explorer.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python scripts/build_sky_district.py
```

The source-preparation script verifies the VRM checksum, converts standard materials and removes VRM-specific vertex masks that would otherwise hide the body in glTF. Blender preserves skin weights and facial morphs; the `Blink` morph and named humanoid bones are used by the browser. The camera/poster uses the actual asset, not a generated concept image.

Encode the generated PNG fallback posters as WebP with Pillow before running `python scripts/build_city.py`. All runtime assets are committed: Pages needs neither Blender nor an external model service. No Draco/Meshopt decoder is required.
