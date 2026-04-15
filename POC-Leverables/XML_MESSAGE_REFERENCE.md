# BIM2BOM POC -- Description of Selected Parts of the Catalogue Message

This document provides a comprehensive reference for **every XML element** used across the 9 POC deliverable Peppol Catalogue messages in the BIM2BOM project. It is intended as a long-term reference for implementers, reviewers, and systems integrating with these messages. It covers both **human-readable item text** (`cbc:Description`, `cbc:Name`) and the **formal model reference** (`cac:ItemSpecificationDocumentReference` with CDE/IFC URI), and how those should reinforce each other.

The format follows the conventions established by the [Peppol BIS "Description of selected parts of the message"](https://docs.peppol.eu/poacc/upgrade-3/profiles/1-catalogueonly/#description-of-selected-parts-of-the-catalogue-message) documentation style.

## 1. Introduction

### 1.1 Standards

| Standard | Version | Reference |
|----------|---------|-----------|
| OASIS UBL | 2.1 | [UBL-Catalogue-2.1](http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Catalogue-2.1.xsd) |
| Peppol BIS Catalogue | 3.4 (Transaction T19) | [Peppol BIS Catalogue Only](https://docs.peppol.eu/poacc/upgrade-3/profiles/1-catalogueonly/) |
| BEAst Supply | -- | [BEAst BIS](https://bis.beast.se/) |
| BIP (Bygginformationsegenskaper) | -- | [BIM Alliance Sweden](https://www.bimalliance.se/) |

### 1.2 Namespaces

All POC messages declare the following XML namespaces on the root `Catalogue` element:

| Prefix | Namespace URI |
|--------|---------------|
| *(default)* | `urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2` |
| `cac` | `urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2` |
| `cbc` | `urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2` |

### 1.3 POC File Overview

The 9 catalogue files fall into **buyer request** and **seller response** categories across four scenarios:

| Use Case | File | Role | Key features |
|----------|------|------|-------------|
| UC1 | `UC1_Buyer_WallTypes_Request.xml` | Buyer request | Wall type only, no quantity, no pricing |
| UC1 | `UC1_Seller_Specification_Response.xml` | Seller response | Price per running metre, GTIN |
| UC2 | `UC2_Buyer_WallTypes_Summed.xml` | Buyer request | Aggregated quantity from BIM, net area |
| UC2 | `UC2_Seller_DetailedSpec_Response.xml` | Seller response | Recipe child lines with `ComponentRelatedItem` |
| UC3 | `UC3_Buyer_UniqueWalls_Request.xml` | Buyer request | Unique wall with CDEGuid, full BIP props |
| UC3 | `UC3_Seller_TraceableCatalogue_Response.xml` | Seller response | **Traceable**: shared CDEGuid + ComponentRelatedItem |
| UC3 | `UC3_Seller_StandardCatalogue_Response.xml` | Seller response | **Standard**: no CDEGuid on children |
| MBOM | `MBOM_TraceableCatalogue_UniqueArticles.xml` | Manufacturing BOM | Traceable MBOM with shared CDEGuid |
| MBOM | `MBOM_StandardCatalogue_PackageArticles.xml` | Manufacturing BOM | Standard package articles, no traceability |

### 1.4 Minimum Required Information

A valid BIM2BOM POC catalogue message must at minimum contain:

- The catalogue identifier (`cbc:ID`)
- The issue date (`cbc:IssueDate`)
- Peppol identifiers (`cbc:CustomizationID`, `cbc:ProfileID`)
- The action code (`cbc:ActionCode`)
- Provider and receiver party names (`cac:ProviderParty`, `cac:ReceiverParty`)
- One or more catalogue lines, each with at minimum:
  - A line identifier (`cbc:ID`)
  - An item name (`cbc:Name`)
  - At least one item identification (Buyers or Sellers)
- When linking to an IFC model on a CDE (`cac:ItemSpecificationDocumentReference`), a human-readable **description** (`cbc:Description`) that aligns with that model reference (see [Section 8](#8-item-name-and-description) and [Section 9](#9-item-specification-document-reference))

---

## 2. Document Header

### 2.1 Root Element and Namespaces (`Catalogue`)

The root element declares the UBL 2.1 Catalogue namespace as default and the `cac`/`cbc` component namespaces. All POC files use identical namespace declarations.

```xml
<Catalogue xmlns="urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2"
           xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
           xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
```

### 2.2 Customization and Profile Identifiers

These two elements identify the Peppol BIS specification and business process. They are **fixed values** across all 9 POC files.

```xml
<cbc:CustomizationID>urn:fdc:peppol.eu:poacc:trns:catalogue:3</cbc:CustomizationID>  <!-- (1) -->
<cbc:ProfileID>urn:fdc:peppol.eu:poacc:bis:catalogue_only:3</cbc:ProfileID>            <!-- (2) -->
```

| # | Description |
|---|-------------|
| 1 | Identifies this as a Peppol Catalogue transaction (T19). Must not contain spaces. |
| 2 | Identifies the Catalogue Only business process (Profile 1). |

### 2.3 Catalogue Identifier (`cbc:ID`)

A unique identifier for the catalogue document, assigned by the provider. Used by receiving systems to track and reference catalogues.

*BIM2BOM usage: IDs follow a naming convention encoding the use case and role, e.g. `UC3-RESP-TRACEABLE-001` or `MBOM-STANDARD-001`.*

```xml
<cbc:ID>UC3-RESP-TRACEABLE-001</cbc:ID>
```

### 2.4 Action Code -- Header Level (`cbc:ActionCode`)

Instructs the receiver's system how to process the catalogue. The action code uses exact casing.

| Code | Description |
|------|-------------|
| `Add` | First catalogue sent for this contract. Used in all POC files. |
| `Replace` | Replaces the entire previous catalogue for the same contract. |
| `Update` | Partial update of the current catalogue. |
| `Delete` | Deletes the entire catalogue. |

*BIM2BOM usage: All 9 POC files use `Add` since they represent initial catalogue exchanges.*

```xml
<cbc:ActionCode>Add</cbc:ActionCode>
```

### 2.5 Catalogue Name (`cbc:Name`)

A human-readable name for the catalogue. Should convey the catalogue's purpose at a glance.

```xml
<cbc:Name>Offert Spårbar Katalog - 1:1 Spårbarhet till BIM</cbc:Name>
```

### 2.6 Issue Date (`cbc:IssueDate`)

The date the catalogue was created, in ISO 8601 format (`YYYY-MM-DD`). Must not include time zone information.

```xml
<cbc:IssueDate>2026-02-05</cbc:IssueDate>
```

### 2.7 Validity Period (`cac:ValidityPeriod`)

Defines the period during which the catalogue offer is valid. Contains start and end dates.

```xml
<cac:ValidityPeriod>
    <cbc:StartDate>2026-02-05</cbc:StartDate>
    <cbc:EndDate>2026-05-05</cbc:EndDate>
</cac:ValidityPeriod>
```

### 2.8 Referenced Contract (`cac:ReferencedContract`)

References the contract that governs the catalogue exchange. The contract ID links the catalogue to a specific procurement agreement.

*BIM2BOM usage: All files reference the same project contract `CONTRACT-934567923` corresponding to the project "Tillämpningsanvisningar BIM".*

```xml
<cac:ReferencedContract>
    <cbc:ID>CONTRACT-934567923</cbc:ID>
</cac:ReferencedContract>
```

### 2.9 Source Catalogue Reference (`cac:SourceCatalogueReference`)

Used in **seller response** catalogues to reference the buyer's original request catalogue. This element is absent in buyer request catalogues (UC1 request, UC2 request, UC3 request).

*BIM2BOM usage: Seller responses reference the buyer's catalogue `cbc:ID` to establish the request-response chain.*

```xml
<cac:SourceCatalogueReference>
    <cbc:ID>UC3-REQ-001</cbc:ID>
</cac:SourceCatalogueReference>
```

| Present in | Absent in |
|------------|-----------|
| UC1 response, UC2 response, UC3 responses (both) | UC1 request, UC2 request, UC3 request, MBOM files |

---

## 3. Parties

### 3.1 Catalogue Provider (`cac:ProviderParty`)

The party responsible for the preparation and transfer of the catalogue. In **buyer request** catalogues, the provider is the buyer. In **seller response** catalogues, the provider is the seller.

The provider must be identified with an endpoint identifier, a party identifier, and a legal entity registration name.

```xml
<cac:ProviderParty>
    <cbc:EndpointID schemeID="0007">5560813031</cbc:EndpointID>      <!-- (1) -->
    <cac:PartyIdentification>
        <cbc:ID schemeID="0007">5560813031</cbc:ID>                  <!-- (2) -->
    </cac:PartyIdentification>
    <cac:PartyLegalEntity>
        <cbc:RegistrationName>ÖBO</cbc:RegistrationName>             <!-- (3) -->
    </cac:PartyLegalEntity>
</cac:ProviderParty>
```

| # | Description |
|---|-------------|
| 1 | Peppol network endpoint identifier. `schemeID="0007"` is the Swedish organizational number scheme (Organisationsnummer). |
| 2 | Party identifier using the same scheme. The `@schemeID` value must be from the [ICD code list](https://docs.peppol.eu/poacc/upgrade-3/codelist/ICD/). |
| 3 | Legal registration name of the party. |

### 3.2 Catalogue Receiver (`cac:ReceiverParty`)

The party responsible for receiving and processing the catalogue. Structure is identical to `cac:ProviderParty`.

```xml
<cac:ReceiverParty>
    <cbc:EndpointID schemeID="0007">5560999202</cbc:EndpointID>
    <cac:PartyIdentification>
        <cbc:ID schemeID="0007">5560999202</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyLegalEntity>
        <cbc:RegistrationName>Väggentreprenören AB</cbc:RegistrationName>
    </cac:PartyLegalEntity>
</cac:ReceiverParty>
```

### 3.3 Parties in the POC

| POC File Category | Provider | Receiver |
|-------------------|----------|----------|
| Buyer requests (UC1/UC2/UC3) | ÖBO (buyer, `5560813031`) | Väggentreprenören AB (seller, `5560999202`) |
| Seller responses / MBOM | Väggentreprenören AB (seller, `5560999202`) | ÖBO (buyer, `5560813031`) |

---

## 4. Catalogue Line (`cac:CatalogueLine`)

Each catalogue line describes one item or product. A catalogue must contain at least one line. Line-level elements appear in UBL-defined sequence.

### 4.1 Line Identifier (`cbc:ID`)

Each line must have an identifier that is **unique within the catalogue document**. This ID is critical because it serves as the target for `cac:ComponentRelatedItem` references from child lines (see [Section 5](#5-component-related-item-bim2bom-recipe-hierarchy)).

```xml
<cac:CatalogueLine>
    <cbc:ID>1</cbc:ID>
    ...
</cac:CatalogueLine>
```

### 4.2 Action Code -- Line Level (`cbc:ActionCode`)

Controls how the receiving system should process this individual line.

| Code | Description | Constraint |
|------|-------------|-----------|
| `Add` | Add this item to the catalogue. | Used with any header ActionCode. |
| `Update` | Update this item. Entire line is replaced. | Only when header ActionCode is `Update`. |
| `Delete` | Remove this item from the catalogue. | Only when header ActionCode is `Update`. |

*BIM2BOM usage: All POC lines use `Add`.*

```xml
<cbc:ActionCode>Add</cbc:ActionCode>
```

### 4.3 Orderable Indicator (`cbc:OrderableIndicator`)

Indicates whether this catalogue line can be ordered. Boolean value: `true` or `false`.

*BIM2BOM usage: Always `true` in all POC files.*

```xml
<cbc:OrderableIndicator>true</cbc:OrderableIndicator>
```

### 4.4 Orderable Unit (`cbc:OrderableUnit`)

The unit of measure in which the item can be ordered. Uses [UN/ECE Recommendation 20](https://unece.org/trade/uncefact/cl-recommendations) codes.

| Code | Unit | BIM2BOM usage |
|------|------|---------------|
| `MTR` | Metre | Parent wall lines (length-based) |
| `MTK` | Square metre | Child component/recipe article lines (area-based) |

```xml
<cbc:OrderableUnit>MTR</cbc:OrderableUnit>
```

### 4.5 Content Unit Quantity (`cbc:ContentUnitQuantity`)

Specifies the **primary** quantity for this catalogue line: the amount of the item in the **orderable unit** (`cbc:OrderableUnit`). It is the main figure at line level for pricing and ordering context. The `@unitCode` must match `cbc:OrderableUnit`.

In BIM2BOM messages there are almost always **additional** measures taken from the same BIM object—net area, height, length, thickness, volumes, and similar—which are **not** repeated here. Those values are carried most of the time as **`cac:AdditionalItemProperty`** entries (typically with `cbc:Value` and `cbc:ValueQuantity` and BIP `listID="SE:BIP-koder"`). See [Section 10.2](#102-bip-properties-listidsebip-koder) and the BIP mapping document. Treat `cbc:ContentUnitQuantity` as the headline quantity for the line; treat AdditionalItemProperty as the detailed quantity breakdown from the model.

*BIM2BOM usage: Represents the main measured quantity extracted from the IFC model for ordering (e.g. wall length in metres, component area in square metres). Supplementary quantities from the model are usually listed under AdditionalItemProperty. Absent in UC1 buyer request where only the wall type -- not a specific instance -- is sent.*

```xml
<cbc:ContentUnitQuantity unitCode="MTR">16.06</cbc:ContentUnitQuantity>
```

---

## 5. Component Related Item (BIM2BOM Recipe Hierarchy)

This is the core mechanism for expressing **parent-child relationships** between catalogue lines within the same document. In standard Peppol Catalogue usage, `cac:ComponentRelatedItem` links pack levels (e.g. bottles in cases on pallets). In the BIM2BOM POC, it links **child recipe/manufacturing articles** back to their **parent wall line**.

**Peppol maturity:** This BIM2BOM pattern is **new** and has **not** been exercised or proven in live Peppol production traffic. UBL allows `cac:ComponentRelatedItem` and Peppol validation (schematron / rules) accepts messages that use `cbc:ID/@schemeID="CatalogueLineID"` to point at another line in the same catalogue, but the **Peppol BIS Catalogue** documentation does not describe this line-internal reference style or prescribe `CatalogueLineID` as a scheme. Treat interoperability as **unvalidated** outside this project until trading partners confirm behaviour.

### 5.1 Element Structure

`cac:ComponentRelatedItem` is placed on the **child** catalogue line, **after** line-level quantity fields and **before** `cac:RequiredItemLocationQuantity` and `cac:Item`, per UBL sequence rules.

```xml
<cac:ComponentRelatedItem>
    <cbc:ID schemeID="CatalogueLineID">1</cbc:ID>     <!-- (1) -->
    <cbc:Quantity unitCode="MTK">90.31</cbc:Quantity>   <!-- (2) -->
</cac:ComponentRelatedItem>
```

| # | Description |
|---|-------------|
| 1 | References the parent line's `cac:CatalogueLine/cbc:ID`. The `@schemeID="CatalogueLineID"` makes explicit that this is a line-internal reference. The target line ID **must** exist in the same document. |
| 2 | The quantity of this component that applies to the parent. The `@unitCode` matches the child line's orderable unit. |

### 5.2 Traceable Catalogue Pattern

In a **traceable catalogue**, child lines use `cac:ComponentRelatedItem` together with a shared `CDEGuid` (see [Section 10.1](#101-beast-supply-properties-listidorgbeast)). This creates a double link:

- **Catalogue-level**: `ComponentRelatedItem` points child to parent line ID
- **Model-level**: shared `CDEGuid` (IFC GlobalId) links both lines to the same BIM object

```
CatalogueLine ID=1 (Wall, CDEGuid=3pLKJPvHT21uNqX1l9FcUN)
  ^
  |-- ComponentRelatedItem --> CatalogueLine ID=2 (Tegelfasad, same CDEGuid)
  |-- ComponentRelatedItem --> CatalogueLine ID=3 (Regelstomme, same CDEGuid)
  |-- ComponentRelatedItem --> CatalogueLine ID=4 (Gips, same CDEGuid)
```

### 5.3 Standard Catalogue Pattern

In a **standard (non-traceable) seller response**—`UC3_Seller_StandardCatalogue_Response.xml` and `MBOM_StandardCatalogue_PackageArticles.xml`—child lines do **not** use `cac:ComponentRelatedItem` and do **not** share the parent's `CDEGuid`.

**UC2** (summed wall type) is different: child recipe lines **do** use `cac:ComponentRelatedItem` to point at the parent wall line, but children have **no** `CDEGuid` (aggregated input, no 1:1 BIM traceability).

### 5.4 Where Used

| Element | UC1 | UC2 | UC3 Traceable | UC3 Standard | MBOM Traceable | MBOM Standard |
|---------|-----|-----|---------------|--------------|----------------|---------------|
| `cac:ComponentRelatedItem` | -- | Child lines 2-4 | Child lines 2-4 | -- | Child lines 2-3 | -- |

---

## 6. Prices and Quantities

### 6.1 Required Item Location Quantity (`cac:RequiredItemLocationQuantity`)

Contains pricing and minimum quantity information for a catalogue line. This element is present on **seller response** catalogues and on some buyer requests (UC2 with placeholder `0.00` price).

```xml
<cac:RequiredItemLocationQuantity>
    <cbc:MinimumQuantity unitCode="MTR">16.06</cbc:MinimumQuantity>  <!-- (1) -->
    <cac:Price>
        <cbc:PriceAmount currencyID="SEK">4850.00</cbc:PriceAmount>  <!-- (2) -->
        <cbc:BaseQuantity unitCode="MTR">1</cbc:BaseQuantity>         <!-- (3) -->
    </cac:Price>
</cac:RequiredItemLocationQuantity>
```

| # | Description |
|---|-------------|
| 1 | Minimum order quantity. In the POC, this typically equals the BIM-derived quantity. |
| 2 | Net price excluding VAT. `@currencyID` is always `SEK` in the POC. |
| 3 | The quantity base to which the price applies. A value of `1` with `unitCode="MTR"` means the price is per running metre. |

### 6.2 Price Absence in Buyer Requests

The UC1 buyer request (`UC1_Buyer_WallTypes_Request.xml`) omits `cac:RequiredItemLocationQuantity` entirely, since it is a price inquiry. The UC2 buyer request includes it with `PriceAmount` of `0.00` as a placeholder awaiting the seller's response.

---

## 7. Item Identification

Items are identified using up to four different identification elements. At least one of `cac:SellersItemIdentification` or `cac:StandardItemIdentification` should be present. The UBL-mandated sequence within `cac:Item` is:

1. `cac:BuyersItemIdentification`
2. `cac:SellersItemIdentification`
3. `cac:ManufacturersItemIdentification`
4. `cac:StandardItemIdentification`

### 7.1 Buyer's Item Identification (`cac:BuyersItemIdentification`)

An identifier assigned by the buyer, corresponding to the **BIP TypeID** from the BIP property set (Swedish BIM classification system).

*BIM2BOM usage: `YV01` for wall type requests (UC1/UC2), `IV01` for unique wall instances (UC3/MBOM).*

```xml
<cac:BuyersItemIdentification>
    <cbc:ID>YV01</cbc:ID>                <!-- (1) -->
</cac:BuyersItemIdentification>
```

| # | Description |
|---|-------------|
| 1 | BIP.TypeID from the BIP-koder classification. The same TypeID is echoed by the seller in response catalogues. |

### 7.2 Seller's Item Identification (`cac:SellersItemIdentification`)

An identifier assigned by the seller for internal reference.

*BIM2BOM usage: In the POC deliverables, **`cbc:ID` should more often than not be the seller’s article number** (or equivalent internal product code)—for example `VE-YV01-350`, `YV01-350`, `VE-TEGEL-110-PKG`. That is the normal case for responses and for most lines.*

Re-using the **IFC GlobalId** (same value as **CDEGuid**) in `cac:SellersItemIdentification` is a **specialised traceability pattern**, used on some lines (e.g. unique-wall buyer requests, traceable seller responses, traceable MBOM parent) where the project deliberately mirrors the BIM instance ID in this element. It is **not** the default: full BIM traceability is still expressed via **`AdditionalItemProperty` / CDEGuid** where needed; prefer a real article number in `SellersItemIdentification` unless you intentionally align this field with the IFC GlobalId for interoperability testing.

| Pattern | Typical `cbc:ID` | When |
|---------|------------------|------|
| Default | Seller article / product code | Most seller responses, standard catalogues, package articles, priced lines |
| Traceability-focused | IFC GlobalId (22-char) | Explicit 1:1 instance alignment on selected lines (see traceable catalogue examples) |

```xml
<!-- Typical: seller article number (most POC lines) -->
<cac:SellersItemIdentification>
    <cbc:ID>VE-TEGEL-110-PKG</cbc:ID>
</cac:SellersItemIdentification>
```

```xml
<!-- Traceability pattern: IFC GlobalId as seller's item ID (exception, not the default) -->
<cac:SellersItemIdentification>
    <cbc:ID>3pLKJPvHT21uNqX1l9FcUN</cbc:ID>
</cac:SellersItemIdentification>
```

### 7.3 Manufacturer's Item Identification (`cac:ManufacturersItemIdentification`)

Identifies the item according to the manufacturer. Necessary when the same product may be purchased from multiple suppliers.

*BIM2BOM usage: Used on parent wall lines with a generic type reference (e.g. `YVxx`). Not present on child recipe/component lines.*

```xml
<cac:ManufacturersItemIdentification>
    <cbc:ID>YVxx</cbc:ID>
</cac:ManufacturersItemIdentification>
```

### 7.4 Standard Item Identification / GTIN (`cac:StandardItemIdentification`)

A globally unique identifier, typically a **GTIN** (GS1 Global Trade Item Number). The `@schemeID="0160"` designates the GTIN scheme.

*BIM2BOM usage: Present on all seller-side catalogue lines. Values in the POC are illustrative 13-digit codes. Every `cac:Item` in seller catalogues should include a GTIN so offers are traceable at the product level.*

```xml
<cac:StandardItemIdentification>
    <cbc:ID schemeID="0160">7318937172312</cbc:ID>   <!-- (1) -->
</cac:StandardItemIdentification>
```

| # | Description |
|---|-------------|
| 1 | `schemeID="0160"` identifies GTIN (GS1). The value must be a 13-digit numeric string. |

---

## 8. Item Name and Description

Together with [Section 9](#9-item-specification-document-reference), this section defines how users and systems see **what** the item is in words, and how that ties to **where** the authoritative BIM model lives.

### 8.1 Item Description (`cbc:Description`)

Free-text description of the item. May contain details about materials, specifications, and context.

*BIM2BOM usage: Descriptions indicate the material composition, traceability approach, and relationship to the BIM model. When a **model reference** is present on the same line (`cac:ItemSpecificationDocumentReference`, [Section 9](#9-item-specification-document-reference)), the description should **complement** that reference: mention the originating IFC or project context in plain language (e.g. wall build-up, storey, or that the line is traceable to a specific model) so humans do not rely on the URI alone. The machine-readable link remains in `cbc:URI`; the description carries the narrative.*

| Practice | Detail |
|----------|--------|
| Align wording | If `DocumentDescription` or the IFC file name identifies the model (e.g. `A-40-V-000_BIM2BOM.ifc`), echo or paraphrase that context in `cbc:Description` where helpful. |
| Traceable lines | State that the line relates to the BIM model / unique instance when `CDEGuid` or traceable patterns apply (see [Section 10.1](#101-beast-supply-properties-listidorgbeast)). |
| Seller responses | Sellers may extend the buyer’s description; they should **not** contradict the model reference URI unless the catalogue is explicitly correcting a prior error. |

```xml
<cbc:Description>Yttre bärande yttervägg, 350 mm. Huvudobjekt från BIM-modell.
    Se katalog-artiklar (rad 2-4) med samma CDEGuid för 1:1 spårbarhet.</cbc:Description>
```

**Example with explicit model context (buyer request, same line as `ItemSpecificationDocumentReference` in UC1):**

```xml
<cbc:Description>Yttre bärande yttervägg, 350 mm. Materials: Tegel fasad 110 / Luft 30 / Vindskydd 9 / Regelstomme C24 195 + mineralull / Ångbroms / Installationsregel 45 + isolering / Gips 13</cbc:Description>
<!-- Formal model reference on the same cac:Item points to https://cde.example.com/models/A-40-V-000_BIM2BOM.ifc -->
```

### 8.2 Item Name (`cbc:Name`)

A short name suitable for use in ERP systems, order lines, and search. Should make it possible for the user to distinguish between similar items.

*BIM2BOM usage: The name may carry **discriminators** that match the model or location (e.g. plan level, storey code) so order lines stay aligned with the BIM instance without duplicating the full URI. This pairs with the formal model reference and with BIP properties such as `floor` where present.*

```xml
<cbc:Name>YV01 350 - Yttre bärande yttervägg (Plan 010)</cbc:Name>
```

---

## 9. Item Specification Document Reference

This block is the **formal model reference** for the line: it points to the IFC (or other) file on a CDE. Pair it with the human-readable text in [Section 8](#8-item-name-and-description) so `cbc:Description` / `cbc:Name` and `cbc:URI` tell a consistent story.

**Why this matters:** This section is **essential** for BIM2BOM. The catalogue carries quantities, identifiers, and properties that were extracted from a **specific** model revision. If the link does not resolve to **that exact version** of the document (immutable file, revision id, or equivalent), the IFC cannot be reconnected to the procurement data with confidence—CDEGuid, lengths, and recipe breakdowns may no longer match reality. Treat model reference + version integrity as a **first-class requirement**, not optional metadata.

### 9.1 External Document Reference (`cac:ItemSpecificationDocumentReference`)

Non-XML documents can be attached to a catalogue line to further specify the item. In the BIM2BOM POC, this is used to link the catalogue item back to its originating **IFC model** on a CDE (Common Data Environment).

*BIM2BOM usage: Present on buyer request catalogues (UC1, UC3) to reference the source IFC file. The attachment uses an external URI rather than an embedded binary object.*

```xml
<cac:ItemSpecificationDocumentReference>
    <cbc:ID>IFC-MODEL-REF</cbc:ID>                                         <!-- (1) -->
    <cbc:DocumentDescription>IFC model file - Originating BIM model</cbc:DocumentDescription>  <!-- (2) -->
    <cac:Attachment>
        <cac:ExternalReference>
            <cbc:URI>https://cde.example.com/models/A-40-V-000_BIM2BOM.ifc</cbc:URI>  <!-- (3) -->
        </cac:ExternalReference>
    </cac:Attachment>
</cac:ItemSpecificationDocumentReference>
```

| # | Description |
|---|-------------|
| 1 | An identifier for the attached document reference. |
| 2 | Human-readable description of the attached document. |
| 3 | URI pointing to the IFC model on the CDE platform. |

### 9.2 Versioning, Peppol-supported tags, and workflows

Peppol BIS Catalogue does **not** define a full “IFC revision” workflow, but it offers a small set of elements you should use together so implementations can align catalogue data with a **specific** document instance:

| Level | Peppol / UBL element | Role for versioning |
|-------|----------------------|---------------------|
| Catalogue header | [`cbc:VersionID`](https://docs.peppol.eu/poacc/upgrade-3/syntax/Catalogue/cbc-VersionID/) (optional in Peppol syntax) | Identifies the **revision of the catalogue message** (e.g. `v2`). Use with `cbc:ActionCode` when replacing or updating catalogues so receivers know which document instance they process. |
| Item specification | [`cac:ItemSpecificationDocumentReference`](https://docs.peppol.eu/poacc/upgrade-3/syntax/Catalogue/cac-CatalogueLine/cac-Item/cac-ItemSpecificationDocumentReference/) | Peppol allows `cbc:ID` (required), optional [`cbc:DocumentTypeCode`](https://docs.peppol.eu/poacc/upgrade-3/syntax/Catalogue/cac-CatalogueLine/cac-Item/cac-ItemSpecificationDocumentReference/cbc-DocumentTypeCode/), `cbc:DocumentDescription`, and `cac:Attachment` (external URI or embedded). **Only elements in the Peppol data model may appear** (rule [PEPPOL-T19-B19402](https://docs.peppol.eu/poacc/upgrade-3/rules/PEPPOL-T19-B19402/)); do not add extra UBL children here unless your profile explicitly extends the subset. |

**Practical guidance:**

- Prefer a **stable, version-specific** `cbc:URI` (path or query that identifies one immutable artefact), or a CDE-issued URL that always resolves to a single revision.
- Put a **CDE document id**, revision label, or hash in `cbc:ID` and/or spell out the revision in `cbc:DocumentDescription` so humans and validators can see which file instance is intended, even if the URI strategy changes later.
- Use optional `cbc:DocumentTypeCode` where your code list distinguishes model types (e.g. IFC vs PDF), if your trading partners agree on the list.
- Review **official Peppol catalogue examples** and the [Catalogue syntax tree](https://docs.peppol.eu/poacc/upgrade-3/syntax/Catalogue/) when designing versioning workflows so header (`VersionID`, `IssueDate`, `ValidityPeriod`, `SourceCatalogueReference`) and line-level document references stay consistent.

Full OASIS UBL `DocumentReference` includes additional fields (e.g. issue date, UUID) that can be useful in non-Peppol contexts; in **Peppol Catalogue** those elements are typically **not** available on `ItemSpecificationDocumentReference`—validate against the Peppol syntax before relying on them.

### 9.3 Future development (APIs and standards)

Further work is needed to connect this Peppol payload to **authoritative** CDE services: e.g. [buildingSMART **OpenCDE**](https://www.buildingsmart.org/solutions/openCDE/) and related APIs for documents, issues, and versions, or other platform-specific REST/GraphQL APIs (project CDE vendors, national services). The goal is to resolve `cbc:ID` / URI to the **same** document record and revision that the authoring tool published—not only a convenient download link. Document here as requirements mature; expect **additional** standards (OpenCDE, bSDD, IDS, etc.) to complement—not replace—clear versioning in the catalogue XML until a normative mapping exists.

### 9.4 `listID`, code lists, and data dictionaries (incl. bSDD)

UBL and Peppol use **`@listID`** on coded basic components (here: `cbc:NameCode/@listID` inside `cac:AdditionalItemProperty`) to say **which register or authority** owns the code in `cbc:NameCode` (and thus how receivers should interpret the property semantics). This is **not** optional decoration: without a stable `listID`, the same string could mean different things in different markets.

**What the POC uses today**

| `listID` value | Meaning in BIM2BOM | Relation to wider dictionaries |
|----------------|-------------------|--------------------------------|
| `ORG:BEAst` | BEAst Supply property names (e.g. `CDEGuid`, `AuthoringToolId`) | Defined by the [BEAst BIS](https://bis.beast.se/) community; not automatically the same URI space as bSDD. |
| `SE:BIP-koder` | Swedish **BIP** (Bygginformationsegenskaper) property names from national BIM practice | National **classification / property** dictionary; overlaps with IFC property sets in places but uses its own naming and code list. |

**buildingSMART Data Dictionary (bSDD)**

The [buildingSMART Data Dictionary](https://www.buildingsmart.org/services/bsdd/) (**bSDD**) is a **global** registry of concepts and properties (often identified by HTTPS URIs) used to harmonise IFC, classification, and exchange requirements. Peppol does **not** ship a built-in `listID` for bSDD: you reference bSDD by agreeing with partners how `listID` and `NameCode` map to **bSDD URIs** (or to entries in another dictionary) in your implementation guide.

**How `listID` should connect to bSDD and other dictionaries (target end-state)**

Further specification is still needed. The intended direction is:

1. **Declare the register** — Keep using `cbc:NameCode/@listID` for the **immediate** authority (`ORG:BEAst`, `SE:BIP-koder`, or a future project-specific list id agreed in the contract).
2. **Map to bSDD where possible** — For each property name (or for selected subsets), maintain a **mapping table** from `(listID, NameCode)` → **bSDD concept URI** (and optionally IFC property set / property name, UNICLASS, etc.). That lets generic tooling resolve Peppol lines to semantic definitions without hard-coding Swedish strings.
3. **Support other dictionaries** — National extensions (BIP), vendor catalogues, GS1 attributes, or EU product databases may each need their own `listID` or the same pattern with a **registry of list ids** maintained by the project.
4. **APIs** — Long term, **bSDD APIs** (search/resolve by URI), **OpenCDE**, and CDE-specific metadata services should supply the same logical link the catalogue hints at with `listID` + codes.

Until those mappings are normative for BIM2BOM, treat [BIP_Peppol_Property_Mapping.md](../peppol-transformer/docs/BIP_Peppol_Property_Mapping.md) and this document’s property tables as the **source of truth** for POC messages; extend them when adding `listID` values or when publishing formal bSDD bridges.

---

## 10. Additional Item Properties (`cac:AdditionalItemProperty`)

Additional properties convey product attributes that cannot be expressed through dedicated UBL elements. Each property consists of a name, an optional code, and a value. Properties are grouped by their `cbc:NameCode/@listID` into two families: **BEAst Supply properties** and **BIP properties** (see [§9.4](#94-listid-code-lists-and-data-dictionaries-incl-bsdd) for how `listID` relates to registers, **bSDD**, and other data dictionaries).

### General Structure

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>thickness</cbc:Name>                                <!-- (1) -->
    <cbc:NameCode listID="SE:BIP-koder">thickness</cbc:NameCode>  <!-- (2) -->
    <cbc:Value>350 mm</cbc:Value>                                  <!-- (3) -->
    <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>      <!-- (4) -->
</cac:AdditionalItemProperty>
```

| # | Description |
|---|-------------|
| 1 | Human-readable property name. |
| 2 | Machine-readable code with `@listID` identifying the code list. Must be either `ORG:BEAst` or `SE:BIP-koder`. |
| 3 | Text representation of the value (always present). |
| 4 | Optional numeric quantity with unit code (present for dimensional/measurable properties). |

---

### 10.1 BEAst Supply Properties (`listID="ORG:BEAst"`)

The BEAst Supply ecosystem defines many property names; **this POC only uses `AuthoringToolId` and `CDEGuid`** under `ORG:BEAst`. All other BEAst-named properties are intentionally omitted (see note after `CDEGuid`).

#### AuthoringToolId

The identifier from the BIM authoring tool (e.g. Revit Element ID). On **parent lines**, this is the original BIM element ID. On **child lines** in traceable catalogues, the seller assigns their own ID.

| Line type | Typical value | Source |
|-----------|---------------|--------|
| Parent (BIM object) | `1192287` | Revit Element ID |
| Child (traceable) | `VE-2001`, `VE-MFG-001` | Seller's system |
| Child (standard) | `VE-PKG-001` | Seller's system |

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>AuthoringToolId</cbc:Name>
    <cbc:NameCode listID="ORG:BEAst">AuthoringToolId</cbc:NameCode>
    <cbc:Value>1192287</cbc:Value>
</cac:AdditionalItemProperty>
```

#### CDEGuid

The IFC GlobalId (22-character base64-encoded GUID) linking the catalogue item to a specific BIM model object. This is the **key property** enabling BIM traceability.

**Rules:**
- On **parent lines** (BIM objects): always present, matches the IFC GlobalId
- On **child lines in traceable catalogues**: present with the **same value** as the parent -- this is what makes the catalogue "traceable"
- On **child lines in standard catalogues**: **absent** -- this is the defining difference

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>CDEGuid</cbc:Name>
    <cbc:NameCode listID="ORG:BEAst">CDEGuid</cbc:NameCode>
    <cbc:Value>3pLKJPvHT21uNqX1l9FcUN</cbc:Value>
</cac:AdditionalItemProperty>
```

**BEAst properties not used in BIM2BOM POC:** Do **not** populate `ORG:BEAst` `AdditionalItemProperty` entries for `ItemType`, `ParentAuthoringToolId`, `ParentItemID`, `RecipeArticle`, `SourceSystem`, `Traceability`, or `LeadTime`. Parent–child structure uses `cac:ComponentRelatedItem` (and shared `CDEGuid` where traceable); delivery time and article typing belong in other layers (e.g. contract, ERP, or future extensions), not these experimental BEAst names in catalogue lines.

---

### 10.2 BIP Properties (`listID="SE:BIP-koder"`)

These properties carry building information from the BIP (Bygginformationsegenskaper) standard, the Swedish national standard for BIM property definitions.

For a comprehensive mapping of all BIP properties to the Peppol `cac:AdditionalItemProperty` structure, see [BIP_Peppol_Property_Mapping.md](../peppol-transformer/docs/BIP_Peppol_Property_Mapping.md).

#### TypeID

The BIP **type identifier**: it repeats the wall or element type in the BIP namespace and should match `cac:BuyersItemIdentification/cbc:ID` on the same line when both are present (e.g. `YV01` for a wall type, `IV01` for a unique instance in UC3). This subsection comes **first** under BIP properties so readers establish the BIP classification link before thickness, geometry, and flags.

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>TypeID</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">TypeID</cbc:NameCode>
    <cbc:Value>IV01</cbc:Value>
</cac:AdditionalItemProperty>
```

#### thickness

Wall or component thickness. Includes both a text value with unit suffix and a machine-readable `ValueQuantity`.

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>thickness</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">thickness</cbc:NameCode>
    <cbc:Value>350 mm</cbc:Value>
    <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>
</cac:AdditionalItemProperty>
```

#### height

Wall height from the BIM model.

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>height</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">height</cbc:NameCode>
    <cbc:Value>5628 mm</cbc:Value>
    <cbc:ValueQuantity unitCode="MMT">5628</cbc:ValueQuantity>
</cac:AdditionalItemProperty>
```

#### length

Wall length from the BIM model.

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>length</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">length</cbc:NameCode>
    <cbc:Value>16060 mm</cbc:Value>
    <cbc:ValueQuantity unitCode="MMT">16060</cbc:ValueQuantity>
</cac:AdditionalItemProperty>
```

#### net area

Net surface area of the wall.

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>net area</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">net area</cbc:NameCode>
    <cbc:Value>79.81 m2</cbc:Value>
    <cbc:ValueQuantity unitCode="MTK">79.81</cbc:ValueQuantity>
</cac:AdditionalItemProperty>
```

#### is load bearing

Whether the wall is structurally load-bearing. Boolean property.

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>is load bearing</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">is load bearing</cbc:NameCode>
    <cbc:Value>Yes</cbc:Value>
</cac:AdditionalItemProperty>
```

#### is external

Whether the wall is an external (facade) wall. Boolean property.

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>is external</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">is external</cbc:NameCode>
    <cbc:Value>Yes</cbc:Value>
</cac:AdditionalItemProperty>
```

#### floor

The floor/storey designation from the BIM model.

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>floor</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">floor</cbc:NameCode>
    <cbc:Value>010</cbc:Value>
</cac:AdditionalItemProperty>
```

### 10.3 Unit Codes Reference

| Unit | UN/CEFACT Code | Used for |
|------|----------------|----------|
| Millimetre | `MMT` | thickness, height, length |
| Square metre | `MTK` | net area, component quantities |
| Metre | `MTR` | wall length, orderable unit |
| Cubic metre | `MTQ` | net volume (in BIP mapping, not in current POC) |
| Kilogram | `KGM` | weight (in BIP mapping, not in current POC) |

---

## 11. Traceable vs Standard Catalogues

The central design decision in the BIM2BOM POC is whether a seller response catalogue maintains **1:1 traceability** to the BIM model or not. This section summarizes the structural differences.

### 11.1 Comparison Table

| Aspect | Traceable Catalogue | Standard Catalogue |
|--------|--------------------|--------------------|
| `CDEGuid` on child lines | Same as parent (shared IFC GlobalId) | Absent |
| `cac:ComponentRelatedItem` | Present on child lines, pointing to parent `cbc:ID` | Absent |
| `cac:SellersItemIdentification` on children | IFC GlobalId (same as parent) | Seller's own article code |
| `AuthoringToolId` on children | Seller's own ID (different from parent) | Seller's own ID |
| BIM model correlation | Full: receiving system can reconstruct hierarchy | None: no connection back to individual BIM objects |

### 11.2 Decision Guide

Use **traceable catalogues** when:
- The buyer sends unique wall instances (UC3 pattern) with IFC GlobalIds
- 1:1 traceability from eBOM to mBOM to components is required
- The receiving system needs to build a hierarchy mapped to the BIM model

Use **standard catalogues** when:
- The buyer sends aggregated wall type quantities (UC2 pattern)
- Simpler processing is acceptable
- No per-object correlation to the BIM model is needed

### 11.3 Example Files

- **Traceable**: `UC3_Seller_TraceableCatalogue_Response.xml`, `MBOM_TraceableCatalogue_UniqueArticles.xml`
- **Standard**: `UC3_Seller_StandardCatalogue_Response.xml`, `MBOM_StandardCatalogue_PackageArticles.xml`

---

## 12. Complete Element Index

For quick reference, the following table lists every XML element and attribute used in the POC files with its XPath and the sections where it is documented.

| Element / Attribute | XPath | Section |
|---------------------|-------|---------|
| `Catalogue` | `/Catalogue` | [2.1](#21-root-element-and-namespaces-catalogue) |
| `cbc:CustomizationID` | `/Catalogue/cbc:CustomizationID` | [2.2](#22-customization-and-profile-identifiers) |
| `cbc:ProfileID` | `/Catalogue/cbc:ProfileID` | [2.2](#22-customization-and-profile-identifiers) |
| `cbc:ID` (header) | `/Catalogue/cbc:ID` | [2.3](#23-catalogue-identifier-cbcid) |
| `cbc:ActionCode` (header) | `/Catalogue/cbc:ActionCode` | [2.4](#24-action-code----header-level-cbcactioncode) |
| `cbc:Name` (header) | `/Catalogue/cbc:Name` | [2.5](#25-catalogue-name-cbcname) |
| `cbc:IssueDate` | `/Catalogue/cbc:IssueDate` | [2.6](#26-issue-date-cbcissuedate) |
| `cac:ValidityPeriod` | `/Catalogue/cac:ValidityPeriod` | [2.7](#27-validity-period-cacvalidityperiod) |
| `cbc:StartDate` | `.../cac:ValidityPeriod/cbc:StartDate` | [2.7](#27-validity-period-cacvalidityperiod) |
| `cbc:EndDate` | `.../cac:ValidityPeriod/cbc:EndDate` | [2.7](#27-validity-period-cacvalidityperiod) |
| `cac:ReferencedContract` | `/Catalogue/cac:ReferencedContract` | [2.8](#28-referenced-contract-cacreferencedcontract) |
| `cac:SourceCatalogueReference` | `/Catalogue/cac:SourceCatalogueReference` | [2.9](#29-source-catalogue-reference-cacsourcecataloguereference) |
| `cac:ProviderParty` | `/Catalogue/cac:ProviderParty` | [3.1](#31-catalogue-provider-cacproviderparty) |
| `cac:ReceiverParty` | `/Catalogue/cac:ReceiverParty` | [3.2](#32-catalogue-receiver-cacreceiverparty) |
| `cbc:EndpointID` | `.../cbc:EndpointID` | [3.1](#31-catalogue-provider-cacproviderparty) |
| `cac:PartyIdentification` | `.../cac:PartyIdentification` | [3.1](#31-catalogue-provider-cacproviderparty) |
| `cac:PartyLegalEntity` | `.../cac:PartyLegalEntity` | [3.1](#31-catalogue-provider-cacproviderparty) |
| `cbc:RegistrationName` | `.../cbc:RegistrationName` | [3.1](#31-catalogue-provider-cacproviderparty) |
| `cac:CatalogueLine` | `/Catalogue/cac:CatalogueLine` | [4](#4-catalogue-line-caccatalogueline) |
| `cbc:ID` (line) | `.../cac:CatalogueLine/cbc:ID` | [4.1](#41-line-identifier-cbcid) |
| `cbc:ActionCode` (line) | `.../cac:CatalogueLine/cbc:ActionCode` | [4.2](#42-action-code----line-level-cbcactioncode) |
| `cbc:OrderableIndicator` | `.../cbc:OrderableIndicator` | [4.3](#43-orderable-indicator-cbcorderableindicator) |
| `cbc:OrderableUnit` | `.../cbc:OrderableUnit` | [4.4](#44-orderable-unit-cbcorderableunit) |
| `cbc:ContentUnitQuantity` | `.../cbc:ContentUnitQuantity` | [4.5](#45-content-unit-quantity-cbccontentunitquantity) |
| `cac:ComponentRelatedItem` | `.../cac:ComponentRelatedItem` | [5](#5-component-related-item-bim2bom-recipe-hierarchy) |
| `cac:RequiredItemLocationQuantity` | `.../cac:RequiredItemLocationQuantity` | [6](#6-prices-and-quantities) |
| `cbc:MinimumQuantity` | `.../cbc:MinimumQuantity` | [6.1](#61-required-item-location-quantity-cacrequireditemlocationquantity) |
| `cac:Price` | `.../cac:Price` | [6.1](#61-required-item-location-quantity-cacrequireditemlocationquantity) |
| `cbc:PriceAmount` | `.../cbc:PriceAmount` | [6.1](#61-required-item-location-quantity-cacrequireditemlocationquantity) |
| `cbc:BaseQuantity` | `.../cbc:BaseQuantity` | [6.1](#61-required-item-location-quantity-cacrequireditemlocationquantity) |
| `cac:Item` | `.../cac:Item` | [7](#7-item-identification), [8](#8-item-name-and-description) |
| `cbc:Description` | `.../cac:Item/cbc:Description` | [8.1](#81-item-description-cbcdescription) |
| `cbc:Name` (item) | `.../cac:Item/cbc:Name` | [8.2](#82-item-name-cbcname) |
| `cac:BuyersItemIdentification` | `.../cac:BuyersItemIdentification` | [7.1](#71-buyers-item-identification-cacbuyersitemidentification) |
| `cac:SellersItemIdentification` | `.../cac:SellersItemIdentification` | [7.2](#72-sellers-item-identification-cacsellersitemidentification) |
| `cac:ManufacturersItemIdentification` | `.../cac:ManufacturersItemIdentification` | [7.3](#73-manufacturers-item-identification-cacmanufacturersitemidentification) |
| `cac:StandardItemIdentification` | `.../cac:StandardItemIdentification` | [7.4](#74-standard-item-identification--gtin-cacstandarditemidentification) |
| `cac:ItemSpecificationDocumentReference` | `.../cac:ItemSpecificationDocumentReference` | [9](#9-item-specification-document-reference) |
| `cbc:DocumentDescription` | `.../cbc:DocumentDescription` | [9.1](#91-external-document-reference-cacitemspecificationdocumentreference) |
| `cac:Attachment` | `.../cac:Attachment` | [9.1](#91-external-document-reference-cacitemspecificationdocumentreference) |
| `cac:ExternalReference` | `.../cac:ExternalReference` | [9.1](#91-external-document-reference-cacitemspecificationdocumentreference) |
| `cbc:URI` | `.../cbc:URI` | [9.1](#91-external-document-reference-cacitemspecificationdocumentreference) |
| `cac:AdditionalItemProperty` | `.../cac:AdditionalItemProperty` | [10](#10-additional-item-properties-cacadditionalitemproperty) |
| `cbc:NameCode` | `.../cbc:NameCode` | [10](#10-additional-item-properties-cacadditionalitemproperty) |
| `cbc:Value` | `.../cbc:Value` | [10](#10-additional-item-properties-cacadditionalitemproperty) |
| `cbc:ValueQuantity` | `.../cbc:ValueQuantity` | [10](#10-additional-item-properties-cacadditionalitemproperty) |

---

## 13. Reference Links

- **Peppol BIS Catalogue syntax**: https://docs.peppol.eu/poacc/upgrade-3/syntax/Catalogue/
- **Peppol BIS Catalogue Only profile**: https://docs.peppol.eu/poacc/upgrade-3/profiles/1-catalogueonly/
- **Peppol BIS Ordering**: https://docs.peppol.eu/poacc/upgrade-3/profiles/28-ordering/
- **Peppol BIS Punch Out**: https://docs.peppol.eu/poacc/upgrade-3/profiles/18-punchout/
- **Peppol code lists**: https://docs.peppol.eu/poacc/upgrade-3/codelist/
- **BEAst Supply BIS**: https://bis.beast.se/
- **UBL 2.1 specification**: http://docs.oasis-open.org/ubl/UBL-2.1.html
- **BIP documentation**: https://www.bimalliance.se/
- **BIP-Peppol Property Mapping**: [BIP_Peppol_Property_Mapping.md](../peppol-transformer/docs/BIP_Peppol_Property_Mapping.md)
- **UN/CEFACT Recommendation 20 (units)**: https://unece.org/trade/uncefact/cl-recommendations

---

*Document version: 1.0 -- 2026-04-15*
*Covers all 9 POC deliverable XML files in `POC-Leverables/`*
