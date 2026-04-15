# Review: bimtobomsimulator (Sweco Sering) vs XML_MESSAGE_REFERENCE.md

**Review date:** 2026-04-15
**Scope:** Full review of every source file in `bimtobomsimulator/src/` against `POC-Leverables/XML_MESSAGE_REFERENCE.md`
**Branch merged:** `origin/sering/develop` → `master`
**Purpose:** Identify all alignment gaps between the Sweco Sering simulator app and the BIM2BOM POC XML message specification. No fixes applied.

---

## Executive Summary

The bimtobomsimulator is a React/Vite app that demonstrates a BIM-to-BOM workflow with CDE → Buying System → Selling System flow. **The app's XML output, internal data model, and message exchange protocol are entirely custom and do not conform to the Peppol Catalogue / UBL 2.1 structure defined in the XML Message Reference.** The app is useful as a UI/workflow prototype but cannot produce or consume valid BIM2BOM POC catalogue messages in its current form.

**Severity scale used:**

| Level | Meaning |
|-------|---------|
| **CRITICAL** | App produces output or uses a structure that directly contradicts the reference and would fail Peppol validation |
| **MAJOR** | A required element/concept from the reference is entirely missing in the app |
| **MINOR** | A concept exists in the app but differs in naming, structure, or semantics from the reference |
| **NOTE** | Observation or recommendation, not a strict divergence |

---

## 1. XML Output Structure

### 1.1 Selling System XML (`SellingSystemComponent.jsx`, lines 159–180) — CRITICAL

The selling system generates the only structured XML in the app. It uses a **completely custom schema**:

```xml
<PeppolOrder>
  <Header>
    <BuyingSystemId>…</BuyingSystemId>
    <Company>…</Company>
    <SellingSystem>…</SellingSystem>
    <Created>…</Created>
  </Header>
  <Lines>
    <Line>
      <Name>…</Name>
      <GUID>…</GUID>
      <Price>…</Price>
    </Line>
  </Lines>
</PeppolOrder>
```

**Gaps vs Reference (Section 2):**

| # | Reference Requirement | App Status |
|---|----------------------|------------|
| 1 | Root element `<Catalogue>` with UBL 2.1 default namespace | Missing — uses `<PeppolOrder>` (non-UBL) |
| 2 | `xmlns:cac` and `xmlns:cbc` namespace declarations | Missing entirely |
| 3 | `cbc:CustomizationID` = `urn:fdc:peppol.eu:poacc:trns:catalogue:3` | Missing |
| 4 | `cbc:ProfileID` = `urn:fdc:peppol.eu:poacc:bis:catalogue_only:3` | Missing |
| 5 | `cbc:ID` (catalogue identifier, e.g. `UC3-RESP-TRACEABLE-001`) | Missing — uses `<BuyingSystemId>` (a UUID) |
| 6 | `cbc:ActionCode` (`Add`/`Replace`/`Update`/`Delete`) | Missing |
| 7 | `cbc:Name` (human-readable catalogue name) | Missing |
| 8 | `cbc:IssueDate` in ISO 8601 | Missing — uses `<Created>` with ISO datetime string |
| 9 | `cac:ValidityPeriod` with `StartDate`/`EndDate` | Missing |
| 10 | `cac:ReferencedContract` | Missing |
| 11 | `cac:SourceCatalogueReference` (seller responses) | Missing |
| 12 | `cac:ProviderParty` with `EndpointID`, `PartyIdentification`, `PartyLegalEntity` | Missing — uses flat `<Company>` text |
| 13 | `cac:ReceiverParty` (same structure) | Missing |

### 1.2 Buyer Request XML (`XmlViewer.jsx`, lines 3–22) — CRITICAL

The default buyer XML template is also entirely custom:

```xml
<BuyOrder>
  <Header>
    <Buyer>Example AB</Buyer>
    <Project>BIM2BOM</Project>
    <Created>2026-02-25</Created>
  </Header>
  <Lines>
    <Line>
      <Name>Vägg A</Name>
      <GUID>3pLKJPvHT21uNqX1l9FcUN</GUID>
      <Length unit="mm">4200</Length>
    </Line>
  </Lines>
</BuyOrder>
```

