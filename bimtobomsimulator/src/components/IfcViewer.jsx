import { useLayoutEffect, useRef } from "react";
import * as OBC from "@thatopen/components";

export default function IfcViewer({ ifcUrl, onBomLoaded }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();

    world.renderer = new OBC.SimpleRenderer(components, containerRef.current);
    world.camera = new OBC.OrthoPerspectiveCamera(components);

    components.init();
    components.get(OBC.Grids).create(world);

    const fragments = components.get(OBC.FragmentsManager);
    const ifcLoader = components.get(OBC.IfcLoader);

    const onCameraUpdate = () => {
      if (!fragments.initialized) return;
      fragments.core.update();
    };

    const loadIfc = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch IFC: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.arrayBuffer();
      const buffer = new Uint8Array(data);

      await ifcLoader.load(buffer, false, "BIM2BOM", {
        processData: {
          progressCallback: (progress) => {
            console.log("IFC loading progress:", progress);
          },
        },
      });
    };

    (async () => {
      try {
        const fragmentsWorkerUrl = new URL(
          "@thatopen/fragments/dist/Worker/worker.mjs",
          import.meta.url,
        );

        await fragments.init(fragmentsWorkerUrl.href);

        if (disposed) return;

        fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(world.camera.three);
          world.scene.three.add(model.object);
          fragments.core.update(true);
        });

        world.camera.controls.setLookAt(78, 20, -2.2, 26, -4, 25);
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

        await loadIfc(ifcUrl);

        if (disposed) return;

        // find all walls in the model using the ItemsFinder and log them (for demo purposes)
        const finder = components.get(OBC.ItemsFinder);
        finder.create("Walls", [{ categories: [/WALL/] }]);
        const finderQuery = finder.list.get("Walls");

        const result = await finderQuery.test();
        const modelId = Object.keys(result)[0];
        const model1 = fragments.list.get(modelId);
        const ids = [...result[modelId]];

        //console.log(ids);
        const data = await model1.getItemsData(ids, {
          attributesDefault: true,
          relations: {
            IsDefinedBy: { attributes: true, relations: true },
            DefinesOccurrence: { attributes: true, relations: true },
          },
        });

        const BOMresult = []; // array of objects

        for (const prop in data) {
          const propData = data[prop];

          if (!propData.IsDefinedBy) continue;
          const beastProp = {};
          beastProp.id = prop;
          beastProp.localID = propData._localId?.value;
          beastProp.GUID = propData._guid?.value;
          beastProp.Seller = "";
          beastProp.price = "";

          let hasBip = false;

          for (const def of propData.IsDefinedBy) {
            if (def.Name?.value !== "BIP") continue;
            hasBip = true;
            const text = propData.Name?.value ?? "";
            const parts = text.split(":");

            beastProp.Name = parts[1]?.trim() || text;
            beastProp.RevitID = parts[2]?.trim() || "";
            beastProp.propertySet = def.Name.value;
            beastProp.property = [];
            def.HasProperties?.forEach((p) => {
              const property = {
                Name: p.Name.value,
                Value: p.NominalValue?.value,
                Unit: p.NominalValue?.type,
              };
              beastProp.property.push(property);
            });
          }

          if (hasBip) BOMresult.push(beastProp);
        }

        console.log(BOMresult);

        if (typeof onBomLoaded === "function" && !disposed) {
          onBomLoaded(BOMresult);
        }

        console.log("Walls found by ItemsFinder:", data);
      } catch (error) {
        console.error("Viewer init failed:", error);
        if (typeof onBomLoaded === "function") onBomLoaded([]);
      }
    })();

    return () => {
      disposed = true;
      try {
        world.camera?.controls?.removeEventListener("update", onCameraUpdate);
      } catch {
        // Ignore cleanup errors.
      }

      try {
        world.renderer?.dispose();
      } catch {
        // @thatopen/components can throw if the renderer DOM is already detached.
      }

      try {
        components.dispose();
      } catch {
        // Ignore cleanup errors.
      }
    };
  }, [ifcUrl, onBomLoaded]);

  return <div ref={containerRef} className="viewerCanvas" />;
}
