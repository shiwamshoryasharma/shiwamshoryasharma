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
