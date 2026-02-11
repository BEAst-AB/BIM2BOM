---
name: POC Leverables Catalogues
overview: Create a dedicated POC-Leverables folder containing validated Peppol Catalogue XMLs demonstrating 3 BIM-to-BOM use cases with both smart and dumb recipe approaches for wall types.
todos:
  - id: create-folder-structure
    content: Create POC-Leverables folder with subfolders for each use case
    status: completed
  - id: create-uc1-catalogues
    content: "Create Use Case 1 catalogues: Buyer wall types request + Seller price specification response"
    status: completed
  - id: create-uc2-catalogues
    content: "Create Use Case 2 catalogues: Buyer wall types with summed quantities + Seller detailed specification"
    status: completed
  - id: create-uc3-catalogues
    content: "Create Use Case 3 catalogues: Buyer unique walls + Seller smart/dumb recipe responses"
    status: completed
  - id: create-mbom-catalogues
    content: Create Manufacturing BOM examples with both smart and dumb recipe approaches
    status: completed
  - id: create-validation-script
    content: Create validate_all.py script to batch validate all catalogues
    status: completed
  - id: create-readme
    content: Create README.md documenting the use cases, structure, and how to use the catalogues
    status: completed
  - id: validate-all
    content: Run validation on all catalogues and fix any errors
    status: completed
isProject: false
---

# POC Leverables - Peppol Catalogue XMLs

## Overview

Create a `POC-Leverables/` folder containing approximately 10 validated Peppol Catalogue XMLs that demonstrate the 3 use cases from the process documentation. The catalogues will use **real wall data from the IFC file** ([models/A-40-V-000_BIM2BOM.ifc](models/A-40-V-000_BIM2BOM.ifc)) and demonstrate both "smart recipes" (with IFCGuid/CDEGuid hierarchy) and "dumb recipes" (simple additional lines).

## Actual Wall Data from IFC File

The IFC file contains the following wall types that will be used in the catalogues:


| Type ID | IFC GlobalId           | Name                          | Thickness | Description                           | Load Bearing | External |
| ------- | ---------------------- | ----------------------------- | --------- | ------------------------------------- | ------------ | -------- |
| YVxx    | 3pLKJPvHT21uNqX1l9FcUN | YV01 350                      | 350 mm    | Yttre bärande yttervägg, 350 mm       | Yes          | Yes      |
| IV01    | 3pOreDpW51RRsIbQ7_dW1k | IV01 Innervägg 95 mm          | 95 mm     | Innervägg 200 mm                      | No           | No       |
| IV02    | 3pOreDpW51RRsIbQ7_dW$e | IV02 Innervägg 200 mm Bärande | 200 mm    | Innervägg 200 mm Bärande              | Yes          | No       |
| IV03    | 2y1Avj7i9EagxIU4cB0FEJ | IV03 Teknikutrymme            | 95 mm     | Icke Bärande innervägg, teknikutrymme | No           | No       |


**Materials for YV01 350**: Tegel fasad 110 / Luft 30 / Vindskydd 9 / Regelstomme C24 195 + mineralull / Ångbroms / Installationsregel 45 + isolering / Gips 13

## Folder Structure

```
POC-Leverables/
├── README.md                           # Documentation of use cases and catalogues
├── UseCase1-WallTypes-PriceRequest/    # Buyer sends wall types, seller responds with running meter price
│   ├── UC1_Buyer_WallTypes_Request.xml
│   └── UC1_Seller_Specification_Response.xml
├── UseCase2-WallTypes-SummedQuantities/ # Buyer sends wall types with summed quantities
│   ├── UC2_Buyer_WallTypes_Summed.xml
│   └── UC2_Seller_DetailedSpec_Response.xml
├── UseCase3-UniqueWalls-Quantities/    # Buyer sends unique walls with quantities
│   ├── UC3_Buyer_UniqueWalls_Request.xml
│   ├── UC3_Seller_SmartRecipe_Response.xml   # With 1:1 IFCGuid/CDEGuid hierarchy
│   └── UC3_Seller_DumbRecipe_Response.xml    # Simple additional lines
├── ManufacturingBOM/                   # Manufacturing BOM examples
│   ├── MBOM_SmartRecipe_UniqueArticles.xml   # Unique recipe articles per wall
│   └── MBOM_DumbRecipe_PackageArticles.xml   # Recipe articles on whole package
└── validate_all.py                     # Script to validate all catalogues
```

