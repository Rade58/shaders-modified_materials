import * as THREE from "three";

import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader, RGBELoader } from "three/examples/jsm/Addons.js";

// We won't use this as a setup
// This is from the repo from one of advanced workshops:
// https://github.com/Rade58/advanced_threejs_realistic_render
// we will build actual setup in here
// src/setups/_2_setup
//

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
  // const cubeTextureLoader = new THREE.CubeTextureLoader();

  const rgbeLoader = new RGBELoader();

  const textureLoader = new THREE.TextureLoader();

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

  // I revorked this function so I can
  // set envMap for materials of meshes that are part of model
  function setEnvironmentMapForMaterialsOfModel(envMap: THREE.DataTexture) {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (
          child.material instanceof THREE.MeshStandardMaterial &&
          !(child.geometry instanceof THREE.TorusKnotGeometry)
        ) {
          child.material.envMap = envMap;
          child.material.envMapIntensity =
            parameters["envMapIntensity for every material of model"];

          // shadows
          child.castShadow = true;
          child.receiveShadow = true;
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
  camera.position.set(4, 1, -4);
  scene.add(camera);

  //------------------------------------------------
  //------------------------------------------------
  //------------------------------------------------
  //------------------------------------------------
  // ----------    ENVIRONMENT MAP

  // we write this

  /**
   * @description HDR (RGBE) equirectangular
   */
  rgbeLoader.load(
    "/textures/environmentMaps/underpass/2k.hdr",
    (environmentMap) => {
      environmentMap.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = environmentMap;

      // torusKnot.material.envMap = environmentMap;

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

        setEnvironmentMapForMaterialsOfModel(environmentMap);
      }); */

      // -------------------------------------------------------------
      // -------------------------------------------------------------
      //    HAMBURGER
      // -------------------------------------------------------------
      // -------------------------------------------------------------
      gltfLoader.load("/models/custom/hamburger.glb", (gltf) => {
        gltf.scene.scale.set(0.4, 0.4, 0.4);
        gltf.scene.position.set(0, -3, 0);

        scene.add(gltf.scene);

        // updateAllMaterials();

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
  // FLOOR
  const floorColorTexture = textureLoader.load(
    "/textures/floor/wood_cabinet_worn_long_diff_1k.jpg"
  );
  const floorNormalTexture = textureLoader.load(
    "/textures/floor/wood_cabinet_worn_long_nor_gl_1k.png"
  );
  const floorAORoughnessMetalnessTexture = textureLoader.load(
    "/textures/floor/wood_cabinet_worn_long_arm_1k.jpg"
  );
  // WALL
  const wallColorTexture = textureLoader.load(
    "/textures/wall/castle_brick_broken_06_diff_1k.jpg"
  );
  const wallNormalTexture = textureLoader.load(
    "/textures/wall/castle_brick_broken_06_nor_gl_1k.png"
  );
  const wallAORoughnessMetalnessTexture = textureLoader.load(
    "/textures/wall/castle_brick_broken_06_arm_1k.jpg"
  );

  floorColorTexture.colorSpace = THREE.SRGBColorSpace;
  wallColorTexture.colorSpace = THREE.SRGBColorSpace;

  // ----------------------------------------------
  // ----------------------------------------------
  // Meshes, Geometries, Materials
  // ----------------------------------------------
  // ----------------------------------------------

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({
      map: floorColorTexture,
      normalMap: floorNormalTexture,
      aoMap: floorAORoughnessMetalnessTexture,
      roughnessMap: floorAORoughnessMetalnessTexture,
      metalnessMap: floorAORoughnessMetalnessTexture,
    })
  );

  floor.rotation.set(-Math.PI / 2, 0, 0);
  floor.position.y = -4;

  scene.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({
      map: wallColorTexture,
      normalMap: wallNormalTexture,
      aoMap: wallAORoughnessMetalnessTexture,
      roughnessMap: wallAORoughnessMetalnessTexture,
      metalnessMap: wallAORoughnessMetalnessTexture,
    })
  );
  wall.position.z = -4;

  scene.add(wall);

  // don't want torusKnot for this scene
  /* const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1, 0.4, 100, 16),
    // new THREE.MeshBasicMaterial({ color: "white" })
    new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 1,
      color: 0xaaaaaa,
    })
  );

  torusKnot.position.x = -4;
  // comment this out
  // torusKnot.material.envMap = environmentMap;
  //

  torusKnot.material.envMapIntensity =
    parameters["envMapIntensity for material of torusKnot"];
  torusKnot.material.needsUpdate = true;

  //
  scene.add(torusKnot); */

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

  // normalBias and bias, we test it first with gui
  // we came to it that these values are appropriate

  directionalLight.shadow.normalBias = 0.027;
  directionalLight.shadow.bias = -0.004;
  // ----
  gui
    .add(directionalLight.shadow, "normalBias")
    .min(-0.05)
    .max(0.05)
    .step(0.001);
  gui.add(directionalLight.shadow, "bias").min(-0.05).max(0.05).step(0.001);

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // -------------------------------------------------------------

  // This was CubeTexture instance
  /* const environmentMap = cubeTextureLoader.load(
    [
      "/textures/environmentMaps/underpass/px.png",
      "/textures/environmentMaps/underpass/nx.png",
      "/textures/environmentMaps/underpass/py.png",
      "/textures/environmentMaps/underpass/ny.png",
      "/textures/environmentMaps/underpass/pz.png",
      "/textures/environmentMaps/underpass/nz.png",
    ],
    () => {
      console.log("environment map loaded");
    },
    () => {
      console.log("environment map progress");
    },
    (err) => {
      console.log("environment map loading error");
      console.error(err);
    }
  );
  scene.background = environmentMap; 
  */

  // don't want torus knot in this scene so I don't want any
  // gui for it
  /* gui
    .add(parameters, "envMapIntensity for material of torusKnot")
    .min(1)
    .max(10)
    .step(0.001)
    .onChange((val: number) => {
      // console.log({ val });

      torusKnot.material.envMapIntensity = val;
      torusKnot.material.needsUpdate = true;

      // renderer.render(scene, camera); // don't need to do this
    }); */

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
