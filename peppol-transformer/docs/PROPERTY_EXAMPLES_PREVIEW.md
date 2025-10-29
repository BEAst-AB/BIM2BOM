# Uppdaterad Översikt av Egenskapsexempel

## Vad har Ändrats

Hierarkiexemplen använder nu **realistiska, disciplinpassande egenskapsvärden** istället för generiska exempel från property.json.

## Nya Exempel per Disciplin

### 🏛️ Arkitektur - Branddörr EI60 med Karm

**Produktinformation:**
- Artikelnamn: Branddörr EI60 med Karm
- Beskrivning: Stålbranddörr med 60 minuters klassning, inklusive karm och beslag. Vit RAL 9010-finish.
- Varumärke: Nordic Doors (från BIP.Manufacturer om tillgänglig, annars från TypeID)
- Säljare ID: ND-FD-EI60-0910
- Tillverkare ID: FD-EI60-WH-910
- GTIN: 7350012345678

**BIP-egenskaper (6):**

| Egenskap | Värde | Typ | Enhetskod | Kommentar |
|----------|-------|-----|-----------|-----------|
| **TypeID** | `D-EI60-0910-WH` | Label | - | Produkttypbeteckning för branddörr |
| **FireRating** | `EI60` | Label | - | Brandmotstånd - 60 min integritet & isolering |
| **Height** | `2100 mm` | PositiveLength | MMT | Dörrhöjd i millimeter |
| **Width** | `900 mm` | PositiveLength | MMT | Dörrbredd i millimeter |
| **AcousticRating** | `33` | Label | - | Ljudreduktionsvärde Rw i dB |
| **Colour** | `RAL 9010` | Label | - | Ytfärgkod - Ren Vit |

---

### 🏗️ Konstruktion - Limträ Balk GL30c

**Produktinformation:**
- Artikelnamn: Limträ Balk GL30c
- Beskrivning: Limmat trä balk, hållfasthetsklass GL30c. Lämplig för synliga konstruktionstillämpningar.
- Varumärke: Moelven Limträ (från BIP.Manufacturer)
- Säljare ID: ML-GL30-115X315
- Tillverkare ID: GL30C-115-315
- GTIN: 7350023456789

**BIP-egenskaper (6):**

| Egenskap | Värde | Typ | Enhetskod | Kommentar |
|----------|-------|-----|-----------|-----------|
| **TypeID** | `GL30C-115X315` | Label | - | Limträbalktyp med dimensioner |
| **BSABwr** | `PDB.3` | Label | - | BSAB Arbetsresultatkod för träkonstruktioner |
| **Length** | `6000 mm` | PositiveLength | MMT | Balklängd i millimeter |
| **Height** | `315 mm` | PositiveLength | MMT | Balkdjup/höjd i millimeter |
| **Width** | `115 mm` | PositiveLength | MMT | Balkbredd i millimeter |
| **Material** | `GL30c` | Label | - | Limträ hållfasthetsklass |

---

### 🔧 VVS - Ventilationsdon Roterande

**Produktinformation:**
- Artikelnamn: Ventilationsdon Roterande
- Beskrivning: Cirkulärt ventilationsdon med inställbar luftriktning. För frånluftssystem.
- Varumärke: Lindab (från BIP.Manufacturer)
- Säljare ID: LI-VD-125-ROT
- Tillverkare ID: VDR-125-WHITE
- GTIN: 7350034567890

**BIP-egenskaper (6):**

| Egenskap | Värde | Typ | Enhetskod | Kommentar |
|----------|-------|-----|-----------|-----------|
| **TypeID** | `VDR-125` | Label | - | Ventilationsdontyp |
| **SystemName** | `Frånluft FT201` | Label | - | Systemtillhörighet VVS |
| **Flow_l/s** | `15 l/s` | VolumetricFlowRate | E97 | Luftflöde liter per sekund |
| **Diameter** | `125 mm` | PositiveLength | MMT | Anslutningsdiameter i millimeter |
| **AcousticRating** | `28 dB(A)` | Label | - | Ljudnivå vid nominellt flöde |
| **Colour** | `RAL 9010` | Label | - | Färg - Vit |

