# BIP till Peppol Egenskapsmappning

## Introduktion

Detta dokument ger en omfattande mappning mellan **BIP**-egenskaper och **Peppols `cac:AdditionalItemProperty`**-struktur enligt BEAst Supply-specifikationen. Denna mappning möjliggör standardiserat utbyte av produktegenskaper i byggbranschens leveranskedjetransaktioner.

BIP-egenskapsuppsättningen är en svensk standard för BIM-egenskaper som används inom arkitektur, konstruktion, VVS och andra byggdiscipliner. Peppol BIS (Business Interoperability Specifications) tillhandahåller ett standardiserat format för elektroniska affärsdokument.

### Viktiga Mappningsprinciper

1. **Egenskapsidentifiering**: BIP-egenskapsnamn används i både `cbc:Name` och `cbc:NameCode` med listidentifieraren `SE:BIP-koder`
2. **Värderepresentation**: 
   - Text/Label-värden använder `cbc:Value`
   - Numeriska värden med enheter använder `cbc:ValueQuantity` med lämplig `@unitCode`
3. **Enhetskoder**: Följer UN/CEFACT Recommendation 20-standarder (t.ex. MMT för millimeter)
4. **Kontext**: Använd `cbc:ValueQualifier` för ytterligare klassificering vid behov

## Särskilda Mappningar

### BrandName (Varumärke)
- **Källa**: Primärt från `BIP.Manufacturer` om tillgänglig
- **Fallback**: `BIP.type name id` om Manufacturer saknas
- **XML-element**: `<cbc:BrandName>`

### ManufacturerParty (Tillverkarpart)
- **Villkor**: Inkluderas ENDAST om `BIP.Manufacturer` finns
- **Källa**: `BIP.Manufacturer`
- **XML-struktur**:
```xml
<cac:ManufacturerParty>
  <cac:PartyName>
    <cbc:Name>Tillverkarens Namn</cbc:Name>
  </cac:PartyName>
</cac:ManufacturerParty>
```

## Egenskapsmappningstabell

Följande tabell visar mappningen för vanligt använda egenskaper inom olika discipliner:

