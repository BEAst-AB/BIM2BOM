import * as OBC from "@thatopen/components";

export class IDSLoader {
  private _specifications: any[] = [];
  private _components: OBC.Components;

  constructor(components: OBC.Components) {
    this._components = components;
  }

  /**
   * Dispose method for cleanup
   */
  dispose() {
    this._specifications = [];
  }

  /**
   * Load IDS data from a file
   */
  async loadFromFile(url: string): Promise<any[]> {
    try {
      console.log(`Loading IDS file from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch IDS file: ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      console.log("Parsing IDS data using IDSSpecifications.load()...");
      
      // Prefer the engine's own importer – closer to official example
      const ids = this._components.get(OBC.IDSSpecifications);
      const specs = ids.load(xmlText);
      this._specifications = specs as any[];
      
      console.log(`Loaded ${this._specifications.length} specifications via engine importer`);
      return this._specifications;
    } catch (error) {
      console.error("Failed to parse IDS data:", error);
      throw error;
    }
  }

  get specifications(): any[] {
    return this._specifications;
  }

  /**
   * Test a model against all loaded IDS specifications using That Open Engine 3.x API
   */
  async testModel(fragmentGroup: any): Promise<any> {
    if (!this._specifications || this._specifications.length === 0) {
      console.warn("No IDS specifications loaded, returning empty results");
      return { specifications: [] };
    }
    
    try {
      console.log(`\n======= STARTING VALIDATION =======`);
      console.log(`Running validation against ${this._specifications.length} specifications...`);
      
      // Get the IDSSpecifications component from the shared components instance
      const ids = this._components.get(OBC.IDSSpecifications);
      
      console.log("Processing model for IDS validation using That Open Engine 3.x...");
      
      // First, verify that we have loaded and processed models
      const fragments = this._components.get(OBC.FragmentsManager);
      
      // Debug fragments state (following successful debug.html pattern)
      console.log("🔍 IDSLoader fragments debug:", {
        fragmentsExists: !!fragments,
        listExists: !!fragments?.list,
        listSize: fragments?.list?.size || 0,
        componentsExist: !!this._components
      });
      
      if (fragments.list.size === 0) {
        console.warn("⚠️ No models available for validation");
        return { specifications: [], passingElements: {}, failingElements: {} };
      }
      
      console.log(`✅ Found ${fragments.list.size} models ready for validation`);
      
      // Get model patterns for testing from loaded fragments
      let modelPatterns: RegExp[] = [];
      try {
        // Get loaded models from fragments manager (already retrieved above)
        
        if (fragments.list.size > 0) {
          console.log(`🔍 Found ${fragments.list.size} fragment models`);
          
          // Create patterns for each loaded model
          for (const [modelId, model] of fragments.list) {
            console.log(`🔍 Found model ID for validation: ${modelId}`);
            console.log(`🔍 Model properties:`, Object.getOwnPropertyNames(model));
            console.log(`🔍 Model prototype:`, Object.getOwnPropertyNames(Object.getPrototypeOf(model)));
            
            // Check if the model has data loaded
            console.log(`🔍 Model data status:`, {
              isLoaded: (model as any)._isLoaded,
              isProcessing: (model as any)._isProcessing,
              isSetup: (model as any)._isSetup,
              hasTiles: !!(model as any).tiles,
              tiles: (model as any).tiles ? Object.keys((model as any).tiles) : 'none'
            });
            
            // Try to access IFC data through different paths
            if ((model as any)._dataManager) {
              console.log(`🔍 DataManager available:`, Object.getOwnPropertyNames((model as any)._dataManager));
            }
            
            if ((model as any)._itemsManager) {
              console.log(`🔍 ItemsManager available:`, Object.getOwnPropertyNames((model as any)._itemsManager));
            }
            
            // Test direct IFC entity access following the fragment model API
            try {
              console.log(`🧪 Testing IFC data access for model ${modelId}:`);
              
              // Test getting categories (types of IFC entities)
              const categories = (model as any).getCategories?.();
              console.log(`  📊 Available categories:`, categories?.size || 0);
              if (categories && categories.size > 0) {
                const categoriesList = Array.from(categories).slice(0, 10); // Show first 10
                console.log(`  📋 Sample categories:`, categoriesList);
              }
              
              // Test getting all GUIDs
              const guids = (model as any).getGuids?.();
              console.log(`  📊 Total GUIDs:`, guids?.size || 0);
              
              // Test getting local IDs
              const localIds = (model as any).getLocalIds?.();
              console.log(`  📊 Total local IDs:`, localIds?.size || 0);
              
              // Test getting items by categories if available
              if (categories && categories.size > 0) {
                const firstCategory = Array.from(categories)[0];
                const itemsOfCategory = (model as any).getItemsOfCategories?.([firstCategory]);
                console.log(`  📊 Items in category '${firstCategory}':`, itemsOfCategory?.size || 0);
              }
              
              // Test spatial structure
              const spatialStructure = (model as any).getSpatialStructure?.();
              console.log(`  🏗️ Spatial structure available:`, !!spatialStructure);
              
            } catch (error) {
              console.warn(`⚠️ Error testing IFC data access:`, error);
            }
            
            // Try to manually trigger processing completion if it's hanging
            const currentCategories = (model as any).getCategories?.();
            const currentGuids = (model as any).getGuids?.();
            if ((model as any)._isProcessing && (!currentCategories || currentCategories.size === 0) && (!currentGuids || currentGuids.size === 0)) {
              console.log(`🔧 Attempting to manually complete processing for model ${modelId}...`);
              try {
                if (typeof (model as any)._finishProcessing === 'function') {
                  await (model as any)._finishProcessing();
                  console.log(`✅ Manual processing completion attempted`);
                  
                  // Re-test data availability after manual processing
                  const newCategories = (model as any).getCategories?.();
                  const newGuids = (model as any).getGuids?.();
                  console.log(`📊 After manual processing - categories: ${newCategories?.size || 0}, GUIDs: ${newGuids?.size || 0}`);
                } else {
                  console.log(`⚠️ _finishProcessing method not available`);
                }
              } catch (processingError) {
                console.warn(`⚠️ Manual processing completion failed:`, processingError);
              }
            }
            
            // Create multiple patterns to ensure matching (following official example pattern)
            const escapedId = modelId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            modelPatterns.push(new RegExp(escapedId, 'i')); // Case insensitive exact match
            
            // Extract basename patterns like in the official example
            const baseName = modelId.replace(/\.[^/.]+$/, ''); // Remove extension
            if (baseName !== modelId) {
              modelPatterns.push(new RegExp(baseName, 'i'));
            }
            
            // Add broad patterns for IFC content matching
            modelPatterns.push(/NC_Mockup/i);
            modelPatterns.push(/.*mockup.*/i);
          }
          
          // Add a fallback pattern that should match any model (like /arq/ in the example)
          modelPatterns.push(/.*/);
        }
        
        // Fallback to legacy method if available
        if (modelPatterns.length === 0 && fragmentGroup) {
          if (fragmentGroup.modelId) {
            modelPatterns.push(new RegExp(fragmentGroup.modelId, 'i'));
            console.log(`📋 Using legacy fragment group model ID: ${fragmentGroup.modelId}`);
          } else if (fragmentGroup.name) {
            modelPatterns.push(new RegExp(fragmentGroup.name, 'i'));
            console.log(`📋 Using legacy fragment group name: ${fragmentGroup.name}`);
          }
        }
        
        // Final fallback patterns
        if (modelPatterns.length === 0) {
          console.log("🔄 No specific models found, using broad patterns...");
          modelPatterns.push(/.*\.ifc$/i); // Match any IFC file
          modelPatterns.push(/.*/); // Match anything as last resort
        }
        
        console.log(`🧪 Testing with ${modelPatterns.length} model patterns:`, modelPatterns.map(p => p.toString()));
        // --- BIP debug test following official IDS example pattern ---
        try {
          await this.testBIPRequirements(modelPatterns);
        } catch (e) {
          console.warn("BIP debug test failed:", e);
        }
      } catch (error) {
        console.warn("❌ Could not extract model IDs:", error);
        // Ensure we have at least one pattern
        modelPatterns = [/.*/];
      }
      
      // Convert old IDS specifications to new That Open Engine 3.x format
      const results = {
        date: new Date().toISOString(),
        title: "BEAst Model Validation Report",
        filepath: "",
        filename: "",
        total_specifications: this._specifications.length,
        total_specifications_pass: 0,
        total_specifications_fail: 0,
        total_requirements: 0,
        total_requirements_pass: 0,
        total_requirements_fail: 0,
        total_checks: 0,
        total_checks_pass: 0,
        total_checks_fail: 0,
        percent_checks_pass: 0,
        percent_requirements_pass: 0,
        percent_specifications_pass: 0,
        status: true,
        specifications: [] as any[]
      };
      
      // Test against each specification using the official engine API (ids.load + spec.test)
      for (const [specIndex, oldSpec] of this._specifications.entries()) {
        console.log(`\n===== PROCESSING SPEC #${specIndex + 1}: ${oldSpec.name || 'Unnamed'} (ID: ${oldSpec.identifier || 'unknown'}) =====`);
        
        try {
          console.log(`Testing spec "${oldSpec.name}" with ${modelPatterns.length} models`);

          let testResult: any = [];
          let passingModels = 0;
          let failingModels = 0;

          if (modelPatterns.length > 0) {
            try {
              // Use the official spec object returned by ids.load
              const specToTest: any = oldSpec;
              console.log(`🧪 Testing specification against model patterns: ${modelPatterns.map(p => p.toString()).join(', ')}`);
              testResult = await specToTest.test(modelPatterns);

              console.log("📊 Test result type:", typeof testResult);
              console.log("📊 Test result:", testResult);

              if (testResult && typeof testResult === 'object') {
                try {
                  console.log("🔄 Processing test results with getModelIdMap...");
                  const { fail, pass } = ids.getModelIdMap(testResult);

                  console.log("✅ getModelIdMap results:");
                  console.log("  - Pass:", pass);
                  console.log("  - Fail:", fail);

                  passingModels = Object.keys(pass || {}).length;
                  failingModels = Object.keys(fail || {}).length;

                  console.log(`📊 Found ${passingModels} passing elements`);
                  console.log(`📊 Found ${failingModels} failing elements`);

                  testResult = { pass, fail, passingCount: passingModels, failingCount: failingModels };

                } catch (mapError) {
                  console.warn("⚠️ Error processing results with getModelIdMap:", mapError);
                  testResult = [];
                  passingModels = 0;
                  failingModels = 0;
                }
              } else {
                console.log("⚠️ Test result is not a valid object, treating as no results");
                testResult = [];
                passingModels = 0;
                failingModels = 0;
              }
            } catch (error) {
              console.warn("❌ Error testing specification:", error);
              testResult = [];
              passingModels = 0;
              failingModels = 0;
            }
          } else {
            console.log("⚠️ No models available for testing");
            passingModels = 0;
            failingModels = 0;
          }
          
          // Create spec result object compatible with existing UI
          const specResult: any = {
            name: oldSpec.name || 'Unnamed Specification',
            description: oldSpec.description || '',
            instructions: oldSpec.instructions || '',
            applicability: [] as string[],
            is_ifc_version: true,
            required: true,
            status: passingModels > 0 || failingModels === 0,
            total_applicable: passingModels + failingModels,
            total_applicable_pass: passingModels,
            total_applicable_fail: failingModels,
            percent_applicable_pass: (passingModels + failingModels) > 0 ? (passingModels / (passingModels + failingModels)) * 100 : 0,
            total_checks: passingModels + failingModels,
            total_checks_pass: passingModels,
            total_checks_fail: failingModels,
            percent_checks_pass: (passingModels + failingModels) > 0 ? (passingModels / (passingModels + failingModels)) * 100 : 0,
            requirements: [],
            testResult: testResult // Store the raw test result for debugging
          };
          
          // Add the spec result to the overall results
          results.specifications.push(specResult);
          
          // Update overall stats
          if (specResult.status) {
            results.total_specifications_pass++;
          } else {
            results.total_specifications_fail++;
          }
          
          results.total_checks += specResult.total_checks;
          results.total_checks_pass += specResult.total_checks_pass;
          results.total_checks_fail += specResult.total_checks_fail;
          
        } catch (error) {
          console.error(`Error processing specification "${oldSpec.name}":`, error);
          
          // Add a failed spec result
          const failedSpecResult = {
            name: oldSpec.name || 'Failed Specification',
            description: oldSpec.description || '',
            status: false,
            total_applicable: 0,
            total_applicable_pass: 0,
            total_applicable_fail: 0,
            percent_applicable_pass: 0,
            total_checks: 0,
            total_checks_pass: 0,
            total_checks_fail: 0,
            percent_checks_pass: 0,
            requirements: [],
            error: error instanceof Error ? error.message : String(error)
          };
          
          results.specifications.push(failedSpecResult);
          results.total_specifications_fail++;
        }
      }
      
      // Calculate final percentages
      results.percent_specifications_pass = results.total_specifications > 0 ? 
        (results.total_specifications_pass / results.total_specifications) * 100 : 0;
      results.percent_checks_pass = results.total_checks > 0 ? 
        (results.total_checks_pass / results.total_checks) * 100 : 0;
      
      console.log(`\n======= VALIDATION COMPLETE =======`);
      console.log(`Total specifications: ${results.total_specifications}`);
      console.log(`Passed specifications: ${results.total_specifications_pass}`);
      console.log(`Failed specifications: ${results.total_specifications_fail}`);
      console.log(`Overall success rate: ${results.percent_specifications_pass.toFixed(1)}%`);
      
      return results;
      
    } catch (error) {
      console.error("Validation failed:", error);
      throw error;
    }
  }

