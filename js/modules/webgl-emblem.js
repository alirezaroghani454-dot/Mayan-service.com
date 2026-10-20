/* ==========================================================================
   مایان سرویس — js/modules/webgl-emblem.js
   نشان سه‌بعدی طلایی (سپر + حرف M + چرخ‌دنده + حلقه‌های مداری + ذرات) با WebGL خام
   • کشیدن با انگشت/ماوس برای چرخاندن • حرکت خودکار • توقف خودکار خارج از صفحه
   ========================================================================== */
(function (root) {
  'use strict';
  var M = root.Mayan, GL = root.MayanGL, mat = GL.mat;
  var E = M.emblem = { ok: false };

  E.init = function () {
    var cv = document.getElementById('emblemCanvas'); if (!cv) return false;
    var gl = null;
    try { gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }) || cv.getContext('experimental-webgl'); } catch (e) {}
    if (!gl) return false;

    function compile(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function program(vs, fs) {
      var p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }

    var mesh, part, uM = {}, uP = {};
    try {
      mesh = program(GL.MESH_VS, GL.MESH_FS); part = program(GL.PART_VS, GL.PART_FS);
    } catch (err) { if (root.console) console.warn('WebGL shader error:', err.message); return false; }
    ['uModel', 'uViewProj', 'uCam', 'uBase', 'uMetal', 'uEmis', 'uTime'].forEach(function (n) { uM[n] = gl.getUniformLocation(mesh, n); });
    ['uViewProj', 'uTime', 'uScale'].forEach(function (n) { uP[n] = gl.getUniformLocation(part, n); });
    var aPos = gl.getAttribLocation(mesh, 'aPos'), aNor = gl.getAttribLocation(mesh, 'aNormal'), aSeed = gl.getAttribLocation(part, 'aSeed');

    /* ---------- ساخت مش‌ها ---------- */
    function upload(g) {
      var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, g.v, gl.STATIC_DRAW);
      var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.i, gl.STATIC_DRAW);
      return { vb: vb, ib: ib, n: g.i.length };
    }
    var GOLD = [1.0, 0.78, 0.34], NAVY = [0.05, 0.14, 0.34], DEEP = [0.03, 0.08, 0.2];
    var gShieldOuter = upload(GL.extrude(GL.shieldOutline(1.0), 0.36, 0.07, 3));
    var gShieldInner = upload(GL.extrude(GL.shieldOutline(0.84), 0.42, 0.05, 3));
    var gLetter = upload(GL.extrude(GL.letterM(0.84), 0.5, 0.035, 2));
    var gGear = upload(GL.extrude(GL.gearOutline(16, 1.62, 1.42), 0.14, 0.03, 2));
    var gGearDisc = upload(GL.extrude(GL.disc(1.28, 64), 0.18, 0.03, 2));
    var gRing1 = upload(GL.torus(2.05, 0.028, 120, 10)), gRing2 = upload(GL.torus(1.78, 0.02, 120, 8));
    var gBead = upload(GL.sphere(0.075, 18, 12));

    /* ---------- ذرات ---------- */
    var PN = M.isTouch() ? 70 : 140, pd = new Float32Array(PN * 4);
    for (var i = 0; i < PN; i++) {
      var a = Math.random() * 6.283, r = 1.4 + Math.random() * 2.3;
      pd[i * 4] = Math.cos(a) * r; pd[i * 4 + 1] = (Math.random() - 0.5) * 3.8; pd[i * 4 + 2] = Math.sin(a) * r * 0.7 - 0.5; pd[i * 4 + 3] = Math.random();
    }
    var pbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferData(gl.ARRAY_BUFFER, pd, gl.STATIC_DRAW);

    /* ---------- وضعیت و اندازه ---------- */
    var W = 1, H = 1, dpr = 1, camZ = 5.6, proj, viewProj, visible = true, raf = 0, t0 = performance.now();
    var yaw = 0, pitch = 0, vyaw = 0, drag = false, lastX = 0, lastY = 0, hoverX = 0, hoverY = 0, reduced = M.reducedMotion();

    function resize() {
      dpr = Math.min(root.devicePixelRatio || 1, M.isTouch() ? 1.75 : 2);
      var w = cv.clientWidth || 300, h = cv.clientHeight || 300;
      W = Math.round(w * dpr); H = Math.round(h * dpr); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H);
      var asp = w / h; camZ = 6.9 * Math.max(1, 0.95 / asp);
      proj = mat.persp(38 * Math.PI / 180, asp, 0.1, 40);
      viewProj = mat.mul(proj, mat.trans(0, 0, -camZ));
      if (reduced) draw(performance.now());
    }

    function drawMesh(g, model, base, metal, emis, time) {
      gl.bindBuffer(gl.ARRAY_BUFFER, g.vb); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(aNor); gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 24, 12);
      gl.uniformMatrix4fv(uM.uModel, false, model); gl.uniform3fv(uM.uBase, base); gl.uniform1f(uM.uMetal, metal); gl.uniform1f(uM.uEmis, emis);
      gl.drawElements(gl.TRIANGLES, g.n, gl.UNSIGNED_SHORT, 0);
    }

    function draw(now) {
      var t = (now - t0) / 1000, intro = Math.min(t / 1.7, 1), ease = 1 - Math.pow(1 - intro, 4), pop = intro < 1 ? ease + Math.sin(intro * Math.PI) * 0.08 : 1;
      var autoYaw = reduced ? 0.25 : Math.sin(t * 0.55) * 0.42 + (1 - ease) * 6.283, autoPitch = reduced ? 0 : Math.sin(t * 0.4) * 0.07;
      if (!drag) { vyaw *= 0.94; yaw += vyaw; yaw *= 0.985; pitch *= 0.97; }
      var ry = autoYaw + yaw + hoverX * 0.35, rx = autoPitch + pitch + hoverY * 0.2;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(mesh);
      gl.uniformMatrix4fv(uM.uViewProj, false, viewProj); gl.uniform3f(uM.uCam, 0, 0, camZ); gl.uniform1f(uM.uTime, t);

      var float = reduced ? 0 : Math.sin(t * 0.9) * 0.06;
      var root3 = mat.chain(mat.trans(0, float, 0), mat.scale(pop), mat.ry(ry), mat.rx(rx));
      // چرخ‌دنده‌ی پشتی
      var gearM = mat.chain(root3, mat.trans(0, 0, -0.34), mat.rz(t * 0.18));
      drawMesh(gGear, gearM, GOLD, 1.0, 0.0, t);
      drawMesh(gGearDisc, mat.chain(root3, mat.trans(0, 0, -0.3), mat.rz(-t * 0.1)), DEEP, 0.7, 0.0, t);
      // سپر
      drawMesh(gShieldOuter, mat.chain(root3, mat.scale(1.08)), GOLD, 1.0, 0.0, t);
      drawMesh(gShieldInner, mat.chain(root3, mat.trans(0, 0, 0.0)), NAVY, 0.7, 0.0, t);
      drawMesh(gLetter, mat.chain(root3, mat.trans(0, 0.02, 0.16)), GOLD, 1.0, 0.04, t);
      // حلقه‌های مداری و مهره‌ها
      var r1 = mat.chain(root3, mat.rx(1.18), mat.rz(t * 0.35)), r2 = mat.chain(root3, mat.ry(1.1), mat.rx(0.5), mat.rz(-t * 0.5));
      drawMesh(gRing1, r1, GOLD, 1.0, 0.05, t); drawMesh(gRing2, r2, GOLD, 1.0, 0.05, t);
      for (var k = 0; k < 3; k++) {
        var ang = t * 0.9 + k * 2.094;
        drawMesh(gBead, mat.chain(r1, mat.trans(Math.cos(ang) * 2.05, Math.sin(ang) * 2.05, 0)), GOLD, 1.0, 0.25, t);
      }
      drawMesh(gBead, mat.chain(r2, mat.trans(Math.cos(-t * 1.3) * 1.78, Math.sin(-t * 1.3) * 1.78, 0)), GOLD, 1.0, 0.3, t);

      // ذرات درخشان
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(part); gl.uniformMatrix4fv(uP.uViewProj, false, mat.mul(viewProj, mat.ry(ry * 0.35)));
      gl.uniform1f(uP.uTime, t); gl.uniform1f(uP.uScale, H / 70);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.disableVertexAttribArray(aPos); gl.disableVertexAttribArray(aNor);
      gl.enableVertexAttribArray(aSeed); gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 16, 0);
      gl.drawArrays(gl.POINTS, 0, PN); gl.disableVertexAttribArray(aSeed);
    }

    function loop(now) { raf = 0; draw(now); if (visible && !document.hidden && !reduced) raf = requestAnimationFrame(loop); }
    function start() { if (!raf) raf = requestAnimationFrame(loop); }

    /* ---------- تعامل ---------- */
    cv.addEventListener('pointerdown', function (e) { drag = true; lastX = e.clientX; lastY = e.clientY; vyaw = 0; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      if (e.pointerType === 'mouse') { hoverX = ((e.clientX - r.left) / r.width - 0.5) * 2; hoverY = ((e.clientY - r.top) / r.height - 0.5) * 2; }
      if (!drag) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      yaw += dx * 0.012; vyaw = dx * 0.012; pitch = M.clamp(pitch + dy * 0.008, -0.6, 0.6);
      if (reduced) draw(performance.now());
    });
    function up() { drag = false; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', function () { hoverX = 0; hoverY = 0; });

    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); visible = false; document.getElementById('emblemFallback').hidden = false; cv.style.display = 'none'; });
    if ('IntersectionObserver' in root) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0.01 }).observe(cv);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    if ('ResizeObserver' in root) new ResizeObserver(M.debounce(resize, 80)).observe(cv); else root.addEventListener('resize', M.debounce(resize, 120));

    gl.enable(gl.DEPTH_TEST);
    resize(); start();
    E.ok = true; E.gl = gl;
    return true;
  };
})(window);