| Disciplin | BIP-egenskap | BIP DataType | cbc:Name | cbc:NameCode | cbc:Value Exempel | cbc:ValueQuantity | @unitCode | Anteckningar |
|-----------|--------------|--------------|----------|--------------|-------------------|-------------------|-----------|--------------|
| **Gemensamt** | type name id | Label | type name id | type name id (@listID="SE:BIP-koder") | TD100 | - | - | Produkttypbeteckning, fallback för BrandName |
| **Gemensamt** | Manufacturer | Label | Manufacturer | Manufacturer (@listID="SE:BIP-koder") | Lindab | - | - | Tillverkarnamn, används för BrandName och ManufacturerParty |
| **Gemensamt** | TypeDescription | Label | TypeDescription | TypeDescription (@listID="SE:BIP-koder") | Yttervägg 350mm | - | - | Typbeskrivning |
| **Gemensamt** | BSAB 96 | Label | BSAB 96 | BSAB 96 (@listID="SE:BIP-koder") | 42.A | - | - | BSAB-klassifikation, används som Keyword |
| **Gemensamt** | materials/components | Label | materials/components | materials/components (@listID="SE:BIP-koder") | Tegel fasad 110 / Luft 30 | - | - | Materialsammansättning |
| **Gemensamt** | StatusConstruction | Label | StatusConstruction | StatusConstruction (@listID="SE:BIP-koder") | NYTT | - | - | Byggfasstatus |
| **Arkitekt** | thickness | PositiveLength | thickness | thickness (@listID="SE:BIP-koder") | 350 mm | 350 | MMT | Tjocklek |
| **Arkitekt** | height | PositiveLength | height | height (@listID="SE:BIP-koder") | 2100 mm | 2100 | MMT | Höjd |
| **Arkitekt** | width | PositiveLength | width | width (@listID="SE:BIP-koder") | 900 mm | 900 | MMT | Bredd |
| **Arkitekt** | length | PositiveLength | length | length (@listID="SE:BIP-koder") | 16060 mm | 16060 | MMT | Längd |
| **Arkitekt** | FireRating | Label | FireRating | FireRating (@listID="SE:BIP-koder") | EI60 | - | - | Brandklass |
| **Arkitekt** | AcousticRating | Label | AcousticRating | AcousticRating (@listID="SE:BIP-koder") | 38 | - | - | Ljudreduktion Rw [dB] |
| **Arkitekt** | Colour | Label | Colour | Colour (@listID="SE:BIP-koder") | RAL 9005 | - | - | Färgspecifikation |
| **Konstruktion** | is load bearing | Boolean | is load bearing | is load bearing (@listID="SE:BIP-koder") | Ja | - | - | Bärande (Ja/Nej) |
| **Konstruktion** | is external | Boolean | is external | is external (@listID="SE:BIP-koder") | Ja | - | - | Yttervägg (Ja/Nej), används för Keyword |
| **Konstruktion** | Material | Label | Material | Material (@listID="SE:BIP-koder") | Betong C30/37 | - | - | Materialkod |
| **Konstruktion** | weight | Real | weight | weight (@listID="SE:BIP-koder") | 54467.20 kg | 54467.20 | KGM | Objektvikt |
| **Konstruktion** | net area | Area | net area | net area (@listID="SE:BIP-koder") | 79.81 m² | 79.81 | MTK | Nettoyta |
| **Konstruktion** | net volume | Volume | net volume | net volume (@listID="SE:BIP-koder") | 27.93 m³ | 27.93 | MTQ | Nettovolym |
| **Allmänt** | floor | Label | floor | floor (@listID="SE:BIP-koder") | 010 | - | - | Våningsbeteckning |
| **Allmänt** | renovation component status | Label | renovation component status | renovation component status (@listID="SE:BIP-koder") | Ny | - | - | Ny/Befintlig/Rivs |
| **VVS** | SystemName | Label | SystemName | SystemName (@listID="SE:BIP-koder") | Tilluft LB101 | - | - | Systembeteckning |
| **VVS** | Flow_l/s | VolumetricFlowRate | Flow_l/s | Flow_l/s (@listID="SE:BIP-koder") | 5,2 l/s | 5.2 | E97 | Flöde (E97=liter/sekund) |
| **VVS** | InsulationThickness | PositiveLength | InsulationThickness | InsulationThickness (@listID="SE:BIP-koder") | 40 mm | 40 | MMT | Isoleringstjocklek |
| **VVS** | HeatingPower_W | Power | HeatingPower_W | HeatingPower_W (@listID="SE:BIP-koder") | 1500 W | 1500 | WTT | Värmeeffekt i Watt |
| **El** | Voltage_V | ElectricVoltage | Voltage_V | Voltage_V (@listID="SE:BIP-koder") | 230 V | 230 | VLT | Spänning |
| **El** | Current_A | ElectricCurrent | Current_A | Current_A (@listID="SE:BIP-koder") | 3 A | 3 | AMP | Ström |
| **El** | PowerElectrical_W | Power | PowerElectrical_W | PowerElectrical_W (@listID="SE:BIP-koder") | 500 W | 500 | WTT | Elektrisk effekt |
| **El** | IPClass | Label | IPClass | IPClass (@listID="SE:BIP-koder") | IP48 | - | - | IP-klass |

## XML-strukturexempel

### Exempel 1: Enkel Textegenskap (type name id)

```xml
<cac:Item>
  <cac:AdditionalItemProperty>
    <cbc:Name>type name id</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">type name id</cbc:NameCode>
    <cbc:Value>YV01</cbc:Value>
  </cac:AdditionalItemProperty>
</cac:Item>
```

### Exempel 2: Tillverkaregenskap (Påverkar BrandName och ManufacturerParty)

