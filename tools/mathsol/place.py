# Places math answers on page images next to their exercise numbers.
# usage: python -I place.py <pdf> <img_dir> <answers.txt> <book_key> <out.js> [preview_dir]
# answers.txt:
#   @19                      page (PDF index, 1-based)
#   12 | answer              exercise number on that page (k-th occurrence: 12#2)
#   12 | answer | question   optional question label
#   [x0,y0,x1,y1,rows] | label | answer   manual box in percent
#   - label | answer         listed under the page
#   # comment
import sys, re, json, pymupdf, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image

pdf, imgdir, src, key, out = sys.argv[1:6]
prev = sys.argv[6] if len(sys.argv) > 6 else None
import os; DEBUG = os.environ.get("DBG") == "1"
doc = pymupdf.open(pdf)
AR = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")

def labels(pno):
    p = doc[pno - 1]; W, H = p.rect.width, p.rect.height
    nums, lines = [], []
    for b in p.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            x0, y0, x1, y1 = l["bbox"]
            lines.append((x0 / W * 100, y0 / H * 100, x1 / W * 100, y1 / H * 100))
            for s in l["spans"]:
                raw = s["text"]; t = raw.strip()
                m = re.match(r"(\d{1,3})(?:\s|$)", t)
                if "ManalBLack" in s["font"] and m and "مث" not in t and 0.019 < (s["bbox"][3] - s["bbox"][1]) / H < 0.026:
                    a, b_, c, d = s["bbox"]
                    if m.group(0).strip() != t: a = c - 1.75 / 100 * W
                    nums.append((m.group(1), a / W * 100, b_ / H * 100, c / W * 100, d / H * 100))
                    continue
                L = r"(أ|ب|جـ|ج|د|هـ|و|ز|ح|ط|ي)"
                m = re.search(r"(?:^|[\s:�])" + L + r"\)", t) or re.search(r"\)\s*" + L + r"\s*$", t) or re.fullmatch(r"\s*	[	 ]*" + L + r"\s*", raw)
                if m:
                    a, b_, c, d = s["bbox"]
                    nums.append((m.group(1).replace("جـ", "ج"), c / W * 100 - 2.2, b_ / H * 100, c / W * 100, d / H * 100))
    nums.sort(key=lambda n: (round(n[2]), -n[1]))
    return nums, lines

def ink(pno):
    im = np.asarray(Image.open(f"{imgdir}/{pno:03d}.webp").convert("RGB")).astype(int)
    return im.min(axis=2) < 215, im.shape[1], im.shape[0]

def place(pno, num, k, ans, short, nums, lines, mask, Wp, Hp):
    X = lambda v: int(round(v / 100 * Wp)); Y = lambda v: int(round(v / 100 * Hp))
    cand = [n for n in nums if n[0] == num]
    if isinstance(k, float): cand.sort(key=lambda n: abs(n[2] - k)); k = 1
    elif k == 0:
        if len(cand) > 1: print(f"  ! p{pno} {num}: {len(cand)} matches at y", [round(n[2]) for n in cand])
        k = 1
    if len(cand) < k: return "notfound"
    t, nx0, ny0, nx1, ny1 = cand[k - 1]
    # left limit: nearest number to the left on the same row
    left = 6.5
    for m in nums:
        if abs(m[2] - ny0) < 1.2 and m[3] < nx0 - 1: left = max(left, m[3] + 0.6)
    # next exercise below in the same column
    # next block below that covers this column (same column or a label further right)
    nexty = min([m[2] for m in nums if m[3] >= nx0 - 1 and m[2] > ny0 + 1] + [92])
    rows = [(ny0 - 0.3, ny1 + 0.3)]
    for (x0, y0, x1, y1) in sorted(lines, key=lambda l: l[1]):
        if y0 > ny0 + 1.0 and ny1 < y0 + 1.0 and y1 < nexty + 0.3 and nx0 - 3 <= x1 <= nx0 + 0.6 and x0 >= left - 1:
            if y0 + 0.5 - rows[-1][1] > 1.6: break
            rows.append((y0 + 0.5, y1 - 0.5))
    ry0, ry1 = rows[-1]
    band = mask[Y(ry0 + 0.45):Y(ry1 - 0.45), :]
    col = band.any(axis=0)
    # content left edge: from the PDF text lines on this row, else from the ink
    pdfx = [x0 for (x0, y0, x1, y1) in lines
            if min(y1, ry1) - max(y0, ry0) > 0.5 * (ry1 - ry0) and nx0 - 3 <= x1 <= nx0 + 0.6 and x0 >= left - 0.5]
    x = X(nx0) - 2; gap = 0; cl = X(nx0)
    while x > X(left):
        if col[x]: cl = x; gap = 0
        else:
            gap += 1
            if gap > X(3): break
        x -= 1
    if pdfx: cl = min(cl, X(min(pdfx)))
    xr = cl - X(1.2)
    x = xr
    while x > X(left) and not col[x]: x -= 1
    fl = x / Wp * 100 + 1.0; fr = xr / Wp * 100
    same = [round(fl, 1), round(ry0, 2), round(fr, 1), round(ry1, 2), 1]
    wsame = fr - fl
    # below the last line
    y = Y(ry1) + 2; blank = 0
    region = mask[:, X(left):X(nx1)]
    while y < min(Hp - 1, Y(nexty) + 2) and not region[y].any(): y += 1; blank += 1
    gh = blank / Hp * 100
    below = None
    if gh >= 2.2 and nx0 - 0.5 - (left + 1) >= 5:
        r = 1 if gh < 5.6 else min(3, int(gh / 2.6))
        top = ry1 + 0.15
        below = [round(left + 1, 1), round(top, 2), round(nx0 - 0.5, 1), round(top + min(r * 2.6, gh - 0.35), 2), r]
    if DEBUG: print("   dbg", pno, num, "rows", [(round(a,1),round(b,1)) for a,b in rows], "left", round(left,1), "cl", round(cl/Wp*100,1), "free", round(fl,1), round(fr,1), "w", round(wsame,1), "gap", round(gh,1), "nexty", round(nexty,1))
    need = lambda a: len(a) * 0.8
    if wsame >= need(ans) and wsame >= 2.5: return same, ans
    if below and (below[4] > 1 or (below[2] - below[0]) >= need(ans) * 0.7): return below, ans
    if short and wsame >= max(2.5, need(short)): return same, short
    if below: return below, ans
    if wsame >= max(6, need(ans) * 0.55): return same, ans
    return None, ans