---

### ⚡ El - LED-armatur Kontorsbelysning

**Produktinformation:**
- Artikelnamn: LED-armatur Kontorsbelysning
- Beskrivning: Energieffektiv LED-armatur för kontorsmiljö. 4000K, Ra>80. Dimbarstyrd.
- Varumärke: Fagerhult (från BIP.Manufacturer)
- Säljare ID: FH-LED-1200-40W
- Tillverkare ID: E-LINE-LED-1200
- GTIN: 7350045678901

**BIP-egenskaper (7):**

| Egenskap | Värde | Typ | Enhetskod | Kommentar |
|----------|-------|-----|-----------|-----------|
| **TypeID** | `E-LINE-LED-1200` | Label | - | LED-armaturtyp |
| **PowerElectrical_W** | `40 W` | Power | WTT | Installerad effekt i Watt |
| **Voltage_V** | `230 V` | ElectricVoltage | VLT | Matningsspänning |
| **Length** | `1200 mm` | PositiveLength | MMT | Armaturlängd |
| **ColourTemperature** | `4000K` | Label | - | Färgtemperatur Kelvin |
| **LuminousFlux** | `4200 lm` | Label | - | Ljusflöde lumen |
| **IPClass** | `IP20` | Label | - | Inkapslingsklass |

---

### 🧱 Ytskikt - Keramiska Golv plattor

**Produktinformation:**
- Artikelnamn: Keramiska Golvplattor
- Beskrivning: Porslinsplattor för golv, matt yta. Lämplig för våtrum och offentliga miljöer.
- Varumärke: Höganäs (från BIP.Manufacturer)
- Säljare ID: HG-PORS-300X300
- Tillverkare ID: PORS-300-GREY
- GTIN: 7350056789012

**BIP-egenskaper (6):**

| Egenskap | Värde | Typ | Enhetskod | Kommentar |
|----------|-------|-----|-----------|-----------|
| **TypeID** | `PORS-300-GREY` | Label | - | Platttyp och färg |
| **Material** | `Porslinskeramik` | Label | - | Materialbeskrivning |
| **Length** | `300 mm` | PositiveLength | MMT | Plattlängd |
| **Width** | `300 mm` | PositiveLength | MMT | Plattbredd |
| **Thickness** | `9 mm` | PositiveLength | MMT | Platttjocklek |
| **SlipResistance** | `R11` | Label | - | Halkmotståndsgrad |

---

## Nyckelfunktioner i Transformationen

### BrandName (Varumärke)
- **Prioritet 1**: Om `BIP.Manufacturer` finns, använd detta värde
- **Prioritet 2**: Om Manufacturer saknas, använd `BIP.type name id`
- **Exempel**: 
  - Med Manufacturer: `<cbc:BrandName>Lindab</cbc:BrandName>`
  - Utan Manufacturer: `<cbc:BrandName>YV01</cbc:BrandName>`

### ManufacturerParty (Tillverkarpart)
- **Villkor**: Endast inkluderad om `BIP.Manufacturer` finns
- **Struktur**:
```xml
<cac:ManufacturerParty>
  <cac:PartyName>
    <cbc:Name>Lindab AB</cbc:Name>
  </cac:PartyName>
</cac:ManufacturerParty>
```
- **Om Manufacturer saknas**: Element utelämnas helt

### Keywords (Nyckelord)
Genereras automatiskt från:
1. **BSAB 96-kod**: t.ex. `42.A`, `43.CB`
2. **ObjectType**: t.ex. `Basic Wall:YV01 350`
3. **Väggtyp**: `external wall` eller `internal wall` (baserat på `is external`)

### Booleska Värden
Översätts till läsbara värden:
- `true` / `1` → `Ja`
- `false` / `0` → `Nej`

