window.GAME = {
  time: 0,
  timeScale: 1,
  started: false,
  paused: false,
  isTouch: false,
  settings: { pixelRatioCap: 2, bubbleRadius: 150, maxTraffic: 12, maxPeds: 18, maxParked: 14 }
};

function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

var U = {
  clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp: function (a, b, t) { return a + (b - a) * t; },
  damp: function (a, b, lambda, dt) { return U.lerp(a, b, 1 - Math.exp(-lambda * dt)); },
  wrapPI: function (a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  },
  angleLerp: function (a, b, t) { return a + U.wrapPI(b - a) * t; },
  dist2: function (ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; },
  dist: function (ax, az, bx, bz) { return Math.sqrt(U.dist2(ax, az, bx, bz)); },
  len: function (x, z) { return Math.sqrt(x * x + z * z); },
  randRange: function (rng, a, b) { return a + rng() * (b - a); },
  randInt: function (rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); },
  pick: function (rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
};

// ---------- shared render resources ----------
// The spawn bubble used to buy fresh geometries and materials for every car
// and ped it minted and throw them away on despawn — leak-free since the
// disposal fix, but a steady tax on the GC and the GPU upload path (the
// mobile spawn hitch). Everything here is immutable by convention: constant-
// dimension boxes, constant-color materials, and merged bodies whose color
// is baked into vertex data. They are built once, marked shared, and
// disposeTree leaves them alone. Anything that intends to MUTATE a material
// (the player's outfit, the wardrobe mirror) must build private ones.
var SHARED = { geo: {}, mat: {} };
function sharedBoxGeo(w, h, d) {
  var k = w + '|' + h + '|' + d;
  var g = SHARED.geo[k];
  if (!g) { g = new THREE.BoxGeometry(w, h, d); g.userData.shared = true; SHARED.geo[k] = g; }
  return g;
}
function sharedLambert(hex) {
  var k = 'L' + hex;
  var m = SHARED.mat[k];
  if (!m) { m = new THREE.MeshLambertMaterial({ color: hex }); m.userData.shared = true; SHARED.mat[k] = m; }
  return m;
}
function sharedBasic(hex) {
  var k = 'B' + hex;
  var m = SHARED.mat[k];
  if (!m) { m = new THREE.MeshBasicMaterial({ color: hex }); m.userData.shared = true; SHARED.mat[k] = m; }
  return m;
}
// the two vertex-color workhorses every merged body/glow rides on
function sharedVertexLambert() {
  var m = SHARED.mat.VL;
  if (!m) { m = new THREE.MeshLambertMaterial({ vertexColors: true }); m.userData.shared = true; SHARED.mat.VL = m; }
  return m;
}
function sharedVertexBasic() {
  var m = SHARED.mat.VB;
  if (!m) { m = new THREE.MeshBasicMaterial({ vertexColors: true }); m.userData.shared = true; SHARED.mat.VB = m; }
  return m;
}

// free a mesh/group's GPU resources before dropping it from the scene, so the
// spawn bubble doesn't leak geometries/materials for the whole session —
// shared registry entries stay: they are the whole point of the registry
function disposeTree(root) {
  if (!root) return;
  root.traverse(function (o) {
    if (o.geometry && o.geometry.dispose && !(o.geometry.userData && o.geometry.userData.shared)) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(function (m) { if (m && m.dispose && !(m.userData && m.userData.shared)) m.dispose(); });
      else if (o.material.dispose && !(o.material.userData && o.material.userData.shared)) o.material.dispose();
    }
  });
}

