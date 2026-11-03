"use strict";

// PA4 - Islamiya Okassova - 242322
// Motion, texture, interaction, and gallery system.

AFRAME.registerComponent("x2322-motion", {
  schema: {
    type: {type: "string", default: "pulse", oneOf: ["bob", "orbit", "pulse"]},
    amplitude: {type: "number", default: 0.15},
    period: {type: "number", default: 3},
    phase: {type: "number", default: 0}
  },
  logLifecycle: function (method) {
    console.log(`[${new Date().toISOString()}] x2322-motion | ${this.el.id} | ${method}`);
  },
  init: function () {
    this.basePosition = this.el.object3D.position.clone();
    this.baseScale = this.el.object3D.scale.clone();
    this.elapsed = 0;
    this.phaseOffset = this.data.phase;
    this.currentAmplitude = this.data.amplitude;
    this.targetAmplitude = this.data.amplitude;
    this.running = true;
    this.logLifecycle("init");
  },
  update: function (oldData) {
    this.logLifecycle("update");
    this.targetAmplitude = this.data.amplitude;
    if (!oldData || Object.keys(oldData).length === 0) return;
    const oldPeriod = Math.max(0.001, oldData.period);
    const newPeriod = Math.max(0.001, this.data.period);
    const angle = 2 * Math.PI * this.elapsed / oldPeriod + this.phaseOffset;
    this.phaseOffset = angle - 2 * Math.PI * this.elapsed / newPeriod;
    if (oldData.phase !== this.data.phase) this.phaseOffset += this.data.phase - oldData.phase;
    if (oldData.type !== this.data.type) {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.scale.copy(this.baseScale);
    }
  },
  tick: function (time, timeDelta) {
    if (!this.running) return;
    const delta = Number.isFinite(timeDelta) ? Math.max(0, timeDelta) : 0;
    this.elapsed += delta / 1000;
    const angle = 2 * Math.PI * this.elapsed / Math.max(0.001, this.data.period) + this.phaseOffset;
    const smoothing = 1 - Math.exp(-delta / 250);
    this.currentAmplitude += (this.targetAmplitude - this.currentAmplitude) * smoothing;
    const amount = this.currentAmplitude * Math.sin(angle);
    if (this.data.type === "pulse") {
      this.el.object3D.scale.copy(this.baseScale).multiplyScalar(Math.max(0.05, 1 + amount));
    } else if (this.data.type === "bob") {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.position.y += amount;
    } else if (this.data.type === "orbit") {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.position.x += this.currentAmplitude * Math.cos(angle);
      this.el.object3D.position.z += this.currentAmplitude * Math.sin(angle);
    }
  },
  pause: function () { this.running = false; this.logLifecycle("pause"); },
  play: function () { this.running = true; this.logLifecycle("play"); },
  remove: function () {
    this.el.object3D.position.copy(this.basePosition);
    this.el.object3D.scale.copy(this.baseScale);
    this.running = false;
    this.logLifecycle("remove");
  }
});

