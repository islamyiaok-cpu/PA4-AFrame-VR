
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
    // Save the original transform.
    this.basePosition = this.el.object3D.position.clone();
    this.baseScale = this.el.object3D.scale.clone();

    // Time and motion state.
    this.elapsed = 0;
    this.phaseOffset = this.data.phase;
    this.running = true;

    // Smooth amplitude changes.
    this.currentAmplitude = this.data.amplitude;
    this.targetAmplitude = this.data.amplitude;

    this.logLifecycle("init");
  },

  update: function (oldData) {
    this.logLifecycle("update");

    // Do not change the visible amplitude immediately.
    // tick() will smoothly approach the new value.
    this.targetAmplitude = this.data.amplitude;

    // A-Frame also calls update() during initialization.
    if (!oldData || Object.keys(oldData).length === 0) {
      return;
    }

    // Keep the current angle when the period changes.
    const oldPeriod = Math.max(0.001, oldData.period);
    const newPeriod = Math.max(0.001, this.data.period);

    const oldAngle =
      (2 * Math.PI * this.elapsed) / oldPeriod +
      this.phaseOffset;

    this.phaseOffset =
      oldAngle -
      (2 * Math.PI * this.elapsed) / newPeriod;

    // Apply an explicitly requested phase change.
    if (oldData.phase !== this.data.phase) {
      this.phaseOffset += this.data.phase - oldData.phase;
    }

    // Reset the previous motion type's transform.
    if (oldData.type !== this.data.type) {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.scale.copy(this.baseScale);
    }
  },

  tick: function (time, timeDelta) {
    if (!this.running) {
      return;
    }

    // Convert milliseconds into seconds.
    const deltaMs = Number.isFinite(timeDelta)
      ? Math.max(0, timeDelta)
      : 0;

    this.elapsed += deltaMs / 1000;

    // Calculate the oscillation.
    const period = Math.max(0.001, this.data.period);

    const angle =
      (2 * Math.PI * this.elapsed) / period +
      this.phaseOffset;

    const wave = Math.sin(angle);

    // Smooth amplitude transitions (about 250 ms).
    const smoothing = 1 - Math.exp(-deltaMs / 250);

    this.currentAmplitude +=
      (this.targetAmplitude - this.currentAmplitude) *
      smoothing;

    const amount = this.currentAmplitude * wave;

    // Pulse: change scale around the original size.
    if (this.data.type === "pulse") {
      const factor = Math.max(0.05, 1 + amount);

      this.el.object3D.scale
        .copy(this.baseScale)
        .multiplyScalar(factor);
    }

    // Bob: move vertically around the original position.
    else if (this.data.type === "bob") {
      this.el.object3D.position.copy(this.basePosition);
      this.el.object3D.position.y += amount;
    }

    // Orbit: move in a small circle.
    else if (this.data.type === "orbit") {
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
    // Restore the original transform.
    this.el.object3D.position.copy(this.basePosition);
    this.el.object3D.scale.copy(this.baseScale);

    this.running = false;
    this.logLifecycle("remove");
  }
});
