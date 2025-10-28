# BEAst-BIP-Type-Tester

En omfattande valideringsramverk för BIP (BIM In Production) typnamn-ID-konsistens och unikhet i IFC-filer. Detta fristående Gherkin-baserade ramverk validerar att element med samma "typnamn-ID" har identiska BIP-egenskaper och att varje unik egenskapkombination mappar till exakt ett typnamn-ID.

## 🎯 Översikt

Detta ramverk tillhandahåller tre valideringsmetoder:
- **Gherkin-ramverk** - Strukturerad, utbyggbar validering med Behave
- **Fristående XML-validerare** - Snabb validering för IFC XML-filer
- **Fristående STEP-validerare** - Snabb validering för IFC STEP-filer

Alla metoder använder centraliserad CSV-konfiguration för maximal flexibilitet.

## 🚀 Snabbstart

### Installation

```bash
cd ".\BIM2BOM\BEAst-BIP-type-tester"
pip install -r requirements.txt
```

### Kör validering

#### Gherkin-ramverk (Rekommenderat)
```bash
# Kör alla valideringsregler
python run_validation.py "..\A-40-V-000_BIM2BOM.ifc"

# Kör specifik regel
python run_validation.py "..\A-40-V-000_BIM2BOM.ifc" BIP001
```

#### Fristående validerare
```bash
# XML-format (rekommenderat - innehåller BIP-egenskaper)
python validate_bip_type_name_id_xml.py "..\A-40-V-000_BIM2BOM.ifc.xml"

# STEP-format (om BIP-egenskaper finns)
python validate_bip_type_name_id.py "..\A-40-V-000_BIM2BOM.ifc"
```

## 📁 Projektstruktur

```
BEAst-BIP-type-tester/
├── features/                          # Behave-ramverk
│   ├── rules/                         # Gherkin-funktionsdefinitioner
│   │   └── BIP001_Type-name-id-uniqueness.feature
│   ├── steps/                         # Steg-implementationer
│   │   ├── __init__.py               # Resultatklasser
│   │   ├── common_steps.py           # Återanvändbara Given-steg
│   │   └── bip_steps.py              # BIP-specifika Then-steg
│   ├── resources/                     # Konfigurationsfiler
│   │   └── bip_type_name_id_properties.csv
│   └── environment.py                 # Behave-hooks & setup
├── behave.ini                         # Behave-konfiguration
├── requirements.txt                   # Python-beroenden
├── run_validation.py                  # Enkel körningsskript
├── validate_bip_type_name_id_xml.py  # Fristående XML-validerare
├── validate_bip_type_name_id.py      # Fristående STEP-validerare
├── README.md                          # Denna fil
└── CREDITS.md                         # Krediter och erkännanden
```

## ⚙️ Konfiguration

### CSV-baserad egenskapskonfiguration

Alla valideringsmetoder använder den centraliserade CSV-filen: `features/resources/bip_type_name_id_properties.csv`

```csv
property_name,data_type,required,description
TypeDescription,IfcText,true,Typbeskrivning av elementet
BSAB 96,IfcLabel,true,Svensk klassificeringskod BSAB 96
materials/components,IfcText,true,Materialspecifikationer
thickness,IfcPositiveLengthMeasure,true,Elementtjocklek
is load bearing,IfcBoolean,true,Strukturell beteckning
is external,IfcBoolean,true,Platsbeteckning
height,IfcPositiveLengthMeasure,false,Instans-egenskap (exkluderad)
```

**För att modifiera validering:**
- `required=true` → Egenskap valideras
- `required=false` → Egenskap ignoreras

Ändringar träder i kraft omedelbart - kör bara om valideringen!

## 📋 Valideringsregler

### BIP001 - Typnamn-ID unikhet och konsistens

**Vad den validerar:**
- **Konsistens**: Alla egenskapssatser med samma "typnamn-ID" har identiska BIP-egenskaper
- **Unikhet**: Varje unik egenskapkombination mappar till exakt ett "typnamn-ID"

**Validerade egenskaper:** Definierade i CSV-konfiguration

**Taggar:** `@BIP`, `@version1`

## 🧪 Testresultat

### Verklig överträdelse upptäckt

Ramverket hittade framgångsrikt en verklig modelleringsfråga:

```
Feature: BIP001 - Type Name ID Uniqueness and Consistency
  Loaded 6 validation properties from CSV
  Checking consistency for 506 property sets...
  FAIL: Type name id '011' - inconsistent properties: 
        thickness: 300.0 (expected: 52.0)
```

**Detta bevisar att ramverket fungerar korrekt!** 🎉

### Testfilresultat

**Fil**: `A-40-V-000_BIM2BOM.ifc.xml`
- **Totalt BIP-egenskapssatser**: 121
- **Unika typnamn-ID:n**: 10
- **Konsistensöverträdelser**: 0 (med höjd exkluderad)
- **Unikhetsöverträdelser**: 0

## 📖 Skapa nya regler

### 1. Skapa funktionsfil

Skapa `features/rules/DIN_REGEL.feature`:

```gherkin
@DIN_TAGG
@version1

Feature: DIN001 - Regelnamn
  Beskrivning av vad regeln validerar

  Background:
    Given An IfcElement
    # ... filtreringssteg

  Scenario: Ditt valideringsscenario
    Then Ditt valideringsvillkor
```

### 2. Implementera stegdefinitioner

Lägg till i `features/steps/bip_steps.py`:

```python
from behave import then

@then("Ditt valideringsvillkor")
def step_din_validering(context):
    # Din valideringslogik
    pass
```

### 3. Kör din regel

```bash
python run_validation.py "fil.ifc" DIN001
```

## 🔍 Jämförelse av valideringsmetoder

| Metod | Backend | Bäst för | CSV-konfig |
|-------|---------|----------|------------|
| **Gherkin-ramverk** | Behave + IfcOpenShell | Strukturerade, utbyggbara valideringar | ✅ Ja |
| **Fristående XML** | XML-parser | Snabb BIP-endast validering | ✅ Ja |
| **Fristående STEP** | IfcOpenShell | IFC-filer med egenskaper | ✅ Ja |

## 📊 Utdata

### Konsolutdata
- Realtidsvalideringsframsteg
- Detaljerad överträdelseinformation
- Godkänd/misslyckad status

### Genererade rapporter
- **Textrapport**: `*_BIP_validation_report.txt` - Människoläsbar sammanfattning
- **JSON-rapport**: `*_BIP_validation_report.json` - Maskinläsbart format

## 🎓 Ramverkskomponenter

### Miljöhooks (`features/environment.py`)
- `before_all()` - Setup-logging
- `before_feature()` - Ladda IFC-fil
- `before_scenario()` - Initiera kontextstack
- `after_scenario()` - Rensa upp

### Gemensamma steg (`features/steps/common_steps.py`)
Återanvändbara Given-steg för filtrering:
- `Given An {entity}` - Filtrera efter entitetstyp
- `Given its attribute .{attribute}.` - Navigera till attribut
- `Given [its entity type] ^is^ '{type}'` - Filtrera efter typ
- `Given its .{attribute}. attribute ^is^ '{value}'` - Filtrera efter värde

### BIP-steg (`features/steps/bip_steps.py`)
BIP-specifika valideringssteg:
- Konsistensvalidering (samma ID → samma egenskaper)
- Unikhetsvalidering (samma egenskaper → samma ID)
- CSV-baserad egenskapsladdning

## 💡 Bästa praxis

### CSV-konfiguration
1. **Versionskontroll** CSV-filen
2. **Dokumentera** egenskapsbeslut i beskrivningskolumnen
3. **Testa** efter ändringar
4. **Behåll backup** före stora ändringar

### Köra validering
```bash
# Kör endast BIP-regler
python -m behave --tags=@BIP --define "input=fil.ifc"

# Debug-läge
python -m behave --no-capture -v --define "input=fil.ifc"

# Torrkörning
python -m behave --dry-run --define "input=fil.ifc"
```

## 🔧 Felsökning

### "Found 0 elements with BIP property sets"
- Prova XML-format istället för STEP-format
- Kontrollera att BIP-egenskapssatser ingår i IFC-export
- Verifiera att egenskapssatser finns i ditt BIM-redigeringsverktyg

### "IFC-XML import temporarily disabled"
- Använd XML-specifika skriptet (`validate_bip_type_name_id_xml.py`)
- Detta använder inbyggd XML-tolkning istället för IfcOpenShell

### Unicode/Encoding-fel
- Omdirigera utdata till fil: `python validate_bip_type_name_id_xml.py "fil.ifc.xml" > rapport.txt 2>&1`

## 🎯 Användningsfall

### Kvalitetssäkring
- Säkerställ typnamnskonsistens över projekt
- Verifiera korrekt klassificering av byggelement
- Kontrollera exakta materialspecifikationer

### Före export till Peppol-katalog
- Validera BIP-egenskaper före export till Peppol/BEAst Supply-format
- Säkerställ att produktkatalogposter har unika identifierare
- Verifiera att elementtypsdefinitioner är konsistenta

### Under modellgranskning
- Identifiera modelleringsinkonsistenser
- Verifiera typdefinitioner
- Säkerställ korrekt elementklassificering

## 🚀 Integration

### CI/CD-pipeline
```bash
# Lägg till i ditt arbetsflöde
python run_validation.py "modell.ifc" || exit 1

# Före Peppol-export
python run_validation.py "modell.ifc" && python export_to_peppol.py
```

### Versionskontroll
```bash
git add features/
git commit -m "Lägg till BIM2BOM-valideringsramverk"
```

## 📞 Support

### Dokumentation
- **README.md** - Denna fil (komplett guide)
- **CREDITS.md** - Krediter och erkännanden

### Exempelfiler
- Testfil: `../A-40-V-000_BIM2BOM.ifc`
- CSV-konfiguration: `features/resources/bip_type_name_id_properties.csv`

## ✨ Sammanfattning

Detta ramverk tillhandahåller:
- ✅ **Komplett fristående validering** - Ingen buildingSMART-infrastruktur behövs
- ✅ **Gherkin-baserat** - Branschstandard BDD-approach
- ✅ **CSV-konfigurerat** - Enkelt att anpassa utan kodändringar
- ✅ **Fungerande validering** - Hittade framgångsrikt verkliga överträdelser
- ✅ **Tre metoder** - Välj baserat på dina behov
- ✅ **Utbyggbart** - Redo för fler regler
- ✅ **Produktionsredo** - Använd idag

**Börja validera**: `python run_validation.py "../A-40-V-000_BIM2BOM.ifc"`

---

**Version**: 2.0 (CSV-baserad)  
**Skapad**: 2025-10-28  
**Ramverk**: Behave + IfcOpenShell  
**Status**: Produktionsredo  
**Första överträdelse hittad**: Typ-ID '011' tjockleksinkonsistens