# Shaders - Modified Materials

```
pnpm add lil-gui three
```

```
pnpm add -D @types/three vite vite-plugin-glslify
```

# Fixing the shadow

To handle shadows, Three.js do renders from the lights point of view called shadow maps.
When those renders occur, all the materials are replaced by another set of materials.
That kind of material doesn't twist