// Runtime THREE.Texture and THREE.Material references stay on the component instance,
// never in this.data. Supports #asset IDs and file paths.
AFRAME.registerComponent("x2322-texture", {
  schema: {
    src: {type: "string", default: ""},
    repeat: {type: "vec2", default: {x: 1, y: 1}},
    normalSrc: {type: "string", default: ""},
    anisotropy: {type: "int", default: 8}
  },
  init: function () {
    this.mesh = null;
    this.originalMaterial = null;
    this.customMaterial = null;
    this.colorTexture = null;
    this.normalTexture = null;
    this.loadToken = 0;
    this.onObject3DSet = this.applyWhenReady.bind(this);
    this.el.addEventListener("object3dset", this.onObject3DSet);
  },
  resolveSrc: function (value) {
    if (!value) return "";
    if (value[0] === "#") {
      const image = document.getElementById(value.slice(1));
      return image ? (image.currentSrc || image.src) : "";
    }
    return value;
  },
  loadTexture: function (source, token, callback) {
    const url = this.resolveSrc(source);
    if (!url) { callback(null); return; }
    new THREE.TextureLoader().load(url, (texture) => {
      if (token !== this.loadToken) { texture.dispose(); return; }
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(this.data.repeat.x, this.data.repeat.y);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = Math.min(
        Math.max(1, this.data.anisotropy),
        this.el.sceneEl.renderer ? this.el.sceneEl.renderer.capabilities.getMaxAnisotropy() : 16
      );
      texture.needsUpdate = true;
      callback(texture);
    }, undefined, (error) => {
      console.error("x2322-texture failed to load:", url, error);
      if (token === this.loadToken) callback(null);
    });
  },
  applyWhenReady: function (event) {
    if (event && event.detail.type !== "mesh") return;
    this.applyMaterial();
  },
  applyMaterial: function () {
    const mesh = this.el.getObject3D("mesh");
    if (!mesh || !mesh.isMesh) return;
    if (this.mesh !== mesh) {
      this.restoreMaterial();
      this.mesh = mesh;
      this.originalMaterial = mesh.material;
      this.customMaterial = this.originalMaterial.clone();
      mesh.material = this.customMaterial;
    }
    if (this.customMaterial) {
      this.customMaterial.map = this.colorTexture;
      this.customMaterial.normalMap = this.normalTexture;
      this.customMaterial.needsUpdate = true;
    }
  },
  update: function (oldData) {
    const first = !oldData || Object.keys(oldData).length === 0;
    const srcChanged = first || oldData.src !== this.data.src;
    const normalChanged = first || oldData.normalSrc !== this.data.normalSrc;
    if (!srcChanged && !normalChanged) {
      [this.colorTexture, this.normalTexture].forEach((texture) => {
        if (!texture) return;
        texture.repeat.set(this.data.repeat.x, this.data.repeat.y);
        texture.anisotropy = Math.max(1, this.data.anisotropy);
        texture.needsUpdate = true;
      });
      this.applyMaterial();
      return;
    }
    const token = ++this.loadToken;
    if (srcChanged) {
      this.loadTexture(this.data.src, token, (texture) => {
        if (this.colorTexture) this.colorTexture.dispose();
        this.colorTexture = texture;
        if (texture) texture.colorSpace = THREE.SRGBColorSpace;
        this.applyMaterial();
      });
    }
    if (normalChanged) {
      this.loadTexture(this.data.normalSrc, token, (texture) => {
        if (this.normalTexture) this.normalTexture.dispose();
        this.normalTexture = texture;
        this.applyMaterial();
      });
    }
    this.applyMaterial();
  },
  restoreMaterial: function () {
    if (this.mesh && this.customMaterial) {
      this.mesh.material = this.originalMaterial;
      this.customMaterial.dispose();
    }
    this.mesh = null;
    this.customMaterial = null;
    this.originalMaterial = null;
  },
  remove: function () {
    ++this.loadToken;
    this.el.removeEventListener("object3dset", this.onObject3DSet);
    this.restoreMaterial();
    if (this.colorTexture) this.colorTexture.dispose();
    if (this.normalTexture) this.normalTexture.dispose();
    this.colorTexture = null;
    this.normalTexture = null;
  }
});

AFRAME.registerComponent("x2322-face-camera", {
  init: function () { this.target = new THREE.Vector3(); },
  tick: function () {
    if (!this.el.sceneEl.camera) return;
    this.el.sceneEl.camera.getWorldPosition(this.target);
    this.el.object3D.lookAt(this.target);
  }
});

AFRAME.registerSystem("x2322-gallery", {
  init: function () {
    this.exhibits = [];
    this.selected = null;
    this.motionPaused = false;
    this.onKeyDown = this.onKeyDown.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
    this.status = null;
    this.sceneEl.addEventListener("loaded", () => {
      this.status = document.querySelector("#gallery-status");
      this.updateStatus();
    });
  },
  registerExhibit: function (component) {
    if (!this.exhibits.includes(component)) this.exhibits.push(component);
    this.updateStatus();
  },
  unregisterExhibit: function (component) {
    if (this.selected === component) this.selected = null;
    this.exhibits = this.exhibits.filter((item) => item !== component);
    this.updateStatus();
  },
  select: function (component) {
    const next = this.selected === component ? null : component;
    if (this.selected) this.selected.setSelected(false);
    this.selected = next;
    if (next) next.setSelected(true);
    this.updateStatus();
  },
  updateStatus: function () {
    if (!this.status) this.status = document.querySelector("#gallery-status");
    if (!this.status) return;
    const count = this.exhibits.length;
    const index = this.selected ? this.exhibits.indexOf(this.selected) + 1 : 0;
    const name = this.selected ? this.selected.data.name : "None";
    this.status.setAttribute("value", `Selected: ${name} (${index} of ${count})`);
  },
  onKeyDown: function (event) {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const key = event.key.toLowerCase();
    if (key === "m") {
      this.motionPaused = !this.motionPaused;
      this.exhibits.forEach((component) => {
        const motion = component.el.components["x2322-motion"];
        if (!motion) return;
        if (this.motionPaused) motion.pause(); else motion.play();
      });
      console.log(`x2322-gallery | motion ${this.motionPaused ? "paused" : "resumed"}`);
    } else if (key === "x" && this.selected) {
      const entity = this.selected.el;
      console.log(`x2322-gallery | removing ${entity.id}`);
      entity.parentNode.removeChild(entity);
    }
  },
  remove: function () { window.removeEventListener("keydown", this.onKeyDown); }
});

