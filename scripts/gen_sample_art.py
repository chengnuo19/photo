"""Generate the sample storybook illustrations (flat acrylic-marker look) as SVG.

Run: python scripts/gen_sample_art.py
Output: public/assets/book/page-0X.svg  (1640x1000, ratio of one open spread)
"""
import math
import os
import random

W, H = 1640, 1000
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'book')

DEFS = '''<defs>
  <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.10 0"/>
  </filter>
</defs>'''


def svg(body, bg):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
            f'{DEFS}<rect width="{W}" height="{H}" fill="{bg}"/>{body}'
            f'<rect width="{W}" height="{H}" filter="url(#grain)"/></svg>')


def blob(cx, cy, r, rnd, n=9, jitter=0.18):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        rr = r * (1 + rnd.uniform(-jitter, jitter))
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a) * 0.9))
    d = f'M{(pts[0][0] + pts[-1][0]) / 2:.1f},{(pts[0][1] + pts[-1][1]) / 2:.1f} '
    for i in range(n):
        p, q = pts[i], pts[(i + 1) % n]
        d += f'Q{p[0]:.1f},{p[1]:.1f} {(p[0] + q[0]) / 2:.1f},{(p[1] + q[1]) / 2:.1f} '
    return d + 'Z'


def streak_cloud(x, y, w, h):
    return (f'<path d="M{x},{y} C{x + w * 0.3},{y - h} {x + w * 0.7},{y - h * 1.1} {x + w},{y - h * 0.2} '
            f'C{x + w * 0.7},{y + h * 0.35} {x + w * 0.3},{y + h * 0.4} {x},{y} Z" fill="#FFFFFF" opacity="0.95"/>')


def marker_fill(y0, y1, color, rnd, count=40, alpha=0.18):
    """Horizontal strokes that mimic acrylic-marker banding."""
    s = ''
    for _ in range(count):
        y = rnd.uniform(y0, y1)
        x = rnd.uniform(-100, W)
        length = rnd.uniform(200, 700)
        s += (f'<path d="M{x:.0f},{y:.0f} q{length / 2:.0f},{rnd.uniform(-6, 6):.0f} {length:.0f},0" '
              f'stroke="{color}" stroke-width="{rnd.uniform(6, 16):.0f}" stroke-linecap="round" '
              f'fill="none" opacity="{alpha}"/>')
    return s


