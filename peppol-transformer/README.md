# IFC till Peppol Katalog Transformation

Transformera IFC (Industry Foundation Classes) XML-filer till Peppol BIS Katalogformat med BIP (BIM In Production) egenskapsmappning.

## 🎯 Översikt

Detta verktyg konverterar BIM-modelldata från IFC-format till standardiserade Peppol e-upphandlingskataloger, vilket möjliggör sömlös integration mellan BIM-arbetsflöden inom byggsektorn och upphandlingssystem.

**Version:** 2.1  
**Datum:** 2025-10-29  
**Status:** Produktionsklar ✓

## ✨ Funktioner

- **MMI-filtrering** - Endast modellelement med MMI ≥ 375 inkluderas för att säkerställa datakvalitet
- **Flera Stilmallar** - Använd olika transformationsmallar för olika scenarion
- **GlobalID-spårning** - Bibehåller IFC-instansers GlobalID för full spårbarhet
- **BIP Egenskapsmappning** - Komplett mappning av BIP-egenskaper till Peppol-format
- **Automatiska Nyckelord** - Intelligent nyckelordsgenerering från BSAB-koder och klassificeringar
- **Tillverkarinformation** - Endast inkluderad om BIP.Manufacturer finns
- **Varumärke** - Använder BIP.Manufacturer om tillgänglig, annars TypeID
- **Enhetskonvertering** - Automatisk enhetsformatering med UBL-kompatibla koder
- **Översättning av Booleska Värden** - Läsbara Ja/Nej-värden
- **Väldokumenterad** - Omfattande inline-dokumentation och exempel

## 📋 Krav

```bash
pip install lxml
```

**Python-version:** 3.7+  
**Beroenden:** lxml (för XSLT 1.0-bearbetning)

## 🚀 Snabbstart

### Grundläggande Användning (Standard Stilmall)

```bash
cd peppol-transformer
python scripts/transform_ifc_to_peppol.py ../IfcConvert/output/A-40-V-000_BIM2BOM.xml
```

Detta kommer att:

1. Använda standardstilmallen från `stylesheets/default-stylesheet-bip_to_peppol.xslt`
2. Generera utdatafil: `A-40-V-000_BIM2BOM_peppol_catalogue.xml`
3. Skapa 74 katalograder från IFC-indata

### Anpassad Utdatafil

```bash
python scripts/transform_ifc_to_peppol.py input.xml output/min_katalog.xml
```

### Anpassad Stilmall

```bash
python scripts/transform_ifc_to_peppol.py input.xml output.xml --stylesheet stylesheets/custom.xslt
```

## 📁 Katalogstruktur

```
peppol-transformer/
├── scripts/
│   └── transform_ifc_to_peppol.py     # Huvudtransformationsskript
├── stylesheets/
│   └── default-stylesheet-bip_to_peppol.xslt  # Standard XSLT-mall
├── output/
│   ├── A-40-V-000_BIM2BOM_peppol_catalogue.xml  # Genererad katalog
│   └── test_new_template.xml          # Testutdata
├── docs/                              # Dokumentation
└── README.md                          # Denna fil
```

## 📝 Utdatastruktur

Transformationen skapar Peppol BIS Katalogformat med följande struktur för varje byggnadselement:

```xml
<cac:CatalogueLine>
  <cbc:ID>3pLKJPvHT21uNqX1l9FcUN</cbc:ID>  <!-- IFC GlobalID -->
  
  <cac:Item>
    <cbc:Description>Yttre bärande yttervägg, 350 mm. Materials: ...</cbc:Description>
    <cbc:Name>Basic Wall:YV01 350:1192287</cbc:Name>
    <cbc:BrandName>YV01</cbc:BrandName>  <!-- Från BIP.Manufacturer om finns, annars TypeID -->
    <cbc:Keyword>42.A</cbc:Keyword>
    <cbc:Keyword>Basic Wall:YV01 350</cbc:Keyword>
    <cbc:Keyword>external wall</cbc:Keyword>
    
    <cac:ManufacturersItemIdentification>
      <cbc:ID>YV01</cbc:ID>
    </cac:ManufacturersItemIdentification>
    
    <!-- ManufacturerParty inkluderas ENDAST om BIP.Manufacturer finns -->
    <cac:ManufacturerParty>
      <cac:PartyName>
        <cbc:Name>Tillverkarens Namn</cbc:Name>
      </cac:PartyName>
    </cac:ManufacturerParty>
    
    <!-- Alla BIP-egenskaper som AdditionalItemProperty -->
    <cac:AdditionalItemProperty>
      <cbc:Name>thickness</cbc:Name>
      <cbc:NameCode listID="SE:BIP-koder">thickness</cbc:NameCode>
      <cbc:Value>350 mm</cbc:Value>
      <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>
    </cac:AdditionalItemProperty>
    <!-- ... fler egenskaper ... -->
  </cac:Item>
</cac:CatalogueLine>
```

