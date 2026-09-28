# Wayfarer & Pixel

An original hooded, androgynous anime-inspired explorer and floating reconnaissance robot, authored in Blender 5.1.2. No personal photograph was used for the model.

- `wayfarer.blend`: editable source scene, studio lights and fallback camera.
- `../scripts/build_explorer.py`: reproducible Blender geometry authoring script.
- `../assets/wayfarer.glb`: optimized glTF 2.0 runtime asset, about 1.2 MB.
- `../assets/wayfarer-poster.webp`: transparent fallback for loading, disabled JavaScript, and unavailable WebGL.

The model has separate transform pivots for the head, eyelids, left/right arms and robot. Browser code supplies breathing, blinking, a wave and robot hover. It is not a skinned humanoid rig or a motion-capture asset. Geometry is grouped by material within pivots to limit draw calls. No external textures, Draco decoder, paid service or downloaded character model is needed.

## Rebuild

From the repository root in PowerShell:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --python scripts/build_explorer.py
npx --yes @gltf-transform/cli@4.2.1 dedup assets/wayfarer.glb assets/wayfarer-optimized.glb
Copy-Item assets/wayfarer-optimized.glb assets/wayfarer.glb -Force
python scripts/prepare_portfolio_assets.py --poster-only
python scripts/build_city.py
```

The optional image encoding step requires Pillow. Blender and glTF Transform are authoring tools only; the GitHub Pages workflow deploys committed runtime assets without installing either.

The character is intentionally decorative and has no collision mesh. It uses dynamic browser lighting and one level of detail. The viewer caps pixel density at 1.5 and animation at 30 FPS, stops scheduling frames off-screen/in hidden tabs, and honors reduced-motion preferences. The rendered poster keeps the design usable when 3D fails.
