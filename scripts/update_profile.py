"""Render profile cards from public GitHub data. Standard library only."""
from __future__ import annotations
import argparse
import datetime as dt
import html
import json
import math
import re
import subprocess
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
USER = 'shiwamshoryasharma'
BG, PANEL, LINE, FG, MUTED = '#0d111c', '#171e2e', '#29354c', '#edf2ff', '#a2b0ca'
MINT, LILAC, BLUE = '#9cf3cd', '#c6b6ff', '#91cfff'


def gh_json(args):
    run = subprocess.run(['gh', 'api', *args], capture_output=True, text=True, encoding='utf-8')
    if run.returncode:
        raise RuntimeError('GitHub API failed; existing generated cards preserved.')
    value = json.loads(run.stdout)
    if isinstance(value, dict) and value.get('errors'):
        raise RuntimeError('GraphQL returned errors; refusing incomplete statistics.')
    return value


def repositories():
    items, cursor = [], None
    while True:
        after = ', after:' + json.dumps(cursor) if cursor else ''
        query = '''query { user(login:"%s") { repositories(first:100, privacy:PUBLIC,
            ownerAffiliations:OWNER, isFork:false%s) { nodes { name url
            languages(first:100,orderBy:{field:SIZE,direction:DESC}) {
            totalCount edges { size node { name color } } } }
            pageInfo { hasNextPage endCursor } } } }''' % (USER, after)
        response = gh_json(['graphql', '-f', 'query=' + query])['data']['user']['repositories']
        for repo in response['nodes']:
            if repo['name'].lower() == USER or 'resume' in repo['name'].lower():
                continue
            edges = repo['languages']['edges']
            if repo['languages']['totalCount'] > len(edges):
                complete = gh_json([f'repos/{USER}/{repo["name"]}/languages'])
                colors = {e['node']['name']: e['node']['color'] for e in edges}
                edges = [{'size': n, 'node': {'name': k, 'color': colors.get(k)}} for k, n in complete.items()]
            counts = {e['node']['name']: e['size'] for e in edges}
            items.append({'name': repo['name'], 'url': repo['url'], 'languages': counts,
                          'colors': {e['node']['name']: e['node']['color'] for e in edges},
                          'bytes': sum(counts.values())})
        if not response['pageInfo']['hasNextPage']:
            break
        cursor = response['pageInfo']['endCursor']
    if not items or not any(r['bytes'] for r in items):
        raise RuntimeError('No public language data returned; refusing an empty replacement.')
    return sorted(items, key=lambda r: (-r['bytes'], r['name']))


class PublicCalendar(HTMLParser):
    """Read the unauthenticated public calendar, never private account activity."""
    def __init__(self):
        super().__init__()
        self.days, self.tip, self.text = {}, None, []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'data-date' in attrs and 'data-level' in attrs:
            self.days[attrs['id']] = {'date': attrs['data-date'], 'level': int(attrs['data-level'])}
        if tag == 'tool-tip' and attrs.get('for') in self.days:
            self.tip, self.text = attrs['for'], []

    def handle_data(self, data):
        if self.tip:
            self.text.append(data)

    def handle_endtag(self, tag):
        if tag == 'tool-tip' and self.tip:
            match = re.search(r'\b(No|[\d,]+) contributions?\b', ''.join(self.text), re.I)
            if match:
                raw = match.group(1)
                self.days[self.tip]['count'] = 0 if raw.lower() == 'no' else int(raw.replace(',', ''))
            self.tip = None


def calendar(today):
    url = f'https://github.com/users/{USER}/contributions'
    request = Request(url, headers={'User-Agent': 'GitHub-Profile-Cards', 'Accept-Language': 'en-US'})
    with urlopen(request, timeout=45) as response:
        parser = PublicCalendar()
        parser.feed(response.read().decode('utf-8'))
    start = today - dt.timedelta(days=364)
    days = sorted([d for d in parser.days.values() if start.isoformat() <= d['date'] <= today.isoformat()], key=lambda d: d['date'])
    if len(days) != 365 or any('count' not in d for d in days):
        raise RuntimeError('Public calendar markup changed or is incomplete; previous cards retained.')
    if len({d['date'] for d in days}) != 365:
        raise RuntimeError('Duplicate calendar dates.')
    return days


def text(x, y, value, size=16, color=FG, weight=400, anchor='start'):
    return f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{html.escape(str(value))}</text>'