## 🎯 MMI-filtrering (Model Maturity Index)

Transformationen inkluderar automatisk kvalitetskontroll genom MMI-filtrering:

- **Tröskelvärde:** MMI ≥ 375 (Detaljerade lösningar som grund för anbud/order/prefabricering)
- **Implementering:** XSLT-stilmallen kontrollerar BIP.MMI-egenskapen för varje IFC-element
- **Resultat:** Endast element med tillräcklig informationsmognad inkluderas i Peppol-katalogen

### MMI-nivåer (enligt svensk standard)


| MMI     | Nivå                      | Beskrivning                                            |
| ------- | ------------------------- | ------------------------------------------------------ |
| 100-200 | Koncept                   | Grundläggande information och etablerat koncept        |
| 225-300 | Principiell lösning       | Interdisciplinärt kontrollerade principiella lösningar |
| 325-375 | **Detaljerade lösningar** | **Grund för anbud/order (tröskelvärde)**               |
| 400-475 | Arbetsunderlag            | Utfört och kontrollerat arbetsunderlag                 |
| 500     | As-built                  | Slutlig dokumentation                                  |


Element under MMI 375 anses inte ha tillräcklig detaljeringsgrad för upphandling och materiallistor.

## 🔍 BIP Egenskapsmappning

Alla BIP (BIM In Production)-egenskaper mappas till `cac:AdditionalItemProperty`-element:


| BIP-egenskap                | Exempelvärde                    | Enhetskod | Anteckningar                                                        |
| --------------------------- | ------------------------------- | --------- | ------------------------------------------------------------------- |
| MMI                         | 375                             | -         | **Model Maturity Index - filter ≥375**                              |
| type name id                | YV01                            | -         | Används för ManufacturersItemIdentification, fallback för BrandName |
| Manufacturer                | Tillverkare AB                  | -         | Används för BrandName och ManufacturerParty (om finns)              |
| TypeDescription             | Yttre bärande yttervägg, 350 mm | -         | Används i Description                                               |
| BSAB 96                     | 42.A                            | -         | Används som Keyword                                                 |
| materials/components        | Tegel fasad 110 / ...           | -         | Läggs till i Description                                            |
| thickness                   | 350                             | MMT       | Millimeter                                                          |
| is load bearing             | true → Ja                       | -         | Boolesk översatt                                                    |
| is external                 | true → Ja                       | -         | Boolesk översatt                                                    |
| height                      | 5628.49                         | MMT       | Millimeter                                                          |
| length                      | 16060                           | MMT       | Millimeter                                                          |
| net area                    | 79.81                           | MTK       | Kvadratmeter                                                        |
| net volume                  | 27.93                           | MTQ       | Kubikmeter                                                          |
| weight                      | 54467.20                        | KGM       | Kilogram                                                            |
| floor                       | 010                             | -         | Våningsbeteckning                                                   |
| renovation component status | Ny                              | -         | Ny/Befintlig                                                        |


## 🎨 Skapa Anpassade Stilmallar

För att skapa en anpassad stilmall:

1. Kopiera standardstilmallen:

```bash
cp stylesheets/default-stylesheet-bip_to_peppol.xslt stylesheets/min-anpassade.xslt
```

1. Modifiera XSLT efter dina behov
2. Använd den med transformationen:

```bash
python scripts/transform_ifc_to_peppol.py input.xml output.xml --stylesheet stylesheets/min-anpassade.xslt
```

### Användningsområden för Anpassade Stilmallar

- **Förenklad Katalog** - Inkludera endast väsentliga egenskaper
- **Utökad Katalog** - Inkludera alla IFC-egenskaper
- **Branschspecifik** - Lägg till branschspecifika klassificeringar
- **Lokaliserad** - Översätt egenskapsnamn och värden
- **Multi-Entitet** - Stöd för IfcSlab, IfcBeam, IfcColumn, etc.

