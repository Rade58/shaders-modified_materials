import * as THREE from "three";

import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader, RGBELoader } from "three/examples/jsm/Addons.js";

// ---------- onBeforeCompile hook :
//                       adding content to vertex shader ----------
//
// we will use `#include ...` to inject code using native javascript
// `replace` method
// we need to understand the code

// we can go to : node_modules/three/src/renderers/shaders/
// folder, there we can find two folders: `ShaderLib/` folder and
// `ShaderChunkFolder`

// in ShaderLib/ folder shaders are grouped by material and both vertex
//  and fragment will be in a same file of the mentioned material

// rember how we were looking at points material shaders:
// node_modules/three/src/renderers/shaders/ShaderLib/points.glsl.js
// in previous workshop

// we can look at it again
// There you will figure out that `#include <>` synatax
// actually include chunks: `#include <name of the chunk>`
// a chunk that is located in `ShaderChunk/` folder

// we found `#include <begin_vertex>` which we will try to replace
// with our own vertex shader we will inline in a template literal

// we will do this in onBeforeCompile hook as you know

// but first we need to go to
// node_modules/three/src/renderers/shaders/ShaderLib/meshphysical.glsl.js
// try to read some code of the vertex shader
// look for includes and by their names you can easyly conclude
// what are they used for

// you will se on several palaces a `#include <begin_vertex>`

// so go to:
//      node_modules/three/src/renderers/shaders/ShaderChunk/begin_vertex.glsl.js
// and there you will see:
/* 
      export default `
      vec3 transformed = vec3( position );

      #ifdef USE_ALPHAHASH

        vPosition = vec3( position );

      #endif
`;
 */

// so we saw this: `vec3 transformed = vec3( position );`

// what we are going to do is to change `transformed`
// variable in our shader code, we can play with it

// ----------------------------------------------------------------
// ------------ gui -------------------
/**
 * @description Debug UI - lil-ui
 */
const gui = new GUI({
  width: 340,
  title: "Tweak it",
  closeFolders: false,
});

/**
 * @description gui parmeters
 */
const parameters = {
  //
  "rotate model": 0,
  // default is 1 I think
  "envMapIntensity for every material of model": 1,
  // "envMapIntensity for material of torusKnot": 5,
  // backgroundBluriness: 0.2,
  backgroundBluriness: 0,
  // backgroundIntensity: 5,
  backgroundIntensity: 1,
};
// gui.hide()
// ----------------------------------