def rect(x, y, w, h, fill=PANEL, radius=20, stroke='none'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>'


def svg(height, title, desc, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="{height}" viewBox="0 0 1120 {height}" role="img" aria-labelledby="title desc">'
            f'<title id="title">{html.escape(title)}</title><desc id="desc">{html.escape(desc)}</desc>'
            f'<g font-family="Segoe UI, Inter, Arial, sans-serif">{rect(0,0,1120,height,BG,32)}{body}</g></svg>\n')


def languages_card(repos, updated):
    counts, colors = Counter(), {}
    for repo in repos:
        counts.update(repo['languages'])
        colors.update(repo['colors'])
    total = sum(counts.values())
    ordered = counts.most_common()
    top = ordered[:7]
    if len(ordered) > 7:
        top.append(('Other', sum(n for _, n in ordered[7:])))
    units = [int(n * 1000 // total) for _, n in top]
    remaining = 1000 - sum(units)
    priority = sorted(range(len(top)), key=lambda i: (top[i][1]*1000/total - units[i]), reverse=True)
    for i in priority[:remaining]:
        units[i] += 1
    body = text(36, 48, 'LANGUAGE MIX', 13, MINT, 700) + text(36, 88, 'What the repositories are made of', 28, FG, 650)
    body += text(36, 117, 'Public code bytes, aggregated across original repositories.', 16, MUTED)
    x = 36
    for name, n in top:
        width = 1048 * n / total
        body += rect(round(x, 2), 151, round(width, 2), 22, colors.get(name) or LILAC, 0)
        x += width
    for i, ((name, _), percentage) in enumerate(zip(top, units)):
        x, y = 36 + (i % 2) * 552, 218 + (i // 2)*48
        body += rect(x, y-12, 12, 12, colors.get(name) or LILAC, 4)
        body += text(x+24, y, name, 18) + text(x+480, y, f'{percentage/10:.1f}%', 18, MINT, 600, 'end')
    height = 252 + math.ceil(len(top)/2)*48
    body += text(36, height-28, f'Excludes forks, profile and resume repositories. Includes markup/notebooks. Updated {updated}.', 13, MUTED)
    data = [{'language': name, 'bytes': n, 'percent': u/10} for (name, n), u in zip(top, units)]
    return svg(height, 'Overall repository language mix', 'Shares of GitHub-reported code bytes, not skill ratings.', body), data


def activity_card(days, updated):
    count = sum(d['count'] for d in days)
    active = sum(d['count'] > 0 for d in days)
    body = text(36, 46, 'ACTIVITY / LAST 365 DAYS', 13, MINT, 700)
    body += text(36, 88, 'A year of building', 30, FG, 650)
    body += text(1084, 57, f'{count:,}', 32, LILAC, 700, 'end') + text(1084, 82, f'visible contributions · {active} active days', 14, MUTED, 400, 'end')
    first = dt.date.fromisoformat(days[0]['date'])
    sunday = first - dt.timedelta(days=(first.weekday()+1)%7)
    weekly = Counter()
    for day in days:
        date = dt.date.fromisoformat(day['date'])
        weekly[(date-sunday).days//7] += day['count']
    columns = max(weekly)+1
    step = 1000 / columns
    maximum = max(1, max(weekly.values()))
    points = ' '.join(f'{60+(w+.5)*step:.1f},{162-48*weekly[w]/maximum:.1f}' for w in range(columns))
    body += f'<polyline points="{points}" fill="none" stroke="{LILAC}" stroke-width="3" stroke-linejoin="round"/>'
    body += text(60, 184, 'Weekly contributions', 12, MUTED)
    palette = ['#1c2937', '#285849', '#398766', '#66c59c', MINT]
    labelled = set()
    for day in days:
        date = dt.date.fromisoformat(day['date'])
        offset = (date-sunday).days
        x, y = 60+(offset//7)*step, 222+(offset%7)*18
        label = f'{date.isoformat()}: {day["count"]} contributions'
        body += f'<g><title>{label}</title>{rect(round(x,2),y,round(step-4,2),14,palette[day["level"]],3)}</g>'
        month = (date.year, date.month)
        if date.day <= 7 and month not in labelled:
            body += text(round(x,2), 210, date.strftime('%b'), 12, MUTED)
            labelled.add(month)
    body += text(36, 378, f'{days[0]["date"]} — {days[-1]["date"]} · public GitHub calendar · updated {updated}', 13, MUTED)
    for i, color in enumerate(palette):
        body += rect(934+i*24, 363, 15, 15, color, 3)
    return svg(402, 'Public GitHub activity', f'{count} contributions on {active} active days over the last 365 days.', body)


def shade(color, factor):
    color = color.lstrip('#')
    return '#' + ''.join(f'{min(255, int(int(color[i:i+2],16)*factor)):02x}' for i in (0,2,4))


def city_card(repos, updated):
    selected = [r for r in repos if r['bytes']][:12]
    body = text(36, 48, 'REPOSITORY DISTRICT / 3D', 13, MINT, 700)
    body += text(36, 87, 'Every build has a place.', 30, FG, 650)
    body += text(36, 117, 'A skyline of my largest public code repositories.', 16, MUTED)
    origin_x, origin_y = 315, 326
    for row in range(3):
        for col in range(4):
            cx, cy = origin_x+(col-row)*86, origin_y+(col+row)*33
            body += f'<path d="M {cx} {cy-30} l 78 30 l -78 30 l -78 -30 Z" fill="#162335" stroke="#304359"/>'
    entries = []
    largest = math.log1p(selected[0]['bytes']/1000)
    for index, repo in enumerate(selected):
        row, col = divmod(index, 4)
        entries.append((row+col, index, row, col, repo))
    for _, index, row, col, repo in sorted(entries):
        cx, cy = origin_x+(col-row)*86, origin_y+(col+row)*33
        height = 26+145*math.log1p(repo['bytes']/1000)/largest
        language = max(repo['languages'], key=repo['languages'].get)
        color = repo['colors'].get(language) or LILAC
        y = round(cy-height, 1)
        body += f'<g><title>{html.escape(repo["name"])}: {repo["bytes"]:,} code bytes; {html.escape(language)}</title>'
        body += f'<path d="M {cx-29} {y} L {cx} {y+14} L {cx} {cy+14} L {cx-29} {cy} Z" fill="{shade(color,.62)}"/>'
        body += f'<path d="M {cx} {y+14} L {cx+29} {y} L {cx+29} {cy} L {cx} {cy+14} Z" fill="{shade(color,.86)}"/>'
        body += f'<path d="M {cx} {y-14} L {cx+29} {y} L {cx} {y+14} L {cx-29} {y} Z" fill="{color}"/>'
        for floor in range(1, max(2,int(height/16))):
            yy = cy-floor*16
            for shift in (8,18):
                body += f'<path d="M {cx+shift} {yy+10-shift*.48} l 5 -2.4 l 0 5 l -5 2.4 Z" fill="{MINT}" opacity=".55"/>'
        body += text(cx, y-22, f'{index+1:02}', 13, FG, 700, 'middle')+'</g>'
    body += rect(716, 153, 368, 392, PANEL, 24)
    for i, repo in enumerate(selected):
        language = max(repo['languages'], key=repo['languages'].get)
        color = repo['colors'].get(language) or LILAC
        y = 184+i*29
        label = repo['name'] if len(repo['name']) <= 30 else repo['name'][:27]+'…'
        body += text(736,y,f'{i+1:02}',13,color,700)+text(771,y,label,13,FG)
    body += text(36, 581, 'Height = log-scaled code bytes · color = main language · a data view, not a ranking of quality.', 13, MUTED)
    body += text(36, 608, f'Public originals only; forks, profile and resume repositories excluded. Updated {updated}.', 13, MUTED)
    return svg(632, '3D repository skyline', 'Each building represents a public repository; height follows code size.', body)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--snapshot', type=Path, help='Render an existing public snapshot without network access.')
    args = parser.parse_args()
    if args.snapshot:
        data = json.loads(args.snapshot.read_text(encoding='utf-8'))
        repos, days, updated = data['repositories'], data['days'], data['updated']
    else:
        updated = dt.datetime.now(dt.timezone.utc).date().isoformat()
        repos = repositories()
        days = calendar(dt.date.fromisoformat(updated))
    language_svg, mix = languages_card(repos, updated)
    outputs = {'languages.svg': language_svg, 'activity.svg': activity_card(days,updated),
               'repo-city.svg': city_card(repos,updated)}
    data = {'updated': updated, 'scope': 'public originals; excludes forks, profile and resume repositories',
            'repositories': repos, 'days': days, 'language_mix': mix}
    outputs['github-data.json'] = json.dumps(data, ensure_ascii=False, indent=2)+'\n'
    destination = ROOT/'assets'
    destination.mkdir(exist_ok=True)
    for name, content in outputs.items():
        temporary = destination/(name+'.tmp')
        temporary.write_text(content,encoding='utf-8')
        temporary.replace(destination/name)
    print(f'Updated {len(repos)} public repositories, {len(days)} calendar days, and {len(mix)} language groups.')


if __name__ == '__main__':
    main()