pages, cur, grids = {}, None, {}
for raw in open(src, encoding="utf-8"):
    line = raw.rstrip("\n")
    if not line.strip() or line.lstrip().startswith("#"): continue
    if line.startswith("@"): cur = int(line[1:]); pages.setdefault(cur, []); grids.clear(); continue
    if line.startswith("!grid"):
        _, name, rest = line.split(None, 2); xs, ys = rest.split(";")
        grids[name] = ([float(v) for v in xs.split(",")], [float(v) for v in ys.split(",")]); continue
    gm = re.match(r"(\w+)\[(\d+),(\d+)\]\s*\|", line)
    if gm and gm.group(1) in grids:
        xs, ys = grids[gm.group(1)]; rr, cc = int(gm.group(2)), int(gm.group(3))
        bx = [round(xs[cc] + 0.3, 2), round(ys[rr - 1] + 0.25, 2), round(xs[cc - 1] - 0.3, 2), round(ys[rr] - 0.25, 2), 1, 2]
        line = json.dumps(bx) + line[gm.end() - 1:]
    parts = [s.strip().replace(r"\n", "\n") for s in line.split("|")]
    pages[cur].append(parts)

res, miss = {}, []
for pno, items in pages.items():
    nums, lines = labels(pno); mask, Wp, Hp = ink(pno); outl = []
    for it in items:
        head = it[0]
        if head == "-":
            outl.append([it[1], it[2]]); continue
        if head.startswith("["):
            bx = json.loads(head); outl.append([it[1], it[2], bx]); continue
        if "@" in head: num, _, k = head.partition("@"); k = float(k)
        else: num, _, k = head.partition("#"); k = int(k or 0)
        ans = it[1]; q = it[2] if len(it) > 2 else (f"تمرين {num.translate(AR)}" if num.isdigit() else f"تحقق من فهمك ({num})")
        short = None
        if "‖" in ans: ans, short = [v.strip() for v in ans.split("‖")]
        elif re.match(r"(أ|ب|جـ|ج|د)\)", ans): short = re.match(r"(أ|ب|جـ|ج|د)\)", ans).group(0)
        elif "=" in ans: short = ans.split("=")[-1].strip()
        elif "←" in ans and ans.count("←") == 1: short = ans.split("←")[-1].strip()
        got = place(pno, num, k, ans, short, nums, lines, mask, Wp, Hp)
        if got == "notfound": miss.append((pno, num, "?")); outl.append([q, ans]); continue
        bx, txt = got
        if bx is None: miss.append((pno, num)); outl.append([q, ans])
        elif txt != ans: outl.append([q, txt, bx, ans])
        else: outl.append([q, ans, bx])
    res[pno] = outl

with open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write("/* حلول الرياضيات (الفصل الدراسي الأول) — [السؤال, الحل, مكانه على الصفحة: يسار%, أعلى%, يمين%, أسفل%, عدد السطور] */\n")
    f.write(f"Object.assign(SOL.{key},{{\n")
    f.write(",\n".join(f"{p}:[\n" + ",\n".join(json.dumps(x, ensure_ascii=False) for x in v) + "\n]" for p, v in sorted(res.items())))
    f.write("\n});\n")
print("pages", len(res), "items", sum(len(v) for v in res.values()), "unplaced", miss)

if prev:
    from PIL import ImageDraw
    for pno, v in res.items():
        im = Image.open(f"{imgdir}/{pno:03d}.webp").convert("RGB"); d = ImageDraw.Draw(im)
        for x in v:
            if len(x) >= 3 and isinstance(x[2], list):
                b = x[2]; d.rectangle([b[0] / 100 * im.width, b[1] / 100 * im.height, b[2] / 100 * im.width, b[3] / 100 * im.height], outline=(0, 90, 255), width=3)
        im.resize((im.width // 2, im.height // 2)).save(f"{prev}/{pno:03d}.png")
