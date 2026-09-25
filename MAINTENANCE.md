# Maintaining this profile

The profile uses GitHub-supported Markdown and HTML, committed SVG cards, an original PNG banner, and a looping GIF. GitHub sanitizes custom CSS and JavaScript, so the rounded navy, lavender, mint, and blue design lives inside the image assets. It is an independent design inspired by modern mobile interfaces; it has no affiliation with Samsung or Google.

## Refresh the charts

The **Refresh profile cards** GitHub Actions workflow runs daily at **04:23 UTC** and when its generator changes. To refresh manually, open **Actions → Refresh profile cards → Run workflow**. Scheduled runs can be delayed; GitHub may disable schedules in public repositories after 60 days without repository activity.

The workflow uses its built-in repository token with `contents: write` to commit changed cards. No personal access token or external chart account is required. GitHub CLI and Python 3.12 are available on the runner. A failed data request or render leaves the existing committed cards available.

For a local refresh, authenticate GitHub CLI and run from this repository:

```powershell
python scripts/update_profile.py
```

To reproduce the current cards without network access:

```powershell
python scripts/update_profile.py --snapshot assets/github-data.json
```

### What the numbers mean

| Visual | Source and calculation |
| :--- | :--- |
| Language mix | GitHub language bytes across owned public repositories, excluding forks, this profile repository, and repositories with `resume` in their name. Includes notebooks and markup. Shows the seven largest groups plus Other; percentages use largest-remainder rounding to total 100.0%. Tiny nonzero shares can round to 0.0%. |
| Activity | Last 365 days of the unauthenticated, publicly visible GitHub contribution calendar. Weekly totals and daily intensity come from that calendar. If the account shares anonymized private contribution counts, those public totals can also appear; no private repository details are requested. |
| Repository skyline | Up to 12 eligible repositories with detected code bytes. Height follows logarithmically scaled code size; color follows the largest detected language. This is an illustrative isometric chart, not a measure of quality or actual 3D geometry. |
| Profile views | Komarev's external badge counter. It approximates badge loads, not unique visitors; caching and repeat loads affect it. |

`assets/github-data.json` contains the public snapshot behind the cards. The generator validates calendar completeness and escapes text for SVG output. API outages, GitHub markup changes, disabled Actions, or repository write restrictions can prevent refreshes; check the workflow log if the displayed date becomes stale.

## Rebuild the static visuals

Only the optional GIF builder needs Pillow; the scheduled chart generator uses Python's standard library.

```powershell
python -m pip install Pillow==11.3.0
python scripts/build_visuals.py
```

This recreates the skill deck and 72-frame robotics GIF. The anime banner is a separately generated original asset; see [asset provenance](ASSETS.md).

Edit prose and project links in `README.md`, skill cards in `scripts/build_visuals.py`, and chart layouts in `scripts/update_profile.py`. The public profile intentionally omits employer, education, and contact information. The requested spoiler uses a closed `<details>` element: its contents remain public and can be expanded or read in the source.

## References

