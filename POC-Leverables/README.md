# POC Leverables - Peppol Catalogue XMLs

This folder contains **9 validated Peppol Catalogue XML files** demonstrating recipe handling patterns for the BIM2BOM project. The focus is on demonstrating **traceable vs standard catalogue** approaches for BIM-to-procurement data exchange. **Traceable** catalogues use shared **CDEGuid** (IFC `GlobalId`) plus **`cac:ComponentRelatedItem`** with **`CatalogueLineID`** from each child line to the parent wall line.

## Key Concept: Traceable vs Standard Catalogues

### Traceable Catalogue (Spårbara kataloger)
- Child lines have the **SAME CDEGuid** as the parent BIM object
- Child lines have **DIFFERENT AuthoringToolId** (seller's own)
- Enables **1:1 traceability** from eBOM -> mBOM -> components
- Receiving system can build hierarchy based on shared CDEGuid
- On each **child catalogue line**, **`cac:ComponentRelatedItem`** with  
  `cbc:ID[@schemeID="CatalogueLineID"]` = **parent line’s** `cac:CatalogueLine/cbc:ID` (document-unique line id), and **`cbc:Quantity`** for that component — [Peppol `ComponentRelatedItem`](https://docs.peppol.eu/poacc/upgrade-3/syntax/Catalogue/cac-CatalogueLine/cac-ComponentRelatedItem/)

The **CDEGuid** value is aligned with the **IFC `GlobalId`** of the wall in the source model (see Source Data). Repeating that same identifier on the parent wall line and on each child line is the **BIM2BOM “common IFC GUID” pattern** for **model-level** traceability. **`ComponentRelatedItem`** adds the **catalogue-level** parent–child link inside the message (child rows point **up** to the parent line’s id).

### Identification (BIP.TypeID and GTIN)

| Element | Usage in this POC |
|--------|-------------------|
| **`cac:BuyersItemIdentification` / `cbc:ID`** | **BIP.TypeID** from **BIP-koder** (e.g. wall type **`YV01`** in UC1/UC2; unique-wall / littra **`IV01`** in UC3). Buyer catalogues carry the buyer’s type; seller responses echo the same **TypeID** on each priced line. |
| **`cac:StandardItemIdentification` / `cbc:ID[@schemeID="0160"]`** | **GTIN** (GS1). **Every `cac:Item` in seller-side catalogues** includes a GTIN so offers are traceable at product level. Values here are **illustrative** 13-digit codes. |
| **`cac:SellersItemIdentification`** | Seller or BIM internal reference (unchanged); **not** a substitute for GTIN. |

UBL order on **`cac:Item`**: `cbc:Description`, `cbc:Name`, **`BuyersItemIdentification`**, **`SellersItemIdentification`**, **`ManufacturersItemIdentification`** (if any), **`StandardItemIdentification`** (GTIN; seller catalogues), then `AdditionalItemProperty`, etc. — **GTIN must follow** seller/manufacturer ids per UBL sequence.

### Standard Catalogue (Standard kataloger)
- Child lines have their **own IDs** (no matching CDEGuid)
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
├── UseCase3-UniqueWalls-Quantities/     # MAIN: Traceable vs Standard catalogues
│   ├── UC3_Buyer_UniqueWalls_Request.xml
│   ├── UC3_Seller_TraceableCatalogue_Response.xml   <- TRACEABLE: CDEGuid + ComponentRelatedItem
│   └── UC3_Seller_StandardCatalogue_Response.xml    <- STANDARD: No traceability
│
└── ManufacturingBOM/                    # Manufacturing BOM patterns
    ├── MBOM_TraceableCatalogue_UniqueArticles.xml   <- TRACEABLE: CDEGuid + ComponentRelatedItem
    └── MBOM_StandardCatalogue_PackageArticles.xml   <- STANDARD
```

**UBL placement:** On `cac:CatalogueLine`, put **`cac:ComponentRelatedItem`** after line quantity fields and **before** `cac:RequiredItemLocationQuantity` (when present) and **`cac:Item`**, per Peppol Catalogue line sequence.

## Use Case 3: Recipe Handling (Core POC)

The key demonstration is in Use Case 3, showing both catalogue approaches:

### Traceable Catalogue Response (`UC3_Seller_TraceableCatalogue_Response.xml`)
```
Wall (CDEGuid: 3pLKJPvHT21uNqX1l9FcUN, AuthoringToolId: 1192287)
├── Tegelfasad (same CDEGuid, ComponentRelatedItem → CatalogueLineID 1, AuthoringToolId: VE-2001)
├── Regelstomme (same CDEGuid, ComponentRelatedItem → CatalogueLineID 1, AuthoringToolId: VE-2002)
└── Gips (same CDEGuid, ComponentRelatedItem → CatalogueLineID 1, AuthoringToolId: VE-2003)
```
Shared CDEGuid = **BIM traceability**; **`CatalogueLineID`** = **parent row in this catalogue**.

### Standard Catalogue Response (`UC3_Seller_StandardCatalogue_Response.xml`)
```
Wall (CDEGuid: 3pLKJPvHT21uNqX1l9FcUN, AuthoringToolId: 1192287)
├── Tegelfasad (ID: VE-TEGEL-110-PKG, AuthoringToolId: VE-PKG-001)  <- NO CDEGuid
├── Regelstomme (ID: VE-REGEL-195-PKG, AuthoringToolId: VE-PKG-002) <- NO CDEGuid
└── Gips (ID: VE-GIPS-13-PKG, AuthoringToolId: VE-PKG-003)          <- NO CDEGuid
```
Child lines have no CDEGuid = **no BIM traceability**

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

All 9 catalogues are validated against Peppol BIS Catalogue (T19) via `validate_peppol_catalogue.py` / `validate_all.py`.

```bash
python validate_all.py
```

## Peppol Specification

- **Peppol BIS Catalogue 3.4** (Transaction T19)
- **CustomizationID**: `urn:fdc:peppol.eu:poacc:trns:catalogue:3`
- **ProfileID**: `urn:fdc:peppol.eu:poacc:bis:catalogue_only:3`

Documentation: https://docs.peppol.eu/poacc/upgrade-3/syntax/Catalogue/