//------------ canvas settings -----------
/**
 * @description canvas settings
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
// ----------------------------------------

const canvas: HTMLCanvasElement | null = document.querySelector("canvas.webgl");

if (canvas) {
  // ---- loaders -------
  /**
   * @description loaders
   */

  const gltfLoader = new GLTFLoader();

  const rgbeLoader = new RGBELoader();

  // const textureLoader = new THREE.TextureLoader();

  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------
  // -------------------------------------------------------------------

  // ------- Scene
  const scene = new THREE.Scene();

  scene.backgroundBlurriness = parameters.backgroundBluriness;
  scene.backgroundIntensity = parameters.backgroundIntensity;
  //
  gui
    .add(parameters, "backgroundBluriness")
    .min(0)
    .max(1)
    .step(0.01)
    .onChange((val: number) => {
      scene.backgroundBlurriness = val;
    });
  gui
    .add(parameters, "backgroundIntensity")
    .min(1)
    .max(10)
    .step(0.1)
    .onChange((val: number) => {
      scene.backgroundIntensity = val;
    });

  //

  function setEnvironmentMapForMaterialsOfModel(envMap: THREE.DataTexture) {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (
          child.material instanceof THREE.MeshStandardMaterial
          // && !(child.geometry instanceof THREE.TorusKnotGeometry)
        ) {
          child.material.envMap = envMap;
          child.material.envMapIntensity =
            parameters["envMapIntensity for every material of model"];

          // shadows
          child.castShadow = true;
          child.receiveShadow = true;
          // ***************************************************
          // ***************************************************
          // ---------------------------------------------------
          // ---------------------------------------------------
          // ---------------------------------------------------

          // don't make a mistake and restructure,
          // do like this
          child.material.onBeforeCompile = (shader) => {
            // since replace makes a new string
            // we must reassign it
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              // if you provide empty replacement string
              // you'll get an error
              // and as we develop you can replace it
              // with a same thing like this
              //      "#include <begin_vertex>"
              // it will work because you are replacing it with a same thing

              // I also tried to copy a code we found in begin_vertex,
              // and use it as a replacemnt string
              // and it worked

              // but it is better to keep
              // on the beggining of template literal
              // and you can comment it out
              // this also works

              /* glsl */ `
              #include <begin_vertex>
              
              // we don't need to use all of this code in
              // here which I originally intended
               
              // vec3 transformed = vec3( position );
              // #ifdef USE_ALPHAHASH
              //    vPosition = vec3( position );
              // #endif

              // instead of that let's try to move
              // vertices

              transformed.y += 3.0;

              // an acutally as we saved
              // entire model changed position
              // otr to be precise all of its vertices

              `
            );
          };

          // ---------------------------------------------------
          // ---------------------------------------------------
          // ---------------------------------------------------
          // ***************************************************
          // ***************************************************
        }
      }
    });
  }

  gui
    .add(parameters, "envMapIntensity for every material of model")
    .min(1)
    .max(10)
    .step(0.001)
    .onChange(updateAllMaterials);

  /**
   * @description Update All Materials
   */
  function updateAllMaterials() {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (
          child.material instanceof THREE.MeshStandardMaterial &&
          !(child.geometry instanceof THREE.TorusKnotGeometry)
        ) {
          // we can now define setting intensity with
          // gui

          child.material.envMapIntensity =
            parameters["envMapIntensity for every material of model"];
          child.material.needsUpdate = true;
        }
      }
    });
  }

  // -------- Camera -------------------------------
  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );
  // camera.position.set(4, 1, -4);
  camera.position.set(1, 1, 4);
  scene.add(camera);

  //------------------------------------------------
  //------------------------------------------------
  //------------------------------------------------
  //------------------------------------------------
  // ----------    ENVIRONMENT MAP

  /**
   * @description HDR (RGBE) equirectangular
   */
  rgbeLoader.load(
    "/textures/environmentMaps/underpass/2k.hdr",
    (environmentMap) => {
      environmentMap.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = environmentMap;

      // so instead of helmet we will load "lee perry-smith head"
      // gltfLoader.load("/models/FlightHelmet/glTF/FlightHelmet.gltf", (gltf) => {
      gltfLoader.load("/models/head_lee_perry_smith/scene.gltf", (gltf) => {
        console.log("model loaded");
        gltf.scene.scale.setScalar(10);
        // gltf.scene.position.y = -4;

        gui
          .add(parameters, "rotate model")
          .onChange((a: number) => {
            gltf.scene.rotation.y = Math.PI * a;
          })
          .min(0)
          .max(2);

        scene.add(gltf.scene);

        // console.log({ gltf });

        setEnvironmentMapForMaterialsOfModel(environmentMap);
      });
    },
    () => {
      console.log("loading hdri progressing");
    },
    (err) => {
      console.log("HDRI not loaded");
      console.error(err);
    }
  );
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------

  // ----------------------------------------------
  // ----------------------------------------------
  // Meshes, Geometries, Materials
  // ----------------------------------------------
  // ----------------------------------------------

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // ------------------------- LIGHTS ----------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  /**
   * @description Directional light
   */
  const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
  directionalLight.position.set(-4, 6.5, 2.5);
  scene.add(directionalLight);

  // add this before adding helper
  directionalLight.shadow.camera.far = 15;

  directionalLight.shadow.mapSize.set(1024, 1024);

  const directionalLightCameraHelper = new THREE.CameraHelper(
    directionalLight.shadow.camera
  );

  directionalLightCameraHelper.visible = false;

  directionalLight.castShadow = true;

  directionalLight.target.position.set(0, 2, 0);
  directionalLight.target.updateWorldMatrix(true, true);

  scene.add(directionalLightCameraHelper);

  gui.add(directionalLight, "castShadow");

  gui
    .add(directionalLight, "intensity")
    .min(0)
    .max(10)
    .step(0.001)
    .name("directLightIntensity");
  gui
    .add(directionalLight.position, "x")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighX");
  gui
    .add(directionalLight.position, "y")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighY");
  gui
    .add(directionalLight.position, "z")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighZ");

  gui
    .add(directionalLight.target.position, "x")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighTargetPositionX")
    .onChange(() => {
      directionalLight.target.updateWorldMatrix(true, true);
    });

  gui
    .add(directionalLight.target.position, "y")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighTargetPositionY")
    .onChange(() => {
      directionalLight.target.updateWorldMatrix(true, true);
    });

  gui
    .add(directionalLight.target.position, "z")
    .min(-10)
    .max(10)
    .step(0.001)
    .name("directLighTargetPositionZ")
    .onChange(() => {
      directionalLight.target.updateWorldMatrix(true, true);
    });

  gui
    .add(directionalLight.shadow.camera, "far")
    .min(-10)
    .max(20)
    .step(0.001)
    .name("directLighShadowCameraFar")
    .onChange(() => {
      directionalLight.shadow.camera.updateProjectionMatrix();
      directionalLightCameraHelper.update();
    });

  gui
    .add(directionalLightCameraHelper, "visible")
    .name("show directionalLightCameraHelper");

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------

  // ----------------------------------------------
  // ----------------------------------------------
  // ----------------------------------------------
  // ----------------------------------------------
  // -----------------   MODELs
  // I moved this code inside onLoad handrer
  // for hdri env map loading
  // I moved this
  /* gltfLoader.load("/models/FlightHelmet/glTF/FlightHelmet.gltf", (gltf) => {
    console.log("model loaded");
    gltf.scene.scale.setScalar(10);
    gltf.scene.position.y = -4;

    gui
      .add(parameters, "rotate model")
      .onChange((a: number) => {
        gltf.scene.rotation.y = Math.PI * a;
      })
      .min(0)
      .max(2);

    scene.add(gltf.scene);
  }); */

  // -------- Controls and helpers

  const orbit_controls = new OrbitControls(camera, canvas);
  orbit_controls.enableDamping = true;

  // ----------------------------------------------
  // ----------------------------------------------

  // -------------- RENDERER
  // ----------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    //To make the edges of the objects more smooth (we are setting this in this lesson)
    antialias: true,
    // alpha: true,
  });

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // maybe this should be only inside       tick

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // -------------- SHADOWS ----------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // ------------- TONE MAPPING ------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 3;

  gui.add(renderer, "toneMapping", {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  });
  gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.001);

  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  /**
   * Event Listeners
   */

  window.addEventListener("resize", (e) => {
    console.log("resizing");
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "h") {
      gui.show(gui._hidden);
    }
  });

  const mouse = new THREE.Vector2();
  window.addEventListener("mousemove", (_event) => {
    mouse.x = (_event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(_event.clientY / sizes.height) * 2 + 1;

    // console.log({ mouse });
  });

  /* window.addEventListener("dblclick", () => {
    console.log("double click");

    // handling safari
    const fullscreenElement =
      // @ts-ignore webkit
      document.fullscreenElement || document.webkitFullScreenElement;
    //

    // if (!document.fullscreenElement) {
    if (!fullscreenElement) {
      if (canvas.requestFullscreen) {
        // go fullscreen
        canvas.requestFullscreen();

        // @ts-ignore webkit
      } else if (canvas.webkitRequestFullScreen) {
        // @ts-ignore webkit
        canvas.webkitRequestFullScreen();
      }
    } else {
      // @ts-ignore
      if (document.exitFullscreen) {
        document.exitFullscreen();

        // @ts-ignore webkit
      } else if (document.webkitExitFullscreen) {
        // @ts-ignore webkit
        document.webkitExitFullscreen();
      }
    }
  }); */

  // ---------------------- TICK -----------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------

  const clock = new THREE.Clock();

  /**
   * @description tick
   */
  function tick() {
    // for dumping to work
    orbit_controls.update();

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  }

  tick();
}