- [GitHub markup sanitization](https://github.com/github/markup#github-markup)
- [GitHub scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GitHub profile views counter](https://github.com/antonkomarev/github-profile-views-counter)
## Interactive 3D city

[Open the Repository District](https://shiwamshoryasharma.github.io/shiwamshoryasharma/).

The README links to a separate GitHub Pages application because README rendering does not execute JavaScript. The site uses a locally vendored Three.js 0.186.0 runtime; no CDN or third-party API is needed by visitors. The original MIT license is included in `city/vendor/THREE-LICENSE.txt`. The engine and controls are unmodified release files.

- Drag to rotate, scroll to zoom, and right-drag to pan. On touch screens, use one finger to orbit and two fingers to zoom/pan.
- Select a tower or directory entry to inspect detected code bytes, language shares, and its repository link.
- Use the toolbar for zoom, reset, automatic orbit, the teleport gate, and fullscreen. Focus the viewport to use arrow keys for rotation, Shift + arrows for pan, +/− for zoom, and Home to reset.
- Automatic orbit respects reduced-motion preferences. Drawing pauses in hidden tabs, pixel density is capped, and window geometry is instanced. Without a working 3D context, the repository directory and static skyline link remain available.
- Unlike the compact README skyline, the interactive grid includes all eligible repositories with detected code, expanding its rows and columns as the snapshot grows. Interactive heights combine logarithmic source-file counts and code bytes; commit counts do not determine height. Language selects the architectural family, while a stable repository-name seed varies orientation, setbacks, and windows.

The **Deploy repository city** workflow publishes changes to city files and redeploys after a successful **Refresh profile cards** run. The `workflow_run` trigger is deliberate: commits made by the default Actions token do not normally start another push workflow. Deployment stages `city/`, the public snapshot, and the explicitly allowlisted existing anime banner. Resume files and unrelated local assets are not published.

To test and preview locally from the repository root:

```powershell
node --test tests/*.test.mjs
python scripts/build_city.py
python -m http.server 8787 --bind 127.0.0.1 --directory .preview/site
```

Open `http://127.0.0.1:8787`. GitHub Pages must use **GitHub Actions** as its publishing source. The deployment uses only the repository's built-in token with Pages write permission and an OIDC token, with official actions pinned to commit SHAs.

### Driving mode

Use **Travel by horse cart** or **Travel to this repository**. W/A/S/D or arrows move and steer; Space brakes, R resets, C switches third-person/first-person cameras, and F opens a repository after stopping at a guild. Touch controls support the same actions. Escape returns to the town view. Inputs clear on blur and tab hiding.

Worn stone stops and hanging wooden guild signs identify public repositories. The cart and horse must fit the stopping area and stop before F opens the validated GitHub URL in another tab. Horse, shafts, cart, buildings, cottages and wall collisions are checked with a fixed 60 Hz simulation. This is flat-ground arcade movement, not realistic horse or vehicle physics.

`world-layout.js` sets three **fictional anonymous** private landmarks: one guarded royal castle, one mage tower and one tavern. They reveal no actual private count, names, languages, activity or existence. The expanded town has at least 64 blocks. Repository lots are scattered by a stable seeded shuffle among homes, parks and market cottages. The castle reserves four blocks; resident routes and vehicle collisions exclude its compound. The castle assignment is deterministic, and the planner supports any positive landmark count. No private GitHub API is called. Edit `PRIVATE_LANDMARK_COUNT` only to change decorative density.

`driving.js` owns movement and parking state; `horse-cart.js` renders the animated horse, reins, driver and spoked cart. `drive-scenery.js` creates hanging signs and stopping areas. `drive-ui.js` handles input, the map and camera controls. `settlement.js` adds private buildings, cottages, parks, the city wall and its portal. The royal compound includes a keep, galleries, corner towers, banners, crenellations, a gatehouse, gardens and fountain. `guards.js` adds armored guards that face approaching carts and show “No entry allowed.” Click a guard in the orbit view to see the same message. No speech recording, external voice service or permission prompt is used. `static-batching.js` instances static box details by material, preserving repository ray targets while excluding animated characters.

Click the wall portal, use **Find the gate → Enter the teleport gate**, or press E when travelling near it. The gate reveals an original isekai-style animated floating kingdom, with a castle, dragon, clouds, cottages and waterfalls. **Return to the town** or Escape restores the preceding view. It does not link to or embed a licensed anime episode.

`daylight.js` uses the visitor's device-local clock for smooth night/dawn/day/evening lighting. It refreshes while the world is visible; there is no manual theme toggle, location request, astronomical sunrise calculation or weather API. Device timezone and clock settings determine the result.

`landscape.js` recycles a bounded 7 × 7 pool of terrain chunks. Position wraps on a repeat interval aligned to those chunks, with fog hiding the seam and the following camera snapping coherently. Long roads, trees, grass, hills and clouds replace the old island edge. This is a finite repeating world, not infinite unique geography. Four city wall openings remain traversable.

Run `node --test tests/*.test.mjs` for motion, braking, collisions, parking, private-data exclusion, world wrapping, local-clock phases, resident behavior and repository layout. Local browser fixtures under ignored `.preview/` test night, parking and seam traversal without publishing debug controls.

### Architecture and source-file counts

The daily refresh counts source files from each public repository's default-branch Git tree. Recognized programming, notebook, markup, and stylesheet extensions count; vendored dependencies, build output, and minified files are excluded. Only the count is stored, never file paths. A truncated Git tree produces an unknown count, with a code-size-only height fallback. This is an extension-based measure, not an executable-script or quality assessment.

Python produces mage archives, notebooks astral observatories, TypeScript crystal citadels, JavaScript twin guild halls, HTML/CSS artisan quarters, and other languages forge keeps. Dominant language colors the facade; secondary languages accent it. Source files and code bytes affect height on logarithmic scales. The compact README skyline retains its separate code-bytes-only scale.

Window panes are offset from their actual wall surfaces, including side faces, to avoid z-fighting. Lit and unlit panes use separate instanced materials; daylight reduces the visible interior illumination. Roads are 6 world units wide, with separate raised pedestrian paths. Cart collision samples cover its body, shafts, horse and head.

Run source-count checks with `python -m unittest discover -s tests -p "test_*.py"`.

## Fantasy portfolio

The Pages homepage is a full public portfolio with selected project summaries, engineering skills, a CSS 3D identity artifact, interests, and verified GitHub, LinkedIn, and ORCID links. Its content is ordinary HTML and remains available without WebGL. It does not publish employers, education, contact details, location, resume files, or private repository metadata. The existing Vivy/Alice fan-art banner is reused in the interests section with attribution; no additional raster artwork was generated.

`city/portfolio.css` styles the responsive indigo/violet/ember theme. `portfolio.js` rotates the identity artifact on request; it does not run a continuous animation. The world loads its Three.js modules when approaching the viewport, and rendering stops when off screen or the document is hidden. Reduced-motion preference disables automatic orbit and resident movement; visitors may enable them explicitly.

`city/residents.js` routes up to 30 residents over connected pavement intersections. Deterministic destination selection sends them across town; they pause, look around, face nearby companions, turn gradually and yield to the moving cart. `characters.js` supplies six original anime-inspired adult archetypes with articulated limbs. Social gestures are ambient animation, not dialogue or AI-generated conversations. **Meet the locals** focuses residents and **Pause residents** stops their movement.

`realm.js` adds instanced cobblestones, raised footpaths, crossings and flowers. Public buildings preserve their repository language/source-file architecture and corrected roofs. Toon materials give the world stepped lighting. Entering travel or the hidden kingdom temporarily expands the world; returning restores the prior scroll position. Reduced-motion preference stops automatic orbit, NPC movement and the kingdom animation.

The page includes canonical, description, Open Graph, and social-card metadata. Build revisions invalidate first-party JavaScript and CSS together on each deployment. Keep the asset staging allowlist explicit; never copy the entire local `assets/` or resume directory into the site.

### Passing dragons

`dragon.js` shares one articulated model between the town and hidden kingdom. The town dragon makes a 32-second passage after 12 visible seconds, then stays away until the next 110-second cycle; successive flights reverse direction. Its flight stays above the tallest repository or castle. The simulation clock pauses off-screen, in hidden tabs and inside the portal destination. Reduced motion suppresses flyovers. The renderer reuses one model rather than spawning additional dragons.
