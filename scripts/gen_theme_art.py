"""Sample illustrations for the screen themes (original artwork, no characters).

Run: python scripts/gen_theme_art.py
Output: public/assets/themes/<theme>/*.svg   (1640x1000, one open spread)
"""
import math
import os
import random

W, H = 1640, 1000
ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'themes')

DEFS = '''<defs>
  <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="5" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.13 0"/>
  </filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="9" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
</defs>'''


def svg(body, bg):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'{DEFS}<rect width="{W}" height="{H}" fill="{bg}"/>{body}'
            f'<rect width="{W}" height="{H}" filter="url(#grain)"/></svg>')


def save(theme, name, content):
    d = os.path.join(ROOT, theme)
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, name)
    with open(p, 'w', encoding='utf8') as f:
        f.write(content)
    print(theme, name, os.path.getsize(p) // 1024, 'KB')


def rain(r, n=260, color='#c9c9cc', op=0.35, angle=-12):
    s = ''
    for _ in range(n):
        x, y = r.uniform(-100, W), r.uniform(-50, H)
        l = r.uniform(20, 60)
        dx = l * math.sin(math.radians(angle))
        s += f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x + dx:.0f}" y2="{y + l:.0f}" stroke="{color}" stroke-width="1.4" opacity="{op}"/>'
    return s


def crow(x, y, s, rot=0, flying=True):
    if flying:
        return (f'<path transform="translate({x},{y}) rotate({rot}) scale({s})" '
                'd="M-30 0 Q-15 -14 0 -2 Q15 -14 30 0 Q15 -6 3 4 L0 8 L-3 4 Q-15 -6 -30 0Z" fill="#141414"/>')
    return (f'<g transform="translate({x},{y}) scale({s})" fill="#141414">'
            '<ellipse cx="0" cy="0" rx="16" ry="10"/><circle cx="14" cy="-8" r="7"/>'
            '<path d="M20 -9 L30 -6 L20 -5Z"/><path d="M-14 2 L-30 10 L-12 7Z"/>'
            '<line x1="-2" y1="9" x2="-4" y2="18" stroke="#141414" stroke-width="2"/>'
            '<line x1="4" y1="9" x2="4" y2="18" stroke="#141414" stroke-width="2"/></g>')


def spire(x, base, w, h, color):
    return (f'<path d="M{x - w / 2},{base} L{x - w / 2},{base - h * 0.55} L{x},{base - h} '
            f'L{x + w / 2},{base - h * 0.55} L{x + w / 2},{base}Z" fill="{color}"/>')


# ----------------------------------------------------------------- Wednesday
def academy():
    r = random.Random(11)
    b = f'<rect width="{W}" height="{H}" fill="#9a9a9e"/>'
    for i in range(8):
        b += f'<rect y="{i * 70}" width="{W}" height="70" fill="#2a2a2e" opacity="{0.06 * (8 - i) / 8:.3f}"/>'
    b += '<ellipse cx="1250" cy="170" rx="110" ry="110" fill="#d9d9d6" opacity="0.5" filter="url(#soft)"/>'
    b += '<g filter="url(#rough)">'
    b += '<path d="M0 760 C300 700 700 740 1000 700 S1500 690 1640 720 L1640 1000 L0 1000Z" fill="#3a3a3e"/>'
    # academy silhouette
    base = 720
    b += f'<rect x="420" y="{base - 300}" width="800" height="300" fill="#222226"/>'
    for (x, w, h) in [(420, 120, 520), (620, 70, 420), (820, 150, 600), (1020, 70, 420), (1220, 120, 520), (500, 50, 380), (1140, 50, 380)]:
        b += spire(x, base, w, h, '#1b1b1f')
    for i in range(14):
        x = 450 + i * 54
        b += f'<path d="M{x},{base - 60} L{x},{base - 150} Q{x + 14},{base - 175} {x + 28},{base - 150} L{x + 28},{base - 60}Z" fill="#e8d9a0" opacity="{r.choice([0.15, 0.6, 0.85]):.2f}"/>'
    b += f'<circle cx="820" cy="{base - 390}" r="36" fill="#d9d6c8" opacity="0.8"/><path d="M820 {base - 390} L820 {base - 414} M820 {base - 390} L838 {base - 382}" stroke="#1b1b1f" stroke-width="4"/>'
    b += '</g>'
    # iron gate foreground
    for i in range(34):
        x = i * 50
        b += f'<line x1="{x}" y1="1000" x2="{x}" y2="820" stroke="#0f0f11" stroke-width="7"/><path d="M{x - 9} 830 L{x} 800 L{x + 9} 830Z" fill="#0f0f11"/>'
    b += '<rect y="850" width="1640" height="10" fill="#0f0f11"/><rect y="960" width="1640" height="10" fill="#0f0f11"/>'
    for (x, y, s, rot) in [(260, 220, 1.4, -8), (330, 260, 1.0, 6), (1420, 330, 1.2, -4), (1500, 290, 0.9, 10), (600, 150, 0.8, 4)]:
        b += crow(x, y, s, rot)
    b += crow(1320, 818, 1.5, flying=False)
    b += rain(r)
    return svg(b, '#9a9a9e')