### Enhetsformatering
Numeriska värden formateras med:
- **Läsbar text**: `350 mm`, `79.81 m²`, `27.93 m³`
- **Strukturerat värde**: `<cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>`

## XML-exempel: Komplett Katalogpost

```xml
<cac:CatalogueLine>
  <cbc:ID>3pLKJPvHT21uNqX1l9FcUN</cbc:ID>
  <cbc:ActionCode>Add</cbc:ActionCode>
  <cbc:OrderableIndicator>true</cbc:OrderableIndicator>
  
  <cac:Item>
    <cbc:Name>Basic Wall:YV01 350:1192287</cbc:Name>
    <cbc:Description>Yttre bärande yttervägg, 350 mm. Materials: Tegel fasad 110 / Luft 30 / Vindskydd 9 / Regelstomme C24 195 + mineralull / Ångbroms / Installationsregel 45 + isolering / Gips 13</cbc:Description>
    
    <!-- BrandName från BIP.Manufacturer eller TypeID -->
    <cbc:BrandName>YV01</cbc:BrandName>
    
    <!-- Nyckelord -->
    <cbc:Keyword>42.A</cbc:Keyword>
    <cbc:Keyword>Basic Wall:YV01 350</cbc:Keyword>
    <cbc:Keyword>external wall</cbc:Keyword>
    
    <cac:ManufacturersItemIdentification>
      <cbc:ID>YV01</cbc:ID>
    </cac:ManufacturersItemIdentification>
    
    <!-- ManufacturerParty endast om BIP.Manufacturer finns -->
    <!-- I detta exempel saknas Manufacturer, så elementet utelämnas -->
    
    <!-- BIP-egenskaper -->
    <cac:AdditionalItemProperty>
      <cbc:Name>type name id</cbc:Name>
      <cbc:NameCode listID="SE:BIP">type name id</cbc:NameCode>
      <cbc:Value>YV01</cbc:Value>
    </cac:AdditionalItemProperty>
    
    <cac:AdditionalItemProperty>
      <cbc:Name>thickness</cbc:Name>
      <cbc:NameCode listID="SE:BIP">thickness</cbc:NameCode>
      <cbc:Value>350 mm</cbc:Value>
      <cbc:ValueQuantity unitCode="MMT">350</cbc:ValueQuantity>
    </cac:AdditionalItemProperty>
    
    <cac:AdditionalItemProperty>
      <cbc:Name>is load bearing</cbc:Name>
      <cbc:NameCode listID="SE:BIP">is load bearing</cbc:NameCode>
      <cbc:Value>Ja</cbc:Value>
    </cac:AdditionalItemProperty>
    
    <cac:AdditionalItemProperty>
      <cbc:Name>is external</cbc:Name>
      <cbc:NameCode listID="SE:BIP">is external</cbc:NameCode>
      <cbc:Value>Ja</cbc:Value>
    </cac:AdditionalItemProperty>
    
    <!-- ... fler BIP-egenskaper ... -->
  </cac:Item>
</cac:CatalogueLine>
```

## Validering

### Kontrollpunkter
- ✓ ManufacturerParty finns ENDAST när BIP.Manufacturer finns
- ✓ BrandName använder BIP.Manufacturer när tillgänglig
- ✓ Alla nyckelord genereras korrekt
- ✓ Booleska värden översatta till Ja/Nej
- ✓ Enheter formaterade korrekt

### Valideringsverktyg
- **BEAst Supply Validator**: https://bis.beast.se/
- **Peppol BIS 3.0** schema
- **UBL 2.1** validering

## Implementation

Transformationslogik implementerad i:
```
peppol-transformer/stylesheets/default-stylesheet-bip_to_peppol.xslt
```

Python-skript:
```bash
python scripts/transform_ifc_to_peppol.py input.xml output.xml
```

---

**Senast Uppdaterad:** 2025-10-29  
**Version:** 1.2  
**Status:** Produktionsklar med villkorlig ManufacturerParty-logik
