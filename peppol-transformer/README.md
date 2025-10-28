# Peppol Transformer

Ett verktyg för att transformera IFC XML-filer till Peppol BIS Catalogue-format med BIP (BIM In Production) egenskapsmappning enligt svenska byggstandarder.

## Snabbstart

```bash
# Installera beroenden
pip install lxml requests openpyxl

# Transformera IFC till Peppol
python scripts/transform_ifc_to_peppol.py input.ifc.xml output_catalogue.xml

# Verifiera resultatet
python scripts/verify_catalogue.py output_catalogue.xml

# Validera mot Peppol-standarder
python scripts/validate_peppol_catalogue.py output_catalogue.xml
```

## Vad det gör

Transformerar IFC XML-filer (exporterade från BIM-verktyg som Revit) till giltig Peppol BIS Catalogue XML med:

- **Projektmetadata** → Catalogue header
- **IfcWall element** → Catalogue lines med BIP properties
- **BIP property sets** → Peppol AdditionalItemProperty med SE:BIP identifiers
- **Enhetskoder** → UN/CEFACT standardkoder (MMT, MTK, MTQ, KGM)
- **Värdeformatering** → Läsbara enheter (mm, m², m³, kg)

## Filer

### Kärnfiler
- `Stylesheet-ifc_to_peppol_catalogue.xslt` - XSLT 2.0 transformation stylesheet
- `transform_ifc_to_peppol.bat` - Windows batch-fil för enkel körning

### Scripts
- `scripts/transform_ifc_to_peppol.py` - Huvudtransformeringsscript
- `scripts/verify_catalogue.py` - Verifiera och visa statistik
- `scripts/validate_peppol_catalogue.py` - Validera mot Peppol-standarder
- `scripts/requirements.txt` - Python-beroenden

### Dokumentation & Exempel
- `docs/` - Egenskapsmappningsguider och exempel
- `output/` - Exempel på utdatafiler

## Användningsexempel

### Grundläggande transformation
```bash
python scripts/transform_ifc_to_peppol.py ../A-40-V-000_BIM2BOM.ifc.xml
```

### Med anpassad utdata
```bash
python scripts/transform_ifc_to_peppol.py input.ifc.xml my_catalogue.xml
```

### Batchbearbetning
```bash
for file in *.ifc.xml; do
    python scripts/transform_ifc_to_peppol.py "$file" "${file%.ifc.xml}_catalogue.xml"
done
```

## Utdata-struktur

Varje IFC wall blir en Peppol catalogue line:

```xml
<cac:CatalogueLine>
    <cbc:ID>1</cbc:ID>
    <cac:Item>
        <cbc:Name>Basic Wall:YV01 350:1295992</cbc:Name>
        <cbc:Description>Yttre bärande yttervägg, 350 mm...</cbc:Description>
        
        <cac:AdditionalItemProperty>
            <cbc:Name>thickness</cbc:Name>
            <cbc:NameCode listID="SE:BIP">thickness</cbc:NameCode>
            <cbc:Value>350 mm</cbc:Value>
            <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>
        </cac:AdditionalItemProperty>
        
        <!-- Fler BIP properties... -->
    </cac:Item>
</cac:CatalogueLine>
```

## Standarder som följs

- ✅ **Peppol BIS 3.0** - Catalogue transaction
- ✅ **UBL 2.1** - Universal Business Language  
- ✅ **BEAst Supply 4.0.5** - Swedish construction extension
- ✅ **BIP 1.8+** - BIM In Production property standard
- ✅ **UN/CEFACT Rec. 20** - Unit codes

## Krav

- Python 3.6+
- lxml (XSLT 2.0 processor)
- requests (för validering)
- openpyxl (för Excel-generering)

## Validering

Efter transformation, validera din katalog:

1. **Lokal verifiering**: `python scripts/verify_catalogue.py output.xml`
2. **Peppol-validering**: `python scripts/validate_peppol_catalogue.py output.xml`
3. **BEAst Supply**: Ladda upp till https://bis.beast.se/

## Anpassning

### Uppdatera partinformation
Redigera XSLT-filen för att ändra standardorganisationsdetaljer:
- ProviderParty organisationsnummer
- ReceiverParty information

### Lägg till fler elementtyper
Stöder för närvarande IfcWall. För att lägga till IfcDoor, IfcWindow, etc.:
1. Redigera `Stylesheet-ifc_to_peppol_catalogue.xslt`
2. Lägg till templates för nya elementtyper
3. Följ samma BIP property mapping-mönster

### Anpassade egenskapsmappningar
För att mappa egenskaper från andra property sets:
1. Hitta BIP properties template
2. Lägg till ytterligare property set-bearbetning
3. Skapa nya templates för anpassade egenskaper

## Felsökning

### "Inga catalogue lines skapade"
- Kontrollera att din IFC XML innehåller `<IfcWall>` element
- Kontrollera att väggar har BIP property sets kopplade

### "XSLT stylesheet hittades inte"
- Kontrollera att `Stylesheet-ifc_to_peppol_catalogue.xslt` finns i rotkatalogen

### "lxml hittades inte"
```bash
pip install lxml
```

## Referenser

- [Peppol BIS Catalogue](https://docs.peppol.eu/poacc/upgrade-3/profiles/3-catalogue-only/)
- [BEAst Supply](https://bis.beast.se/)
- [BIP Standard](http://www.bipkoder.se/)
- [UN/CEFACT Unit Codes](https://unece.org/trade/uncefact/cl-recommendations)

---

**Version**: 1.0  
**Senast uppdaterad**: 2025-10-28  
**Status**: ✅ Redo för produktionsanvändning