def lake():
    r = random.Random(12)
    b = f'<rect width="{W}" height="560" fill="#b6b7b4"/>'
    b += '<rect y="420" width="1640" height="160" fill="#e7e7e3" opacity="0.5" filter="url(#soft)"/>'
    b += '<path d="M0 520 C300 470 600 500 900 480 S1400 470 1640 500 L1640 560 L0 560Z" fill="#6f7072"/>'
    b += f'<rect y="560" width="{W}" height="440" fill="#4d4e52"/>'
    for _ in range(50):
        y = r.uniform(580, 1000)
        b += f'<path d="M{r.uniform(0, W):.0f},{y:.0f} h{r.uniform(40, 160):.0f}" stroke="#7c7d80" stroke-width="2" opacity="0.5"/>'
    # dead trees

    def tree(x, base, h, s):
        t = f'<g stroke="#161618" fill="none" stroke-linecap="round" filter="url(#rough)">'
        t += f'<path d="M{x},{base} C{x - 6},{base - h * 0.4} {x + 8},{base - h * 0.7} {x},{base - h}" stroke-width="{14 * s:.1f}"/>'
        for k in range(7):
            yy = base - h * (0.35 + k * 0.09)
            d = 1 if k % 2 else -1
            L = h * (0.35 - k * 0.03)
            t += f'<path d="M{x},{yy:.0f} q{d * L * 0.4:.0f},{-L * 0.3:.0f} {d * L:.0f},{-L * 0.45:.0f}" stroke-width="{(6 - k * 0.6) * s:.1f}"/>'
            t += f'<path d="M{x + d * L * 0.6:.0f},{yy - L * 0.3:.0f} q{d * 20},{-30} {d * 34},{-34}" stroke-width="{2.4 * s:.1f}"/>'
        return t + '</g>'
    b += tree(260, 600, 460, 1.2) + tree(1380, 590, 400, 1.0) + tree(1500, 580, 300, 0.8)
    # reflection
    b += '<g opacity="0.25" transform="translate(0,1170) scale(1,-1)">' + tree(260, 600, 460, 1.2) + '</g>'
    # small figure with umbrella on a jetty (generic silhouette)
    b += '<rect x="700" y="610" width="360" height="12" fill="#1b1b1e"/>'
    for x in range(710, 1060, 50):
        b += f'<rect x="{x}" y="620" width="6" height="60" fill="#1b1b1e"/>'
    b += '<g fill="#101012"><path d="M930 520 q40 -44 80 0Z"/><line x1="970" y1="520" x2="970" y2="566" stroke="#101012" stroke-width="3"/>'
    b += '<path d="M955 560 L985 560 L992 612 L948 612Z"/><circle cx="970" cy="548" r="10"/></g>'
    for (x, y, s, rot) in [(560, 200, 1.1, 6), (620, 170, 0.8, -6), (1100, 250, 1.0, 3)]:
        b += crow(x, y, s, rot)
    b += crow(330, 300, 1.2, flying=False)
    b += '<path d="M150 980 q8 -40 30 -60" stroke="#161618" stroke-width="3" fill="none"/>'
    b += '<g transform="translate(182,918) rotate(20)"><path d="M0 0 q-14 -18 0 -30 q14 12 0 30Z" fill="#4a0f18"/><path d="M0 0 q14 -18 0 -30" fill="#6b1a24"/></g>'
    b += rain(r, 160, op=0.25)
    return svg(b, '#b6b7b4')


