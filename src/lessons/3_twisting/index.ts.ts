import * as THREE from "three";

import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader, RGBELoader } from "three/examples/jsm/Addons.js";

// ---------------- twisting -----------------------------
// we wnat to "deform" the material of the model with
// vertex shader in a way that we are going to do some kind
// of rotation of vertices to esencially twist it

// again if you forgot previous lesson, go to onBeforeCompile
// hook (for the rest info, see a previous lesson)

// author of the workshop used this as a refrence:
// https://thebookofshaders.com/08/
// we need function that returns 2d rotation matrix and function
// takes the angle as argument

// but where to define the function
// we need to add function in the `common` chunk
// the chunk that shaders include like this: `#include <common>`
// here is the code, and also you will see inside the
// bunch of defines you can use in your code
//  node_modules/three/src/renderers/shaders/ShaderChunk/common.glsl.js

// we will do the same thing we did earlier, in previous lesson
// we will replace mentioned `#include <common>` with our code
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

          child.material.onBeforeCompile = (shader) => {
            // here you go, this is what we do
            // sa,e thing we did in previous lesson for begin_vertex
            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              /* glsl */ `
              
              #include <common>

              mat2 get2dRotateMatrix(float _angle){
                return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
              }

              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",

              /* glsl */ `
              
              #include <begin_vertex>
              
              // make angle vary according to elavation (according to y)
              float angle = position.y *  3.0;

              // we can use the function here
              mat2 rotateMatrix = get2dRotateMatrix(angle);

              // we can try rotating it by multiplying
              // with matrice
              transformed.xz = rotateMatrix * transformed.xz;
              
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

  const axesHelper = new THREE.AxesHelper(3);
  axesHelper.setColors("red", "green", "blue");
  scene.add(axesHelper);

  axesHelper.visible = false;

  gui.add(axesHelper, "visible").name("axes helper");

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
