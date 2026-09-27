"""Sample illustrations for the second batch of themes (original artwork, no characters).

Run: python scripts/gen_theme_art2.py
"""
import math
import random

from gen_theme_art import DEFS, H, W, save, svg

WC_DEFS = """<filter id="wc" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="4" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="38" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="3"/>
</filter>
<filter id="paperTex"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="2"/>
  <feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 0.12 0"/></filter>"""


def wc_svg(body, bg='#f8f5ef'):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'{DEFS.replace("</defs>", WC_DEFS + "</defs>")}<rect width="{W}" height="{H}" fill="{bg}"/>{body}'
            f'<rect width="{W}" height="{H}" filter="url(#paperTex)"/></svg>')


def wash(x, y, rx, ry, color, op=0.55):
    return f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rx:.0f}" ry="{ry:.0f}" fill="{color}" opacity="{op}" filter="url(#wc)"/>'


def stars(r, n, y0=0, y1=H, color='#f8f2dc'):
    return ''.join(
        f'<circle cx="{r.uniform(0, W):.0f}" cy="{r.uniform(y0, y1):.0f}" r="{r.uniform(0.6, 2.6):.1f}" fill="{color}" opacity="{r.uniform(0.35, 1):.2f}"/>'
        for _ in range(n))


# ----------------------------------------------------------------- watercolour diary
def wc_flowers():
    r = random.Random(31)
    b = wash(820, 180, 900, 260, '#a9c7de', 0.5) + wash(400, 120, 300, 90, '#c9dcea', 0.6)
    b += wash(820, 640, 1000, 360, '#b8d39a', 0.55) + wash(300, 760, 500, 200, '#9cc27d', 0.45)
    for _ in range(140):
        c = r.choice(['#e98aa0', '#f2b5c4', '#f5d06f', '#b99ad8', '#ffffff', '#f19a7a'])
        b += wash(r.uniform(40, W - 40), r.uniform(520, 960), r.uniform(10, 26), r.uniform(8, 18), c, 0.8)
    for _ in range(60):
        x, y = r.uniform(40, W - 40), r.uniform(560, 980)
        b += f'<path d="M{x:.0f},{y:.0f} q{r.uniform(-6, 6):.0f},-30 {r.uniform(-8, 8):.0f},-60" stroke="#6f9a52" stroke-width="3" fill="none" opacity="0.5"/>'
    b += '<path d="M180 470 q300 -40 600 -10 q300 30 700 -20" stroke="#7aa0b8" stroke-width="3" fill="none" opacity="0.4"/>'
    return wc_svg(b)


def wc_cafe():
    r = random.Random(32)
    b = wash(820, 300, 1000, 330, '#9ecbe0', 0.55) + wash(820, 760, 1000, 260, '#6fa6c4', 0.5)
    b += '<g filter="url(#wc)" opacity="0.85">'
    b += '<rect x="220" y="300" width="520" height="440" fill="#f3e3cf"/><path d="M190 300 L470 170 L770 300Z" fill="#d77a5e"/>'
    b += '<rect x="300" y="420" width="120" height="150" fill="#9fc3d9"/><rect x="520" y="440" width="120" height="300" fill="#a36d4f"/></g>'
    b += '<g filter="url(#wc)">'
    for i in range(6):
        b += f'<path d="M{240 + i * 84},330 l42 0 l-6 40 l-30 0z" fill="{["#e56e6e", "#fff"][i % 2]}" opacity="0.8"/>'
    b += '</g>'
    b += wash(1200, 560, 180, 60, '#ffffff', 0.7) + wash(1320, 520, 120, 40, '#ffffff', 0.6)
    b += '<path d="M1100 700 l260 0 M1180 700 l0 -120 l100 -20" stroke="#6b5140" stroke-width="5" fill="none" opacity="0.6"/>'
    for _ in range(30):
        b += wash(r.uniform(900, 1600), r.uniform(800, 960), 30, 6, '#ffffff', 0.5)
    return wc_svg(b)


def wc_tea():
    r = random.Random(33)
    b = wash(820, 500, 1100, 520, '#f1e2d0', 0.6)
    b += '<g filter="url(#wc)">'
    b += '<ellipse cx="560" cy="560" rx="260" ry="90" fill="#ffffff" opacity="0.9"/><ellipse cx="560" cy="540" rx="170" ry="60" fill="#c98a5a" opacity="0.8"/>'
    b += '<path d="M390 530 q0 150 170 160 q170 -10 170 -160" fill="#f3f0ea" opacity="0.95"/>'
    b += '<path d="M730 560 q70 0 60 50 q-10 40 -70 30" stroke="#e8e2d6" stroke-width="18" fill="none"/></g>'
    for (x, y, c) in [(1120, 380, '#e98aa0'), (1260, 520, '#b99ad8'), (1080, 640, '#f5d06f'), (1320, 300, '#e98aa0')]:
        for k in range(5):
            a = k * 72 + r.uniform(-8, 8)
            px, py = x + math.cos(math.radians(a)) * 34, y + math.sin(math.radians(a)) * 34
            b += f'<ellipse cx="{px:.0f}" cy="{py:.0f}" rx="30" ry="18" transform="rotate({a:.0f} {px:.0f} {py:.0f})" fill="{c}" opacity="0.6" filter="url(#wc)"/>'
        b += f'<circle cx="{x}" cy="{y}" r="10" fill="#e8b43c" opacity="0.8"/>'
        b += f'<path d="M{x} {y + 20} q-20 120 -60 200" stroke="#7a9a5a" stroke-width="4" fill="none" opacity="0.6"/>'
    b += '<path d="M200 300 q40 -60 80 0 q-40 60 -80 0Z" fill="#8fb77a" opacity="0.5" filter="url(#wc)"/>'
    b += '<path d="M150 820 h420" stroke="#8a6a4a" stroke-width="3" opacity="0.4"/><path d="M160 850 h300" stroke="#8a6a4a" stroke-width="3" opacity="0.3"/>'
    return wc_svg(b)


# ----------------------------------------------------------------- night sky
def sky_milky():
    r = random.Random(41)
    b = '<linearGradient id="nt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070c1f"/><stop offset="1" stop-color="#1c2a55"/></linearGradient>'
    b += f'<rect width="{W}" height="{H}" fill="url(#nt)"/>'
    b += '<ellipse cx="820" cy="420" rx="1100" ry="140" transform="rotate(-24 820 420)" fill="#9fb2e8" opacity="0.18" filter="url(#soft)"/>'
    b += '<ellipse cx="820" cy="420" rx="900" ry="70" transform="rotate(-24 820 420)" fill="#e8d9ff" opacity="0.14" filter="url(#soft)"/>'
    b += stars(r, 700)
    for _ in range(160):
        x = r.uniform(0, W)
        y = 420 - (x - 820) * math.tan(math.radians(24)) + r.gauss(0, 60)
        b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r.uniform(0.5, 1.6):.1f}" fill="#fff" opacity="0.8"/>'
    b += '<path d="M0 860 C300 800 500 840 820 800 S1300 820 1640 780 L1640 1000 L0 1000Z" fill="#050810"/>'
    b += '<path d="M1180 820 l40 -110 l40 110Z M1250 830 l30 -80 l30 80Z" fill="#050810"/>'
    return svg(b, '#070c1f')


