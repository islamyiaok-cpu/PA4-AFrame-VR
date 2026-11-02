
"use strict";

// PA4 - Student ID 242322
// Custom motion component: x2322-motion

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
    this.lastTime = null;
    this.phaseOffset = this.data.phase;
    this.running = true;

    this.logLifecycle("init");
  },

  update: function (oldData) {
    this.logLifecycle("update");

    if (!oldData || Object.keys(oldData).length === 0) {
      return;
    }

    // Preserve the current oscillation angle when the
    // period or phase is changed at runtime.
    const oldPeriod = Math.max(0.001, oldData.period);
    const oldAngle =
      (2 * Math.PI * this.elapsed) / oldPeriod +
      this.phaseOffset;

    const newPeriod = Math.max(0.001, this.data.period);

    this.phaseOffset =
      oldAngle -
      (2 * Math.PI * this.elapsed) / newPeriod;

    if (oldData.phase !== this.data.phase) {
      this.phaseOffset += this.data.phase - oldData.phase;
    }
  },

  tick: function (time, timeDelta) {
    if (!this.running) return;

    // A-Frame supplies frame time in milliseconds.
    // Store elapsed time in seconds.
    if (Number.isFinite(timeDelta)) {
      this.elapsed += Math.max(0, timeDelta) / 1000;
    }

    const period = Math.max(0.001, this.data.period);
    const angle =
      (2 * Math.PI * this.elapsed) / period +
      this.phaseOffset;

    const wave = Math.sin(angle);
    const amount = this.data.amplitude * wave;

    if (this.data.type === "pulse") {
      const factor = Math.max(0.05, 1 + amount);
      this.el.object3D.scale.copy(this.baseScale)
        .multiplyScalar(factor);
    } else if (this.data.type === "bob") {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.position.y += amount;
    } else if (this.data.type === "orbit") {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.position.x +=
        this.data.amplitude * Math.cos(angle);
      this.el.object3D.position.z +=
        this.data.amplitude * Math.sin(angle);
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
