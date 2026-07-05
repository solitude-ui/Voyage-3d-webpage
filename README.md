# VOYAGE - Car Traffic Simulator

A Next.js & React Three Fiber interactive portfolio and traffic simulator.

---

## 🚀 How to Run This Project Simply

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18.0 or later is recommended).

### 2. Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

### 3. Run the Development Server
Start the local server by running:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your web browser.

---

## 🎮 Where to Add Unity WebGL Build Files

To make sure your Unity WebGL build loads correctly, you must place the files inside the `public/unity-game/` directory.

### Folder Structure
Your `public/unity-game/` directory should look like this:
```text
public/
└── unity-game/
    ├── index.html
    └── Build/
        ├── game.loader.js
        ├── game.framework.js.br
        ├── game.wasm.br
        └── game.data.br
```

> [!IMPORTANT]
> **Renaming Compressed Assets**: Make sure the WebGL build files inside the `Build/` directory are named exactly **`game.loader.js`**, **`game.framework.js.br`**, **`game.wasm.br`**, and **`game.data.br`** (without spaces or custom names) to match the pre-configured static asset routing headers in `next.config.ts`.

---

## 🚗 Where to Add Car Assets

Place your 3D car models inside the `public/models/car/` folder.

1. **SUV Model (FBX)**:
   *   Path: `public/models/car/playerCar.fbx`
2. **Dodge Challenger Model (GLB)**:
   *   Path: `public/models/car/dodge_challenger.glb`