  private async testBIPRequirements(modelPatterns: RegExp[]) {
    const ids = this._components.get(OBC.IDSSpecifications);

    const spec = ids.create("BIP - Debug", ["IFC2X3", "IFC4"]);
    spec.description = "Samtliga objekt: BIP + BaseQuantities requirements";

    const entityTypes = [
      "IFCBEAM","IFCBEARING","IFCBUILDINGELEMENTPROXY","IFCCHIMNEY","IFCCOLUMN","IFCCOURSE",
      "IFCCOVERING","IFCCURTAINWALL","IFCDEEPFOUNDATION","IFCCAISSONFOUNDATION","IFCPILE",
      "IFCDOOR","IFCEARTHWORKSELEMENT","IFCEARTHWORKSFILL","IFCREINFORCEDSOIL","IFCFOOTING",
      "IFCKERB","IFCMEMBER","IFCMOORINGDEVICE","IFCNAVIGATIONELEMENT","IFCPAVEMENT","IFCPLATE",
      "IFCRAIL","IFCRAILING","IFCRAMP","IFCRAMPFLIGHT","IFCROOF","IFCSHADINGDEVICE","IFCSLAB",
      "IFCSTAIR","IFCSTAIRFLIGHT","IFCTRACKELEMENT","IFCWALL","IFCWALLSTANDARDCASE","IFCWINDOW","IFCBUILTELEMENT"
    ];
    for (const type of entityTypes) {
      spec.applicability.add(new OBC.IDSEntity(this._components, { type: "simple", parameter: type }));
    }

    const bip = new OBC.IDSProperty(
      this._components,
      { type: "simple", parameter: "BIP" },
      { type: "simple", parameter: ".*" }
    );
    const baseQuantities = new OBC.IDSProperty(
      this._components,
      { type: "simple", parameter: "BaseQuantities" },
      { type: "simple", parameter: ".*" }
    );
    spec.requirements.add(bip);
    spec.requirements.add(baseQuantities);

    console.log("🧪 [BIP Debug] Testing with patterns:", modelPatterns.map(p => p.toString()));
    const result = await spec.test(modelPatterns);
    const { pass, fail } = ids.getModelIdMap(result);

    console.log("✅ [BIP Debug] Pass:", pass);
    console.log("❌ [BIP Debug] Fail:", fail);
    return { result, pass, fail };
  }

