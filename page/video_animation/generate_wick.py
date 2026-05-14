#!/usr/bin/env python3
"""
Generate balloon_scene.wick — a Wick Editor 1.19.x project file.
Scene: Sky with rising balloons (middle layer) and drifting foreground clouds.
  - Background layer : sky, sun, hills, ground
  - Middle layers    : 3 coloured hot-air balloons rising (tweened)
  - Foreground layers: 2 white clouds drifting right (tweened)
Canvas 480×270, 30 fps, 90 frames (3 s). Loops cleanly.
"""

import json, zipfile, uuid as _uuid, io, math

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def uid():
    return str(_uuid.uuid4())

def xform(x=0, y=0, sx=1, sy=1, rot=0, op=1):
    return {"classname":"Transform","x":float(x),"y":float(y),
            "scaleX":float(sx),"scaleY":float(sy),"rotation":float(rot),"opacity":float(op)}

def tween(pos, x=0, y=0, sx=1, sy=1, rot=0, op=1, easing="none"):
    return {"classname":"Tween","uuid":uid(),"playheadPosition":int(pos),
            "transform":xform(x,y,sx,sy,rot,op),"fullRotations":0,"easingType":easing}

def mkpath(paperjs_list, x=0, y=0):
    return {"classname":"Path","uuid":uid(),
            "json":json.dumps(paperjs_list, separators=(',',':')),
            "transform":xform(x,y),"identifier":None}

def mkframe(start, end, clips=None, paths=None, tweens=None):
    return {"classname":"Frame","uuid":uid(),"start":int(start),"end":int(end),
            "clips":clips or [],"paths":paths or [],"tweens":tweens or [],
            "identifier":None,"sound":None,"soundVolume":1,"soundLoop":False,
            "soundStart":0,"forwardSeekSkip":1,"backwardSeekSkip":1}

def mklayer(name, frames):
    return {"classname":"Layer","name":name,"uuid":uid(),"hidden":False,"locked":False,
            "frames":frames,"activeFrameIndex":0}

def mkclip(inner_paths, x=0, y=0, identifier=None):
    """A Clip whose visual content is the given paths (defined at origin)."""
    f = mkframe(1, 1, paths=inner_paths)
    l = mklayer("layer 1", [f])
    return {"classname":"Clip","uuid":uid(),"identifier":identifier,
            "transform":xform(x,y),"isRoot":False,
            "timeline":{"classname":"Timeline","layers":[l],"playheadPosition":1}}

# ---------------------------------------------------------------------------
# Paper.js shape builders
# (Wick uses Paper.js path JSON for all drawn shapes)
# Coordinate system: canvas centre = (0,0)
# For 480×270: left=-240 top=-135 right=240 bottom=135
# ---------------------------------------------------------------------------

def p_rect(x, y, w, h, fill, stroke=None):
    d = {"applyMatrix":True,
         "segments":[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],
         "closed":True,"fillColor":fill}
    if stroke: d["strokeColor"] = stroke
    return ["Path", d]

def p_circle(cx, cy, r, fill, stroke=None):
    k = 0.5523
    d = {"applyMatrix":True,
         "segments":[[[cx,cy-r],[-r*k,0],[r*k,0]],
                     [[cx+r,cy],[0,-r*k],[0,r*k]],
                     [[cx,cy+r],[r*k,0],[-r*k,0]],
                     [[cx-r,cy],[0,r*k],[0,-r*k]]],
         "closed":True,"fillColor":fill}
    if stroke: d["strokeColor"] = stroke
    return ["Path", d]

def p_oval(cx, cy, rx, ry, fill, stroke=None):
    k = 0.5523
    d = {"applyMatrix":True,
         "segments":[[[cx,cy-ry],[-rx*k,0],[rx*k,0]],
                     [[cx+rx,cy],[0,-ry*k],[0,ry*k]],
                     [[cx,cy+ry],[rx*k,0],[-rx*k,0]],
                     [[cx-rx,cy],[0,ry*k],[0,-ry*k]]],
         "closed":True,"fillColor":fill}
    if stroke: d["strokeColor"] = stroke
    return ["Path", d]