def sky_tent():
    r = random.Random(42)
    b = f'<rect width="{W}" height="{H}" fill="#101a3a"/>' + stars(r, 500, 0, 700)
    pts = [(300, 180), (380, 150), (460, 170), (520, 140), (600, 190), (640, 260), (560, 280)]
    b += '<polyline points="' + ' '.join(f'{x},{y}' for x, y in pts) + '" stroke="#e7c97a" stroke-width="1.6" fill="none" opacity="0.7"/>'
    b += ''.join(f'<circle cx="{x}" cy="{y}" r="4" fill="#fff5d0"/>' for x, y in pts)
    b += '<path d="M0 720 C400 660 900 700 1640 650 L1640 1000 L0 1000Z" fill="#0b1226"/>'
    b += '<path d="M660 860 L820 620 L980 860Z" fill="#e9a74a"/><path d="M820 620 L780 860 L860 860Z" fill="#b5702c"/>'
    b += '<ellipse cx="820" cy="820" rx="260" ry="60" fill="#ffbe6a" opacity="0.25" filter="url(#soft)"/>'
    b += '<g transform="translate(1100 840)"><path d="M-30 0 l30 -40 l30 40Z" fill="#f38a3a" filter="url(#glow)"/><path d="M-50 10 h100" stroke="#5a3a1a" stroke-width="10"/></g>'
    b += ''.join(f'<path d="M{200 + i * 90} 900 l40 -220 l40 220Z" fill="#070b18"/>' for i in range(5))
    return svg(b, '#101a3a')


