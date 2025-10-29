# BIM2BOM Workflow - Från IFC till Peppol Katalog

## 📋 Översikt

Detta dokument beskriver det kompletta arbetsflödet för att konvertera en BIM-modell (IFC-format) till en standardiserad Peppol e-upphandlingskatalog. Processen består av två huvudsteg:

1. **IFC till XML** - Konvertering med IfcConvert
2. **XML till Peppol** - Transformation med Peppol Transformer

## 🔄 Komplett Arbetsflöde

```
┌─────────────┐
│  IFC-fil    │  Digital byggnadsmodell (.ifc)
└──────┬──────┘
       │
       │ IfcConvert
       │ (Konvertering)
       ▼
┌─────────────┐
│  XML-fil    │  Strukturerad representation
└──────┬──────┘
       │
       │ Peppol Transformer
       │ (XSLT Transformation)
       ▼
┌─────────────┐
│Peppol BIS   │  Standardiserad e-upphandlingskatalog
│ Katalog     │
└─────────────┘
```

## 🎯 Steg-för-Steg Guide

### Steg 1: IFC till XML Konvertering

**Verktyg:** IfcConvert (IfcOpenShell)

#### Syfte
Konverterar den binära IFC-filen till en strukturerad XML-representation som kan bearbetas vidare.

#### Kommando (Windows)
```batch
cd IfcConvert
IfcConvert.exe --threads 7 input.ifc output.xml
```

#### Kommando (Linux/macOS)
```bash
cd IfcConvert
./IfcConvert --threads 7 input.ifc output.xml
```

#### Parametrar
- `--threads 7` - Använder 7 CPU-trådar för snabbare bearbetning
- `input.ifc` - Din byggnadsmodell i IFC-format
- `output.xml` - Namn på den genererade XML-filen

#### Exempel
```batch
IfcConvert.exe --threads 7 models/A-40-V-000_BIM2BOM.ifc IfcConvert/output/A-40-V-000_BIM2BOM.xml
```

#### Vad händer?
- IfcConvert läser IFC-filen och extraherar all geometri och metadata
- All information konverteras till ett strukturerat XML-format
- Resulterande XML-fil innehåller:
  - Element-ID och GlobalID
  - Geometrisk information
  - Material och komponenter
  - Egenskaper (properties)
  - Klassificeringar (BSAB, etc.)
  - Relationer mellan element

#### Utdata
En XML-fil med strukturerad data för alla byggnadselement, till exempel:
- IfcWall (väggar)
- IfcSlab (bjälklag)
- IfcBeam (balkar)
- IfcColumn (pelare)
- Med tillhörande egenskaper och metadata

---

### Steg 2: XML till Peppol Transformation

**Verktyg:** Peppol Transformer (Python + XSLT)

#### Syfte
Transformerar XML-filen till standardiserad Peppol BIS Katalogformat med BIP-egenskapsmappning.

#### Kommando (Standard Stilmall)
```bash
cd peppol-transformer
python scripts/transform_ifc_to_peppol.py ../IfcConvert/output/A-40-V-000_BIM2BOM.xml
```

#### Kommando (Anpassad Utdatafil)
```bash
python scripts/transform_ifc_to_peppol.py input.xml output/min_katalog.xml
```

#### Kommando (Anpassad Stilmall)
```bash
python scripts/transform_ifc_to_peppol.py input.xml output.xml --stylesheet stylesheets/custom.xslt
```

#### Parametrar
- Första argumentet: Sökväg till XML-filen från Steg 1
- Andra argumentet (valfritt): Namn på utdatafil
- `--stylesheet` (valfritt): Sökväg till anpassad XSLT-stilmall

#### Vad händer?
Transformationsskriptet använder XSLT-stilmallen för att:

1. **Extrahera byggnadselement** från XML-filen
2. **Mappa BIP-egenskaper** till Peppol-format:
   - `type name id` → ManufacturersItemIdentification
   - `Manufacturer` → BrandName och ManufacturerParty
   - `TypeDescription` → Description
   - `BSAB 96` → Keyword
   - `thickness`, `height`, `length` → AdditionalItemProperty med enheter
   - `is load bearing`, `is external` → Översatta booleska värden (Ja/Nej)
   - `net area`, `net volume`, `weight` → Med UBL-kompatibla enhetskoder

