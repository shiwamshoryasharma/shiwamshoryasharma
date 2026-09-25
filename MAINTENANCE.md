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
- Use the toolbar for zoom, reset, automatic orbit, daylight, and fullscreen. Focus the viewport to use arrow keys for rotation, Shift + arrows for pan, +/− for zoom, and Home to reset.
- Automatic orbit respects reduced-motion preferences. Drawing pauses in hidden tabs, pixel density is capped, and window geometry is instanced. Without a working 3D context, the repository directory and static skyline link remain available.
- Unlike the compact README skyline, the interactive grid includes all eligible repositories with detected code, expanding its rows and columns as the snapshot grows. Interactive heights combine logarithmic source-file counts and code bytes; commit counts do not determine height. Language selects the architectural family, while a stable repository-name seed varies orientation, setbacks, and windows.

The **Deploy repository city** workflow publishes changes to city files and redeploys after a successful **Refresh profile cards** run. The `workflow_run` trigger is deliberate: commits made by the default Actions token do not normally start another push workflow. Deployment stages only the `city/` directory and the public snapshot; local files, profile artwork, and unrelated assets are not published as site files.

To test and preview locally from the repository root:

```powershell
node --test tests/*.test.mjs
python scripts/build_city.py
python -m http.server 8787 --bind 127.0.0.1 --directory .preview/site
```

Open `http://127.0.0.1:8787`. GitHub Pages must use **GitHub Actions** as its publishing source. The deployment uses only the repository's built-in token with Pages write permission and an OIDC token, with official actions pinned to commit SHAs.

### Driving mode

Use **Drive the city** to enter the cockpit, or **Drive to this repository** to mark the selected repository on the minimap. Drive with W/A/S/D or arrow keys; S/down reverses, Space brakes, R resets, and Escape returns to the skyline when not in fullscreen. On touch screens, hold the pedal and steering buttons. Controls clear on blur and when the page is hidden so the vehicle does not continue accelerating after a tab change.

Every public repository with a valid GitHub link has a mint parking bay. The car must be inside that bay and nearly stationary before F or **Open repository** opens its URL in a separate tab. That check is repeated at activation time. The gear display shows P only in a valid parking bay; stopping elsewhere shows N. Buildings, parked cars, restricted fences, and the island perimeter block movement. This is a flat-ground arcade driving model, not a realistic vehicle-physics simulation.

Two generic landmarks, **Royal Archive** and **Civic Authority**, represent inaccessible private work. They are fictional scenery with no repository URLs, parking bays, or entry interaction. They do not reveal the count, names, language statistics, or existence of any actual private repositories. The data generator still requests public repositories only, and the viewer additionally excludes entries marked private. No new token or private GitHub API access is used.

Driving logic and parking eligibility live in `city/driving.js`, separate from the Three.js renderer. The simulation runs at a fixed 60 Hz inside the existing capped render loop; the cockpit and minimap are driven by that plain state. `city/drive-scenery.js` creates the parking signs, restricted landmarks, and cockpit geometry; `city/drive-ui.js` handles input and the HUD.

Run all tests with `node --test tests/*.test.mjs`. They cover motion and braking, collisions and island bounds, frame-rate consistency, public parking eligibility, restricted access, private-data exclusion, and the growing city layout. Local browser checks also cover a public parking stop and F navigation, the restricted gate, and mobile layout. Local-only starting-position fixtures are kept under ignored `.preview/` and are never deployed.

### Architecture and source-file counts

The daily refresh counts source files from each public repository's default-branch Git tree. Recognized programming, notebook, markup, and stylesheet extensions count; vendored dependencies, build output, and minified files are excluded. Only the count is stored, never file paths. A truncated Git tree produces an unknown count, with a code-size-only height fallback. This is an extension-based measure, not an executable-script or quality assessment.

Python produces research terraces, notebooks observatory campuses, TypeScript crystal spires, JavaScript connected towers, HTML/CSS creative studios, and other languages engineering hubs. Dominant language colors the facade; secondary languages accent it. Source files and code bytes affect height on logarithmic scales. The compact README skyline retains its separate code-bytes-only scale.

Window panes are offset from their actual wall surfaces, including side faces, to avoid z-fighting. Lit and unlit panes use separate instanced materials; daylight reduces the visible interior illumination. The road width is 4.6 world units and the car collision diameter is 1.44 units. The curved bonnet has no road-like center stripe.

Run source-count checks with `python -m unittest discover -s tests -p "test_*.py"`.
