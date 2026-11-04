# PA4 — A-Frame VR Scene with Custom Components

**Student:** Islamiya Okassova  
**Student ID:** 242322

## Personal Variant

- Theme: Underwater Research Base
- Motion: Pulse
- Interaction: Point-and-click
- Layout: Ring of six exhibits, radius 4 m
- Component prefix: `x2322-`

## Technology

- A-Frame 1.8.0
- Three.js (included with A-Frame)
- HTML, CSS, and JavaScript
- Visual Studio Code and Live Server
- Google Chrome

## Project Description

An interactive underwater research base containing six exhibits arranged in a circular gallery. Each exhibit uses a custom motion component and can be selected to display its name and description.

The scene includes image textures, lighting, fog, navigation controls, and a gallery management system.

## Custom Components and System

- `x2322-motion` — controls time-based exhibit motion, including pulse animation and lifecycle handling.
- `x2322-texture` — loads textures, configures texture repetition and filtering, and manages Three.js resources.
- `x2322-exhibit` — handles exhibit highlighting, selection, and information display.
- `x2322-gallery` — manages exhibit registration, selection, and removal.

## Run Locally

1. Download or clone the repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` using the Live Server extension.
4. Open the local URL in Google Chrome.
5. Explore the underwater research base.

## Controls

- **W/A/S/D:** Move around the scene.
- **Mouse drag:** Rotate the camera.
- **Mouse click on an exhibit:** Select or deselect it.
- **M:** Pause or resume exhibit motion.
- **X:** Remove the selected exhibit.
- **VR button:** Enter immersive VR when supported by the browser and device.

## Scene Features

- Six exhibits positioned on a ring with a radius of 4 meters.
- Pulse animations with different phases.
- Information panels and selection highlighting.
- A gallery status display.
- Three image textures.
- Ambient and directional lighting.
- Underwater fog and background.

## Texture Credits

The project uses three custom texture images:

- `textures/seafloor.png` — stylized underwater seabed texture.
- `textures/metal.png` — stylized metal panel texture.
- `textures/coral.png` — stylized coral-inspired texture.

### Additional Texture Resources 

1. **Poly Haven** — https://polyhaven.com/textures

2. **3DTextures.me** — https://3dtextures.me/

## Experiments

The project is evaluated through six experiments:

- **E1:** Component lifecycle and live updates.
- **E2:** Chapter 8 texture loader and component data handling.
- **E3:** Texture filtering and anisotropy.
- **E4:** A-Frame renderer, scene graph, camera, and WebXR.
- **E5:** Performance measurements and instanced rendering.
- **E6:** VR ergonomics and interaction comfort.