// Batches transformed boxes/quads into one BufferGeometry (vertex colors + tiled uvs).
//
// The vertices go straight into typed arrays that grow as they fill. They
// used to be gathered in plain arrays of doubles, twice the size of the
// floats they end up as, and copied across at build() while both were alive,
// with a few dozen small arrays thrown away for every box on the way:
// building the world peaked at some 250 MB of heap for 40 MB of geometry.
var NO_FLOATS = new Float32Array(0);
function GeoBatch() {
  this.n = 0;      // vertices written
  this.cap = 0;    // vertices the arrays have room for
  this.pos = NO_FLOATS; this.nrm = NO_FLOATS; this.col = NO_FLOATS; this.uv = NO_FLOATS;
  // Window light, per building (see addBox). Only a batch given a `light`
  // setting carries it, so every other mesh in the game is exactly as it was.
  this.light = null; this.lgt = NO_FLOATS; this.nl = 0;
}
function growFloats(a, len) { var b = new Float32Array(len); b.set(a); return b; }
// make room for k more vertices
GeoBatch.prototype.room = function (k) {
  if (this.n + k <= this.cap) return;
  var cap = Math.max(256, this.cap * 2, this.n + k);
  this.pos = growFloats(this.pos, cap * 3); this.nrm = growFloats(this.nrm, cap * 3);
  this.col = growFloats(this.col, cap * 3); this.uv = growFloats(this.uv, cap * 2);
  this.cap = cap;
};
GeoBatch.prototype.vert = function (x, y, z, nx, ny, nz, r, g, b, u, v) {
  var i = this.n++, i3 = i * 3, i2 = i * 2;
  var p = this.pos, q = this.nrm, c = this.col, t = this.uv;
  p[i3] = x; p[i3 + 1] = y; p[i3 + 2] = z;
  q[i3] = nx; q[i3 + 1] = ny; q[i3 + 2] = nz;
  c[i3] = r; c[i3 + 1] = g; c[i3 + 2] = b;
  t[i2] = u; t[i2 + 1] = v;
};
// window light for the vertex just written
GeoBatch.prototype.winLight = function (a, b, c) {
  var j = this.nl * 3;
  if (j + 3 > this.lgt.length) this.lgt = growFloats(this.lgt, Math.max(768, this.lgt.length * 2));
  this.lgt[j] = a; this.lgt[j + 1] = b; this.lgt[j + 2] = c;
  this.nl++;
};
// A box's faces, +x -x +y -y +z -z: for each, its four corners as signs on
// the half sizes, its normal, and which two of the box's sizes its texture
// spans across and up (0 x, 1 y, 2 z). A quad's corners go down as two
// triangles in QUAD_TRIS order, corner k taking the uv (QUAD_U[k], QUAD_V[k])
// of its rectangle.
var BOX_CORNER = [
  1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1,
  -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
  -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,
  -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
  -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
  1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1
];
var BOX_NORMAL = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
var BOX_SPAN = [2, 1, 2, 1, 0, 2, 0, 2, 0, 1, 0, 1];
var QUAD_TRIS = [0, 1, 2, 0, 2, 3];
var QUAD_U = [0, 1, 1, 0], QUAD_V = [0, 0, 1, 1];
// a flat quad's corners, as signs on its half sizes, and the order its
// triangles take them in (wound to face up)
var FLAT_X = [-1, 1, 1, -1], FLAT_Z = [-1, -1, 1, 1];
var GROUND_TRIS = [0, 2, 1, 0, 3, 2];
function boxSize(k, sx, sy, sz) { return k === 0 ? sx : k === 1 ? sy : sz; }
// murmur3's finaliser: scrambles an integer hash so one position can seed
// several independent choices without any of them echoing another
function fmix32(h) {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
// How lit a building is after dark, as a multiple of its district's usual
// share: nearly dark like offices after hours, an evening's worth, busy, and
// blazing. Dealt as below they average 1.11 times the district's old share,
// so the night city is a touch brighter than it was and never darker — the
// light is mostly just spread unevenly now.
var WINDOW_SHARE = [0.25, 0.85, 1.6, 2.4];
// Dealt, not rolled. Rolled independently, the island's nine port towers all
// came up in the middle two — no dark tower and no blazing one on its whole
// skyline, which is exactly what this is for. A district deals its blocks
// round this ring instead, from a starting point of its own: four nearly
// dark, nine evening, four busy and three blazing in every twenty, spaced so
// that any seven blocks dealt in a row hold all four.
var WINDOW_DECK = [3, 1, 0, 1, 2, 1, 1, 3, 0, 1, 2, 1, 0, 1, 3, 2, 1, 0, 2, 1];
// `shift`: slide this box's window pattern along by an amount of its own (see
// below). Opt-in, so the buildings that were designed keep the windows they
// were designed with.
GeoBatch.prototype.addBox = function (cx, cy, cz, sx, sy, sz, rotY, color, uvScale, shift) {
  var hx = sx / 2, hy = sy / 2, hz = sz / 2;
  var c = Math.cos(rotY || 0), s = Math.sin(rotY || 0);
  var r = (color >> 16 & 255) / 255, g = (color >> 8 & 255) / 255, b = (color & 255) / 255;
  var us = uvScale || 0;
  // Where along its texture a wall starts. This used to be a per-position
  // offset of floor(x * 8) — a whole number, on a texture that REPEATS, and a
  // repeating texture samples u and u + 1 identically. So it did nothing: 249
  // textured blocks across both islands, one window pattern between them,
  // every tower in a district showing the same lit windows in the same places.
  // At night, when the windows are most of what a building is, the skyline
  // was one tower copied.
  //
  // A shifted box slides by a FRACTION instead, from an integer hash of where
  // it stands — exact on every engine, so a building shows the same windows
  // every visit. Walls only: the roof and the floor sample the texture's
  // plain left column on purpose (that is where a roof gets its flat wall
  // colour), and sliding them would print windows across every rooftop.
  var ushift = 0, h0 = 0;
  if (shift && us) {
    h0 = (Math.imul(Math.round(cx * 8), 73856093) ^ Math.imul(Math.round(cz * 8), 19349663)) >>> 0;
    ushift = h0 / 4294967296;
  }
  // Its window light, for a batch that carries one: the share of its windows
  // lit after dark, how warm that light is (0 an office's tubes, 1 a lamp at
  // home), and a seed for WHICH windows. The shader does the rest — see
  // lamBlock in city.js. A box with no pattern of its own, a plinth or a deco
  // cap, gets a negative share: it keeps the windows it has always had.
  var lit = !!this.light, lv0 = 0, lv1 = 0, lv2 = 0;
  if (lit) {
    if (shift && us) {
      // (the deal is kept on the batch; names here stay clear of r, g and b
      // above, which are this box's colour — reusing `r` once repainted every
      // block's walls with a random number)
      if (this.lightDeal === undefined) this.lightDeal = fmix32(h0 ^ 0x68e31da4) % WINDOW_DECK.length;
      var cls = WINDOW_DECK[this.lightDeal++ % WINDOW_DECK.length];
      lv0 = Math.min(0.95, this.light.lit * WINDOW_SHARE[cls]);
      lv1 = Math.max(0, Math.min(1, this.light.warm + (fmix32(h0 ^ 0xb5297a4d) / 4294967296 - 0.5) * 0.9));
      // a whole number, not a fraction: an interpolated value is never
      // quite constant across a face, and the hash turns the difference
      // into windows that sparkle on and off pixel by pixel
      lv2 = fmix32(h0 ^ 0x1b56c4e9) % 61;
    } else { lv0 = -1; lv1 = 0.5; lv2 = 0; }
  }
  this.room(36);
  for (var f = 0; f < 6; f++) {
    var n0 = BOX_NORMAL[f * 3], n1 = BOX_NORMAL[f * 3 + 1], n2 = BOX_NORMAL[f * 3 + 2];
    var nx = n0 * c + n2 * s, nz = -n0 * s + n2 * c;
    var fw = boxSize(BOX_SPAN[f * 2], sx, sy, sz), fh = boxSize(BOX_SPAN[f * 2 + 1], sx, sy, sz);
    var uw = us ? fw / us : 1, vh = us ? fh / (us * 0.75) : 1;
    var u0 = 0;
    if (us && f >= 2 && f <= 3) { uw = 0.01; vh = 0.01; }
    else u0 = ushift;
    for (var i = 0; i < 6; i++) {
      var k = QUAD_TRIS[i], o = (f * 4 + k) * 3;
      var v0 = BOX_CORNER[o] * hx, v1 = BOX_CORNER[o + 1] * hy, v2 = BOX_CORNER[o + 2] * hz;
      this.vert(cx + (v0 * c + v2 * s), cy + v1, cz + (-v0 * s + v2 * c), nx, n1, nz, r, g, b,
        QUAD_U[k] ? u0 + uw : u0, QUAD_V[k] ? vh : 0);
      if (lit) this.winLight(lv0, lv1, lv2);
    }
  }
};
// Horizontal quad (facing +y) at height y.
GeoBatch.prototype.addGroundQuad = function (cx, y, cz, sx, sz, rotY, color) {
  var hx = sx / 2, hz = sz / 2;
  var c = Math.cos(rotY || 0), s = Math.sin(rotY || 0);
  var r = (color >> 16 & 255) / 255, g = (color >> 8 & 255) / 255, b = (color & 255) / 255;
  this.room(6);
  for (var i = 0; i < 6; i++) {
    var k = GROUND_TRIS[i], v0 = FLAT_X[k] * hx, v1 = FLAT_Z[k] * hz;
    this.vert(cx + (v0 * c + v1 * s), y, cz + (-v0 * s + v1 * c), 0, 1, 0, r, g, b, QUAD_U[k], QUAD_V[k]);
  }
};
// Quad from four explicit corners, wound a-b-c-d — for surfaces that follow a
// grade instead of being stepped out of flat tiles. `face` is the direction the
// quad should point: get it wrong and the winding culls the face away, so the
// quad is reversed to match rather than trusting the caller's corner order.
GeoBatch.prototype.addQuad = function (a, b, c, d, color, face) {
  var r = (color >> 16 & 255) / 255, g = (color >> 8 & 255) / 255, bl = (color & 255) / 255;
  var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  var vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  var l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  nx /= l; ny /= l; nz /= l;
  if (face && nx * face[0] + ny * face[1] + nz * face[2] < 0) {
    var t = b; b = d; d = t;
    nx = -nx; ny = -ny; nz = -nz;
  }
  this.room(6);
  for (var i = 0; i < 6; i++) {
    var k = QUAD_TRIS[i], p = k === 0 ? a : k === 1 ? b : k === 2 ? c : d;
    this.vert(p[0], p[1], p[2], nx, ny, nz, r, g, bl, QUAD_U[k], QUAD_V[k]);
  }
};
// Vertical quad centered at (cx,cy,cz), width w, height h, facing rotY direction; custom uv rect.
GeoBatch.prototype.addWallQuad = function (cx, cy, cz, w, h, rotY, color, u0, v0, u1, v1) {
  var hw = w / 2, hh = h / 2;
  var c = Math.cos(rotY), s = Math.sin(rotY);
  var r = (color >> 16 & 255) / 255, g = (color >> 8 & 255) / 255, b = (color & 255) / 255;
  if (u0 === undefined) { u0 = 0; v0 = 0; u1 = 1; v1 = 1; }
  this.room(6);
  for (var i = 0; i < 6; i++) {
    // local +x maps along the wall, facing normal (s, c)
    var k = QUAD_TRIS[i], x = FLAT_X[k] * hw;
    this.vert(cx + x * c, cy + FLAT_Z[k] * hh, cz + -x * s, s, 0, c, r, g, b,
      QUAD_U[k] ? u1 : u0, QUAD_V[k] ? v1 : v0);
  }
};
GeoBatch.prototype.build = function () {
  var n = this.n, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(this.nrm.slice(0, n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(this.col.slice(0, n * 3), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(this.uv.slice(0, n * 2), 2));
  if (this.nl) {
    // every vertex or none: a light batch given a quad by some other route
    // would feed the shader garbage, so say so loudly instead
    if (this.nl !== n) console.error('GeoBatch: window light missing on some vertices');
    g.setAttribute('winLight', new THREE.BufferAttribute(this.lgt.slice(0, this.nl * 3), 3));
  }
  // A batch is built once. What it held is the geometry's now; keeping the
  // working arrays as well would hold the world twice over.
  this.pos = this.nrm = this.col = this.uv = this.lgt = NO_FLOATS;
  this.n = this.cap = this.nl = 0;
  return g;
};

// Pack the static meshes under `root` down to what their materials read.
// Every batch comes out with position, normal, colour and uv as 32-bit
// floats, 44 bytes a vertex, whatever wears it. Unlit materials never look
// at a normal and untextured ones never look at a uv, so those go; colours
// (always a whole number of 255ths) are stored as bytes, exactly, and normals
// as signed bytes padded to four — the shaders renormalise them, and a
// hundred-and-twenty-seventh is well under anything the light can show.
// Colours stay three bytes: a fourth would make r128 read it as alpha.
// A geometry is left alone if it is shared (a vehicle may wear it with a
// different material) or listed in `keep` (read back as floats elsewhere).
function packStatic(root, keep) {
  var need = new Map();
  root.traverse(function (o) {
    if (!o.isMesh || !o.geometry || !o.geometry.isBufferGeometry) return;
    var n = need.get(o.geometry) || { uv: false, normal: false, color: false };
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
      if (!m) return;
      if (m.map || m.emissiveMap || m.alphaMap || m.bumpMap || m.normalMap || m.specularMap ||
          m.lightMap || m.aoMap || m.displacementMap) n.uv = true;
      if (!m.isMeshBasicMaterial) n.normal = true;
      if (m.vertexColors) n.color = true;
    });
    need.set(o.geometry, n);
  });
  need.forEach(function (n, g) {
    if (g.userData.shared || (keep && keep.has(g))) return;
    var at = g.attributes;
    if (at.uv && !n.uv) g.deleteAttribute('uv');
    if (at.normal && !n.normal) g.deleteAttribute('normal');
    if (at.color && !n.color) g.deleteAttribute('color');
    var c = g.attributes.color;
    if (c && c.array instanceof Float32Array && c.itemSize === 3) {
      var cb = new Uint8Array(c.count * 3);
      for (var i = 0; i < cb.length; i++) cb[i] = Math.round(Math.min(1, Math.max(0, c.array[i])) * 255);
      g.setAttribute('color', new THREE.BufferAttribute(cb, 3, true));
    }
    var nr = g.attributes.normal;
    if (nr && nr.array instanceof Float32Array && nr.itemSize === 3) {
      var nb = new Int8Array(nr.count * 4);
      for (var v = 0; v < nr.count; v++) {
        nb[v * 4] = Math.round(nr.array[v * 3] * 127);
        nb[v * 4 + 1] = Math.round(nr.array[v * 3 + 1] * 127);
        nb[v * 4 + 2] = Math.round(nr.array[v * 3 + 2] * 127);
      }
      g.setAttribute('normal', new THREE.BufferAttribute(nb, 4, true));
    }
  });
}

// Once a static mesh's vertices are on the GPU nothing here reads them
// again, but three.js keeps the arrays it uploaded from: the world was held
// twice, once on each side. This lets each attribute go as soon as it is
// uploaded. The bounds are worked out first, since culling asks for them
// later and would otherwise go looking for the vertices. The price, accepted:
// a lost WebGL context cannot re-upload them. Same exemptions as packStatic.
function releaseStatic(root, keep) {
  root.traverse(function (o) {
    if (!o.isMesh || !o.geometry || !o.geometry.isBufferGeometry) return;
    var g = o.geometry;
    if (g.userData.shared || g.userData.released || (keep && keep.has(g))) return;
    g.userData.released = true;
    if (!g.boundingSphere) g.computeBoundingSphere();
    if (!g.boundingBox) g.computeBoundingBox();
    // what it takes on the GPU, for anyone counting once the arrays are gone
    var bytes = g.index ? g.index.array.byteLength : 0;
    for (var k in g.attributes) { bytes += g.attributes[k].array.byteLength; g.attributes[k].onUpload(dropArray); }
    if (g.index) g.index.onUpload(dropArray);
    g.userData.bytes = bytes;
  });
}
function dropArray() { this.array = null; }

// Boxes drawn as copies of one unit cube: GeoBatch.addBox's arguments, less
// the texture. Baked into a batch a box is 36 vertices of position, normal,
// colour and uv — 1,584 bytes in memory and as much again on the GPU; as an
// instance it is a matrix and a colour, 76. That is the whole difference for
// the scatter the world has hundreds of: fence posts, trees, lamp standards.
// Lambert lights per vertex from the normal, and the instance matrix turns
// the cube's normals exactly as addBox turns its own, so a box looks the
// same either way.
function BoxSet() { this.m = []; this.c = []; }
BoxSet.prototype.addBox = function (cx, cy, cz, sx, sy, sz, rotY, color) {
  var c = Math.cos(rotY || 0), s = Math.sin(rotY || 0);
  // column by column: scale, turn about y (addBox's own sense), then place
  this.m.push(c * sx, 0, -s * sx, 0, 0, sy, 0, 0, s * sz, 0, c * sz, 0, cx, cy, cz, 1);
  this.c.push((color >> 16 & 255) / 255, (color >> 8 & 255) / 255, (color & 255) / 255);
};
// One mesh for the lot, or null if nothing was added. The material colours by
// instance (see sharedInstanceLambert), not by vertex: the cube has none.
BoxSet.prototype.build = function (material) {
  var n = this.c.length / 3;
  if (!n) return null;
  var geo = SHARED.geo.unitBox;
  if (!geo) {
    var b = new GeoBatch();
    b.addBox(0, 0, 0, 1, 1, 1, 0, 0xffffff, 0);
    geo = b.build();
    geo.deleteAttribute('color'); geo.deleteAttribute('uv');
    geo.userData.shared = true;
    SHARED.geo.unitBox = geo;
  }
  var mesh = new THREE.InstancedMesh(geo, material, n);
  mesh.instanceMatrix.array.set(this.m);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.c), 3);
  mesh.matrixAutoUpdate = false;
  this.m = this.c = null;
  return mesh;
};
// The material for a BoxSet. Its own, not sharedVertexLambert: r128 keeps one
// program per material, and instanced and plain meshes wearing the same one
// swap it back and forth as the draw order alternates.
function sharedInstanceLambert() {
  var m = SHARED.mat.IL;
  if (!m) { m = new THREE.MeshLambertMaterial(); m.userData.shared = true; SHARED.mat.IL = m; }
  return m;
}