Same comprehensive gaps as Section 1.1 — no UBL/Peppol structure at all.

### 1.3 The name `<PeppolOrder>` is misleading — MINOR

The root element `<PeppolOrder>` suggests Peppol conformance, but the XML bears no resemblance to any Peppol BIS message (Catalogue, Order, OrderResponse, etc.). This could create confusion for integrators who expect Peppol-compliant messages.

---

## 2. Catalogue Line Structure

### 2.1 No `cac:CatalogueLine` wrapper — CRITICAL

**Reference (Section 4):** Each item must be wrapped in `<cac:CatalogueLine>` with:
- `cbc:ID` (line identifier, unique within document)
- `cbc:ActionCode` (line-level)
- `cbc:OrderableIndicator`
- `cbc:OrderableUnit` (UN/CEFACT code)
- `cbc:ContentUnitQuantity`

**App:** Uses flat `<Line>` elements with only `<Name>`, `<GUID>`, and `<Price>` (or `<Length>`). None of the required catalogue line fields exist.

### 2.2 No `cac:Item` wrapper — CRITICAL

**Reference (Sections 7–10):** Item details must be nested inside `<cac:Item>` within each catalogue line.

**App:** No `cac:Item` structure exists in any XML output.

---

## 3. Item Identification

### 3.1 No `cac:BuyersItemIdentification` — MAJOR

**Reference (Section 7.1):** Should carry the BIP TypeID (e.g. `YV01`, `IV01`).

**App:** No buyer item identification in any output. The internal model has no `TypeID` field.

### 3.2 No `cac:SellersItemIdentification` — MAJOR

**Reference (Section 7.2):** Should carry the seller's article number (e.g. `VE-YV01-350`) or, in traceable patterns, the IFC GlobalId.

**App:** No seller item identification. The `GUID` in the XML is the IFC GlobalId but is not wrapped in `cac:SellersItemIdentification`.

### 3.3 No `cac:ManufacturersItemIdentification` — MAJOR

**Reference (Section 7.3):** Used on parent wall lines with a generic type reference (e.g. `YVxx`).

**App:** Not present anywhere.

### 3.4 No `cac:StandardItemIdentification` / GTIN — MAJOR

**Reference (Section 7.4):** Every seller catalogue line should include a GTIN (`schemeID="0160"`).

**App:** No GTIN concept exists in the data model or XML output.

---

## 4. Item Description and Name

### 4.1 `cbc:Description` absent — MAJOR

**Reference (Section 8.1):** Free-text description mentioning materials, traceability, BIM model context. Should complement the model reference URI.

**App:** The XML `<Name>` element carries only the wall name. No description field exists in the XML output or internal data model.

### 4.2 `cbc:Name` structure — MINOR

**Reference (Section 8.2):** Should include discriminators (plan level, storey code) matching the BIM instance, e.g. `YV01 350 - Yttre bärande yttervägg (Plan 010)`.

**App:** The `Name` field is extracted from IFC (`propData.Name?.value` split by `:`) but does not include type ID prefix or plan discriminators in a structured way.

---

## 5. Item Specification Document Reference (IFC Model Link)

### 5.1 No `cac:ItemSpecificationDocumentReference` — CRITICAL

**Reference (Section 9):** This is described as **essential** for BIM2BOM. Must include:
- `cbc:ID` (e.g. `IFC-MODEL-REF`)
- `cbc:DocumentDescription`
- `cac:Attachment/cac:ExternalReference/cbc:URI` pointing to the IFC model on the CDE

**App:** No model reference exists in any XML output. The IFC file is loaded locally from `/web-ifc/A-40-V-000_BIM2BOM.ifc` but this path is never serialized into the catalogue data. The reference doc states: *"Treat model reference + version integrity as a first-class requirement, not optional metadata."*

### 5.2 No versioning support — MAJOR

**Reference (Section 9.2):** `cbc:VersionID` at catalogue header level and version-specific URIs are recommended.

**App:** No versioning concept exists.

---

## 6. Prices and Quantities