def sky_moonsea():
    r = random.Random(43)
    b = f'<rect width="{W}" height="620" fill="#15204a"/>' + stars(r, 350, 0, 560)
    b += '<circle cx="1140" cy="220" r="110" fill="#f6ecc8"/><circle cx="1180" cy="200" r="100" fill="#15204a" opacity="0.18"/>'
    b += '<circle cx="1140" cy="220" r="180" fill="#f6ecc8" opacity="0.12" filter="url(#soft)"/>'
    b += f'<rect y="600" width="{W}" height="400" fill="#0d1636"/>'
    for i in range(40):
        w = 40 + i * 6
        b += f'<rect x="{1140 - w / 2 + r.uniform(-20, 20):.0f}" y="{620 + i * 9}" width="{w:.0f}" height="3" fill="#f6ecc8" opacity="{0.6 - i * 0.012:.2f}"/>'
    b += '<path d="M180 640 l60 -40 l140 0 l40 40Z" fill="#070c20"/><path d="M280 600 l0 -140 l80 120Z" fill="#dfe4f0" opacity="0.8"/>'
    return svg(b, '#15204a')


# ----------------------------------------------------------------- Pokémon world (objects & places only)
BALL_RED = '#e3350d'


def ball(x, y, rr):
    sw = rr * 0.1
    return (f'<g transform="translate({x},{y})"><circle r="{rr}" fill="#f6f6f6" stroke="#222" stroke-width="{sw:.1f}"/>'
            f'<path d="M{-rr},0 A{rr},{rr} 0 0 1 {rr},0Z" fill="{BALL_RED}" stroke="#222" stroke-width="{sw:.1f}"/>'
            f'<rect x="{-rr}" y="{-rr * 0.07:.1f}" width="{2 * rr}" height="{rr * 0.14:.1f}" fill="#222"/>'
            f'<circle r="{rr * 0.3:.1f}" fill="#f6f6f6" stroke="#222" stroke-width="{sw:.1f}"/></g>')


def pk_route():
    r = random.Random(51)
    b = f'<rect width="{W}" height="520" fill="#8fd3f5"/>'
    for (x, y, w) in [(200, 140, 260), (900, 100, 340), (1350, 200, 220)]:
        b += f'<ellipse cx="{x}" cy="{y}" rx="{w / 2}" ry="{w / 6}" fill="#fff"/><ellipse cx="{x + 40}" cy="{y - 20}" rx="{w / 3}" ry="{w / 6}" fill="#fff"/>'
    b += '<path d="M0 520 C400 440 1000 470 1640 420 L1640 1000 L0 1000Z" fill="#7ccf5a"/>'
    b += '<path d="M600 1000 C700 800 820 640 900 470 L980 470 C920 640 900 820 980 1000Z" fill="#e7d49a"/>'
    for _ in range(260):
        x, y = r.uniform(0, W), r.uniform(560, 1000)
        if 600 < x < 1000 and y > 600:
            continue
        h = r.uniform(40, 80)
        b += f'<path d="M{x:.0f},{y:.0f} l8,{-h:.0f} l8,{h:.0f} l8,{-h * 0.8:.0f} l8,{h * 0.8:.0f}Z" fill="{r.choice(["#3f9a3a", "#4aad3f", "#357f31"])}"/>'
    b += '<rect x="1060" y="560" width="12" height="90" fill="#7a5a3a"/><rect x="1000" y="520" width="130" height="60" rx="6" fill="#f3e3b8" stroke="#7a5a3a" stroke-width="4"/>'
    b += '<text x="1065" y="560" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="26" fill="#5a3a1a">1号道路</text>'
    b += ball(430, 760, 46)
    for (x, y) in [(1300, 420), (1420, 400), (160, 440)]:
        b += f'<circle cx="{x}" cy="{y}" r="60" fill="#2f7d33"/><rect x="{x - 8}" y="{y + 40}" width="16" height="60" fill="#6b4a2a"/>'
    return svg(b, '#8fd3f5')