// Uniform-grid broadphase for static AABBs {minX,maxX,minZ,maxZ,h,tag}.
//
// Queried constantly — three times a tick for every car's height, again for
// its walls, once for every pedestrian and for the camera — so a query
// allocates nothing: cells are keyed by a number rather than an "i,j" string,
// a box already collected is recognised by a stamp on it rather than a Set,
// and the answer goes into an array the caller keeps (queryInto).
function SpatialHash(cell) {
  this.cell = cell || 25;
  this.map = new Map();
  this.all = [];
  this.stamp = 0;
}
// a cell's key: i and j packed into one exact integer (|i|, |j| < 32768)
function hashCell(i, j) { return (i + 32768) * 65536 + (j + 32768); }
SpatialHash.prototype.insert = function (box) {
  this.all.push(box);
  box._q = 0; box._s = 0;   // query and line-of-sight stamps, set up front so every box keeps one shape
  var c = this.cell;
  var i0 = Math.floor(box.minX / c), i1 = Math.floor(box.maxX / c);
  var j0 = Math.floor(box.minZ / c), j1 = Math.floor(box.maxZ / c);
  for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) {
    var k = hashCell(i, j), arr = this.map.get(k);
    if (!arr) this.map.set(k, arr = []);
    arr.push(box);
  }
};
// A non-finite lookup is a bug wherever it came from, but it must not take
// the tab down with it. Math.floor(±Infinity) is ±Infinity and `i++` on an
// infinity never advances, so `for (i = i0; i <= i1; i++)` spins forever and
// the frame loop simply stops — a hang, not a glitch, with nothing on screen
// to say why. Every caller feeds this an entity position (a car, a ped, the
// camera), so one bad number anywhere in the physics reaches it.
//
// NaN needs no guard and never did: NaN <= NaN is false, so those loops run
// zero times and return nothing. Infinity is the case that hangs.
//
// The boxes overlapping the square of half-size r round (x, z), each once, in
// the order they are met, written into `out` (which is returned). A caller
// that keeps its own `out` and reads it before asking again allocates nothing.
SpatialHash.prototype.queryInto = function (x, z, r, out) {
  var n = 0;
  if (isFinite(x) && isFinite(z) && isFinite(r)) {
    var c = this.cell, st = ++this.stamp;
    var i0 = Math.floor((x - r) / c), i1 = Math.floor((x + r) / c);
    var j0 = Math.floor((z - r) / c), j1 = Math.floor((z + r) / c);
    for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) {
      var arr = this.map.get(hashCell(i, j));
      if (!arr) continue;
      for (var k = 0; k < arr.length; k++) {
        var b = arr[k];
        if (b._q === st) continue;
        b._q = st;
        if (x + r < b.minX || x - r > b.maxX || z + r < b.minZ || z - r > b.maxZ) continue;
        out[n++] = b;
      }
    }
  }
  out.length = n;
  return out;
};
// the same answer in an array of its own, for callers that keep it
SpatialHash.prototype.query = function (x, z, r) {
  return this.queryInto(x, z, r, []);
};
// Segment LOS test: returns true if segment is clear of all boxes.
// `aboveY`, when given, is the viewer's eye height: anything topping out below
// it is seen over (a parapet, a kerb), and anything that only STARTS above it
// (a bridge deck overhead) is seen under. Without it the check stays flat-2D.
//
// It walks the segment in steps and looks at the boxes round each step, each
// box tested once however many steps find it (the line-of-sight stamp).
SpatialHash.prototype.segmentClear = function (x0, z0, x1, z1, aboveY) {
  // the same trap one level up: an infinite endpoint makes `len` infinite,
  // `steps` infinite, and `for (s = 0; s <= steps; s++)` never ends. Answer
  // the way a NaN endpoint already does — nothing measurable in the way.
  if (!isFinite(x0) || !isFinite(z0) || !isFinite(x1) || !isFinite(z1)) return true;
  var dx = x1 - x0, dz = z1 - z0;
  var len = Math.sqrt(dx * dx + dz * dz);
  var c = this.cell, r = c * 0.6;
  var steps = Math.max(1, Math.ceil(len / (c * 0.8)));
  var st = ++this.stamp;
  for (var s = 0; s <= steps; s++) {
    var t = s / steps, x = x0 + dx * t, z = z0 + dz * t;
    var i0 = Math.floor((x - r) / c), i1 = Math.floor((x + r) / c);
    var j0 = Math.floor((z - r) / c), j1 = Math.floor((z + r) / c);
    for (var i = i0; i <= i1; i++) for (var j = j0; j <= j1; j++) {
      var arr = this.map.get(hashCell(i, j));
      if (!arr) continue;
      for (var k = 0; k < arr.length; k++) {
        var b = arr[k];
        if (b._s === st) continue;
        // only a box this step's square reaches counts as looked at; one it
        // misses may still be reached by a later step
        if (x + r < b.minX || x - r > b.maxX || z + r < b.minZ || z - r > b.maxZ) continue;
        b._s = st;
        if (b.noLOS) continue;
        if (aboveY !== undefined) {
          if (b.h !== undefined && b.h < aboveY - 0.4) continue;
          if (b.minY !== undefined && b.minY > aboveY + 0.6) continue;
        }
        if (segIntersectsAABB(x0, z0, x1, z1, b)) return false;
      }
    }
  }
  return true;
};

