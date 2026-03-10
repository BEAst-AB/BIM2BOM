import { useEffect, useRef } from "react";
import * as OBC from "@thatopen/components";

export default function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    // --------------------------------------------------
    // 1. Create components and world
    // --------------------------------------------------
    const components = new OBC.Components();

    const worlds = components.get(OBC.Worlds);
    const world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();
    //world.scene.three.background = null;

    world.renderer = new OBC.SimpleRenderer(components, containerRef.current);

    world.camera = new OBC.OrthoPerspectiveCamera(components);

    world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);

    components.init();

    components.get(OBC.Grids).create(world);

    // --------------------------------------------------
    // 2. Setup FragmentsManager
    // --------------------------------------------------
    const fragments = components.get(OBC.FragmentsManager);

    let workerUrl;

    const onCameraUpdate = () => {
      if (!fragments.initialized) return;
      fragments.core.update();
    };

    // --------------------------------------------------
    // 3. Setup IfcLoader
    // --------------------------------------------------
    const ifcLoader = components.get(OBC.IfcLoader);

    // --------------------------------------------------
    // 4. Load IFC helper
    // --------------------------------------------------
    const loadIfc = async (url) => {
      const response = await fetch(url);
      const data = await response.arrayBuffer();
      const buffer = new Uint8Array(data);

      await ifcLoader.load(buffer, false, "example", {
        processData: {
          progressCallback: (progress) => {
            console.log("IFC loading progress:", progress);
          },
        },
      });
    };

    // Load example IFC automatically

    (async () => {
      try {
        const workerSource = await fetch(
          "https://thatopen.github.io/engine_fragment/resources/worker.mjs",
        ).then((r) => r.text());

        if (disposed) return;

        workerUrl = URL.createObjectURL(
          new Blob([workerSource], { type: "text/javascript" }),
        );

        await fragments.init(workerUrl);

        if (disposed) return;

        fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(world.camera.three);
          world.scene.three.add(model.object);
          fragments.core.update(true);
        });

        world.camera.controls.addEventListener("update", onCameraUpdate);

        fragments.core.models.materials.list.onItemSet.add(
          ({ value: material }) => {
            if (!("isLodMaterial" in material && material.isLodMaterial)) {
              material.polygonOffset = true;
              material.polygonOffsetUnits = 1;
              material.polygonOffsetFactor = Math.random();
            }
          },
        );

        await ifcLoader.setup({
          autoSetWasm: false,
          wasm: {
            path: "https://unpkg.com/web-ifc@0.0.74/",
            absolute: true,
          },
        });

        if (disposed) return;

        await loadIfc("/web-ifc/A-40-V-000_BIM2BOM.ifc");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Viewer init failed:", error);
      }
    })();

    // --------------------------------------------------
    // 5. Cleanup on unmount
    // --------------------------------------------------
    return () => {
      disposed = true;

      world.camera?.controls?.removeEventListener("update", onCameraUpdate);
      world.renderer?.dispose();

      if (workerUrl) URL.revokeObjectURL(workerUrl);
      components.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}