## CatalogueLine Format (Based on Peppol BIP Explorer Example)

Each catalogue line will follow this enhanced structure with BIM traceability:

```xml
<cac:CatalogueLine>
  <cbc:ID>1</cbc:ID>
  <cac:Item>
    <!-- IFC GlobalId as BuyersItemIdentification -->
    <cac:BuyersItemIdentification>
      <cbc:ID>3pLKJPvHT21uNqX1l9FcUN</cbc:ID>
    </cac:BuyersItemIdentification>
    
    <cbc:Name>Yttre bärande yttervägg YV01 350</cbc:Name>
    <cbc:Description>Yttre bärande yttervägg, 350 mm. Materials: Tegel fasad 110 / Luft 30 / Vindskydd 9...</cbc:Description>
    
    <cac:ManufacturersItemIdentification>
      <cbc:ID>YV01</cbc:ID>
    </cac:ManufacturersItemIdentification>
    
    <!-- LotIdentification for grouping (Ytterväggar, Innerväggar) -->
    <cac:ItemInstance>
      <cac:LotIdentification>
        <cbc:LotNumberID>Ytterväggar</cbc:LotNumberID>
      </cac:LotIdentification>
    </cac:ItemInstance>
    
    <!-- Key BIP properties as AdditionalItemProperty -->
    <cac:AdditionalItemProperty>
      <cbc:Name>AuthoringToolId</cbc:Name>
      <cbc:Value>1192287</cbc:Value>
    </cac:AdditionalItemProperty>
    
    <cac:AdditionalItemProperty>
      <cbc:Name>CDEGuid</cbc:Name>
      <cbc:Value>3pLKJPvHT21uNqX1l9FcUN</cbc:Value>
    </cac:AdditionalItemProperty>
    
    <cac:AdditionalItemProperty>
      <cbc:Name>TypeID</cbc:Name>
      <cbc:NameCode listID="SE:BIP">TypeID</cbc:NameCode>
      <cbc:Value>YVxx</cbc:Value>
    </cac:AdditionalItemProperty>
    
    <cac:AdditionalItemProperty>
      <cbc:Name>thickness</cbc:Name>
      <cbc:NameCode listID="SE:BIP">thickness</cbc:NameCode>
      <cbc:Value>350 mm</cbc:Value>
      <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>
    </cac:AdditionalItemProperty>
    
    <cac:AdditionalItemProperty>
      <cbc:Name>is load bearing</cbc:Name>
      <cbc:NameCode listID="SE:BIP">is load bearing</cbc:NameCode>
      <cbc:Value>Yes</cbc:Value>
    </cac:AdditionalItemProperty>
    
    <cac:AdditionalItemProperty>
      <cbc:Name>is external</cbc:Name>
      <cbc:NameCode listID="SE:BIP">is external</cbc:NameCode>
      <cbc:Value>Yes</cbc:Value>
    </cac:AdditionalItemProperty>
    
    <!-- Reference to originating IFC model -->
    <cac:ItemSpecificationDocumentReference>
      <cbc:ID>1</cbc:ID>
      <cbc:DocumentDescription>IFC model file - Originating BIM model</cbc:DocumentDescription>
      <cac:Attachment>
        <cac:ExternalReference>
          <cbc:URI>https://cde.example.com/models/A-40-V-000_BIM2BOM.ifc</cbc:URI>
        </cac:ExternalReference>
      </cac:Attachment>
    </cac:ItemSpecificationDocumentReference>
  </cac:Item>
</cac:CatalogueLine>
```

