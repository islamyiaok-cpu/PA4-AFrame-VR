
"use strict";

// PA4 - Student ID 242322

// ========================================
// TASK B: CUSTOM MOTION COMPONENT
// ========================================

AFRAME.registerComponent("x2322-motion", {
  schema: {
    type: {
      type: "string",
      default: "pulse",
      oneOf: ["bob", "orbit", "pulse"]
    },
    amplitude: { type: "number", default: 0.15 },
    period: { type: "number", default: 3 },
    phase: { type: "number", default: 0 }
  },

  logLifecycle: function (method) {
    console.log(
      `[${new Date().toISOString()}] ` +
      `x2322-motion | ${this.el.id} | ${method}`
    );
  },

  init: function () {
    this.basePosition = this.el.object3D.position.clone();
    this.baseScale = this.el.object3D.scale.clone();

    this.elapsed = 0;
    this.phaseOffset = this.data.phase;
    this.running = true;

    this.currentAmplitude = this.data.amplitude;
    this.targetAmplitude = this.data.amplitude;

    this.logLifecycle("init");
  },

  update: function (oldData) {
    this.logLifecycle("update");

    this.targetAmplitude = this.data.amplitude;

    if (!oldData || Object.keys(oldData).length === 0) {
      return;
    }

    const oldPeriod = Math.max(0.001, oldData.period);
    const newPeriod = Math.max(0.001, this.data.period);

    const oldAngle =
      (2 * Math.PI * this.elapsed) / oldPeriod +
      this.phaseOffset;

    this.phaseOffset =
      oldAngle -
      (2 * Math.PI * this.elapsed) / newPeriod;

    if (oldData.phase !== this.data.phase) {
      this.phaseOffset += this.data.phase - oldData.phase;
    }

    if (oldData.type !== this.data.type) {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.scale.copy(this.baseScale);
    }
  },

  tick: function (time, timeDelta) {
    if (!this.running) return;

    const deltaMs = Number.isFinite(timeDelta)
      ? Math.max(0, timeDelta)
      : 0;

    this.elapsed += deltaMs / 1000;

    const period = Math.max(0.001, this.data.period);
    const angle =
      (2 * Math.PI * this.elapsed) / period +
      this.phaseOffset;

    const wave = Math.sin(angle);
    const smoothing = 1 - Math.exp(-deltaMs / 250);

    this.currentAmplitude +=
      (this.targetAmplitude - this.currentAmplitude) *
      smoothing;

    const amount = this.currentAmplitude * wave;

    if (this.data.type === "pulse") {
      const factor = Math.max(0.05, 1 + amount);
      this.el.object3D.scale
        .copy(this.baseScale)
        .multiplyScalar(factor);
    } else if (this.data.type === "bob") {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.position.y += amount;
    } else if (this.data.type === "orbit") {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.position.x +=
        this.currentAmplitude * Math.cos(angle);
      this.el.object3D.position.z +=
        this.currentAmplitude * Math.sin(angle);
    }
  },

  pause: function () {
    this.running = false;
    this.logLifecycle("pause");
  },

  play: function () {
    this.running = true;
    this.logLifecycle("play");
  },

  remove: function () {
    this.el.object3D.position.copy(this.basePosition);
    this.el.object3D.scale.copy(this.baseScale);
    this.running = false;
    this.logLifecycle("remove");
  }
});

// ========================================
// TASK D: EXHIBIT INTERACTION COMPONENT
// ========================================

AFRAME.registerComponent("x2322-exhibit", {
  schema: {
    name: { type: "string", default: "Exhibit" },
    description: { type: "string", default: "" }
  },

  init: function () {
    this.selected = false;
    this.hovered = false;

    this.originalColor = this.el.getAttribute("material").color;

    const motion = this.el.getAttribute("x2322-motion");
    this.originalAmplitude = motion
      ? motion.amplitude
      : 0.15;

    // Create the information panel.
    this.panel = document.createElement("a-entity");
    this.panel.setAttribute("position", "0 1.35 0");
    this.panel.setAttribute("visible", false);

    const background = document.createElement("a-plane");
    background.setAttribute("width", 2.5);
    background.setAttribute("height", 0.85);
    background.setAttribute(
      "material",
      "color: #102d3b; opacity: 0.95; side: double"
    );

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

    this.panel.appendChild(background);
    this.panel.appendChild(title);
    this.panel.appendChild(description);
    this.el.appendChild(this.panel);

    // Point the panel toward the camera.
    this.panel.setAttribute("x2322-face-camera", "");

    this.onEnter = this.onEnter.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.onClick = this.onClick.bind(this);

    this.el.addEventListener("mouseenter", this.onEnter);
    this.el.addEventListener("mouseleave", this.onLeave);
    this.el.addEventListener("click", this.onClick);
  },

  onEnter: function () {
    this.hovered = true;
    if (!this.selected) {
      this.el.setAttribute("material", "color", "#fff0a6");
    }
  },

  onLeave: function () {
    this.hovered = false;
    if (!this.selected) {
      this.el.setAttribute(
        "material",
        "color",
        this.originalColor
      );
    }
  },

  onClick: function () {
    const all = document.querySelectorAll(
      "[x2322-exhibit]"
    );

    // Only one exhibit can be selected at a time.
    all.forEach((entity) => {
      if (entity !== this.el) {
        const component = entity.components["x2322-exhibit"];
        if (component) component.setSelected(false);
      }
    });

    this.setSelected(!this.selected);
  },

  setSelected: function (value) {
    this.selected = value;

    if (this.panel) {
      this.panel.setAttribute("visible", value);
    }

    this.el.setAttribute(
      "material",
      "color",
      value
        ? "#ffffff"
        : (this.hovered ? "#fff0a6" : this.originalColor)
    );

    if (this.el.hasAttribute("x2322-motion")) {
      this.el.setAttribute(
        "x2322-motion",
        "amplitude",
        value ? 0.35 : this.originalAmplitude
      );
    }

    console.log(
      `[${new Date().toISOString()}] ` +
      `x2322-exhibit | ${this.el.id} | ` +
      (value ? "selected" : "deselected")
    );
  },

  remove: function () {
    this.el.removeEventListener("mouseenter", this.onEnter);
    this.el.removeEventListener("mouseleave", this.onLeave);
    this.el.removeEventListener("click", this.onClick);

    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }

    this.el.setAttribute(
      "material",
      "color",
      this.originalColor
    );
  }
});

// ========================================
// INFORMATION PANEL FACES THE CAMERA
// ========================================

AFRAME.registerComponent("x2322-face-camera", {
  tick: function () {
    const scene = this.el.sceneEl;
    if (!scene || !scene.camera) return;

    const cameraPosition = new THREE.Vector3();
    scene.camera.getWorldPosition(cameraPosition);

    this.el.object3D.lookAt(cameraPosition);
  }
});