def paddocks():
    r = random.Random(1)
    b = f'<rect width="{W}" height="560" fill="#5E9FDA"/>'
    b += marker_fill(0, 540, '#8CC0EE', r, 70)
    for (x, y, w, h) in [(120, 150, 520, 24), (700, 110, 620, 20), (980, 230, 460, 18),
                         (60, 300, 380, 16), (1250, 330, 330, 14), (520, 250, 300, 12)]:
        b += streak_cloud(x, y, w, h)
    b += '<g filter="url(#rough)">'
    b += ('<path d="M0,470 C300,440 520,470 760,455 C1000,440 1150,380 1400,360 C1520,352 1600,360 1640,370 '
          'L1640,600 L0,600 Z" fill="#8FC24E"/>')
    b += '<path d="M780,470 C1000,430 1200,395 1640,400 L1640,600 L780,600 Z" fill="#7DB443"/>'
    for _ in range(60):
        cx, cy = r.uniform(-40, 430), r.uniform(250, 480)
        col = r.choice(['#2E5B28', '#3A6D2F', '#274E24', '#44793A'])
        b += f'<path d="{blob(cx, cy, r.uniform(30, 70), r)}" fill="{col}"/>'
    b += '<rect x="560" y="440" width="46" height="26" fill="#5B5B55"/><path d="M552,442 L583,424 L614,442 Z" fill="#46463F"/>'
    b += '<path d="M0,500 C400,480 900,500 1640,470 L1640,1000 L0,1000 Z" fill="#8CCB3E"/>'
    b += '</g>'
    b += marker_fill(520, 1000, '#B4E063', r, 60, alpha=0.22)
    b += marker_fill(700, 1000, '#5E9E2F', r, 30, alpha=0.18)
    for i in range(34):
        x = 380 + i * 38
        y = 505 - i * 0.9
        b += f'<line x1="{x}" y1="{y:.1f}" x2="{x}" y2="{y + 26:.1f}" stroke="#6A5A45" stroke-width="3"/>'
    b += '<path d="M380,512 L1640,482" stroke="#6A5A45" stroke-width="1.5"/>'
    b += '<path d="M380,522 L1640,492" stroke="#6A5A45" stroke-width="1.5"/>'
    sheep = [(240, 640, 1.0), (430, 610, 0.8), (560, 700, 1.15), (760, 640, 0.9), (900, 720, 1.2),
             (1080, 650, 0.95), (1230, 700, 1.1), (1380, 630, 0.85), (1500, 690, 1.0), (330, 760, 1.25),
             (680, 800, 1.3), (1160, 800, 1.35), (980, 590, 0.7), (1310, 580, 0.65), (620, 580, 0.6)]
    for (x, y, s) in sheep:
        g = f'<g transform="translate({x},{y}) scale({s})">'
        g += '<ellipse cx="0" cy="34" rx="34" ry="5" fill="#3E6E22" opacity="0.35"/>'
        for lx in (-16, -6, 8, 18):
            g += f'<rect x="{lx}" y="14" width="4" height="18" rx="2" fill="#2E2A26"/>'
        for _ in range(9):
            g += (f'<circle cx="{r.uniform(-26, 26):.0f}" cy="{r.uniform(-8, 12):.0f}" '
                  f'r="{r.uniform(10, 16):.0f}" fill="#F5F2EA"/>')
        g += '<circle cx="-4" cy="-2" r="20" fill="#FBF9F3" opacity="0.6"/>'
        g += f'<ellipse cx="{r.choice([-34, 34])}" cy="-4" rx="9" ry="11" fill="#2F2B27"/></g>'
        b += g
    for _ in range(420):
        x = r.uniform(0, W)
        y = r.uniform(820, 1000)
        h = r.uniform(18, 50)
        col = r.choice(['#4F8F24', '#6BAF2E', '#3C7A1E'])
        b += (f'<path d="M{x:.0f},{y:.0f} q{r.uniform(-8, 8):.0f},{-h / 2:.0f} {r.uniform(-10, 10):.0f},{-h:.0f}" '
              f'stroke="{col}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    for _ in range(70):
        col = r.choice(['#E8493A', '#F2C230', '#9B6BD0', '#FFFFFF', '#F28DB2'])
        b += (f'<circle cx="{r.uniform(0, W):.0f}" cy="{r.uniform(840, 990):.0f}" '
              f'r="{r.uniform(3, 6):.1f}" fill="{col}"/>')
    b += ('<g stroke="#7A6448" stroke-width="5"><line x1="1450" y1="700" x2="1450" y2="860"/>'
          '<line x1="1600" y1="690" x2="1600" y2="850"/><line x1="1450" y1="730" x2="1600" y2="720"/>'
          '<line x1="1450" y1="780" x2="1600" y2="770"/><line x1="1450" y1="830" x2="1600" y2="820"/>'
          '<line x1="1450" y1="830" x2="1600" y2="720"/></g>')
    return svg(b, '#5E9FDA')


def blossoms():
    r = random.Random(2)
    b = f'<rect width="{W}" height="{H}" fill="#3F86D6"/>'
    b += marker_fill(0, 900, '#6FA8E6', r, 90, alpha=0.25)
    for (x, y, w) in [(90, 250, 200), (250, 520, 170), (620, 380, 150)]:
        b += f'<path d="{blob(x, y, w / 2, r, n=11, jitter=0.25)}" fill="#FFFFFF"/>'
        b += f'<path d="{blob(x + w * 0.45, y + 6, w / 2.6, r)}" fill="#FFFFFF"/>'
    b += '<g filter="url(#rough)">'
    b += '<path d="M40,1000 L320,610 C350,585 380,585 400,610 L760,1000 Z" fill="#6C5C73"/>'
    b += '<path d="M300,640 C330,600 370,600 395,630 L380,660 C360,640 330,650 300,640 Z" fill="#7D6D84"/>'
    b += '<path d="M0,900 C200,780 450,800 700,1000 L0,1000 Z" fill="#3E6F3A"/>'
    b += '<path d="M0,980 C300,860 520,900 820,1000 Z" fill="#2E5A2C"/>'
    b += '<rect x="90" y="880" width="170" height="90" fill="#EFE6D8"/><path d="M70,885 L175,835 L280,885 Z" fill="#A04A3A"/>'
    b += '<rect x="120" y="910" width="30" height="26" fill="#3F6FA8"/><rect x="200" y="910" width="30" height="26" fill="#3F6FA8"/>'
    b += '<rect x="1170" y="430" width="470" height="570" fill="#F3F2EE"/>'
    b += '<rect x="1170" y="430" width="470" height="30" fill="#DADAD4"/>'
    for i in range(6):
        for j in range(3):
            b += f'<rect x="{1200 + i * 72}" y="{620 + j * 110}" width="56" height="86" fill="#A9C6DE"/>'
    b += '<rect x="1150" y="360" width="20" height="640" fill="#E8E7E2"/>'
    b += '<rect x="1320" y="300" width="14" height="140" fill="#E0DFDA"/><rect x="1255" y="330" width="150" height="10" fill="#E0DFDA"/>'
    b += '</g>'
    b += ('<path d="M560,1000 C700,860 820,760 980,640 C1120,540 1300,380 1640,120" stroke="#4A3328" '
          'stroke-width="22" fill="none" stroke-linecap="round" filter="url(#rough)"/>')
    twigs = [(900, 700, 820, 560), (1100, 560, 1180, 420), (1300, 420, 1260, 260),
             (1450, 300, 1560, 330), (800, 780, 700, 720)]
    for (sx, sy, ex, ey) in twigs:
        b += (f'<path d="M{sx},{sy} Q{(sx + ex) / 2 + 20},{(sy + ey) / 2 - 20} {ex},{ey}" stroke="#4A3328" '
              f'stroke-width="10" fill="none" stroke-linecap="round"/>')

    def flower(cx, cy, s):
        pc = r.choice(['#F6B6CB', '#F2A0BB', '#F9C9D8', '#EE8FAE', '#FBD7E2'])
        g = f'<g transform="translate({cx:.0f},{cy:.0f}) rotate({r.uniform(0, 72):.0f}) scale({s:.2f})">'
        for k in range(5):
            g += f'<ellipse cx="0" cy="-11" rx="8" ry="11" fill="{pc}" transform="rotate({k * 72})"/>'
        return g + '<circle r="4" fill="#E0507A"/></g>'

    pts = [(560 + 1080 * t, 1000 - 880 * (t ** 0.9)) for t in [i / 60 for i in range(61)]]
    for (sx, sy, ex, ey) in twigs:
        pts += [(sx + (ex - sx) * t, sy + (ey - sy) * t) for t in [i / 8 for i in range(9)]]
    for (x, y) in pts:
        for _ in range(4):
            b += flower(x + r.uniform(-70, 70), y + r.uniform(-60, 60), r.uniform(0.9, 1.9))
    return svg(b, '#3F86D6')


def harbour():
    r = random.Random(3)
    b = f'<rect width="{W}" height="520" fill="#2C4E86"/>'
    b += marker_fill(0, 500, '#3E64A0', r, 80, alpha=0.35)
    b += marker_fill(0, 300, '#1F3C6E', r, 30, alpha=0.4)
    for _ in range(40):
        b += (f'<circle cx="{r.uniform(0, W):.0f}" cy="{r.uniform(20, 300):.0f}" r="{r.uniform(1, 2.4):.1f}" '
              f'fill="#F3E9C6" opacity="{r.uniform(0.4, 0.9):.2f}"/>')
    b += '<g filter="url(#rough)">'
    b += '<path d="M0,470 C160,430 320,450 460,440 C600,430 700,410 820,420 L820,540 L0,540 Z" fill="#46597A"/>'
    b += ('<path d="M600,520 C700,360 820,300 980,300 C1140,300 1260,380 1400,440 C1500,480 1580,470 1640,460 '
          'L1640,560 L600,560 Z" fill="#23492E"/>')
    for _ in range(80):
        col = r.choice(['#1E3F28', '#2A5534', '#18351F'])
        b += f'<path d="{blob(r.uniform(640, 1640), r.uniform(360, 520), r.uniform(16, 34), r)}" fill="{col}"/>'
    b += '</g>'
    b += f'<rect y="520" width="{W}" height="480" fill="#1E3A66"/>'
    b += marker_fill(530, 1000, '#2F5590', r, 90, alpha=0.4)
    b += '<path d="M600,520 C760,600 980,640 1400,600 C1500,590 1580,570 1640,560 L1640,520 Z" fill="#17324F" opacity="0.8"/>'
    for (x, y, s) in [(820, 520, 1.0), (1000, 515, 1.2), (1180, 522, 1.0), (1340, 518, 1.1), (1500, 524, 0.9)]:
        g = f'<g transform="translate({x},{y}) scale({s})">'
        g += '<path d="M-60,0 L60,0 L48,18 L-50,18 Z" fill="#F4F1EA"/>'
        g += '<rect x="-30" y="-20" width="50" height="20" fill="#F4F1EA"/>'
        g += '<rect x="-22" y="-14" width="10" height="8" fill="#2C4E86"/><rect x="-4" y="-14" width="10" height="8" fill="#2C4E86"/>'
        g += '<line x1="0" y1="-20" x2="0" y2="-70" stroke="#E6E2D8" stroke-width="3"/>'
        g += '<path d="M-58,24 L58,24" stroke="#F4F1EA" stroke-width="4" opacity="0.35"/></g>'
        b += g
    b += '<path d="M0,1000 L620,560 L660,560 L420,1000 Z" fill="#5E5A57" filter="url(#rough)"/>'
    b += '<path d="M420,1000 L660,560 L668,560 L440,1000 Z" fill="#3E3B39"/>'
    for i in range(10):
        t = i / 10
        x = 620 - 600 * t ** 1.3
        y = 560 + 440 * t ** 1.3
        b += f'<rect x="{x:.0f}" y="{y:.0f}" width="{3 + 8 * t:.0f}" height="{10 + 40 * t:.0f}" fill="#2B2826"/>'
    b += '<circle cx="610" cy="548" r="4" fill="#F4D27A"/><rect x="607" y="552" width="6" height="30" fill="#E24B3B"/>'
    for _ in range(30):
        b += (f'<path d="M{r.uniform(700, 1640):.0f},{r.uniform(560, 1000):.0f} h{r.uniform(20, 80):.0f}" '
              f'stroke="#9FB6D6" stroke-width="2" opacity="0.35"/>')
    return svg(b, '#1E3A66')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [('page-01.svg', paddocks), ('page-02.svg', blossoms), ('page-03.svg', harbour)]:
        path = os.path.join(OUT, name)
        with open(path, 'w', encoding='utf8') as f:
            f.write(fn())
        print(name, os.path.getsize(path) // 1024, 'KB')