AFRAME.registerComponent("x2322-exhibit", {
  schema: {
    name: {type: "string", default: "Exhibit"},
    description: {type: "string", default: ""}
  },
  init: function () {
    this.selected = false;
    this.hovered = false;
    this.originalColor = this.el.getAttribute("material").color;
    const motion = this.el.getAttribute("x2322-motion");
    this.originalAmplitude = motion ? motion.amplitude : 0.15;

    // Child panel remains excluded from the raycaster because it has no .exhibit class.
    this.panel = document.createElement("a-entity");
    this.panel.setAttribute("position", "0 1.35 0");
    this.panel.setAttribute("visible", false);
    this.panel.setAttribute("x2322-face-camera", "");
    const background = document.createElement("a-plane");
    background.setAttribute("width", 2.5);
    background.setAttribute("height", 0.85);
    background.setAttribute("material", "color: #102d3b; opacity: 0.95; side: double");
    const title = document.createElement("a-text");
    title.setAttribute("value", this.data.name);
    title.setAttribute("position", "-1.12 0.23 0.02");
    title.setAttribute("width", 2.25);
    title.setAttribute("color", "#ffffff");
    const description = document.createElement("a-text");
    description.setAttribute("value", this.data.description);
    description.setAttribute("position", "-1.12 -0.10 0.02");
    description.setAttribute("width", 2.2);
    description.setAttribute("wrap-count", 32);
    description.setAttribute("color", "#bcecf5");
    this.panel.append(background, title, description);
    this.el.appendChild(this.panel);

    this.onEnter = this.onEnter.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.onClick = this.onClick.bind(this);
    this.el.addEventListener("mouseenter", this.onEnter);
    this.el.addEventListener("mouseleave", this.onLeave);
    this.el.addEventListener("click", this.onClick);
    this.el.sceneEl.systems["x2322-gallery"].registerExhibit(this);
  },
  onEnter: function () {
    this.hovered = true;
    if (!this.selected) this.setDisplayColor("#fff0a6");
  },
  onLeave: function () {
    this.hovered = false;
    if (!this.selected) this.setDisplayColor(this.originalColor);
  },
  onClick: function () { this.el.sceneEl.systems["x2322-gallery"].select(this); },
  setDisplayColor: function (color) {
    this.el.setAttribute("material", "color", color);
    const textureComponent = this.el.components["x2322-texture"];
    if (textureComponent && textureComponent.customMaterial) {
      textureComponent.customMaterial.color.set(color);
    }
  },
  setSelected: function (value) {
    if (this.selected === value) return;
    this.selected = value;
    this.panel.setAttribute("visible", value);
    this.setDisplayColor(value ? "#ffffff" : (this.hovered ? "#fff0a6" : this.originalColor));
    if (this.el.hasAttribute("x2322-motion")) {
      this.el.setAttribute("x2322-motion", "amplitude", value ? 0.35 : this.originalAmplitude);
    }
    console.log(`[${new Date().toISOString()}] x2322-exhibit | ${this.el.id} | ${value ? "selected" : "deselected"}`);
  },
  remove: function () {
    this.el.removeEventListener("mouseenter", this.onEnter);
    this.el.removeEventListener("mouseleave", this.onLeave);
    this.el.removeEventListener("click", this.onClick);
    this.el.sceneEl.systems["x2322-gallery"].unregisterExhibit(this);
    if (this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
  }
});