### 6.1 No `cac:RequiredItemLocationQuantity` — CRITICAL

**Reference (Section 6):** Pricing must be structured as:
```xml
<cac:RequiredItemLocationQuantity>
    <cbc:MinimumQuantity unitCode="MTR">16.06</cbc:MinimumQuantity>
    <cac:Price>
        <cbc:PriceAmount currencyID="SEK">4850.00</cbc:PriceAmount>
        <cbc:BaseQuantity unitCode="MTR">1</cbc:BaseQuantity>
    </cac:Price>
</cac:RequiredItemLocationQuantity>
```

**App:** Price is a flat `<Price>` text element in XML and a bare `price` number in the internal model. No currency, no base quantity, no minimum quantity, no unit code on price.

### 6.2 `cbc:ContentUnitQuantity` absent — MAJOR

**Reference (Section 4.5):** The headline quantity for ordering, with `@unitCode` matching `cbc:OrderableUnit`.

**App:** Quantity is a bare number in the internal model (`Quantity` field). The XML includes `<Length>` in the buyer template but not as a proper `cbc:ContentUnitQuantity`.

---

## 7. Component Related Item (Parent-Child Hierarchy)

### 7.1 No `cac:ComponentRelatedItem` — CRITICAL

**Reference (Section 5):** Child lines must use `cac:ComponentRelatedItem` with `cbc:ID schemeID="CatalogueLineID"` to reference the parent line's `cbc:ID` within the same document.

**App:** Parent-child relationships are modeled internally via `itemchildren` arrays in JSON. This is never translated to `cac:ComponentRelatedItem` in XML output. The hierarchy is lost in serialization.

### 7.2 No traceable vs standard catalogue distinction — MAJOR

**Reference (Section 11):** Traceable catalogues share CDEGuid between parent and child lines + use ComponentRelatedItem. Standard catalogues omit both.

**App:** No concept of traceable vs standard catalogues exists. The app has a single output path for all orders.

---

## 8. Additional Item Properties (`cac:AdditionalItemProperty`)

### 8.1 No `AdditionalItemProperty` structure in XML — CRITICAL

**Reference (Section 10):** Properties must be structured as:
```xml
<cac:AdditionalItemProperty>
    <cbc:Name>thickness</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">thickness</cbc:NameCode>
    <cbc:Value>350 mm</cbc:Value>
    <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>
</cac:AdditionalItemProperty>
```

**App:** Properties are stored internally as `{ Name, Value, Unit }` objects in a `property[]` array (extracted from IFC BIP property set). These are **never serialized** to XML.

### 8.2 BEAst Properties (`listID="ORG:BEAst"`)

| Property | Reference | App |
|----------|-----------|-----|
| `CDEGuid` | Must be present on parent lines; shared on traceable child lines | GUID exists in internal model but is not emitted as an `AdditionalItemProperty` with `listID="ORG:BEAst"` |
| `AuthoringToolId` | Revit Element ID on parent, seller ID on children | `RevitID` exists in model but not structured as AdditionalItemProperty |

### 8.3 BIP Properties (`listID="SE:BIP-koder"`)

| Property | Reference | App |
|----------|-----------|-----|
| `TypeID` | Must match BuyersItemIdentification | Not present in model or XML |
| `thickness` | With `ValueQuantity unitCode="MMT"` | Extracted from IFC if present in BIP pset, but not in XML |
| `height` | With `ValueQuantity unitCode="MMT"` | Same — extracted but not serialized |
| `length` | With `ValueQuantity unitCode="MMT"` | Extracted, used for Quantity, but not as AdditionalItemProperty |
| `net area` | With `ValueQuantity unitCode="MTK"` | Not explicitly handled |
| `is load bearing` | Boolean | Not explicitly handled |
| `is external` | Boolean | Not explicitly handled |
| `floor` | Storey designation | Not explicitly handled |
| `MMI` | Model Maturity Index, `unitCode="C62"`, threshold >= 375 | **Not present at all** — no MMI filtering or output |
| `ObjectType` | BIP classification string | Not explicitly handled |

### 8.4 No `cbc:NameCode` / `listID` in any output — CRITICAL