## Use Case Details

### Use Case 1: Wall Types with Running Meter Price

- **Buyer Catalogue**: List of wall types (YV01/YVxx, IV01, IV02, IV03) without quantities
- **Seller Response**: Same wall types with price per running meter (löpmeterpris)
- **Recipe approach**: N/A (price inquiry phase)
- **Walls used**: All 4 wall types from IFC

### Use Case 2: Wall Types with Summed Quantities

- **Buyer Catalogue**: Wall types with aggregated quantities (e.g., "60 meters of YV01 350mm")
- **Seller Response**: Detailed specification with recipe articles
- **Recipe approach**: Dumb recipes (no 1:1 mapping back to model objects)
- **Example quantities**: Based on actual IFC wall lengths

### Use Case 3: Unique Walls with Quantities

- **Buyer Catalogue**: Individual wall instances with IFCGuid/CDEGuid, unique quantities
- **Seller Smart Response**: Recipe articles with same IFCGuid/CDEGuid but different AuthoringToolID
- **Seller Dumb Response**: Recipe articles without object correlation
- **Key difference**: Smart recipes maintain 1:1 traceability to BIM objects

## Key Properties Mapping (IFC to Peppol)


| IFC Property            | Peppol Element                                | Notes                                   |
| ----------------------- | --------------------------------------------- | --------------------------------------- |
| GlobalId                | `cac:BuyersItemIdentification/cbc:ID`         | IFC GUID for traceability               |
| GlobalId                | `cac:AdditionalItemProperty[CDEGuid]`         | Duplicated for explicit reference       |
| Element ID              | `cac:AdditionalItemProperty[AuthoringToolId]` | Revit Element ID (e.g., 1192287)        |
| type name id            | `cac:ManufacturersItemIdentification/cbc:ID`  | Type code (YV01, IV01, etc.)            |
| Name                    | `cbc:Name`                                    | Human-readable name                     |
| TypeDescription         | `cbc:Description`                             | Full description with materials         |
| thickness/height/length | `cac:AdditionalItemProperty`                  | With `cbc:ValueQuantity unitCode="MMT"` |
| is load bearing         | `cac:AdditionalItemProperty`                  | Boolean as Yes/No                       |
| is external             | `cac:AdditionalItemProperty`                  | Boolean as Yes/No                       |
| LotNumberID             | `cac:ItemInstance/cac:LotIdentification`      | Grouping (Ytterväggar, etc.)            |


## Recipe Articles for Walls

For YV01 350mm exterior wall, typical recipe articles (seller additions):

- Tegelfasad 110mm (facade brick)
- Luftspalt 30mm (air gap)
- Vindskydd 9mm (wind barrier)
- Regelstomme C24 195mm + mineralull (timber frame + insulation)
- Ångbroms (vapor barrier)
- Installationsregel 45mm + isolering (installation frame + insulation)
- Gips 13mm (gypsum board)

## Validation

All XMLs will be validated against:

1. Peppol BIS Catalogue 3.4 schema (T19)
2. Peppol Schematron rules (PEPPOL-T19-*)
3. Using existing [peppol-transformer/scripts/validate_peppol_catalogue.py](peppol-transformer/scripts/validate_peppol_catalogue.py)

## Implementation Notes

- Use encoding UTF-8
- Follow namespace conventions from [BEAst use case examples](peppol-transformer/docs/peppol_example_xml/)
- Include `cbc:CustomizationID` and `cbc:ProfileID` as per Peppol specification
- Use Swedish org numbers (schemeID="0007") for party identifications
- Reference IFC model via `cac:ItemSpecificationDocumentReference`
- Project: "934567923" / "Tillämpningsanvisningar BIM" (from IFC header)
- Organization: "ÖBO" (from IFC header)

