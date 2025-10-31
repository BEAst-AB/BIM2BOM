# IFC2Peppol Transformer

Direct IFC to Peppol Catalogue transformer using ifcopenshell.

## Overview

This transformer uses `ifcopenshell` to parse IFC files directly and generates Peppol BIS Catalogue format XML without requiring an intermediate XML conversion step. It uses the XSLT stylesheet as a reference template for structure and mapping rules.

## Key Features

- **Direct IFC parsing**: Uses ifcopenshell to read IFC files directly
- **No intermediate XML**: Generates Peppol XML immediately
- **MMI filtering**: Only processes elements with Model Maturity Index (MMI) >= 375
- **Complete mapping**: Maps all BIP properties to Peppol format
- **1:1 match**: Produces identical output to ifcconvert+XSLT workflow

## Installation

```bash
pip install -r scripts/requirements.txt
```

Requirements:
- `ifcopenshell>=0.8.3`
- `lxml>=4.9.0`

## Usage

### Basic Usage

```bash
python scripts/transform_ifc_to_peppol.py <input_ifc_file> [output_catalogue.xml]
```

### Examples

```bash
# Transform IFC file (output will be auto-generated)
python scripts/transform_ifc_to_peppol.py ../../models/A-40-V-000_BIM2BOM.ifc

# Specify output file
python scripts/transform_ifc_to_peppol.py ../../models/A-40-V-000_BIM2BOM.ifc output_catalogue.xml
```

## How It Works

1. **Load IFC file**: Uses `ifcopenshell.open()` to load the IFC model
2. **Filter by element types**: Processes only hardcoded IFC element types (IfcWall, IfcDoor, IfcWindow, etc.)
3. **Extract BIP properties**: Extracts BIP property set from each element
4. **Filter by MMI**: Only includes elements with Model Maturity Index (MMI) >= 375
5. **Generate Peppol XML**: Creates Peppol Catalogue XML directly using lxml

See [docs/WORKFLOW.md](docs/WORKFLOW.md) for detailed workflow documentation.

## Mapping Logic

The transformer follows the same mapping rules as the XSLT stylesheet:

- **Element Name**: Uses IFC element `@Name` attribute
- **Description**: Combines `TypeDescription` + `materials/components`
- **BrandName**: From `Manufacturer` property (if available)
- **Keywords**: From `BSAB 96`, `ObjectType`, and `is external` properties
- **ManufacturersItemIdentification**: From `type name id` property
- **ManufacturerParty**: Only included if `Manufacturer` property exists
- **LotNumberID**: From `LotNumberID` property
- **AdditionalItemProperty**: All BIP properties with proper formatting

## Value Formatting

- **Boolean values**: "true"/"1" → "Yes", "false"/"0" → "No"
- **Dimensions**: Adds " mm" suffix (height, length, width, thickness, diameter)
- **Area**: Adds " m²" suffix
- **Volume**: Adds " m³" suffix
- **Weight**: Adds " kg" suffix
- **Unit codes**: MMT (mm), MTK (m²), MTQ (m³), KGM (kg)

## Integration with Test Suite

The transformer is integrated into `test_workflow.py`:

```bash
python test_workflow.py --skip-ifcconvert --keep-files
```

This will:
1. Run the ifcconvert+XSLT transformation
2. Run the ifcopenshell transformation
3. Compare both outputs to ensure they match exactly

## Output Files

- Default output: `{model_name}_ifcopenshell_catalogue.xml`
- Test output: `test_workflow_ifcopenshell_catalogue.xml`

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[WORKFLOW.md](docs/WORKFLOW.md)** - Complete workflow documentation with step-by-step process
- **[USE_CASES.md](docs/USE_CASES.md)** - Practical use cases and integration scenarios

## Structure

```
ifc2peppol/
├── scripts/
│   ├── transform_ifc_to_peppol.py    # Main transformer
│   └── requirements.txt               # Dependencies
├── stylesheets/
│   └── default-stylesheet-bip_to_peppol.xslt  # Reference template
├── output/                            # Generated XML files
├── docs/                              # Documentation
│   ├── WORKFLOW.md                    # Workflow documentation
│   └── USE_CASES.md                   # Use case documentation
└── README.md                          # This file
```

## Element Types Processed

The transformer processes these hardcoded IFC element types (matching BIM2BOM.ids specification and XSLT behavior):

- `IfcWall`, `IfcWallStandardCase`, `IfcDoor`, `IfcWindow`
- `IfcSlab`, `IfcBeam`, `IfcColumn`
- `IfcRoof`, `IfcStair`, `IfcStairFlight`, `IfcRailing`
- `IfcPlate`, `IfcMember`, `IfcChimney`
- `IfcCovering`, `IfcCurtainWall`
- `IfcFurniture`, `IfcFlowTerminal`, `IfcOpeningElement`
- `IfcBuildingElementProxy`

See `transform_ifc_to_peppol.py` lines 48-70 for the complete list.

## Differences from ifcconvert Approach

- **No intermediate XML**: Direct IFC → Peppol conversion
- **Faster**: No need to convert entire IFC to XML first
- **More efficient**: Only processes hardcoded element types that pass MMI filter
- **Same output**: Produces identical Peppol XML structure

## Verification

The transformer has been verified to produce identical output to the ifcconvert+XSLT workflow:
- Same number of catalogue lines (288)
- Same element IDs
- Same property values
- Same XML structure

## License

Same as main project.