**Reference (Section 9.4):** `listID` is mandatory for machine-interpretable properties (`ORG:BEAst` or `SE:BIP-koder`). Without it, receivers cannot interpret property semantics.

**App:** Internal properties have `Name`/`Value`/`Unit` but no `NameCode` or `listID` concept.

---

## 9. Unit Codes

### 9.1 Non-standard unit codes — MAJOR

**Reference (Section 10.3):** Must use UN/CEFACT Recommendation 20 codes.

| Reference Code | Reference Unit | App Equivalent |
|---------------|----------------|----------------|
| `MTR` | Metre | `"m"` |
| `MTK` | Square metre | `"m2"` |
| `MTQ` | Cubic metre | `"m3"` |
| `MMT` | Millimetre | Raw numbers from IFC (heuristic mm→m conversion) |
| `C62` | Dimensionless | Not used |
| `KGM` | Kilogram | Not used |

**App:** Uses informal strings `"m"`, `"m2"`, `"m3"`, `"pcs"` in the UI and internal model. The `"pcs"` unit has no UN/CEFACT mapping in the reference.

---

## 10. Party Identification

### 10.1 No proper party structure — CRITICAL

**Reference (Section 3):** Provider and receiver must include:
- `cbc:EndpointID` with `schemeID="0007"` (Swedish org number)
- `cac:PartyIdentification/cbc:ID` with `schemeID="0007"`
- `cac:PartyLegalEntity/cbc:RegistrationName`

**App:** Uses opaque strings `"Company 1"` / `"Company 2"` and `"Selling System 1"` / `"Selling System 2"`. No org numbers, no endpoint IDs, no legal entity names. The XML output uses `<Company>` and `<SellingSystem>` flat text elements.

---

## 11. IFC Property Extraction (IfcViewer.jsx)

### 11.1 Only extracts BIP property set — MINOR

**File:** `IfcViewer.jsx`, line 165: `if (def.Name?.value !== 'BIP') continue;`

The viewer only reads properties from the IFC property set named `"BIP"`. Other relevant property sets (if any exist on the model) are silently skipped.

### 11.2 No MMI threshold filtering — MAJOR

**Reference (Section 10.2, MMI):** Only BIM objects with `MMI >= 375` should be included in a catalogue.

**App:** No MMI check exists. All walls found by `ItemsFinder` with category `/WALL/` are included regardless of model maturity.

### 11.3 Length conversion heuristic — MINOR

**File:** `IfcViewer.jsx`, lines 139–151 (`toMeters`)

The conversion uses a heuristic: if `lengthValue > 1000`, assume millimeters and divide by 1000. This could misinterpret values (e.g., a 1200m structure or a value already in meters > 1000).

### 11.4 GUID mapping — MINOR

The IFC `_guid` (GlobalId) is stored as `GUID` in the internal model but is not formally identified as the BEAst `CDEGuid` property. This distinction matters for XML serialization where CDEGuid must appear as an `AdditionalItemProperty` with `listID="ORG:BEAst"`.

---

## 12. Item Instance and Lot Identification

### 12.1 No `cac:ItemInstance` / `cac:LotIdentification` — MAJOR

**Reference (Section 9B):** Seller responses and MBOM catalogues may include `cac:ItemInstance` with `cbc:LotNumberID` for manufacturing batch traceability.

**App:** No lot identification concept exists.

---

## 13. Order Flow / Message Exchange

### 13.1 No Catalogue request→response chain — MAJOR

**Reference (Section 2.9):** Seller responses use `cac:SourceCatalogueReference` to link back to the buyer's original catalogue `cbc:ID`.

**App:** The order is forwarded as an internal JSON payload via React context. There is no catalogue ID chain.

### 13.2 No ActionCode workflow — MAJOR

**Reference (Section 2.4, 4.2):** Header and line-level `cbc:ActionCode` values (`Add`/`Replace`/`Update`/`Delete`) control how receiving systems process catalogues.

**App:** The internal `status` field uses `"Unchanged"` / `"New"` / `"Updated"` but these are not mapped to Peppol ActionCode semantics and are not present in the XML output.

