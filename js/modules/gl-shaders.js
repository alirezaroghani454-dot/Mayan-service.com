/* ==========================================================================
   مایان سرویس — js/modules/gl-shaders.js
   شیدرهای فلز طلایی (محیط پروسیجرال، بدون تکسچر) و ذرات درخشان
   ========================================================================== */
(function (root) {
  'use strict';
  var GL = root.MayanGL = root.MayanGL || {};

  GL.MESH_VS = [
    'attribute vec3 aPos; attribute vec3 aNormal;',
    'uniform mat4 uModel; uniform mat4 uViewProj;',
    'varying vec3 vN; varying vec3 vW;',
    'void main(){',
    '  vec4 w = uModel * vec4(aPos, 1.0);',
    '  vW = w.xyz; vN = (uModel * vec4(aNormal, 0.0)).xyz;',
    '  gl_Position = uViewProj * w;',
    '}'
  ].join('\n');

  GL.MESH_FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'varying vec3 vN; varying vec3 vW;',
    'uniform vec3 uCam; uniform vec3 uBase; uniform float uMetal; uniform float uEmis; uniform float uTime;',
    // محیط استودیویی ساختگی: گرادیان گرم/سرمه‌ای + سافت‌باکس‌ها
    'vec3 env(vec3 r){',
    '  vec3 c = mix(vec3(0.07,0.12,0.26), vec3(0.8,0.62,0.4), smoothstep(-0.1, 0.95, r.y));',
    '  c = mix(c, vec3(0.05,0.03,0.015), smoothstep(0.0, -0.75, r.y));',
    '  vec3 l1 = normalize(vec3(-0.55,0.7,0.55)); c += vec3(1.5,1.2,0.8) * smoothstep(0.84, 0.97, dot(r,l1));',
    '  vec3 l2 = normalize(vec3(0.8,0.25,0.35));  c += vec3(0.45,0.75,1.5) * smoothstep(0.88, 0.985, dot(r,l2));',
    '  vec3 l3 = normalize(vec3(0.1,-0.35,0.9));  c += vec3(0.55,0.38,0.14) * smoothstep(0.6, 1.0, dot(r,l3));',
    '  c += 0.14 * smoothstep(0.35, 0.5, abs(sin(r.x*3.2 + r.y*2.2 + uTime*0.15)));',
    '  return c;',
    '}',
    'void main(){',
    '  vec3 N = normalize(vN); vec3 V = normalize(uCam - vW);',
    '  if (dot(N, V) < 0.0) N = -N;',
    '  vec3 R = reflect(-V, N);',
    '  float ndv = max(dot(N, V), 0.0);',
    '  vec3 fres = uBase + (1.0 - uBase) * pow(1.0 - ndv, 5.0);',
    '  vec3 spec = env(R) * fres * 0.85;',
    '  vec3 L = normalize(vec3(-0.4, 0.7, 0.6));',
    '  float diff = max(dot(N, L), 0.0) * 0.65 + 0.2;',
    '  vec3 col = mix(uBase * diff, spec, uMetal) + spec * (1.0 - uMetal) * 0.3 + uBase * uEmis;',
    '  col = 1.0 - exp(-col * 1.0);',
    '  col = pow(col, vec3(1.0 / 2.2));',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  GL.PART_VS = [
    'attribute vec4 aSeed;',   // xyz = موقعیت پایه، w = بذر
    'uniform mat4 uViewProj; uniform float uTime; uniform float uScale;',
    'varying float vTw;',
    'void main(){',
    '  vec3 p = aSeed.xyz;',
    '  float s = aSeed.w * 6.2831;',
    '  p.y += sin(uTime * 0.45 + s) * 0.22; p.x += cos(uTime * 0.3 + s * 1.7) * 0.12;',
    '  vec4 c = uViewProj * vec4(p, 1.0);',
    '  gl_Position = c;',
    '  vTw = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.6 + s * 3.0));',
    '  gl_PointSize = (2.5 + aSeed.w * 7.0) * uScale / max(c.w, 0.5);',
    '}'
  ].join('\n');

  GL.PART_FS = [
    'precision mediump float;',
    'varying float vTw;',
    'void main(){',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.0, d) * vTw;',
    '  gl_FragColor = vec4(vec3(1.0, 0.84, 0.45) * a, a);',
    '}'
  ].join('\n');
})(window);
