# Shaders - Modified Materials

```
pnpm add lil-gui three
```

```
pnpm add -D @types/three vite vite-plugin-glslify
```

# Fixing the shadow and fixing the normals

for lesson 7:

To handle shadows, Three.js do renders from the lights point of view called shadow maps.
When those renders occur, all the materials are replaced by another set of materials.
That kind of material doesn't twist
So we will create and twist MeshDepthMaterial, better to say we will override it

for lesson 8:
The normal are data associated with the vertices that tell in which direction is the outside to be used for lights, shadows, reflection and stuff like that
We will also rotate the normals
