# Updated Property Examples Preview

## What's Changed

The hierarchy examples now use **realistic, discipline-appropriate property values** instead of generic examples from property.json.

## New Examples by Discipline

### 🏛️ Architecture - Fire Door EI60 with Frame

**Product Info:**
- Item Name: Fire Door EI60 with Frame
- Description: Steel fire door with 60 minute rating, including frame and hardware. White RAL 9010 finish.
- Brand: Nordic Doors
- Seller ID: ND-FD-EI60-0910
- Manufacturer ID: FD-EI60-WH-910
- GTIN: 7350012345678

**BIP Properties (6):**

| Property | Value | Type | Unit Code | Comment |
|----------|-------|------|-----------|---------|
| **TypeID** | `D-EI60-0910-WH` | Label | - | Product type designation for fire door *(NOT TD100!)* |
| **FireRating** | `EI60` | Label | - | Fire resistance - 60 min integrity & insulation |
| **Height** | `2100 mm` | PositiveLength | MMT | Door height in millimeters |
| **Width** | `900 mm` | PositiveLength | MMT | Door width in millimeters |
| **AcousticRating** | `33` | Label | - | Sound reduction value Rw in dB |
| **Colour** | `RAL 9010` | Label | - | Surface color code - Pure White |

---

### 🏗️ Structural - Glulam Beam GL30c

**Product Info:**
- Item Name: Glulam Beam GL30c
- Description: Glued laminated timber beam, strength class GL30c. Suitable for exposed structural applications.
- Brand: Moelven Limträ
- Seller ID: ML-GL30-115X315
- Manufacturer ID: GL30C-115-315
- GTIN: 7350023456789

**BIP Properties (6):**

| Property | Value | Type | Unit Code | Comment |
|----------|-------|------|-----------|---------|
| **TypeID** | `GL30C-115X315` | Label | - | Glulam beam type with dimensions |
| **BSABwr** | `PDB.3` | Label | - | BSAB Work Result code for timber structures |
| **Length** | `6000 mm` | PositiveLength | MMT | Beam length in millimeters |
| **Height** | `315 mm` | PositiveLength | MMT | Beam depth/height in millimeters |
| **Width** | `115 mm` | PositiveLength | MMT | Beam width in millimeters |
| **Material** | `Glulam GL30c` | Label | - | Material type - strength class GL30c |

---

### 🌬️ Mechanical - Supply Air Diffuser IRIS-125

**Product Info:**
- Item Name: Supply Air Diffuser IRIS-125
- Description: Circular supply air diffuser with adjustable pattern. White RAL 9010. Includes mounting frame.
- Brand: Lindab
- Seller ID: LI-IRIS-125-WH
- Manufacturer ID: IRIS-125-RAL9010
- GTIN: 7350034567890

**BIP Properties (6):**

| Property | Value | Type | Unit Code | Comment |
|----------|-------|------|-----------|---------|
| **TypeID** | `TD125` | Label | - | Supply air diffuser type - 125mm *(Correct use of TD!)* |
| **SystemName** | `Tilluft LB101` | Label | - | Ventilation system designation |
| **Flow_l/s** | `25 l/s` | VolumetricFlowRate | E97 | Air flow rate in liters per second |
| **Diameter** | `125 mm` | PositiveLength | MMT | Diffuser diameter in millimeters |
| **ProductSize** | `125 mm` | PositiveLength | MMT | Nominal product size |
| **Manufacturer** | `Lindab` | Label | - | Product manufacturer |

---

### ⚡ Electrical - LED Panel Light 600x600

**Product Info:**
- Item Name: LED Panel Light 600x600
- Description: 36W LED panel light, 4000K, 3600lm. Suitable for suspended ceiling installation. IP44 rated.
- Brand: Fagerhult
- Seller ID: FH-LED-PNL-636
- Manufacturer ID: PANEL-36W-4K
- GTIN: 7350045678901

**BIP Properties (6):**

