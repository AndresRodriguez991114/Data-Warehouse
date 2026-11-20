/*
 * Maqueta 3D del módulo "Energía renovable" de la ciudad inteligente.
 * Escena independiente con Three.js r128: aerogeneradores en movimiento,
 * dos paneles solares, consola LCD, edificios de 4 y 3 pisos, tres casas a dos aguas y árboles.
 * La iluminación recorre un ciclo día → tarde → noche → amanecer cada minuto
 * y la cámara gira lentamente alrededor del módulo.
 */
(function () {
  "use strict";

  // Duración de un ciclo completo de iluminación (milisegundos).
  const CICLO_MS = 60000;
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const ORBIT_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js";

  function cargarScript(src) {
    return new Promise((ok, falla) => {
      const s = document.createElement("script");
      s.src = src; s.async = true; s.onload = ok; s.onerror = falla;
      document.head.appendChild(s);
    });
  }

  function iniciar() {
    const stage = document.getElementById("maqueta-energia");
    if (!stage) return;

    // Carga diferida: Three.js solo se descarga cuando la maqueta se acerca a la pantalla.
    const arrancar = () => {
      const listo = window.THREE && window.THREE.OrbitControls
        ? Promise.resolve()
        : (window.THREE ? Promise.resolve() : cargarScript(THREE_URL)).then(() => window.THREE.OrbitControls ? null : cargarScript(ORBIT_URL));
      listo.then(() => construir(stage)).catch(() => sinVista(stage));
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((ents) => {
        if (ents.some((e) => e.isIntersecting)) { io.disconnect(); arrancar(); }
      }, { rootMargin: "300px" });
      io.observe(stage);
    } else {
      arrancar();
    }
  }

  function sinVista(stage) {
    const d = document.createElement("div");
    d.className = "maqueta-nogl";
    d.textContent = "No se pudo abrir la vista 3D en este navegador.";
    stage.appendChild(d);
  }

  function construir(stage) {
    let gl = null;
    try { const c = document.createElement("canvas"); gl = c.getContext("webgl") || c.getContext("experimental-webgl"); } catch (e) { /* sin WebGL */ }
    if (!window.THREE || !THREE.OrbitControls || !gl) { sinVista(stage); return; }

    // ------------------------------------------------------------ escena
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "Maqueta 3D del módulo de energía renovable con dos aerogeneradores, dos paneles solares y viviendas");
    stage.insertBefore(renderer.domElement, stage.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdcd8d0);
    const camera = new THREE.PerspectiveCamera(32, 1, 1, 2000);
    camera.position.set(-78, 72, 92);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 7, 0);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enableZoom = false; controls.enablePan = false; // no bloquear el desplazamiento de la página
    controls.maxPolarAngle = 1.38; controls.minPolarAngle = 0.35;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.9;

    const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc4b2, 0.62); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0db, 1.25); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 20, far: 500 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.4;
    scene.add(sun);
    const moon = new THREE.DirectionalLight(0x7f95c9, 0); moon.position.set(90, 160, -70); scene.add(moon);

    // ------------------------------------------------------------ utilidades
    const rnd = (() => { let s = 20261119; return () => ((s = Math.imul(s ^ s >>> 15, 2246822507) ^ Math.imul(s ^ s >>> 13, 3266489909), (s >>> 0) % 100000) / 100000); })();
    function canvasTex(w, h, draw, rep) {
      const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
      if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
      return t;
    }
    const matCache = {};
    function M(color, o = {}) {
      const key = color + "|" + Object.keys(o).map((k) => k + ":" + ((o[k] && o[k].uuid) || o[k])).join(",");
      if (matCache[key]) return matCache[key];
      return (matCache[key] = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color), roughness: 0.85, metalness: 0 }, o)));
    }
    function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m; }
    function box(w, h, d, mat, x, y, z, parent) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z, parent); }
    function cyl(rt, rb, h, mat, x, y, z, parent, seg = 20) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y + h / 2, z, parent); }
    function noise(base, specks, n, size) {
      return (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { g.fillStyle = specks[i % specks.length]; const s = size * (0.4 + rnd()); g.globalAlpha = 0.35 + rnd() * 0.6; g.fillRect(rnd() * w, rnd() * h, s, s); } g.globalAlpha = 1; };
    }
    const plyEdge = canvasTex(512, 64, (g, w, h) => { const cols = ["#d9b07a", "#b9884f", "#e2be8b", "#a87a45", "#d4a56d"]; for (let i = 0; i < h; i += 7) { g.fillStyle = cols[(i / 7) % 5]; g.fillRect(0, i, w, 7); } }, [4, 1]);

    const facadeMats = [], emissives = [], glows = [], pointLights = [];
    function facade(wall, win, cols, rows, o = {}) {
      const W = 256, H = Math.max(128, Math.round(256 * rows / cols * 0.9)); const frame = o.frame || "#2b2b33";
      const draw = (lit) => (g) => {
        g.fillStyle = lit ? "#000" : wall; g.fillRect(0, 0, W, H);
        if (!lit) { for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * H, 2, 2); } }
        const mw = W / cols, mh = H / rows;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const x = c * mw + mw * 0.2, y = r * mh + mh * 0.2, ww = mw * 0.6, hh = mh * 0.55;
          if (lit) { g.fillStyle = (rnd() < 0.72) ? "#fff" : "#333"; g.fillRect(x, y, ww, hh); continue; }
          g.fillStyle = frame; g.fillRect(x - 1.5, y - 1.5, ww + 3, hh + 3); g.fillStyle = win; g.fillRect(x, y, ww, hh);
          g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x + ww * 0.08, y + hh * 0.08, ww * 0.25, hh * 0.84);
          if (o.cross) { g.fillStyle = frame; g.fillRect(x + ww / 2 - 1, y, 2, hh); g.fillRect(x, y + hh / 2 - 1, ww, 2); }
        }
      };
      const t = canvasTex(W, H, draw(false)), e = canvasTex(W, H, draw(true)); e.encoding = THREE.LinearEncoding; return [t, e];
    }
    function building(w, d, h, wall, win, cols, rows, x, z, parent, o = {}) {
      const [tf, ef] = facade(wall, win, Math.max(1, Math.round(cols)), rows, o), [ts, es] = facade(wall, win, Math.max(1, Math.round(cols * d / w)), rows, o);
      const glow = new THREE.Color(o.glow || 0xffd38a);
      const mk = (t, e) => { const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, emissive: glow, emissiveMap: e, emissiveIntensity: 0 }); facadeMats.push(m); return m; };
      const top = M(o.roof || wall, { roughness: 0.9 });
      return mesh(new THREE.BoxGeometry(w, h, d), [mk(ts, es), mk(ts, es), top, top, mk(tf, ef), mk(tf, ef)], x, h / 2, z, parent);
    }
    function gable(w, d, hw, hr, roofMat, x, z, parent, ry, o) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
      building(w, d, hw, o.facade[0], o.facade[1], o.facade[2], o.facade[3], 0, 0, g, { glow: o.glow, cross: true });
      const s = new THREE.Shape(); const ov = 0.5; s.moveTo(-w / 2 - ov, 0); s.lineTo(w / 2 + ov, 0); s.lineTo(0, hr); s.lineTo(-w / 2 - ov, 0);
      const rg = new THREE.ExtrudeGeometry(s, { depth: d + ov * 2, bevelEnabled: false }); rg.translate(0, 0, -(d + ov * 2) / 2);
      mesh(rg, roofMat, 0, hw, 0, g);
      return g;
    }
    const corrugated = (c) => canvasTex(128, 128, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 6) { g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x, 0, 2, h); g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(x + 3, 0, 1, h); } }, [3, 3]);
    function glowSprite(color, size) {
      const t = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      s.scale.set(size, size, 1); return s;
    }

    // ------------------------------------------------------------ suelo y vía perimetral
    const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 48), new THREE.MeshStandardMaterial({ color: 0xc9c4bb, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -3.6; ground.receiveShadow = true; scene.add(ground);
    const SIDE = 72; // módulo de 56 cm + vía de 8 cm en cada lado
    const roadTex = canvasTex(720, 720, (g, W, H) => {
      g.fillStyle = "#3b3e43"; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 9000; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.08)"; g.fillRect(rnd() * W, rnd() * H, 2, 2); }
      g.fillStyle = "#f4f4ef";
      for (let s = 0; s < W; s += 60) { g.fillRect(s, 38, 30, 4); g.fillRect(s, H - 42, 30, 4); g.fillRect(38, s, 4, 30); g.fillRect(W - 42, s, 4, 30); }
    });
    const edge = M("#c99a63", { map: plyEdge });
    mesh(new THREE.BoxGeometry(SIDE, 2.4, SIDE), [edge, edge, new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.92 }), M("#b98a55"), edge, edge], 0, -1.2, 0);

    // ------------------------------------------------------------ módulo: Energía renovable
    const MOD = 56;
    const flock = new THREE.MeshStandardMaterial({
      roughness: 1, map: canvasTex(512, 512, (c, w, h) => {
        noise("#1f5a2a", ["#2e7a39", "#14421d", "#3c8f47", "#0e3316"], 20000, 3)(c, w, h);
        c.fillStyle = "#2fae47"; c.fillRect(0, h * 0.4, w * 0.62, h * 0.6);
        for (let i = 0; i < 6000; i++) { c.fillStyle = "rgba(255,255,255,.05)"; c.fillRect(rnd() * w * 0.62, h * 0.4 + rnd() * h * 0.6, 2, 2); }
      })
    });
    const pe = M("#6f7378", { map: plyEdge });
    const modG = new THREE.Group(); modG.position.set(-MOD / 2, 0, -MOD / 2); scene.add(modG);
    mesh(new THREE.BoxGeometry(MOD, 1.2, MOD), [pe, pe, flock, M("#6f7378"), pe, pe], MOD / 2, 0.6, MOD / 2, modG);
    const g = new THREE.Group(); g.position.y = 1.2; modG.add(g);

    // bordillo gris
    box(56, 0.6, 1.4, M("#6f7378"), 28, 0, 0.7, g); box(56, 0.6, 1.4, M("#6f7378"), 28, 0, 55.3, g);
    box(1.4, 0.6, 56, M("#6f7378"), 0.7, 0, 28, g); box(1.4, 0.6, 56, M("#6f7378"), 55.3, 0, 28, g);
    // edificio blanco de 4 pisos
    building(10, 8, 20, "#f1efe9", "#3b3f46", 3, 4, 9, 8, g, { glow: 0x6dff8a, frame: "#c9c6be" });
    // edificio blanco de 3 pisos en la esquina (reemplaza la casa de esa esquina), con techo de una sola agua
    const terra = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, map: corrugated("#c47a5c") });
    building(9, 9, 15, "#f1efe9", "#3b3f46", 3, 3, 45, 47, g, { glow: 0x6dff8a, frame: "#c9c6be" });
    box(11, 0.35, 11, terra, 45, 15.6, 47, g).rotation.z = -0.2;
    // tres casas a dos aguas
    [[26, 8, 0], [46, 10, Math.PI / 2], [46, 30, Math.PI / 2]].forEach(([x, z, ry]) =>
      gable(9, 8, 7, 5, terra, x, z, g, ry, { facade: ["#f2efe8", "#7fb0a0", 3, 1], glow: 0x52ff7a }));
    // árboles de esponja
    const esp = M("#4fd06a", { roughness: 1, flatShading: true });
    [[3, 16], [17.5, 17], [36.5, 20], [53, 3], [37, 40], [53, 53]].forEach(([x, z]) => {
      const e = mesh(new THREE.IcosahedronGeometry(1.8, 1), esp, x, 2, z, g); e.scale.set(1.1, 1, 0.8);
      box(0.4, 0.6, 0.4, M("#c9a64a"), x, 0, z, g);
    });
    // cerca del campo
    const post = M("#5b4a3a"); for (let x = 2; x < 34; x += 2.2) box(0.25, 1.6, 0.25, post, x, 0, 23, g);
    for (let z = 23; z < 55; z += 2.2) box(0.25, 1.6, 0.25, post, 33.5, 0, z, g);
    const wire = M("#3a3a3a"); box(31.5, 0.12, 0.12, wire, 17.6, 1.3, 23, g); box(0.12, 0.12, 32, wire, 33.5, 1.3, 39, g);
    // dos paneles solares del mismo tamaño
    const solar = new THREE.MeshStandardMaterial({
      roughness: 0.25, metalness: 0.4, map: canvasTex(128, 256, (c, w, h) => {
        c.fillStyle = "#10182a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#5d6f8e"; c.lineWidth = 2;
        for (let x = 0; x <= w; x += w / 2) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
        for (let y = 0; y <= h; y += h / 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      })
    });
    box(8, 0.5, 12, solar, 11, 0.3, 38, g).rotation.x = -0.08;
    box(8, 0.5, 12, solar, 25, 0.3, 33, g).rotation.x = -0.08; // antes era la losa gris
    // consola con dos pantallas LCD 16×2
    box(22, 3, 7, M("#5e6166", { roughness: 0.8 }), 12, 0, 51, g);
    [6.5, 17.5].forEach((x) => {
      const lm = new THREE.MeshStandardMaterial({ color: 0x1f4fd6, emissive: 0x2b62ff, emissiveIntensity: 0.9, roughness: 0.2 });
      emissives.push({ m: lm, day: 0.9, night: 2.2 });
      box(7.6, 0.15, 2.6, M("#202226"), x, 3, 51, g);
      const s = mesh(new THREE.PlaneGeometry(7, 2), lm, x, 3.17, 51, g); s.rotation.x = -Math.PI / 2; s.castShadow = false;
    });
    // aerogeneradores
    const rotors = [];
    const tw = M("#f4f4f2", { roughness: 0.5 });
    const blade = M("#ffffff", { roughness: 0.6, side: THREE.DoubleSide });
    [[5, 26, 26], [29, 47, 22]].forEach(([x, z, h]) => {
      cyl(0.55, 0.95, h, tw, x, 0, z, g, 16);
      const hub = new THREE.Group(); hub.position.set(x, h, z + 1.4); g.add(hub);
      box(1.4, 1.4, 3, tw, 0, -0.7, -1.2, hub);
      const rot = new THREE.Group(); hub.add(rot); mesh(new THREE.SphereGeometry(0.8, 12, 10), tw, 0, 0, 0.2, rot);
      for (let i = 0; i < 3; i++) { const bl = new THREE.Group(); bl.rotation.z = i * 2.094; rot.add(bl); mesh(new THREE.BoxGeometry(1.6, 11, 0.15), blade, 0, 6, 0, bl).rotation.y = 0.25; }
      rot.rotation.z = rnd() * 3; rotors.push(rot); hub.rotation.y = -0.35;
    });

    // ------------------------------------------------------------ alumbrado en las esquinas de la vía
    function farola(x, z, ry) {
      const f = new THREE.Group(); f.position.set(x, 0, z); f.rotation.y = ry; scene.add(f);
      const pm = M("#7d8288", { metalness: 0.5, roughness: 0.4 }); cyl(0.18, 0.25, 11, pm, 0, 0, 0, f, 8); box(0.25, 0.25, 2.6, pm, 0, 10.8, 1.2, f);
      const bm = new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffcf73, emissiveIntensity: 0.5 }); emissives.push({ m: bm, day: 0.5, night: 3 });
      box(0.7, 0.3, 1.2, bm, 0, 10.55, 2.3, f);
      const gs = glowSprite(0xffc870, 7); gs.position.set(0, 10.2, 2.3); f.add(gs); glows.push({ s: gs, day: 0.05, night: 0.85 });
      const pl = new THREE.PointLight(0xffc880, 0, 30, 2); pl.position.set(0, 9.8, 2.3); f.add(pl); pointLights.push(pl);
    }
    const E = SIDE / 2 - 0.8;
    farola(-E, -E, Math.PI * 0.25); farola(E, -E, -Math.PI * 0.25); farola(E, E, -Math.PI * 0.75); farola(-E, E, Math.PI * 0.75);

    // colores definidos en sRGB → espacio lineal (una sola vez por material)
    const seen = new Set();
    scene.traverse((o) => {
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach((m) => { if (seen.has(m)) return; seen.add(m); if (m.color) m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); });
    });

    // ------------------------------------------------------------ ciclo día / tarde / noche
    const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
    const ESTADOS = {
      dia:      { bg: new THREE.Color(0xdcd8d0), hemi: 0.62, sun: 1.25, sunCol: lin(0xfff0db), pos: new THREE.Vector3(-120, 190, 90), moon: 0, n: 0, exp: 1.05, suelo: 1 },
      tarde:    { bg: new THREE.Color(0xe7b58f), hemi: 0.38, sun: 1.0, sunCol: lin(0xff9e55), pos: new THREE.Vector3(170, 45, 60), moon: 0, n: 0.35, exp: 1.08, suelo: 0.75 },
      noche:    { bg: new THREE.Color(0x0c0f16), hemi: 0.05, sun: 0, sunCol: lin(0xff9e55), pos: new THREE.Vector3(170, 10, 60), moon: 0.22, n: 1, exp: 1.15, suelo: 0.22 },
      amanecer: { bg: new THREE.Color(0xc7b9cf), hemi: 0.32, sun: 0.7, sunCol: lin(0xffc59a), pos: new THREE.Vector3(-170, 40, 40), moon: 0.05, n: 0.45, exp: 1.08, suelo: 0.65 },
    };
    // Fotogramas clave a lo largo del ciclo (fracción 0–1).
    const CLAVES = [[0, "dia"], [0.28, "dia"], [0.42, "tarde"], [0.55, "noche"], [0.84, "noche"], [0.93, "amanecer"], [1, "dia"]];
    const tmpBg = new THREE.Color(), tmpCol = new THREE.Color(), tmpPos = new THREE.Vector3();
    const groundBase = ground.material.color.clone();

    function aplicarLuz(t) {
      let i = 0; while (i < CLAVES.length - 2 && t >= CLAVES[i + 1][0]) i++;
      const [t0, k0] = CLAVES[i], [t1, k1] = CLAVES[i + 1];
      const u = t1 > t0 ? Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : 0;
      const e = u * u * (3 - 2 * u); // suavizado
      const a = ESTADOS[k0], b = ESTADOS[k1], mix = (p, q) => p + (q - p) * e;
      tmpBg.copy(a.bg).lerp(b.bg, e); scene.background.copy(tmpBg); stage.style.background = "#" + tmpBg.getHexString();
      hemi.intensity = mix(a.hemi, b.hemi); sun.intensity = mix(a.sun, b.sun); moon.intensity = mix(a.moon, b.moon);
      sun.color.copy(tmpCol.copy(a.sunCol).lerp(b.sunCol, e)); sun.position.copy(tmpPos.copy(a.pos).lerp(b.pos, e));
      renderer.toneMappingExposure = mix(a.exp, b.exp);
      ground.material.color.copy(groundBase).multiplyScalar(mix(a.suelo, b.suelo));
      const n = mix(a.n, b.n);
      facadeMats.forEach((m) => { m.emissiveIntensity = n * 1.1; });
      emissives.forEach((x) => { x.m.emissiveIntensity = x.day + (x.night - x.day) * n; });
      glows.forEach((x) => { x.s.material.opacity = x.day + (x.night - x.day) * n; });
      pointLights.forEach((p) => { p.intensity = n * 1.6; });
    }

    // Etiqueta con la fase y una hora simulada.
    const etiqueta = stage.querySelector(".maqueta-fase");
    const barra = stage.querySelector(".maqueta-progreso span");
    function fase(t) {
      if (t < 0.34) return ["Día", "sol"];
      if (t < 0.5) return ["Tarde", "tarde"];
      if (t < 0.86) return ["Noche", "noche"];
      return ["Amanecer", "tarde"];
    }
    let ultimaFase = "";
    function actualizarEtiqueta(t) {
      const minutos = Math.floor(((9 + t * 24) % 24) * 60);
      const hora = String(Math.floor(minutos / 60)).padStart(2, "0") + ":" + String(minutos % 60).padStart(2, "0");
      const [nombre, clase] = fase(t);
      if (etiqueta) {
        if (nombre !== ultimaFase) { etiqueta.dataset.fase = clase; ultimaFase = nombre; }
        etiqueta.textContent = nombre + " · " + hora;
      }
      if (barra) barra.style.width = (t * 100).toFixed(1) + "%";
    }

    // ------------------------------------------------------------ controles y bucle
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let corriendo = !reduce, visible = true;
    controls.autoRotate = corriendo;
    const bPausa = document.getElementById("maqueta-pausa");
    function marcarBoton() {
      if (!bPausa) return;
      bPausa.textContent = corriendo ? "Pausar" : "Reanudar";
      bPausa.setAttribute("aria-pressed", String(!corriendo));
    }
    if (bPausa) bPausa.addEventListener("click", () => { corriendo = !corriendo; controls.autoRotate = corriendo; marcarBoton(); });
    marcarBoton();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; }).observe(stage);
    }
    function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage); else window.addEventListener("resize", resize);
    resize();

    let last = performance.now(), reloj = 0;
    function loop(now) {
      requestAnimationFrame(loop);
      // El ciclo usa tiempo real (no depende de los fotogramas por segundo);
      // se limita a 1 s por paso para que no salte al volver de otra pestaña.
      const pasoMs = Math.min(1000, now - last), dt = Math.min(0.05, pasoMs / 1000); last = now;
      if (!visible) return; // no gastar recursos si la maqueta no está en pantalla
      if (corriendo) { reloj += pasoMs; rotors.forEach((r, i) => { r.rotation.z += dt * (2.2 + i * 0.4); }); }
      const t = (reloj % CICLO_MS) / CICLO_MS;
      aplicarLuz(t); actualizarEtiqueta(t);
      controls.update(); renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
