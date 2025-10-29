# BIM2BOM Modeller

Denna mapp innehåller BIM-modeller som används för testning och utveckling av BIM2BOM-systemet (Building Information Model to Bill of Materials).

## Modellfiler

### A-40-V-000_BIM2BOM.rvt
- **Typ**: Autodesk Revit modellfil
- **Storlek**: 28MB
- **Beskrivning**: Källmodell i Revit som innehåller byggelement med förbättrade egenskaper för BIM2BOM-testning

### A-40-V-000_BIM2BOM.ifc
- **Typ**: IFC (Industry Foundation Classes) modellfil
- **Storlek**: 637KB (6,020 rader)
- **Beskrivning**: Exporterad IFC-modell från Revit, innehållande standardiserad byggnadsinformation för interoperabilitetstestning

## Modellutveckling

Modellerna har vidareutvecklats med ytterligare egenskaper från en shared parameter-lista från Autodesk, som ingår i projektets resurser.

### Nya egenskaper som lagts till

Följande egenskaper har lagts till för att förbättra modellen för BIM2BOM-testning:

- **BIP.MMI** - Model Maturity Index (tresiffrigt värde, t.ex. 375) för kvalitetskontroll
- **Pset_WallCommon.IsExternal** - Boolesk egenskap som indikerar om en vägg är extern
- **Pset_WallCommon.LoadBearing** - Boolesk egenskap som indikerar om en vägg är bärande
- **Qto_WallBaseQuantities.GrossWeight** - Vikt egenskap som innehåller bruttovikten för väggelement

Dessa egenskaper är definierade i PropertySet-definitionsfilen och mappade till lämpliga Revit-parametrar för korrekt IFC-export.

**Viktigt:** MMI-egenskapen är obligatorisk för BIM2BOM-arbetsflödet. Endast element med MMI ≥ 375 inkluderas i materiallistor och Peppol-kataloger för att säkerställa tillräcklig detaljeringsgrad för upphandling.

## Resurser

Mappen `resources/` innehåller stödfiler för modellutveckling och egenskapsmappning:

### PropertySet-definition
- **PSET-EXPORT REVIT.txt** - Användardefinierad PropertySet-definitionsfil för IFC-exportkonfiguration
- Definierar BIP (Building Information Properties) PropertySet med mappningar till Revit-parametrar
- Inkluderar de nya egenskaperna ovan med korrekta datatyper och parametermappningar

### Shared Parameters
- **IFC Shared Parameters.txt** - Revit shared parameter-fil som innehåller IFC-kompatibla parametrar
- **IFC Shared Parameters-RevitIFCBuiltIn_ALL.txt** - Omfattande lista över alla inbyggda IFC-parametrar i Revit

## Upphovsrätt

### Ursprunglig modellkälla
Basmodellen härstammar från de svenska BIM-riktlinjerna och standarder som utvecklats som del av **Tillämpningsanvisningar för BIM**-projektet.

**Källa**: [Smart Built Environment - Tillämpningsanvisningar för BIM](https://www.smartbuilt.se/projekt/informationsinfrastruktur/tillampningsanvisningar-bim/tillampningsanvisningar-for-bim-samt-bilagor/)

### Egenskapsförbättringar i ursprunglig modell
De ytterligare egenskaperna (IsExternal, LoadBearing, GrossWeight) baseras på:
- **Autodesk IFC Shared Parameters** - Standard IFC-egenskapsdefinitioner
- **Pset_WallCommon** - IFC standard property set för vägggemensamma egenskaper
- **Qto_WallBaseQuantities** - IFC standard quantity set för väggbaserade kvantiteter

## Användning

Dessa modeller är avsedda för:
- Testning av BIM2BOM-transformationsprocesser
- Validering av IFC-egenskapsextraktion och mappning
- Utveckling och testning av PEPPOL-transformationsarbetsflöden
- Demonstration av svensk BIM-standardimplementation

## Filformat

- **.rvt**: Native Autodesk Revit-format (kräver Revit-programvara)
- **.ifc**: Industry Foundation Classes-format (öppen standard, visningsbar i de flesta BIM-programvaror)
- **.txt**: Textbaserade konfigurations- och parameterdefinitionsfiler

## Relaterad dokumentation

För mer information om BIM2BOM-projektet och relaterade verktyg, se:
- Huvudprojektets README
- BEAst-BIP-type-tester dokumentation
- PEPPOL transformer dokumentation
- IFC-valideringsverktyg dokumentation