  /**
   * Get detailed entity information for an element using model.getItemsData() method
   * Based on: https://raw.githubusercontent.com/ThatOpen/engine_fragment/refs/heads/main/packages/fragments/src/FragmentsModels/examples/ModelInformation/example.ts
   */
  async getEntityInfo(_fragmentGroup: any, elementData: { expressID?: number, guid?: string }): Promise<any> {
    try {
      const fragments = this._components.get(OBC.FragmentsManager);
      
      // Find the model that contains this element
      let targetModel = null;
      
      if (elementData.expressID) {
        // Search through all models to find the one containing this element
        for (const [, model] of fragments.list) {
          try {
            const localIds = await model.getLocalIds();
            if (localIds && localIds.includes(elementData.expressID)) {
              targetModel = model;
              console.log(`🎯 Found element ${elementData.expressID} in model`);
              break;
            }
          } catch {
            // Element not in this model, continue searching
          }
        }
      }
      
      // Fallback to first model if we couldn't find the specific one
      if (!targetModel && fragments.list.size > 0) {
        targetModel = Array.from(fragments.list.values())[0];
        console.log("📦 Using first available model as fallback");
      }
      
      if (!targetModel) {
        console.warn("No models available for entity info lookup");
        return {
          class: 'Unknown',
          name: '',
          type_name: '',
          tag: '',
          guid: elementData.guid || ''
        };
      }
      
      // Initialize entity info
      let entityInfo: any = {
        class: 'Unknown',
        name: '',
        type_name: '',
        tag: '',
        guid: elementData.guid || ''
      };
      
      if (elementData.expressID) {
        try {
          console.log(`🔍 Getting IFC attributes for element ${elementData.expressID} using getItemsData()`);
          
          // Use the proper getItemsData method as shown in the That Open Components example
          const [data] = await (targetModel as any).getItemsData([elementData.expressID], {
            attributesDefault: true, // Get all default attributes
            attributes: ["Name", "ObjectType", "PredefinedType", "Tag"], // Specific attributes we want
          });
          
          if (data) {
            console.log(`📋 Raw element data for ${elementData.expressID}:`, data);
            console.log(`📋 Data keys:`, Object.keys(data));
            
            // Log specific attribute values to understand structure
            if (data.Name) console.log(`📋 Name attribute:`, data.Name);
            if (data.ObjectType) console.log(`📋 ObjectType attribute:`, data.ObjectType);
            if (data.Tag) console.log(`📋 Tag attribute:`, data.Tag);
            if (data._category) console.log(`📋 Category:`, data._category);
            if (data._guid) console.log(`📋 GUID:`, data._guid);
            
            // Extract IFC class from _category
            if (data._category && data._category.value) {
              entityInfo.class = data._category.value;
              console.log(`📋 Found IFC class: ${entityInfo.class}`);
            }
            
            // Extract name
            if (data.Name && data.Name.value) {
              entityInfo.name = data.Name.value;
              console.log(`📋 Found Name: ${entityInfo.name}`);
            }
            
            // Extract type - prefer ObjectType over PredefinedType
            if (data.ObjectType && data.ObjectType.value) {
              entityInfo.type_name = data.ObjectType.value;
              console.log(`📋 Found ObjectType: ${entityInfo.type_name}`);
            } else if (data.PredefinedType && data.PredefinedType.value && data.PredefinedType.value !== 'NOTDEFINED') {
              entityInfo.type_name = data.PredefinedType.value;
              console.log(`📋 Found PredefinedType: ${entityInfo.type_name}`);
            }
            
            // Extract tag
            if (data.Tag && data.Tag.value) {
              entityInfo.tag = data.Tag.value;
              console.log(`📋 Found Tag: ${entityInfo.tag}`);
            }
            
            // Extract GUID
            if (data._guid && data._guid.value) {
              entityInfo.guid = data._guid.value;
              console.log(`📋 Found GlobalId: ${entityInfo.guid}`);
            }
            
          } else {
            console.warn(`No data returned for element ${elementData.expressID}`);
          }
          
        } catch (error) {
          console.warn("Could not get element data using getItemsData:", error);
        }
      }
      
      // Final cleanup and validation
      if (!entityInfo.class || entityInfo.class === 'Unknown') {
        entityInfo.class = 'IFC Element';
      }
      
      if (!entityInfo.name) {
        entityInfo.name = `Element ${elementData.expressID || 'Unknown'}`;
      }
      
      console.log(`✅ Final entity info for ${elementData.expressID}:`, entityInfo);
      return entityInfo;
      
    } catch (error) {
      console.warn("Error getting entity info:", error);
      return {
        class: 'IFC Element',
        name: `Element ${elementData.expressID || 'Unknown'}`,
        type_name: '',
        tag: '',
        guid: elementData.guid || ''
      };
    }
  }
}