def pk_pixel():
    pal = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
    b = f'<rect width="{W}" height="{H}" fill="{pal[3]}"/>'
    for i in range(W // 20):
        for j in range(H // 20):
            if (i * 7 + j * 3) % 11 == 0:
                b += f'<rect x="{i * 20}" y="{j * 20}" width="4" height="4" fill="{pal[2]}"/>'

    def house(cx, cy, w, h, roof):
        g = f'<rect x="{cx}" y="{cy}" width="{w}" height="{h}" fill="{pal[2]}" stroke="{pal[0]}" stroke-width="6"/>'
        g += f'<rect x="{cx - 20}" y="{cy - 80}" width="{w + 40}" height="80" fill="{roof}" stroke="{pal[0]}" stroke-width="6"/>'
        g += ''.join(f'<rect x="{cx - 20 + k}" y="{cy - 80}" width="20" height="80" fill="{pal[0]}" opacity="0.25"/>' for k in range(0, w + 40, 40))
        g += f'<rect x="{cx + w / 2 - 25}" y="{cy + h - 70}" width="50" height="70" fill="{pal[0]}"/>'
        g += f'<rect x="{cx + 20}" y="{cy + 30}" width="50" height="40" fill="{pal[3]}" stroke="{pal[0]}" stroke-width="5"/>'
        return g
    b += house(220, 340, 300, 240, pal[1]) + house(1060, 320, 340, 260, pal[1]) + house(640, 620, 260, 200, pal[0])
    b += f'<rect x="0" y="860" width="{W}" height="140" fill="{pal[2]}"/>'
    b += ''.join(f'<rect x="{i}" y="880" width="20" height="20" fill="{pal[1]}"/>' for i in range(0, W, 40))
    for (x, y) in [(120, 180), (1500, 200), (900, 180), (560, 220)]:
        b += f'<rect x="{x - 50}" y="{y - 50}" width="100" height="100" fill="{pal[1]}" stroke="{pal[0]}" stroke-width="6"/><rect x="{x - 10}" y="{y + 50}" width="20" height="40" fill="{pal[0]}"/>'
    b += f'<rect x="700" y="420" width="60" height="80" fill="{pal[0]}"/><rect x="690" y="380" width="80" height="50" fill="{pal[1]}" stroke="{pal[0]}" stroke-width="6"/>'
    return svg(b, pal[3])


def pk_stadium():
    b = '<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a52"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>'
    b += f'<rect width="{W}" height="{H}" fill="url(#sun)"/>'
    b += '<path d="M0 560 Q820 300 1640 560 L1640 1000 L0 1000Z" fill="#c0392b"/>'
    for i in range(14):
        y = 580 + i * 26
        b += f'<path d="M0 {y} Q820 {y - 240 + i * 14} 1640 {y}" stroke="#a62d22" stroke-width="3" fill="none"/>'
    b += '<ellipse cx="820" cy="820" rx="700" ry="160" fill="#6bbf4c"/><ellipse cx="820" cy="820" rx="700" ry="160" fill="none" stroke="#fff" stroke-width="8"/>'
    b += '<line x1="820" y1="662" x2="820" y2="978" stroke="#fff" stroke-width="8"/><ellipse cx="820" cy="820" rx="120" ry="40" fill="none" stroke="#fff" stroke-width="8"/>'
    b += f'<g transform="scale(1 0.34) translate(0 {820 / 0.34 - 820:.0f})">{ball(820, 820, 90)}</g>'
    for x in (200, 1440):
        b += f'<rect x="{x - 8}" y="260" width="16" height="320" fill="#555"/><rect x="{x - 60}" y="230" width="120" height="50" fill="#eee"/>'
        b += f'<ellipse cx="{x}" cy="255" rx="160" ry="60" fill="#fff8c8" opacity="0.4" filter="url(#soft)"/>'
    return svg(b, '#ff9a52')


# ----------------------------------------------------------------- Ghibli summer (places only)
def gb_clouds():
    r = random.Random(61)
    b = '<linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8fd8"/><stop offset="1" stop-color="#a8d6f2"/></linearGradient>'
    b += f'<rect width="{W}" height="{H}" fill="url(#gsky)"/>'
    for (cx, cy, s) in [(1000, 330, 1.4), (360, 250, 0.8)]:
        for _ in range(26):
            b += f'<circle cx="{cx + r.gauss(0, 150 * s):.0f}" cy="{cy + r.gauss(0, 60 * s) - abs(r.gauss(0, 60 * s)):.0f}" r="{r.uniform(50, 110) * s:.0f}" fill="#fff"/>'
        b += f'<ellipse cx="{cx}" cy="{cy + 90 * s:.0f}" rx="{320 * s:.0f}" ry="{50 * s:.0f}" fill="#dfeaf5"/>'
    b += '<path d="M0 700 C300 600 700 660 1000 640 S1500 580 1640 610 L1640 1000 L0 1000Z" fill="#6aaa3f"/>'
    b += '<path d="M0 820 C400 760 900 800 1640 760 L1640 1000 L0 1000Z" fill="#4f8f2f"/>'
    b += '<g transform="translate(1180 610)"><rect x="-10" y="0" width="20" height="120" fill="#5a3f28"/>'
    for _ in range(40):
        b += f'<circle cx="{r.gauss(0, 70):.0f}" cy="{r.gauss(-40, 40):.0f}" r="{r.uniform(24, 46):.0f}" fill="{r.choice(["#2f6f2a", "#3c8233", "#27602a"])}"/>'
    b += '</g>'
    for _ in range(200):
        x, y = r.uniform(0, W), r.uniform(780, 1000)
        b += f'<path d="M{x:.0f},{y:.0f} q6,-20 16,-34" stroke="#3a7a24" stroke-width="3" fill="none"/>'
    return svg(b, '#3f8fd8')


def gb_busstop():
    r = random.Random(62)
    b = f'<rect width="{W}" height="{H}" fill="#6f7f86"/><rect width="1640" height="560" fill="#8a989e"/>'
    for _ in range(40):
        b += f'<rect x="{r.uniform(0, W):.0f}" y="{r.uniform(260, 420):.0f}" width="{r.uniform(40, 120):.0f}" height="600" fill="#445a4a" opacity="0.6"/>'
    b += '<rect y="700" width="1640" height="300" fill="#4d5a52"/>'
    b += '<rect x="1000" y="360" width="14" height="420" fill="#d8d0b8"/><circle cx="1007" cy="340" r="62" fill="#e4dac0" stroke="#7a6a48" stroke-width="6"/>'
    b += '<text x="1007" y="352" text-anchor="middle" font-family="serif" font-size="30" fill="#4a3a28">站</text>'
    b += '<path d="M600 560 L900 560 L880 480 L620 480Z" fill="#6b4a32"/><rect x="620" y="560" width="14" height="220" fill="#5a3a22"/><rect x="866" y="560" width="14" height="220" fill="#5a3a22"/>'
    b += '<rect x="640" y="660" width="220" height="16" fill="#7a5a3a"/>'
    b += '<g transform="translate(1180 700) rotate(18)"><path d="M-110 0 Q0 -120 110 0Z" fill="#d2352c"/><line x1="0" y1="-60" x2="0" y2="120" stroke="#3a2a1a" stroke-width="6"/></g>'
    for _ in range(400):
        x, y = r.uniform(-100, W), r.uniform(0, H)
        b += f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x - 8:.0f}" y2="{y + 50:.0f}" stroke="#e6ecef" stroke-width="1.6" opacity="0.4"/>'
    for _ in range(30):
        b += f'<ellipse cx="{r.uniform(0, W):.0f}" cy="{r.uniform(760, 990):.0f}" rx="{r.uniform(20, 60):.0f}" ry="4" fill="#c8d2d6" opacity="0.4"/>'
    return svg(b, '#6f7f86')


def gb_seaplane():
    r = random.Random(63)
    b = f'<rect width="{W}" height="620" fill="#9fd6ef"/><rect y="560" width="{W}" height="440" fill="#2f8fb8"/>'
    for _ in range(80):
        b += f'<path d="M{r.uniform(0, W):.0f},{r.uniform(600, 1000):.0f} h{r.uniform(30, 90):.0f}" stroke="#e8f6fb" stroke-width="3" opacity="0.5"/>'
    for i in range(14):
        x = 60 + i * 40
        h = r.uniform(80, 220)
        c = r.choice(['#f1e3c8', '#e8c6a8', '#f6f0e4', '#d9b690'])
        b += f'<rect x="{x}" y="{620 - h:.0f}" width="44" height="{h:.0f}" fill="{c}"/><path d="M{x - 4},{620 - h:.0f} l26,-26 l26,26Z" fill="#c8583e"/>'
    b += '<g transform="translate(1100 250) rotate(-6)">'
    b += '<path d="M-150 0 C-100 -24 120 -24 170 0 C120 20 -100 20 -150 0Z" fill="#c8302a"/>'
    b += '<rect x="-70" y="-60" width="200" height="14" fill="#c8302a"/><rect x="-70" y="38" width="200" height="14" fill="#a82420"/>'
    b += '<line x1="-20" y1="-46" x2="-20" y2="40" stroke="#555" stroke-width="4"/><line x1="90" y1="-46" x2="90" y2="40" stroke="#555" stroke-width="4"/>'
    b += '<ellipse cx="175" cy="0" rx="8" ry="46" fill="#ddd" opacity="0.6"/><path d="M-150 0 l-30 -34 l24 0 l26 26Z" fill="#c8302a"/>'
    b += '<ellipse cx="0" cy="80" rx="80" ry="12" fill="#eee"/></g>'
    for (x, y, w) in [(300, 140, 320), (800, 90, 240)]:
        b += f'<ellipse cx="{x}" cy="{y}" rx="{w / 2}" ry="{w / 7:.0f}" fill="#fff"/><ellipse cx="{x + 30}" cy="{y - 20}" rx="{w / 3:.0f}" ry="{w / 6:.0f}" fill="#fff"/>'
    return svg(b, '#9fd6ef')


# ----------------------------------------------------------------- wizard school
def wz_castle():
    r = random.Random(71)
    b = f'<rect width="{W}" height="{H}" fill="#101630"/>' + stars(r, 300, 0, 500)
    b += '<circle cx="1380" cy="150" r="70" fill="#f3ead0"/>'
    b += '<path d="M0 1000 L0 700 C200 640 380 600 520 520 L1100 520 C1200 600 1400 680 1640 700 L1640 1000Z" fill="#0a0e20"/>'
    base = 540
    for (x, w, h) in [(560, 70, 300), (650, 50, 220), (720, 110, 380), (850, 60, 260), (930, 90, 340), (1040, 50, 230)]:
        b += f'<rect x="{x}" y="{base - h}" width="{w}" height="{h}" fill="#141a33"/><path d="M{x - 8},{base - h} L{x + w / 2},{base - h - 90} L{x + w + 8},{base - h}Z" fill="#141a33"/>'
        for k in range(int(h / 50)):
            if r.random() > 0.3:
                b += f'<rect x="{x + w / 2 - 6:.0f}" y="{base - h + 30 + k * 50}" width="12" height="20" fill="#f4c55a" opacity="{r.uniform(0.6, 1):.2f}"/>'
    b += f'<rect x="560" y="{base - 60}" width="540" height="60" fill="#141a33"/><rect y="820" width="1640" height="180" fill="#0c1a2a"/>'
    for _ in range(30):
        b += f'<path d="M{r.uniform(0, W):.0f},{r.uniform(840, 990):.0f} h{r.uniform(20, 70):.0f}" stroke="#f4c55a" stroke-width="2" opacity="0.3"/>'
    b += ''.join(f'<path d="M{300 + i * 110},900 l14 -8 l14 8 l-4 6 h-20Z" fill="#f4c55a" opacity="0.7"/>' for i in range(6))
    return svg(b, '#101630')


def wz_hall():
    r = random.Random(72)
    b = f'<rect width="{W}" height="{H}" fill="#1a1a3a"/>' + stars(r, 400, 0, 600, '#fff6d8')
    b += '<rect y="620" width="1640" height="380" fill="#3a2418"/>'
    for i in range(4):
        y = 700 + i * 70
        b += f'<rect x="100" y="{y}" width="1440" height="26" fill="#6b4226"/><rect x="100" y="{y + 26}" width="1440" height="8" fill="#4a2c18"/>'
    for i in range(6):
        x = 60 + i * 300
        b += f'<rect x="{x}" y="0" width="60" height="640" fill="#2a2440"/>'
    for _ in range(70):
        x, y = r.uniform(80, 1560), r.uniform(120, 560)
        b += f'<rect x="{x:.0f}" y="{y:.0f}" width="10" height="{r.uniform(26, 48):.0f}" fill="#f3ecd8"/>'
        b += f'<ellipse cx="{x + 5:.0f}" cy="{y - 8:.0f}" rx="5" ry="10" fill="#ffcf5a" filter="url(#glow)"/>'
    for i, c in enumerate(['#8c1d1d', '#1f4f2f', '#1d2f6b', '#b8912a']):
        b += f'<path d="M{260 + i * 340},40 h120 v240 l-60 -40 l-60 40Z" fill="{c}"/>'
    return svg(b, '#1a1a3a')


def wz_platform():
    r = random.Random(73)
    b = f'<rect width="{W}" height="{H}" fill="#7a6a5a"/>'
    for i in range(20):
        for j in range(10):
            b += f'<rect x="{i * 84 + (j % 2) * 42}" y="{j * 40}" width="80" height="36" fill="#8e7b66" stroke="#6a5a4a" stroke-width="2"/>'
    b += '<rect y="620" width="1640" height="380" fill="#5a5048"/><rect y="600" width="1640" height="30" fill="#c9b99a"/>'
    b += '<g transform="translate(300 360)">'
    b += '<rect x="0" y="80" width="760" height="190" rx="16" fill="#8c1d1d"/><rect x="760" y="120" width="260" height="150" rx="20" fill="#7a1818"/>'
    b += '<rect x="880" y="40" width="60" height="90" fill="#2a2a2a"/><rect x="870" y="30" width="80" height="20" fill="#2a2a2a"/>'
    b += ''.join(f'<rect x="{40 + i * 120}" y="110" width="80" height="60" rx="6" fill="#f2d98a"/>' for i in range(6))
    b += ''.join(f'<circle cx="{80 + i * 140}" cy="280" r="40" fill="#2a2a2a" stroke="#b8912a" stroke-width="6"/>' for i in range(7))
    b += '<rect x="0" y="210" width="760" height="10" fill="#b8912a"/></g>'
    for _ in range(18):
        b += f'<circle cx="{1200 + r.uniform(-200, 200):.0f}" cy="{r.uniform(80, 360):.0f}" r="{r.uniform(40, 120):.0f}" fill="#eee" opacity="0.28" filter="url(#soft)"/>'
    b += '<g transform="translate(1320 480)"><rect x="-6" y="0" width="12" height="130" fill="#333"/><rect x="-90" y="-60" width="180" height="70" fill="#1d2f5b" stroke="#b8912a" stroke-width="4"/>'
    b += '<text x="0" y="-14" text-anchor="middle" font-family="Georgia" font-size="36" fill="#f2e6c2">9 ¾</text></g>'
    return svg(b, '#7a6a5a')


if __name__ == '__main__':
    for theme, name, fn in [
        ('watercolor', 'flowers', wc_flowers), ('watercolor', 'cafe', wc_cafe), ('watercolor', 'tea', wc_tea),
        ('starry', 'milky', sky_milky), ('starry', 'tent', sky_tent), ('starry', 'moonsea', sky_moonsea),
        ('pokemon', 'route', pk_route), ('pokemon', 'pixel', pk_pixel), ('pokemon', 'stadium', pk_stadium),
        ('ghibli', 'clouds', gb_clouds), ('ghibli', 'busstop', gb_busstop), ('ghibli', 'seaplane', gb_seaplane),
        ('wizard', 'castle', wz_castle), ('wizard', 'hall', wz_hall), ('wizard', 'platform', wz_platform),
    ]:
        save(theme, name + '.svg', fn())