def window():
    r = random.Random(13)
    b = f'<rect width="{W}" height="{H}" fill="#2a2a2d"/>'
    for i in range(0, W, 60):
        b += f'<rect x="{i}" width="30" height="{H}" fill="#fff" opacity="0.025"/>'
    # arched window with a spider-web lattice
    cx, cy, R = 1060, 470, 330
    b += f'<path d="M{cx - R},{cy + 380} L{cx - R},{cy} A{R},{R} 0 0 1 {cx + R},{cy} L{cx + R},{cy + 380}Z" fill="#8d95a3"/>'
    b += f'<path d="M{cx - R},{cy + 380} L{cx - R},{cy} A{R},{R} 0 0 1 {cx + R},{cy} L{cx + R},{cy + 380}Z" fill="#c7ccd4" opacity="0.35" filter="url(#soft)"/>'
    web = f'<g stroke="#18181b" stroke-width="7" fill="none">'
    hub = (cx, cy + 40)
    for k in range(12):
        a = math.pi * (k / 11)
        web += f'<line x1="{hub[0]}" y1="{hub[1]}" x2="{hub[0] + math.cos(a + math.pi) * 520:.0f}" y2="{hub[1] + math.sin(a + math.pi) * 520:.0f}"/>'
    for ring in range(1, 7):
        rr = ring * 70
        pts = []
        for k in range(12):
            a = math.pi + math.pi * (k / 11)
            pts.append(f'{hub[0] + math.cos(a) * rr:.0f},{hub[1] + math.sin(a) * rr * 0.98:.0f}')
        web += '<polyline points="' + ' '.join(pts) + '"/>'
    web += f'<line x1="{cx - R}" y1="{cy + 40}" x2="{cx + R}" y2="{cy + 40}"/><line x1="{cx}" y1="{cy + 40}" x2="{cx}" y2="{cy + 380}"/></g>'
    b += f'<clipPath id="win"><path d="M{cx - R},{cy + 380} L{cx - R},{cy} A{R},{R} 0 0 1 {cx + R},{cy} L{cx + R},{cy + 380}Z"/></clipPath>'
    b += f'<g clip-path="url(#win)">{web}{rain(r, 120, "#e3e6ea", 0.35)}</g>'
    b += f'<path d="M{cx - R - 20},{cy + 400} L{cx - R - 20},{cy} A{R + 20},{R + 20} 0 0 1 {cx + R + 20},{cy} L{cx + R + 20},{cy + 400}" stroke="#141416" stroke-width="30" fill="none"/>'
    # floor + window sill
    b += f'<rect y="870" width="{W}" height="130" fill="#1a1a1c"/><rect x="{cx - R - 60}" y="850" width="{2 * R + 120}" height="30" fill="#141416"/>'
    # cello silhouette
    b += '<g transform="translate(420,300)" fill="#1d1414">'
    b += '<path d="M60 250 C-20 250 -30 360 30 400 C-40 440 -40 580 90 590 C220 580 220 440 150 400 C210 360 200 250 120 250Z"/>'
    b += '<rect x="82" y="-120" width="16" height="380" fill="#120c0c"/><path d="M78 -150 q12 -30 24 0 q6 20 -6 30 h-12 q-12 -10 -6 -30Z"/>'
    b += '<path d="M60 380 q0 -18 10 -30 M120 380 q0 -18 -10 -30" stroke="#3a2a2a" stroke-width="5" fill="none"/>'
    b += '<rect x="88" y="600" width="4" height="80" fill="#120c0c"/></g>'
    b += '<line x1="330" y1="330" x2="700" y2="840" stroke="#2b2020" stroke-width="5"/>'
    # candelabra
    b += '<g transform="translate(230,560)" fill="#161616">'
    b += '<rect x="-8" y="0" width="16" height="300"/><path d="M-60 300 h120 l-20 -20 h-80Z"/>'
    b += '<path d="M0 60 C-80 60 -100 20 -100 -20 M0 60 C80 60 100 20 100 -20" stroke="#161616" stroke-width="10" fill="none"/>'
    for x in (-100, 0, 100):
        b += f'<rect x="{x - 9}" y="-100" width="18" height="{90 if x else 40}" fill="#ece7da" transform="translate(0,{0 if x else -40})"/>'
        b += f'<ellipse cx="{x}" cy="{-116 if x else -156}" rx="7" ry="14" fill="#f3c65a" filter="url(#glow)"/>'
    b += '</g>'
    b += '<rect x="0" y="0" width="1640" height="1000" fill="url(#vig)"/><radialGradient id="vig"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>'
    return svg(b, '#2a2a2d')