def p_line(x1,y1,x2,y2, stroke, width=1):
    return ["Path",{"applyMatrix":True,"segments":[[x1,y1],[x2,y2]],
                    "closed":False,"strokeColor":stroke,"strokeWidth":width}]

# ---------------------------------------------------------------------------
# Scene asset builders
# ---------------------------------------------------------------------------

def balloon_paths(body_color):
    """Hot-air balloon shape centred at (0,0). Body goes –30..+50 in y."""
    paths = []
    # body
    paths.append(mkpath(p_oval(0, -10, 22, 32, body_color)))
    # highlight
    paths.append(mkpath(p_oval(-8, -20, 6, 10, [1,1,1,0.4])))
    # rigging lines
    for dx in [-10, 10]:
        paths.append(mkpath(p_line(dx, 22, 0, 38,  [0.3,0.3,0.3], 1)))
    # basket
    paths.append(mkpath(p_rect(-9, 38, 18, 12, [0.55,0.27,0.07])))
    return paths

def cloud_paths():
    """Fluffy cloud shape centred at (0,0), roughly 90px wide."""
    col = [1,1,1,0.88]
    paths = []
    for cx,cy,r in [(-25,5,18),(-5,-5,22),(15,5,18),(35,-3,16),(52,5,14)]:
        paths.append(mkpath(p_circle(cx,cy,r,col)))
    # fill bottom gap
    paths.append(mkpath(p_rect(-30, 0, 95, 22, col)))
    return paths