### 13.3 Internal JSON vs Peppol XML — NOTE

The entire message exchange between CDE, Buying System, and Selling System uses in-memory React state (via BomProvider context). No actual Peppol messages are sent or received. The XML output is a display-only artifact shown in a `<pre>` tag.

---

## 14. Code Quality and Housekeeping Observations

### 14.1 Leftover/duplicate files — NOTE

- `src/App copy.jsx` — appears to be a backup of an earlier IFC viewer version
- `src/App.jsx.old` — another earlier iteration with different OBC setup
- Neither is imported or used by the active app

### 14.2 File naming — NOTE

- `src/helpers/IXBD Functions.js` contains a space in the filename, which can cause issues with some toolchains and imports

### 14.3 Interaxo page is a placeholder — NOTE

The Interaxo page (`src/pages/Interaxo.jsx`) uses hardcoded dummy BOM data (`INTERAXO_GUID_001`, etc.) and has no CDE-integration relevance to the XML reference. The route is present in `main.jsx` but not shown in the main navigation tab bar (`App.jsx`).

---

## 15. Summary of All Gaps

### Critical (13 items)
1. Root XML element is `<PeppolOrder>`/`<BuyOrder>` — not `<Catalogue>` with UBL namespaces
2. No `cbc:CustomizationID` or `cbc:ProfileID`
3. No `cac:ProviderParty` / `cac:ReceiverParty` with Peppol endpoint structure
4. No `cac:CatalogueLine` wrapper with required fields
5. No `cac:Item` wrapper for item details
6. No `cac:ItemSpecificationDocumentReference` (IFC model link)
7. No `cac:RequiredItemLocationQuantity` for pricing
8. No `cac:ComponentRelatedItem` for parent-child hierarchy
9. No `cac:AdditionalItemProperty` in XML output
10. No `cbc:NameCode` / `listID` for machine-readable property codes
11. Party identification uses plain text, not Peppol endpoint/ID/legal entity
12. Buyer XML template is also fully custom
13. No UBL namespace declarations on any generated XML

### Major (12 items)
14. No `cac:BuyersItemIdentification` (BIP TypeID)
15. No `cac:SellersItemIdentification` (article number)
16. No `cac:ManufacturersItemIdentification`
17. No `cac:StandardItemIdentification` / GTIN
18. No `cbc:Description` on items
19. No `cbc:ContentUnitQuantity`
20. No traceable vs standard catalogue distinction
21. Non-standard unit codes (`"m"` instead of `"MTR"`, etc.)
22. No MMI threshold filtering (`>= 375`)
23. No `cac:ItemInstance` / lot identification
24. No Catalogue request→response chain (`SourceCatalogueReference`)
25. No ActionCode workflow mapping

### Minor (5 items)
26. Item Name lacks type ID prefix and plan discriminators
27. Only BIP property set extracted from IFC
28. Length conversion uses heuristic that may misinterpret values
29. GUID not formally identified as BEAst CDEGuid
30. `<PeppolOrder>` root element name misleadingly suggests Peppol conformance

### Notes (4 items)
31. Entire message exchange is in-memory React state, not actual Peppol messages
32. Leftover files: `App copy.jsx`, `App.jsx.old`
33. Space in filename: `IXBD Functions.js`
34. Interaxo page is a non-functional placeholder

---

## 16. Recommended Next Steps (for alignment discussion)

1. **Define a serialization layer** that maps the internal BOM model to valid UBL 2.1 Catalogue XML per the reference
2. **Decide which use cases** (UC1–UC3, MBOM) the simulator should cover
3. **Add BIP property propagation** from IFC extraction all the way to XML output, including `NameCode`/`listID`
4. **Implement party configuration** with proper Swedish org numbers and Peppol endpoint identifiers
5. **Add MMI filtering** during IFC extraction
6. **Map internal status** to Peppol ActionCode semantics
7. **Add model reference** (ItemSpecificationDocumentReference) with CDE URI to the buyer request output
8. **Map unit codes** from informal strings to UN/CEFACT Recommendation 20 codes

---

*This review is read-only. No code changes have been made.*