3. **Generera Peppol-struktur**:
   - Varje byggnadselement blir en `CatalogueLine`
   - GlobalID används som rad-ID för full spårbarhet
   - Automatisk nyckelordsgenerering från BSAB-koder och klassificeringar
   - Tillverkarinformation inkluderas endast om BIP.Manufacturer finns

4. **Formatera enheter** enligt UBL-standard:
   - `MMT` - Millimeter
   - `MTK` - Kvadratmeter
   - `MTQ` - Kubikmeter
   - `KGM` - Kilogram

#### Utdata
En Peppol BIS Katalog XML-fil med struktur:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Catalogue>
  <cac:CatalogueLine>
    <cbc:ID>3pLKJPvHT21uNqX1l9FcUN</cbc:ID>  <!-- GlobalID -->
    <cac:Item>
      <cbc:Name>Basic Wall:YV01 350:1192287</cbc:Name>
      <cbc:Description>Yttre bärande yttervägg, 350 mm. Materials: ...</cbc:Description>
      <cbc:BrandName>YV01</cbc:BrandName>
      <cbc:Keyword>42.A</cbc:Keyword>
      <cac:ManufacturersItemIdentification>
        <cbc:ID>YV01</cbc:ID>
      </cac:ManufacturersItemIdentification>
      <cac:AdditionalItemProperty>
        <cbc:Name>thickness</cbc:Name>
        <cbc:Value>350 mm</cbc:Value>
        <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>
      </cac:AdditionalItemProperty>
      <!-- Fler egenskaper... -->
    </cac:Item>
  </cac:CatalogueLine>
</Catalogue>
```

---

## 📊 Exempel på Komplett Workflow

### Förutsättningar
1. **Python 3.7+** installerat
2. **lxml** bibliotek: `pip install lxml`
3. **IfcConvert** tillgängligt i `IfcConvert/` katalogen
4. **IFC-modell** som följer BIM2BOM.ids krav

### Komplett Körning

```bash
# Steg 1: Konvertera IFC till XML
cd IfcConvert
IfcConvert.exe --threads 7 ../models/A-40-V-000_BIM2BOM.ifc output/A-40-V-000_BIM2BOM.xml

# Steg 2: Transformera XML till Peppol
cd ../peppol-transformer
python scripts/transform_ifc_to_peppol.py ../IfcConvert/output/A-40-V-000_BIM2BOM.xml