function segIntersectsAABB(x0, z0, x1, z1, b) {
  var dx = x1 - x0, dz = z1 - z0;
  var tmin = 0, tmax = 1;
  if (Math.abs(dx) < 1e-9) { if (x0 < b.minX || x0 > b.maxX) return false; }
  else {
    var t1 = (b.minX - x0) / dx, t2 = (b.maxX - x0) / dx;
    if (t1 > t2) { var tt = t1; t1 = t2; t2 = tt; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
  }
  if (Math.abs(dz) < 1e-9) { if (z0 < b.minZ || z0 > b.maxZ) return false; }
  else {
    var t3 = (b.minZ - z0) / dz, t4 = (b.maxZ - z0) / dz;
    if (t3 > t4) { var tt2 = t3; t3 = t4; t4 = tt2; }
    tmin = Math.max(tmin, t3); tmax = Math.min(tmax, t4);
  }
  return tmax >= tmin;
}

// Ray vs AABB along a 2d direction; returns nearest t or Infinity.
function rayAABB(x0, z0, dx, dz, b) {
  var tmin = -Infinity, tmax = Infinity;
  if (Math.abs(dx) < 1e-9) { if (x0 < b.minX || x0 > b.maxX) return Infinity; }
  else {
    var t1 = (b.minX - x0) / dx, t2 = (b.maxX - x0) / dx;
    if (t1 > t2) { var tt = t1; t1 = t2; t2 = tt; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
  }
  if (Math.abs(dz) < 1e-9) { if (z0 < b.minZ || z0 > b.maxZ) return Infinity; }
  else {
    var t3 = (b.minZ - z0) / dz, t4 = (b.maxZ - z0) / dz;
    if (t3 > t4) { var tt2 = t3; t3 = t4; t4 = tt2; }
    tmin = Math.max(tmin, t3); tmax = Math.min(tmax, t4);
  }
  if (tmax < tmin || tmax < 0) return Infinity;
  return tmin >= 0 ? tmin : 0;
}

GAME.input = {
  keys: {},
  pressed: {},
  mouseDX: 0, mouseDY: 0,
  lmb: false, rmb: false,
  lmbPressed: false,
  wheel: 0,
  pointerLocked: false,
  touch: { active: false, stickX: 0, stickY: 0, fire: false, aim: false, brake: false, handbrake: false, enter: false, weaponCycle: false, radio: false, driveByL: false, driveByR: false }
};

GAME.initInput = function (canvas) {
  var inp = GAME.input;
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Tab') e.preventDefault();
    if (!e.repeat) { inp.keys[e.code] = true; inp.pressed[e.code] = true; }
    // Any key is a real gesture that can bring fullscreen back after the
    // browser dropped it over an Esc — EXCEPT Esc itself, which browsers
    // refuse to honor for requestFullscreen (it is the reserved exit key).
    // So resuming with Esc stays windowed for exactly one keypress: the
    // first W (or anything else) restores it.
    if (GAME.started && !e.repeat && e.code !== 'Escape' && GAME.maybeRestoreFullscreen) GAME.maybeRestoreFullscreen();
    if (GAME.onKeyDown && !e.repeat) GAME.onKeyDown(e.code);
  });
  window.addEventListener('keyup', function (e) { inp.keys[e.code] = false; });
  // focus loss eats the keyup, so drop the held keys AND any press nobody
  // claimed — coming back to a key the game still thinks is down is the
  // oldest stuck-input bug there is
  window.addEventListener('blur', function () { inp.keys = {}; inp.pressed = {}; inp.lmb = false; inp.rmb = false; });

  canvas.addEventListener('mousedown', function (e) {
    // The click that ACQUIRES pointer lock is aim, not fire. Without this,
    // the first click after the title screen (or after any overlay released
    // the lock) squeezed off a round with whatever the save had loaded and
    // earned a wanted star before the player had done anything at all.
    var acquiring = GAME.started && !GAME.isTouch && !inp.pointerLocked && document.pointerLockElement !== canvas;
    // on touch devices the fire button is on the touch layer; mouse events
    // reaching the canvas there are the browser's synthetic echoes of taps,
    // and treating them as trigger pulls is how taps punched people
    if (e.button === 0 && !acquiring && !GAME.isTouch) { inp.lmb = true; inp.lmbPressed = true; }
    if (e.button === 2 && !GAME.isTouch) inp.rmb = true;
    // a click back into the game is a real gesture: if the browser threw us
    // out of fullscreen over an Esc on an overlay, this is where it comes back
    if (GAME.started && GAME.maybeRestoreFullscreen) GAME.maybeRestoreFullscreen();
    if (acquiring) {
      canvas.requestPointerLock && canvas.requestPointerLock();
    }
  });
  window.addEventListener('mouseup', function (e) {
    if (e.button === 0) inp.lmb = false;
    if (e.button === 2) inp.rmb = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('mousemove', function (e) {
    if (inp.pointerLocked) { inp.mouseDX += e.movementX; inp.mouseDY += e.movementY; }
  });
  document.addEventListener('pointerlockchange', function () {
    inp.pointerLocked = (document.pointerLockElement === canvas);
    // the moment the lock lands, start a short grace: the double-click on
    // load (or the reflexive click right after an overlay) arrives with the
    // lock already held and used to squeeze off a round before the player
    // had done anything on purpose
    if (inp.pointerLocked) inp.lockGraceT = performance.now();
  });
  window.addEventListener('wheel', function (e) { inp.wheel += e.deltaY > 0 ? 1 : -1; }, { passive: true });
};

// Overlays release the pointer lock through this wrapper so the unlock can
// be told apart from the browser's own (the user pressing Esc). A one-shot
// flag is not enough: lock grants and exits resolve asynchronously, so our
// exit can land AFTER a still-pending grant, one event tick later. The
// timestamp lets the unlock handler treat anything within a beat of a
// deliberate release as the game's own doing.
GAME.releasePointer = function () {
  GAME.releasePointerT = performance.now();
  if (document.exitPointerLock) document.exitPointerLock();
};

// After an overlay hands the screen back to the game, ask for the pointer
// lock right away — the closing key or click usually carries user activation
// so the request lands and no extra click is needed. When it doesn't (Esc
// carries none) the request is refused quietly and the next click into the
// canvas acquires the lock as always — swallowed as aim, never fired.
GAME.regainPointer = function () {
  if (GAME.isTouch || !GAME.started) return;
  if (GAME.paused || GAME.mapOpen || GAME.shopOpen || GAME.shareOpen) return;
  var cv = document.getElementById('game-canvas');
  if (cv && cv.requestPointerLock) {
    try {
      var pr = cv.requestPointerLock();
      if (pr && pr.catch) pr.catch(function () { });
    } catch (e) { }
  }
};

GAME.key = function (code) { return !!GAME.input.keys[code]; };

// Edge-triggered input: true exactly once per physical press, to whoever
// asks first on the tick after it happened.
//
// This used to be a per-code cache of "was it down last time somebody
// asked", written only when somebody asked — and every caller sits behind a
// mode gate: Comma/Period only while driving, KeyJ only in a cab, Digit1-5
// only while alive and not mid-entry. Nothing wrote the cache while its gate
// was shut, so a key already held when one opened read as a brand new press:
// walk to a car holding Comma and the radio changed station by itself as the
// door closed, and a key held through an overlay fired the moment it closed.
// (The mirror case — a real press swallowed because the cache still said
// "held" — largely healed itself, since the first polled frame with the key
// up wrote the cache back. It is the spurious fire that actually reached
// players.)
//
// A buffer written by keydown cannot go stale that way, and the tick drops
// whatever nobody claimed (GAME.clearPressed), so a press meant for a mode
// that is not running dies in the frame it arrived in instead of being saved
// up to fire at the wrong moment later.
GAME.keyPressed = function (code) {
  var p = GAME.input.pressed;
  if (!p[code]) return false;
  p[code] = false;   // one claim per press, as when this consumed the edge
  return true;
};
GAME.clearPressed = function () { GAME.input.pressed = {}; };
