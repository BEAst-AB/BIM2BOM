# POC Leverables - Peppol Catalogue XMLs

This folder contains **9 validated Peppol Catalogue XML files** demonstrating recipe handling patterns for the BIM2BOM project. The focus is on demonstrating **smart vs dumb recipe approaches** for BIM-to-procurement data exchange.

## Key Concept: Smart vs Dumb Recipes

### Smart Recipe (Smarta recept)
- Recipe articles have the **SAME CDEGuid** as the parent BIM object
- Recipe articles have **DIFFERENT AuthoringToolId** (seller's own)
- Enables **1:1 traceability** from eBOM -> mBOM -> components
- Receiving system can build hierarchy based on shared CDEGuid

### Dumb Recipe (Dumma recept)
- Recipe articles have their **own IDs** (no matching CDEGuid)
- **NO correlation** to specific BIM model objects
- Simpler but **loses traceability**
- Note from diagram: *"Notera här har vi ingen koppling tillbaka"*

## Folder Structure

```
POC-Leverables/
├── README.md
├── validate_all.py
│
├── UseCase1-WallTypes-PriceRequest/     # Price inquiry (no recipes)
│   ├── UC1_Buyer_WallTypes_Request.xml
│   └── UC1_Seller_Specification_Response.xml
│
├── UseCase2-WallTypes-SummedQuantities/ # Aggregated quantities with recipes
│   ├── UC2_Buyer_WallTypes_Summed.xml
│   └── UC2_Seller_DetailedSpec_Response.xml  <- Recipes
│
├── UseCase3-UniqueWalls-Quantities/     # MAIN: Smart vs Dumb recipes
│   ├── UC3_Buyer_UniqueWalls_Request.xml
│   ├── UC3_Seller_SmartRecipe_Response.xml   <- SMART: 1:1 traceability
│   └── UC3_Seller_DumbRecipe_Response.xml    <- DUMB: No traceability
│
└── ManufacturingBOM/                    # Manufacturing BOM patterns
    ├── MBOM_SmartRecipe_UniqueArticles.xml   <- SMART
    └── MBOM_DumbRecipe_PackageArticles.xml   <- DUMB
```

## Use Case 3: Recipe Handling (Core POC)

The key demonstration is in Use Case 3, showing both recipe approaches:

### Smart Recipe Response (`UC3_Seller_SmartRecipe_Response.xml`)
```
Wall (CDEGuid: 3pLKJPvHT21uNqX1l9FcUN, AuthoringToolId: 1192287)
├── Tegelfasad (CDEGuid: 3pLKJPvHT21uNqX1l9FcUN, AuthoringToolId: VE-2001)
├── Regelstomme (CDEGuid: 3pLKJPvHT21uNqX1l9FcUN, AuthoringToolId: VE-2002)
└── Gips (CDEGuid: 3pLKJPvHT21uNqX1l9FcUN, AuthoringToolId: VE-2003)
```
All items share the same CDEGuid = **full BIM traceability**

### Dumb Recipe Response (`UC3_Seller_DumbRecipe_Response.xml`)
```
Wall (CDEGuid: 3pLKJPvHT21uNqX1l9FcUN, AuthoringToolId: 1192287)
├── Tegelfasad (ID: VE-TEGEL-110-PKG, AuthoringToolId: VE-PKG-001)  <- NO CDEGuid
├── Regelstomme (ID: VE-REGEL-195-PKG, AuthoringToolId: VE-PKG-002) <- NO CDEGuid
└── Gips (ID: VE-GIPS-13-PKG, AuthoringToolId: VE-PKG-003)          <- NO CDEGuid
```
Recipe articles have no CDEGuid = **no BIM traceability**

## Source Data

Wall data from IFC model: `models/A-40-V-000_BIM2BOM.ifc`

| Property | Value |
|----------|-------|
| IFC GlobalId | 3pLKJPvHT21uNqX1l9FcUN |
| AuthoringToolId | 1192287 |
| Type | YV01 350 |
| Thickness | 350 mm |
| Height | 5628 mm |
| Length | 16060 mm |
| Net Area | 79.81 m² |

## Validation

All 9 catalogues are validated against Peppol BIS Catalogue 3.4 (T19).

```bash
python validate_all.py
```

## Peppol Specification

- **Peppol BIS Catalogue 3.4** (Transaction T19)
- **CustomizationID**: `urn:fdc:peppol.eu:poacc:trns:catalogue:3`
- **ProfileID**: `urn:fdc:peppol.eu:poacc:bis:catalogue_only:3`

Documentation: https://docs.peppol.eu/poacc/upgrade-3/syntax/Catalogue/