```xml
<cac:Item>
  <cbc:BrandName>Lindab AB</cbc:BrandName>  <!-- Från BIP.Manufacturer -->
  
  <cac:ManufacturerParty>  <!-- Endast inkluderad om BIP.Manufacturer finns -->
    <cac:PartyName>
      <cbc:Name>Lindab AB</cbc:Name>
    </cac:PartyName>
  </cac:ManufacturerParty>
  
  <cac:AdditionalItemProperty>
    <cbc:Name>Manufacturer</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">Manufacturer</cbc:NameCode>
    <cbc:Value>Lindab AB</cbc:Value>
  </cac:AdditionalItemProperty>
</cac:Item>
```

### Exempel 3: Dimensionsegenskap med Enhet (thickness)

```xml
<cac:Item>
  <cac:AdditionalItemProperty>
    <cbc:Name>thickness</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">thickness</cbc:NameCode>
    <cbc:Value>350 mm</cbc:Value>
    <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>
  </cac:AdditionalItemProperty>
</cac:Item>
```

### Exempel 4: Boolesk Egenskap (is load bearing)

```xml
<cac:Item>
  <cac:AdditionalItemProperty>
    <cbc:Name>is load bearing</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">is load bearing</cbc:NameCode>
    <cbc:Value>Ja</cbc:Value>  <!-- Översatt från true/false -->
  </cac:AdditionalItemProperty>
</cac:Item>
```

### Exempel 5: Ytaegenskap (net area)

```xml
<cac:Item>
  <cac:AdditionalItemProperty>
    <cbc:Name>net area</cbc:Name>
    <cbc:NameCode listID="SE:BIP-koder">net area</cbc:NameCode>
    <cbc:Value>79.81 m²</cbc:Value>
    <cbc:ValueQuantity unitCode="MTK">79.81</cbc:ValueQuantity>
  </cac:AdditionalItemProperty>
</cac:Item>
```

## Enhetskoder (UN/CEFACT)

| Enhet | Kod | Beskrivning |
|-------|-----|-------------|
| Millimeter | MMT | Längd |
| Kvadratmeter | MTK | Yta |
| Kubikmeter | MTQ | Volym |
| Kilogram | KGM | Vikt/Massa |
| Watt | WTT | Effekt |
| Volt | VLT | Spänning |
| Ampere | AMP | Ström |
| Liter/sekund | E97 | Volymflöde |

## Transformationsregler

### Booleska Värden
- `true` / `1` → `Ja`
- `false` / `0` → `Nej`

### Dimensioner
- Automatisk tillägg av enhetsuffix (mm, m², m³, kg)
- Numeriskt värde i `ValueQuantity` med lämplig `unitCode`
- Läsbart värde med enhet i `Value`

### Nyckelord (Keywords)
Genereras automatiskt från:
- BSAB 96-kod
- ObjectType
- Väggklassificering (external wall / internal wall baserat på `is external`)

### BrandName-logik
```
IF BIP.Manufacturer EXISTS THEN
    BrandName = BIP.Manufacturer
ELSE IF BIP.type name id EXISTS THEN
    BrandName = BIP.type name id
END IF
```

### ManufacturerParty-logik
```
IF BIP.Manufacturer EXISTS THEN
    Include ManufacturerParty with BIP.Manufacturer value
ELSE
    Do not include ManufacturerParty
END IF
```

## Användning i XSLT

Referensimplementering finns i:
```
peppol-transformer/stylesheets/default-stylesheet-bip_to_peppol.xslt
```

Nyckelvariabel för tillverkare:
```xml
<xsl:variable name="manufacturer" select="$propSet/IfcPropertySingleValue[@Name='Manufacturer']/@NominalValue"/>
```

## Validering

Validera genererade kataloger mot:
- **Peppol BIS 3.0** standard
- **BEAst Supply** valideringsregler
- **UBL 2.1** schema

Använd BEAst Supply validator: https://bis.beast.se/

## Referenser

- **BIP Dokumentation**: https://www.bimalliance.se/
- **Peppol BIS**: https://peppol.eu/
- **UN/CEFACT Codes**: https://unece.org/trade/uncefact/cl-recommendations

---

**Senast Uppdaterad:** 2025-10-29  
**Version:** 1.2