# ----------------------------------------------------------------- Stranger Things
BULBS = ['#ff3b30', '#ffcc00', '#34c759', '#0a84ff', '#ff9500', '#bf5af2', '#ff2d55']


def lights_wall():
    r = random.Random(21)
    b = f'<rect width="{W}" height="{H}" fill="#e8d7b0"/>'
    # 80s floral wallpaper
    for y in range(0, H, 90):
        for x in range(0 if (y // 90) % 2 else 45, W, 90):
            b += f'<g transform="translate({x},{y})" opacity="0.55"><circle r="10" fill="#c98d6a"/>'
            for k in range(5):
                a = k * 72
                b += f'<ellipse cx="0" cy="-15" rx="7" ry="12" fill="#d9a07c" transform="rotate({a})"/>'
            b += '<path d="M-24 18 q12 -10 24 0" stroke="#8aa06f" stroke-width="4" fill="none"/></g>'
    b += f'<rect width="{W}" height="{H}" fill="#3a2a1a" opacity="0.18"/>'
    # painted letters, 3 rows
    rows = ['ABCDEFGH', 'IJKLMNOPQ', 'RSTUVWXYZ']
    for ri, row in enumerate(rows):
        y = 380 + ri * 190
        n = len(row)
        for i, ch in enumerate(row):
            x = 170 + i * (1300 / (n - 1)) + r.uniform(-12, 12)
            b += (f'<text x="{x:.0f}" y="{y + r.uniform(-8, 8):.0f}" text-anchor="middle" font-family="Georgia, serif" '
                  f'font-weight="700" font-size="{92 + r.uniform(-8, 10):.0f}" fill="#141210" opacity="0.88" '
                  f'transform="rotate({r.uniform(-6, 6):.1f} {x:.0f} {y})">{ch}</text>')
            # bulb above each letter on a sagging wire
            by = y - 120 + math.sin(i / (n - 1) * math.pi) * 22
            col = BULBS[(i + ri * 3) % len(BULBS)]
            lit = r.random() > 0.35
            glow = 'filter="url(#glow)"' if lit else ''
            b += (f'<g transform="translate({x:.0f},{by:.0f}) rotate({r.uniform(-20, 20):.0f})">'
                  f'<rect x="-5" y="-10" width="10" height="9" fill="#2c3a2c"/>'
                  f'<ellipse cx="0" cy="8" rx="9" ry="14" fill="{col}" {glow} opacity="{1 if lit else 0.55}"/></g>')
        # wire
        pts = ' '.join(f'{170 + i * (1300 / (n - 1)):.0f},{y - 132 + math.sin(i / (n - 1) * math.pi) * 22:.0f}' for i in range(n))
        b += f'<polyline points="{pts}" stroke="#1d2a1d" stroke-width="3" fill="none"/>'
    # armchair + lamp silhouettes at the bottom
    b += '<path d="M60 1000 L60 860 Q60 800 120 800 L300 800 Q360 800 360 860 L360 1000Z" fill="#5a3b2a"/>'
    b += '<rect x="1440" y="700" width="16" height="300" fill="#3a2a1a"/><path d="M1390 700 L1506 700 L1480 620 L1416 620Z" fill="#e2b56c" opacity="0.85"/>'
    b += '<ellipse cx="1448" cy="720" rx="160" ry="60" fill="#ffd27a" opacity="0.18" filter="url(#soft)"/>'
    return svg(b, '#e8d7b0')


def forest_road():
    r = random.Random(22)
    b = f'<rect width="{W}" height="{H}" fill="#10131c"/>'
    b += '<ellipse cx="820" cy="120" rx="900" ry="240" fill="#7a1a1a" opacity="0.45" filter="url(#soft)"/>'
    # pine silhouettes, two depths
    for layer, col, n in [(0, '#161c26', 30), (1, '#0b0e14', 22)]:
        for i in range(n):
            x = r.uniform(-60, W + 60)
            if 600 < x < 1060 and layer == 1:
                continue
            base = 720 + layer * 90
            h = r.uniform(420, 700)
            w = r.uniform(120, 190) * (1 + layer * 0.3)
            pts = []
            tiers = 6
            for t in range(tiers):
                yy = base - h * t / tiers
                ww = w * (1 - t / tiers) * 0.5
                pts.append((x - ww, yy))
                pts.append((x - ww * 0.45, yy - h / tiers * 0.35))
            pts.append((x, base - h))
            right = [(2 * x - px, py) for (px, py) in reversed(pts[:-1])]
            poly = ' '.join(f'{px:.0f},{py:.0f}' for px, py in pts + right)
            b += f'<polygon points="{poly}" fill="{col}"/><rect x="{x - 5:.0f}" y="{base:.0f}" width="10" height="400" fill="{col}"/>'
    # road
    b += '<path d="M560 1000 L780 620 L860 620 L1100 1000Z" fill="#24262b"/>'
    b += '<path d="M818 640 L814 700 M812 740 L806 820 M802 870 L794 960" stroke="#c9b25a" stroke-width="5" stroke-dasharray="1 0" opacity="0.6"/>'
    # flashlight beams
    for (x, y, a) in [(620, 900, -18), (880, 930, -8), (1120, 910, 6)]:
        b += (f'<path d="M{x},{y} L{x + 900 * math.sin(math.radians(a)) - 160:.0f},{y - 900:.0f} '
              f'L{x + 900 * math.sin(math.radians(a)) + 160:.0f},{y - 900:.0f}Z" fill="#fff4c2" opacity="0.10"/>')

    # bikes
    def bike(x, y, s):
        g = f'<g transform="translate({x},{y}) scale({s})" stroke="#050608" stroke-width="7" fill="none">'
        g += '<circle cx="-60" cy="0" r="46"/><circle cx="70" cy="0" r="46"/>'
        g += '<path d="M-60 0 L-10 -60 L50 -60 L70 0 M-10 -60 L10 0 L-60 0 M50 -60 L60 -90 M40 -92 L78 -88"/>'
        g += '<rect x="44" y="-128" width="46" height="30" fill="#050608"/></g>'
        return g
    b += bike(620, 930, 1.0) + bike(880, 960, 1.1) + bike(1130, 935, 0.95)
    # spores
    for _ in range(90):
        b += f'<circle cx="{r.uniform(0, W):.0f}" cy="{r.uniform(0, H):.0f}" r="{r.uniform(1.2, 3.6):.1f}" fill="#d8d0c0" opacity="{r.uniform(0.15, 0.55):.2f}"/>'
    # red lightning
    x, y = 1320, 40
    path = f'M{x},{y}'
    for _ in range(9):
        x += r.uniform(-50, 40)
        y += r.uniform(30, 55)
        path += f' L{x:.0f},{y:.0f}'
    b += f'<path d="{path}" stroke="#ff2b2b" stroke-width="5" fill="none" filter="url(#glow)" opacity="0.85"/>'
    return svg(b, '#10131c')


def arcade():
    r = random.Random(23)
    b = f'<rect width="{W}" height="{H}" fill="#14082a"/>'
    # checkered floor
    for i in range(-10, 30):
        for j in range(0, 8):
            if (i + j) % 2:
                y0 = 700 + j * 40
                x0 = 820 + (i - 10) * (60 + j * 22)
                b += f'<rect x="{x0:.0f}" y="{y0}" width="{60 + j * 22}" height="40" fill="#f2eee6" opacity="0.8"/>'
    b += '<rect y="690" width="1640" height="12" fill="#ff3fa4" filter="url(#glow)"/>'
    # neon shapes
    b += '<rect x="560" y="110" width="520" height="150" rx="30" fill="none" stroke="#34e0ff" stroke-width="9" filter="url(#glow)"/>'
    b += '<text x="820" y="215" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="96" fill="none" stroke="#ff3fa4" stroke-width="5" filter="url(#glow)">Arcade</text>'
    b += '<path d="M180 160 l40 -60 l-10 40 l40 0 l-50 70 l12 -50Z" fill="none" stroke="#ffe34f" stroke-width="7" filter="url(#glow)"/>'
    b += '<circle cx="1420" cy="170" r="70" fill="none" stroke="#7cff7a" stroke-width="8" filter="url(#glow)"/><path d="M1420 170 L1480 130 A70 70 0 0 1 1480 210Z" fill="#14082a"/>'
    # arcade cabinets
    for k, x in enumerate([120, 380, 1080, 1340]):
        col = ['#ff3fa4', '#34e0ff', '#ffe34f', '#7cff7a'][k]
        b += f'<g transform="translate({x},330)"><path d="M0 390 L0 60 L40 0 L200 0 L200 390Z" fill="#0b0618"/>'
        b += f'<rect x="30" y="80" width="140" height="110" fill="{col}" opacity="0.8" filter="url(#glow)"/>'
        b += f'<rect x="40" y="90" width="120" height="90" fill="#12081f"/>'
        for _ in range(6):
            b += f'<rect x="{r.uniform(50, 140):.0f}" y="{r.uniform(100, 165):.0f}" width="8" height="8" fill="{col}"/>'
        b += f'<rect x="20" y="220" width="160" height="40" fill="#241640"/><circle cx="70" cy="240" r="9" fill="#ff3b30"/><circle cx="130" cy="240" r="9" fill="#0a84ff"/>'
        b += f'<rect x="0" y="0" width="200" height="30" fill="{col}" opacity="0.9"/></g>'
    return svg(b, '#14082a')


def upside_down():
    r = random.Random(24)
    b = f'<rect width="{W}" height="{H}" fill="#1a1216"/>'
    b += '<ellipse cx="820" cy="300" rx="900" ry="360" fill="#6d1414" opacity="0.5" filter="url(#soft)"/>'
    # small town rooftops silhouette
    x = 0
    while x < W:
        w = r.uniform(120, 220)
        h = r.uniform(120, 240)
        b += f'<path d="M{x:.0f},900 L{x:.0f},{900 - h:.0f} L{x + w / 2:.0f},{900 - h - 70:.0f} L{x + w:.0f},{900 - h:.0f} L{x + w:.0f},900Z" fill="#0d0a0c"/>'
        x += w + r.uniform(10, 60)
    b += f'<rect y="900" width="{W}" height="100" fill="#0d0a0c"/>'
    # vines
    for _ in range(18):
        x0 = r.uniform(0, W)
        p = f'M{x0:.0f},1000'
        y = 1000
        for _ in range(6):
            x0 += r.uniform(-40, 40)
            y -= r.uniform(30, 70)
            p += f' Q{x0 + r.uniform(-30, 30):.0f},{y + 20:.0f} {x0:.0f},{y:.0f}'
        b += f'<path d="{p}" stroke="#2a1618" stroke-width="{r.uniform(4, 10):.0f}" fill="none"/>'
    # lightning
    for (x, y) in [(300, 0), (1250, 0)]:
        path = f'M{x},{y}'
        for _ in range(10):
            x += r.uniform(-50, 50)
            y += r.uniform(30, 50)
            path += f' L{x:.0f},{y:.0f}'
        b += f'<path d="{path}" stroke="#ff3a2a" stroke-width="4" fill="none" filter="url(#glow)"/>'
    for _ in range(160):
        b += f'<circle cx="{r.uniform(0, W):.0f}" cy="{r.uniform(0, H):.0f}" r="{r.uniform(1, 4):.1f}" fill="#e8dccf" opacity="{r.uniform(0.15, 0.6):.2f}"/>'
    return svg(b, '#1a1216')


if __name__ == '__main__':
    save('wednesday', 'academy.svg', academy())
    save('wednesday', 'lake.svg', lake())
    save('wednesday', 'window.svg', window())
    save('stranger', 'lights.svg', lights_wall())
    save('stranger', 'forest.svg', forest_road())
    save('stranger', 'arcade.svg', arcade())
    save('stranger', 'upside.svg', upside_down())