# Resultat: output/A-40-V-000_BIM2BOM_peppol_catalogue.xml
```

### Förväntade Resultat
- **Indata:** 1 IFC-fil med t.ex. 74 väggelement
- **Mellan-steg:** 1 XML-fil (~flera MB)
- **Utdata:** 1 Peppol-katalog (~800 KB) med 74 katalograder
- **Bearbetningstid:** 
  - Steg 1: ~1-5 minuter (beroende på modellstorlek)
  - Steg 2: ~2 sekunder

---

## ✅ Validering och Kvalitetssäkring

### 1. Före Transformation (IFC-validering)

**Verktyg:** BEAst-ifctester
```bash
# Validera IFC mot BIM2BOM.ids krav
# Detta säkerställer att modellen innehåller rätt egenskaper
```

**Kontrollera:**
- ✓ BIP-egenskaper finns på elementen
- ✓ BSAB-klassificering är korrekt
- ✓ Tillverkarinformation (om relevant)
- ✓ Material och komponenter dokumenterade

### 2. Efter Steg 1 (XML-validering)

**Validera XML-struktur:**
```bash
python -c "from lxml import etree; doc = etree.parse('IfcConvert/output/file.xml'); print('Giltig XML')"
```

**Kontrollera:**
- ✓ Välformad XML
- ✓ Alla förväntade element finns
- ✓ Inga parsningsfel

### 3. Efter Steg 2 (Peppol-validering)

**XML-strukturvalidering:**
```bash
python -c "from lxml import etree; doc = etree.parse('peppol-transformer/output/catalogue.xml'); print('Giltig XML')"
```

**Räkna katalograder:**
```bash
python -c "from lxml import etree; doc = etree.parse('output/catalogue.xml'); print(f'Rader: {len(doc.xpath(\"//cac:CatalogueLine\", namespaces={\"cac\": \"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\"}))}')"
```

**Peppol BIS-validering:**
- Ladda upp katalogen till **BEAst Supply Validator**: https://bis.beast.se/
- Kontrollera att inga valideringsfel visas
- Verifiera att alla obligatoriska element finns

---

## 🔧 Anpassning och Konfiguration

### Anpassa XSLT-Stilmallen

För att skapa en anpassad transformation:

1. **Kopiera standardstilmallen:**
```bash
cd peppol-transformer/stylesheets
cp default-stylesheet-bip_to_peppol.xslt custom-stylesheet.xslt
```

2. **Modifiera stilmallen** för att:
   - Inkludera fler/färre egenskaper
   - Ändra mappning av BIP-egenskaper
   - Lägga till branschspecifika klassificeringar
   - Översätta till andra språk
   - Stödja ytterligare IFC-entiteter (IfcSlab, IfcBeam, etc.)

3. **Använd den anpassade stilmallen:**
```bash
python scripts/transform_ifc_to_peppol.py input.xml output.xml --stylesheet stylesheets/custom-stylesheet.xslt
```

### Användningsområden för Anpassade Stilmallar

- **Förenklad Katalog** - Endast väsentliga egenskaper för snabb upphandling
- **Utökad Katalog** - All IFC-information för detaljerad dokumentation
- **Branschspecifik** - Anpassad för VVS, El, etc.
- **Lokaliserad** - Översatta egenskapsnamn och värden
- **Multi-Entitet** - Stöd för alla IFC-elementtyper

---

## 📁 Katalogstruktur för Arbetsflödet

```
BIM2BOM/
├── models/                                    # Källfiler
│   └── A-40-V-000_BIM2BOM.ifc                 # Input: IFC-modell
│
├── IfcConvert/                                # Steg 1: IFC → XML
│   ├── IfcConvert.exe                         # Konverteringsverktyg
│   ├── output/
│   │   └── A-40-V-000_BIM2BOM.xml             # Output: XML från IFC
│   └── README.md
│
├── peppol-transformer/                        # Steg 2: XML → Peppol
│   ├── scripts/
│   │   └── transform_ifc_to_peppol.py         # Transformationsskript
│   ├── stylesheets/
│   │   └── default-stylesheet-bip_to_peppol.xslt  # XSLT-mall
│   ├── output/
│   │   └── A-40-V-000_BIM2BOM_peppol_catalogue.xml  # Output: Peppol-katalog
│   └── README.md
│
├── BIM2BOM.ids                                # IFC Data Specification
├── README.md                                  # Projektöversikt
└── WORKFLOW.md                                # Detta dokument
```

---

## 🎓 BIP-Egenskapsmappning

Följande BIP (BIM In Production)-egenskaper mappas automatiskt:

| BIP-egenskap | Peppol-element | Enhet | Beskrivning |
|--------------|----------------|-------|-------------|
| `type name id` | ManufacturersItemIdentification | - | Typbeteckning |
| `Manufacturer` | BrandName, ManufacturerParty | - | Tillverkare |
| `TypeDescription` | Description | - | Beskrivning |
| `BSAB 96` | Keyword | - | Klassificering |
| `materials/components` | Description (tillägg) | - | Material |
| `thickness` | AdditionalItemProperty | MMT | Tjocklek |
| `is load bearing` | AdditionalItemProperty | - | Bärande (Ja/Nej) |
| `is external` | AdditionalItemProperty | - | Yttervägg (Ja/Nej) |
| `height` | AdditionalItemProperty | MMT | Höjd |
| `length` | AdditionalItemProperty | MMT | Längd |
| `net area` | AdditionalItemProperty | MTK | Nettoarea |
| `net volume` | AdditionalItemProperty | MTQ | Nettovolym |
| `weight` | AdditionalItemProperty | KGM | Vikt |
| `floor` | AdditionalItemProperty | - | Våning |
| `renovation component status` | AdditionalItemProperty | - | Status (Ny/Befintlig) |

---

## 🚨 Felsökning

### Problem vid Steg 1 (IfcConvert)

**Problem:** "Cannot read IFC file"
- **Lösning:** Kontrollera att filen är giltig IFC (IFC2x3 eller IFC4)
- **Kontroll:** Öppna filen i en IFC-viewer

**Problem:** Långsam konvertering
- **Lösning:** Öka antalet trådar: `--threads 8` eller högre
- **Not:** Beror på modellens komplexitet

### Problem vid Steg 2 (Peppol Transformer)

**Problem:** "XSLT stylesheet not found"
- **Lösning:** Kontrollera att `stylesheets/default-stylesheet-bip_to_peppol.xslt` finns
- **Alternativ:** Ange fullständig sökväg till stilmallen

**Problem:** "lxml library not found"
- **Lösning:** Installera lxml: `pip install lxml`

**Problem:** Tom utdatakatalog (0 rader)
- **Lösning:** Kontrollera att XML-filen innehåller IfcWall-element
- **Not:** Stilmallen kan behöva anpassas för andra elementtyper

**Problem:** Saknade BIP-egenskaper
- **Lösning:** Validera IFC-modellen mot BIM2BOM.ids före konvertering
- **Verktyg:** Använd BEAst-ifctester

---

## 📈 Prestanda och Skalbarhet

### Typiska Bearbetningstider

| Modellstorlek | IFC-element | Steg 1 (IFC→XML) | Steg 2 (XML→Peppol) | Total tid |
|---------------|-------------|------------------|----------------------|-----------|
| Liten | 50-100 | ~30 sek | ~2 sek | ~32 sek |
| Medium | 100-500 | ~2 min | ~5 sek | ~2 min |
| Stor | 500-2000 | ~5 min | ~15 sek | ~5 min |
| Mycket stor | 2000+ | ~10+ min | ~30+ sek | ~10+ min |

### Minnesanvändning

- **IfcConvert:** ~200-500 MB beroende på modellstorlek
- **Peppol Transformer:** ~50-100 MB

### Optimeringstips

1. **Använd flera trådar:** `--threads` baserat på CPU-kärnor
2. **Filtrera element:** Anpassa XSLT för endast relevanta element
3. **Batch-bearbetning:** Kör flera modeller parallellt
4. **SSD-lagring:** Snabbare I/O-operationer

---

## 🎯 Användningsområden

### För Byggherrar
- Kvalitetssäkring av BIM-modeller
- Automatisk materiallistor för upphandling
- Spårbarhet från design till produktion

### För Entreprenörer
- Sömlös övergång från projektfiler till inköpssystem
- Minskad risk för felbeställningar
- Bättre kostnadsuppföljning

### För Projektörer
- Tydliga krav på modellinformation
- Validering mot BIM2BOM.ids
- Direkt feedback på modellkvalitet

### För Leverantörer
- Standardiserad produktinformation
- Integration med e-upphandlingssystem
- Bättre synlighet i byggprocessen

---

## 🔗 Relaterade Resurser

- **BEAst Supply Validator:** https://bis.beast.se/
- **Peppol BIS Catalogue:** https://peppol.eu/
- **BIP (BIM In Production):** https://www.bimalliance.se/
- **IfcOpenShell:** https://ifcopenshell.org/
- **SS-EN ISO 19650:** BIM-standarder

---

## 📝 Nästa Steg

Efter att du har genererat en Peppol-katalog:

1. **Validera** katalogen på https://bis.beast.se/
2. **Granska** innehållet och verifiera mappningar
3. **Integrera** med ert upphandlingssystem
4. **Iterera** och förbättra modellkvaliteten
5. **Dokumentera** projektspecifika anpassningar

---

**Senast Uppdaterad:** 2025-10-29  
**Version:** 1.0  
**Status:** Produktionsklar ✓

