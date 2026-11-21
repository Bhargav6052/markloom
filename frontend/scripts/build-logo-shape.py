"""Derive the original public logo's silhouette for a shallow, textured 3D extrusion."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
image = Image.open(root / 'public/markloom-logo.png').convert('RGBA')
image.thumbnail((256, 256), Image.Resampling.LANCZOS)
w, h = image.size
alpha = image.getchannel('A')
solid = {(x, y) for y in range(h) for x in range(w) if alpha.getpixel((x, y)) >= 110}
edges = set()
for x, y in solid:
    if (x, y-1) not in solid: edges.add(((x, y), (x+1, y)))
    if (x+1, y) not in solid: edges.add(((x+1, y), (x+1, y+1)))
    if (x, y+1) not in solid: edges.add(((x+1, y+1), (x, y+1)))
    if (x-1, y) not in solid: edges.add(((x, y+1), (x, y)))
loops = []
while edges:
    first = min(edges)
    edges.remove(first)
    points = [first[0], first[1]]
    while points[-1] != points[0]:
        a, b = points[-2], points[-1]
        dx, dy = b[0]-a[0], b[1]-a[1]
        candidates = [(-dy, dx), (dx, dy), (dy, -dx), (-dx, -dy)]
        nxt = next(((b, (b[0]+vx, b[1]+vy)) for vx, vy in candidates
                    if (b, (b[0]+vx, b[1]+vy)) in edges), None)
        if nxt is None: break
        edges.remove(nxt)
        points.append(nxt[1])
    if points[-1] == points[0] and len(points) > 8:
        area = sum(a[0]*b[1]-b[0]*a[1] for a, b in zip(points, points[1:]))/2
        if abs(area) > 30: loops.append((area, points[:-1]))

def simplify(points, epsilon=.55):
    if len(points) <= 2: return points
    a, b = points[0], points[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]
    denom = (dx*dx+dy*dy)**.5
    distances = [abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/denom
                 if denom else ((p[0]-a[0])**2+(p[1]-a[1])**2)**.5 for p in points]
    i = max(range(len(points)), key=lambda i: distances[i])
    if distances[i] <= epsilon: return [a, b]
    return simplify(points[:i+1], epsilon)[:-1]+simplify(points[i:], epsilon)

loops.sort(key=lambda item: abs(item[0]), reverse=True)
outer_area = loops[0][0]
selected = [loops[0]]+[loop for loop in loops[1:] if loop[0]*outer_area < 0]
contours = []
for _, points in selected:
    pivot = max(range(len(points)), key=lambda i: (points[i][0]-points[0][0])**2+(points[i][1]-points[0][1])**2)
    points = simplify(points[:pivot+1])[:-1]+simplify(points[pivot:]+[points[0]])[:-1]
    contours.append([[round((x/w-.5)*3.4, 5), round((.5-y/h)*3.4*h/w, 5)] for x, y in points])
result = {'image': '/markloom-logo.webp', 'width': 3.4, 'height': 3.4*h/w,
          'outer': contours[0], 'holes': contours[1:]}
(root/'src/logoShape.json').write_text(json.dumps(result, separators=(',', ':'))+'\n')
print('Original-logo silhouette:', len(contours[0]), 'outer vertices;', len(contours)-1, 'holes')