## 📊 Validering

### XML-strukturvalidering

Verktyget validerar:

- ✓ Välformad XML
- ✓ Korrekta namespace-deklarationer
- ✓ Nödvändiga element finns
- ✓ Elementordning följs

### Innehållsvalidering

Kör valideringskontroll:

```bash
python -c "from lxml import etree; doc = etree.parse('output/catalogue.xml'); print('Giltig XML')"
```

### Peppol BIS-validering

Ladda upp genererad katalog till BEAst Supply validator:
**[https://bis.beast.se/](https://bis.beast.se/)**

## 📈 Prestanda

**Testresultat:**

- Indata: 74 IfcWall-instanser
- Bearbetningstid: ~2 sekunder
- Utdatastorlek: ~800 KB
- Minnesanvändning: ~50 MB

## 🔧 Felsökning

### Vanliga Problem

**1. Stilmall Hittades Inte**

```
ERROR: XSLT stylesheet not found
```

**Lösning:** Kontrollera stilmallens sökväg. Standardplats är `stylesheets/default-stylesheet-bip_to_peppol.xslt`

**2. lxml Inte Installerad**

```
ERROR: lxml library not found
```

**Lösning:** Installera lxml: `pip install lxml`

**3. Ogiltig IFC XML**

```
ERROR: Invalid XML syntax in input file
```

**Lösning:** Se till att IFC-filen exporteras som XML-format (inte binär .ifc)

## 📚 Dokumentation

- **docs/BIP_Peppol_Property_Mapping.md** - Referens för egenskapsmappning
- **docs/PROPERTY_EXAMPLES_PREVIEW.md** - Egenskapsexempel

## 🧪 Testning

### Testfiler

- **Indata:** `../IfcConvert/output/A-40-V-000_BIM2BOM.xml`
- **Utdata:** `output/test_new_template.xml`

### Kör Tester

```bash
# Testa med standardstilmall
python scripts/transform_ifc_to_peppol.py ../IfcConvert/output/A-40-V-000_BIM2BOM.xml output/test.xml

# Validera utdata
python -c "from lxml import etree; doc = etree.parse('output/test.xml'); print(f'Rader: {len(doc.xpath(\"//cac:CatalogueLine\", namespaces={\"cac\": \"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\"}))}')"
```

## 🔄 Versionshistorik

### Version 2.1 (2025-10-29)

- ✨ MMI-filtrering implementerad (≥375) för kvalitetskontroll
- ✨ XSLT-stilmall kontrollerar BIP.MMI-egenskap automatiskt
- 📝 Dokumentation uppdaterad med MMI-information
- 🔧 Bugfix: XSLT variabelevaluering förbättrad för XSLT 1.0-kompatibilitet

### Version 1.2 (2025-10-29)

- ✨ ManufacturerParty inkluderas endast om BIP.Manufacturer finns
- ✨ BrandName använder BIP.Manufacturer om tillgänglig, annars TypeID
- 📝 Uppdaterad dokumentation till svenska

### Version 1.1 (2025-10-29)

- ✨ Stöd för flera stilmallar
- ✨ Omdesignad katalogradstruktur
- ✨ GlobalID som katalogradID
- ✨ Automatisk nyckelordsgenerering
- ✨ ManufacturerParty-implementering
- 🗑️ Borttagna föråldrade element

### Version 1.0 (2025-10-28)

- Initial release
- Grundläggande IFC till Peppol-transformation
- BIP egenskapsmappning

## 🤝 Bidra

När du skapar anpassade stilmallar eller modifieringar:

1. **Testa Noggrant** - Validera utdata med flera IFC-filer
2. **Dokumentera Ändringar** - Håll dokumentationen uppdaterad
3. **Följ Struktur** - Bibehåll Peppol BIS-efterlevnad
4. **Validera** - Testa med BEAst Supply validator

## 🔗 Länkar

- **BEAst Supply Validator:** [https://bis.beast.se/](https://bis.beast.se/)
- **Peppol BIS Catalogue:** [https://peppol.eu/](https://peppol.eu/)
- **BIP (BIM In Production):** [https://www.bimalliance.se/](https://www.bimalliance.se/)

---

**Senast Uppdaterad:** 2025-10-29  
**Status:** Produktionsklar ✓