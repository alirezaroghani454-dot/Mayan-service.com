/* ==========================================================================
   مایان سرویس — js/modules/gl-math.js
   ریاضیات ماتریس و ساخت مش سه‌بعدی (اکستروژن با پخ، تورus، کره) — بدون Three.js
   ========================================================================== */
(function (root) {
  'use strict';
  var GL = root.MayanGL = root.MayanGL || {};

  /* ---------- ماتریس 4×4 (ستون‌محور) ---------- */
  GL.mat = {
    ident: function () { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    mul: function (a, b) {
      var o = new Float32Array(16);
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
        var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s;
      }
      return o;
    },
    persp: function (fovy, asp, n, f) {
      var t = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
      o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o;
    },
    trans: function (x, y, z) { var o = GL.mat.ident(); o[12] = x; o[13] = y; o[14] = z; return o; },
    scale: function (s) { var o = GL.mat.ident(); o[0] = o[5] = o[10] = s; return o; },
    rx: function (a) { var c = Math.cos(a), s = Math.sin(a), o = GL.mat.ident(); o[5] = c; o[6] = s; o[9] = -s; o[10] = c; return o; },
    ry: function (a) { var c = Math.cos(a), s = Math.sin(a), o = GL.mat.ident(); o[0] = c; o[2] = -s; o[8] = s; o[10] = c; return o; },
    rz: function (a) { var c = Math.cos(a), s = Math.sin(a), o = GL.mat.ident(); o[0] = c; o[1] = s; o[4] = -s; o[5] = c; return o; },
    chain: function () { var m = arguments[0]; for (var i = 1; i < arguments.length; i++) m = GL.mat.mul(m, arguments[i]); return m; }
  };

  /* ---------- مثلث‌بندی چندضلعی (Ear Clipping) ---------- */
  function area2(p) { var a = 0; for (var i = 0, n = p.length; i < n; i++) { var q = p[(i + 1) % n]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a; }
  function inTri(p, a, b, c) {
    var d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
    var d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]);
    var d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
    var neg = d1 < -1e-9 || d2 < -1e-9 || d3 < -1e-9, pos = d1 > 1e-9 || d2 > 1e-9 || d3 > 1e-9;
    return !(neg && pos);
  }
  GL.triangulate = function (pts) {
    var V = pts.map(function (_, i) { return i; }), idx = [], guard = 0;
    while (V.length > 3 && guard++ < 5000) {
      var found = false;
      for (var i = 0; i < V.length; i++) {
        var i0 = V[(i + V.length - 1) % V.length], i1 = V[i], i2 = V[(i + 1) % V.length];
        var a = pts[i0], b = pts[i1], c = pts[i2];
        if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) <= 1e-9) continue;
        var bad = false;
        for (var j = 0; j < V.length; j++) { var k = V[j]; if (k === i0 || k === i1 || k === i2) continue; if (inTri(pts[k], a, b, c)) { bad = true; break; } }
        if (bad) continue;
        idx.push(i0, i1, i2); V.splice(i, 1); found = true; break;
      }
      if (!found) { idx.push(V[0], V[1], V[2]); V.splice(1, 1); }
    }
    if (V.length === 3) idx.push(V[0], V[1], V[2]);
    return idx;
  };

  /* ---------- اکستروژن چندضلعی با پخ گرد ----------
     خروجی: { v: Float32Array[x,y,z,nx,ny,nz...], i: Uint16Array } */
  GL.extrude = function (outline, depth, bevel, steps) {
    var pts = outline.map(function (p) { return [p[0], p[1]]; });
    if (area2(pts) < 0) pts.reverse();
    var n = pts.length; steps = steps || 3;
    bevel = Math.min(bevel, depth * 0.45);
    var zs = depth / 2 - bevel, en = [], mit = [], i;
    for (i = 0; i < n; i++) {
      var a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      en.push([dy / len, -dx / len]);
    }
    for (i = 0; i < n; i++) {
      var pr = en[(i + n - 1) % n], nx = en[i], dt = pr[0] * nx[0] + pr[1] * nx[1], k = 1 / (1 + dt);
      var mx = (pr[0] + nx[0]) * k, my = (pr[1] + nx[1]) * k, ml = Math.hypot(mx, my);
      if (ml > 2.2) { mx *= 2.2 / ml; my *= 2.2 / ml; }
      mit.push([mx, my]);
    }
    var SMOOTH = 0.76, V = [], I = [];
    function nrm(x, y, z) { var l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; }
    function vtxN(e, atStart) {           // نرمال ۲بعدی در رأس (نرم یا تیز)
      var cur = en[e], oth = atStart ? en[(e + n - 1) % n] : en[(e + 1) % n];
      if (cur[0] * oth[0] + cur[1] * oth[1] > SMOOTH) { var l = Math.hypot(cur[0] + oth[0], cur[1] + oth[1]) || 1; return [(cur[0] + oth[0]) / l, (cur[1] + oth[1]) / l]; }
      return cur;
    }
    function push(p, nn) { V.push(p[0], p[1], p[2], nn[0], nn[1], nn[2]); return V.length / 6 - 1; }
    function quad(p0, n0, p1, n1, p2, n2, p3, n3) {
      var a = push(p0, n0), b = push(p1, n1), c = push(p2, n2), d = push(p3, n3); I.push(a, b, c, a, c, d);
    }
    function ringPos(vi, th, sgn) {
      var o = bevel * (1 - Math.cos(th)), z = (zs + bevel * Math.sin(th)) * sgn;
      return [pts[vi][0] - mit[vi][0] * o, pts[vi][1] - mit[vi][1] * o, z];
    }
    for (var e = 0; e < n; e++) {
      var e2 = (e + 1) % n, ns = vtxN(e, true), ne = vtxN(e, false);
      // دیواره‌ی صاف
      quad([pts[e][0], pts[e][1], -zs], [ns[0], ns[1], 0], [pts[e2][0], pts[e2][1], -zs], [ne[0], ne[1], 0],
           [pts[e2][0], pts[e2][1], zs], [ne[0], ne[1], 0], [pts[e][0], pts[e][1], zs], [ns[0], ns[1], 0]);
      // پخ جلو و عقب
      for (var sgn = -1; sgn <= 1; sgn += 2) for (var s = 0; s < steps; s++) {
        var t0 = s / steps * Math.PI / 2, t1 = (s + 1) / steps * Math.PI / 2;
        function N(v2, t) { return nrm(v2[0] * Math.cos(t), v2[1] * Math.cos(t), sgn * Math.sin(t)); }
        quad(ringPos(e, t0, sgn), N(ns, t0), ringPos(e2, t0, sgn), N(ne, t0), ringPos(e2, t1, sgn), N(ne, t1), ringPos(e, t1, sgn), N(ns, t1));
      }
    }
    // سطح‌های جلو و عقب (چندضلعی کوچک‌شده)
    var inner = pts.map(function (p, j) { return [p[0] - mit[j][0] * bevel, p[1] - mit[j][1] * bevel]; });
    var tri = GL.triangulate(inner);
    for (var sg = -1; sg <= 1; sg += 2) {
      var base = V.length / 6;
      inner.forEach(function (p) { push([p[0], p[1], sg * depth / 2], [0, 0, sg]); });
      for (var q = 0; q < tri.length; q++) I.push(base + tri[q]);
    }
    return { v: new Float32Array(V), i: new Uint16Array(I) };
  };

  /* ---------- شکل‌ها ---------- */
  function cubic(p0, p1, p2, p3, n) {
    var out = [];
    for (var i = 1; i <= n; i++) {
      var t = i / n, u = 1 - t;
      out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
                u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
    }
    return out;
  }
  /** سپر (هم‌شکل لوگو) به ارتفاع حدود ۲ واحد */
  GL.shieldOutline = function (k) {
    var s = (k || 1) * 2 / 72, raw = [[32, 3], [58, 12], [58, 34]];
    raw = raw.concat(cubic([58, 34], [58, 51], [47, 62], [32, 69], 16), cubic([32, 69], [17, 62], [6, 51], [6, 34], 16), [[6, 12]]);
    return raw.map(function (p) { return [(p[0] - 32) * s, -(p[1] - 36) * s]; });
  };
  /** حرف M */
  GL.letterM = function (k) {
    var s = (k || 1) * 2 / 72, raw = [[19, 46], [19, 25.5], [25.5, 24], [32, 36], [38.5, 24], [45, 25.5], [45, 46], [39.8, 46], [39.8, 31.5], [32, 44.5], [24.2, 31.5], [24.2, 46]];
    return raw.map(function (p) { return [(p[0] - 32) * s, -(p[1] - 36) * s]; });
  };
  /** چرخ‌دنده */
  GL.gearOutline = function (teeth, rOut, rIn) {
    var pts = [], w = Math.PI * 2 / teeth;
    for (var i = 0; i < teeth; i++) {
      var a = i * w;
      [[-0.46, rIn], [-0.26, rOut], [0.26, rOut], [0.46, rIn]].forEach(function (t) { pts.push([Math.cos(a + t[0] * w) * t[1], Math.sin(a + t[0] * w) * t[1]]); });
    }
    return pts;
  };
  GL.disc = function (r, seg) {
    var pts = []; for (var i = 0; i < seg; i++) { var a = i / seg * Math.PI * 2; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } return pts;
  };
  /** تورس (حلقه) */
  GL.torus = function (R, r, seg, sides) {
    var V = [], I = [], i, j;
    for (i = 0; i <= seg; i++) {
      var u = i / seg * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u);
      for (j = 0; j <= sides; j++) {
        var v = j / sides * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v);
        V.push((R + r * cv) * cu, (R + r * cv) * su, r * sv, cv * cu, cv * su, sv);
      }
    }
    for (i = 0; i < seg; i++) for (j = 0; j < sides; j++) {
      var a = i * (sides + 1) + j, b = a + sides + 1; I.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return { v: new Float32Array(V), i: new Uint16Array(I) };
  };
  /** کره */
  GL.sphere = function (r, seg, rings) {
    var V = [], I = [], i, j;
    for (i = 0; i <= rings; i++) {
      var p = i / rings * Math.PI, sp = Math.sin(p), cp = Math.cos(p);
      for (j = 0; j <= seg; j++) { var t = j / seg * Math.PI * 2; V.push(r * sp * Math.cos(t), r * cp, r * sp * Math.sin(t), sp * Math.cos(t), cp, sp * Math.sin(t)); }
    }
    for (i = 0; i < rings; i++) for (j = 0; j < seg; j++) { var a = i * (seg + 1) + j, b = a + seg + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
    return { v: new Float32Array(V), i: new Uint16Array(I) };
  };
})(window);