def tree_silhouette(base_x, base_y, trunk_w=10, trunk_h=42, canopy_rx=22, canopy_ry=30):
    """Simple tree: trunk + round canopy, base at (base_x, base_y)."""
    dark_green = [0.18, 0.42, 0.14]
    brown      = [0.36, 0.22, 0.10]
    paths = []
    paths.append(mkpath(p_rect(base_x - trunk_w//2, base_y - trunk_h, trunk_w, trunk_h, brown)))
    paths.append(mkpath(p_oval(base_x, base_y - trunk_h - canopy_ry + 8,
                               canopy_rx, canopy_ry, dark_green)))
    return paths

# ---------------------------------------------------------------------------
# Build the project
# ---------------------------------------------------------------------------

W, H   = 480, 270
FRAMES = 90          # 3 seconds @ 30 fps
ROOT_UUID = uid()

# ── BACKGROUND LAYER ──────────────────────────────────────────────────────
sky_col   = [0.529, 0.808, 0.922]
sky_lo    = [0.678, 0.847, 0.902]

bg_paths  = []
bg_paths.append(mkpath(p_rect(-240,-135, W, H//2,    sky_col)))          # upper sky
bg_paths.append(mkpath(p_rect(-240,   0, W, 135,     sky_lo)))           # lower sky
bg_paths.append(mkpath(p_circle(145, -92, 52, [1,0.96,0.52,0.25])))      # sun glow
bg_paths.append(mkpath(p_circle(145, -92, 34, [1,0.90,0.13])))           # sun

# distant hills
bg_paths.append(mkpath(p_oval(-110, 120, 175, 75, [0.33,0.58,0.22])))
bg_paths.append(mkpath(p_oval(  95, 125, 210, 85, [0.29,0.53,0.19])))

# ground
bg_paths.append(mkpath(p_rect(-240, 108, W, 30, [0.40,0.65,0.26])))

# background trees
for bx, by in [(-195,108),(-155,104),(168,108),(210,104)]:
    bg_paths.extend(tree_silhouette(bx, by))

bg_layer = mklayer("Background", [mkframe(1, FRAMES, paths=bg_paths)])

# ── BALLOON LAYERS ─────────────────────────────────────────────────────────
# 3 balloons at different x positions; staggered starting y for seamless loop:
#   total travel: y = 210  →  y = -210  (420 px)
#   stagger by 1/3 so they're evenly spaced at frame 1
#   Red   starts at y = +210 (just off bottom)
#   Blue  starts at y = +210 - 140 = +70  (lower middle)
#   Yellow starts at y = +210 - 280 = -70 (upper middle)

RED    = [0.90, 0.20, 0.20]
BLUE   = [0.20, 0.40, 0.90]
YELLOW = [1.00, 0.85, 0.10]

def balloon_layer(name, color, start_x, start_y, end_x=-999):
    if end_x == -999:
        end_x = start_x + 4   # slight horizontal drift
    clip = mkclip(balloon_paths(color))
    f = mkframe(1, FRAMES, clips=[clip],
                tweens=[tween(1,      x=start_x, y=start_y, easing="none"),
                        tween(FRAMES, x=end_x,   y=-210,    easing="none")])
    return mklayer(name, [f])

blayer_red    = balloon_layer("Balloon Red",    RED,    -80,  210,  -76)
blayer_blue   = balloon_layer("Balloon Blue",   BLUE,    20,   70,   24)
blayer_yellow = balloon_layer("Balloon Yellow", YELLOW, 105,  -70,  109)

# ── FOREGROUND CLOUD LAYERS ────────────────────────────────────────────────
# Two clouds drift from left to right at different heights/speeds

def cloud_layer(name, start_x, start_y, end_x, end_y):
    clip = mkclip(cloud_paths())
    f = mkframe(1, FRAMES, clips=[clip],
                tweens=[tween(1,      x=start_x, y=start_y),
                        tween(FRAMES, x=end_x,   y=end_y)])
    return mklayer(name, [f])

clayer1 = cloud_layer("Cloud Front 1", -300, -48,  350, -48)   # full cross
clayer2 = cloud_layer("Cloud Front 2",  -80,  30,  350,  30)   # starts mid-screen

# ── ASSEMBLE ROOT CLIP ─────────────────────────────────────────────────────
# Layer order in array = render order (index 0 = bottom)
layers = [
    bg_layer,
    blayer_red,
    blayer_blue,
    blayer_yellow,
    clayer1,
    clayer2,
]

root_clip = {
    "classname":"Clip","identifier":"root","uuid":ROOT_UUID,
    "transform":xform(),"isRoot":True,
    "timeline":{"classname":"Timeline","layers":layers,"playheadPosition":1}
}

project = {
    "classname":"Project",
    "backgroundColor":"#87CEEB",
    "framerate":30,
    "width":W,
    "height":H,
    "name":"Balloon Scene",
    "zoom":1,
    "pan":{"x":0,"y":0},
    "assets":[],
    "focus":ROOT_UUID,
    "root":root_clip,
    "selection":{"classname":"Selection","uuids":[]},
    "clipboard":{"classname":"Clipboard","clipboardFrames":[],"copyType":None},
    "history":{"classname":"History","undoStack":[],"redoStack":[]},
    "tools":{},
    "tool":"cursor",
    "toolSettings":{
        "fillColor":{"classname":"Color","r":0,"g":0,"b":0,"a":1},
        "strokeColor":{"classname":"Color","r":0,"g":0,"b":0,"a":1},
        "strokeWidth":1,"brushSize":10,"brushSmoothing":0.9,
        "brushStabilizerWeight":0.8,"eraserSize":10,"fillCursorSize":10,
        "textFontFamily":"courier","textFontSize":20,"textStrokeWidth":0
    },
    "onionSkinEnabled":False,
    "onionSkinSeekForwards":1,
    "onionSkinSeekBackwards":1
}

# Write .wick file (ZIP with project.json inside)
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("project.json", json.dumps(project, indent=2))

out_path = "balloon_scene.wick"
with open(out_path, "wb") as f:
    f.write(buf.getvalue())

print(f"Created {out_path}  ({len(buf.getvalue())} bytes)")