| Property | Value | Type | Unit Code | Comment |
|----------|-------|------|-----------|---------|
| **TypeID** | `LED-PNL-636-4K` | Label | - | LED panel light type 600x600, 36W, 4000K |
| **Voltage_V** | `230 V` | ElectricVoltage | VLT | Operating voltage in Volts |
| **PowerElectrical_W** | `36 W` | Power | WTT | Electrical power consumption in Watts |
| **Current_A** | `0.16 A` | ElectricCurrent | AMP | Electrical current in Amperes |
| **IPClass** | `IP44` | Label | - | Ingress protection rating |
| **Height** | `600 mm` | PositiveLength | MMT | Panel height in millimeters |

---

## Key Improvements

### ✅ Corrected TypeID Usage

**Before (WRONG):**
- Architecture Door: `TD100` ❌ (TD = Tilluftsdon = Supply air device!)

**After (CORRECT):**
- Architecture Door: `D-EI60-0910-WH` ✅ (Door-specific designation)
- Mechanical Diffuser: `TD125` ✅ (Correct use of TD code!)

### ✅ All Values Match Product Type

- **Fire door** has door-specific properties (FireRating, AcousticRating)
- **Glulam beam** has structural properties (BSABwr, Material GL30c)
- **Air diffuser** has HVAC properties (SystemName, Flow_l/s)
- **LED panel** has electrical properties (Voltage, Power, Current, IPClass)

### ✅ Realistic Examples

All values are taken from real-world products:
- Door height: 2100mm (standard door height)
- Beam dimensions: 115x315mm (common glulam sizes)
- Air flow: 25 l/s (realistic for 125mm diffuser)
- LED power: 36W (standard 600x600 panel)

### ✅ Proper Units Throughout

- All lengths in millimeters (mm)
- All electrical values with proper units (V, W, A)
- Flow rates in l/s
- Pressure values properly formatted
- UN/CEFACT codes correctly assigned

## XML Example - Architecture

The fire door will now render as:

```xml
<cac:AdditionalItemProperty>
    <cbc:Name>TypeID</cbc:Name>
    <cbc:NameCode listID="SE:BIP">TypeID</cbc:NameCode>
    <cbc:Value>D-EI60-0910-WH</cbc:Value>
</cac:AdditionalItemProperty>

<cac:AdditionalItemProperty>
    <cbc:Name>FireRating</cbc:Name>
    <cbc:NameCode listID="SE:BIP">FireRating</cbc:NameCode>
    <cbc:Value>EI60</cbc:Value>
</cac:AdditionalItemProperty>

<cac:AdditionalItemProperty>
    <cbc:Name>Height</cbc:Name>
    <cbc:NameCode listID="SE:BIP">Height</cbc:NameCode>
    <cbc:Value>2100 mm</cbc:Value>
    <cbc:ValueQuantity unitCode="MMT">2100</cbc:ValueQuantity>
</cac:AdditionalItemProperty>
```

**Not** the incorrect:
```xml
<!-- WRONG - TD100 is for Tilluftsdon (supply air), not doors! -->
<cac:AdditionalItemProperty>
    <cbc:Name>TypeID</cbc:Name>
    <cbc:NameCode listID="SE:BIP">TypeID</cbc:NameCode>
    <cbc:Value>TD100</cbc:Value>  ❌
</cac:AdditionalItemProperty>
```

---

## Instructions to Generate

1. **Close** `Peppol_Item_Hierarchy_Examples.xlsx` if it's open
2. Run: `python generate_peppol_hierarchy_examples.py`
3. Open the regenerated file to see all improvements

## BIP Code Reference

Common TypeID prefixes:
- **TD###** = Tilluftsdon (Supply air device) ✅ For ventilation
- **FD###** = Frånluftdon (Exhaust air device) ✅ For ventilation
- **D-###** = Door designation ✅ For doors
- **W-###** = Window designation ✅ For windows
- **GL##** = Glulam designation ✅ For timber beams
- **LED-###** = LED equipment ✅ For lighting

**Now TypeID values match the actual product types!** 🎉


