# BIP to Peppol Property Mapping

## Introduction

This document provides a comprehensive mapping between **BIP (BIM In Production)** properties and **Peppol's `cac:AdditionalItemProperty`** structure as implemented in the BEAst Supply specification. This mapping enables standardized exchange of product properties in construction supply chain transactions.

The BIP property set is a Swedish standard for BIM properties used across Architecture, Structural, MEP (Mechanical, Electrical, Plumbing), and other construction disciplines. The Peppol BIS (Business Interoperability Specifications) provides a standardized format for electronic business documents.

### Key Mapping Principles

1. **Property Identification**: BIP property names are used in both `cbc:Name` and `cbc:NameCode` with the list identifier `SE:BIP`
2. **Value Representation**: 
   - Text/Label values use `cbc:Value`
   - Numeric values with units use `cbc:ValueQuantity` with appropriate `@unitCode`
3. **Unit Codes**: Following UN/CEFACT Recommendation 20 standards (e.g., MMT for millimeter)
4. **Context**: Use `cbc:ValueQualifier` for additional classification when needed

## Property Mapping Table

The following table shows the mapping for commonly used properties across different disciplines:

| Discipline | BIP Property | BIP DataType | cbc:Name | cbc:NameCode | cbc:Value Example | cbc:ValueQuantity | @unitCode | Notes |
|------------|--------------|--------------|----------|--------------|-------------------|-------------------|-----------|-------|
| **Common** | TypeID | Label | TypeID | TypeID (@listID="SE:BIP") | TD100 | - | - | Product type designation |
| **Common** | ObjectID | Identifier | ObjectID | ObjectID (@listID="SE:BIP") | 52-LB200-LA01 | - | - | Unique object ID |
| **Common** | Manufacturer | Label | Manufacturer | Manufacturer (@listID="SE:BIP") | Lindab | - | - | Manufacturer name |
| **Common** | StatusConstruction | Label | StatusConstruction | StatusConstruction (@listID="SE:BIP") | NYTT | - | - | Construction phase status |
| **Architect** | Height | PositiveLength | Height | Height (@listID="SE:BIP") | 600 mm | 600 | MMT | Height dimension |
| **Architect** | FireRating | Label | FireRating | FireRating (@listID="SE:BIP") | EI60 | - | - | Fire resistance class |
| **Architect** | AcousticRating | Label | AcousticRating | AcousticRating (@listID="SE:BIP") | 38 | - | - | Sound reduction Rw [dB] |
| **Architect** | Colour | Label | Colour | Colour (@listID="SE:BIP") | RAL 9005 | - | - | Color specification |
| **Structural** | BSABwr | Label | BSABwr | BSABwr (@listID="SE:BIP") | PDB.3 | - | - | BSAB Work Result code |
| **Structural** | Material | Label | Material | Material (@listID="SE:BIP") | 1 | - | - | Material code |
| **Structural** | Weight | Real | Weight | Weight (@listID="SE:BIP") | 20 kg | 20 | KGM | Object weight |
| **Structural** | FireSeparating | Boolean | FireSeparating | FireSeparating (@listID="SE:BIP") | Yes | - | - | Fire separating (Yes/No) |
| **Mechanical** | SystemName | Label | SystemName | SystemName (@listID="SE:BIP") | Tilluft LB101 | - | - | System designation |
| **Mechanical** | Flow_l/s | VolumetricFlowRate | Flow_l/s | Flow_l/s (@listID="SE:BIP") | 5,2 l/s | 5.2 | E97 | Flow rate (E97=liters/second) |
| **Mechanical** | InsulationThickness | PositiveLength | InsulationThickness | InsulationThickness (@listID="SE:BIP") | 40 mm | 40 | MMT | Insulation thickness |
| **Mechanical** | HeatingPower_W | Power | HeatingPower_W | HeatingPower_W (@listID="SE:BIP") | 1500 W | 1500 | WTT | Heating power in Watts |
| **Electrical** | Voltage_V | ElectricVoltage | Voltage_V | Voltage_V (@listID="SE:BIP") | 230 V | 230 | VLT | Voltage |
| **Electrical** | Current_A | ElectricCurrent | Current_A | Current_A (@listID="SE:BIP") | 3 A | 3 | AMP | Current |
| **Electrical** | PowerElectrical_W | Power | PowerElectrical_W | PowerElectrical_W (@listID="SE:BIP") | 500 W | 500 | WTT | Electrical power |
| **Electrical** | IPClass | Label | IPClass | IPClass (@listID="SE:BIP") | IP48 | - | - | IP protection class |

## XML Structure Examples

### Example 1: Simple Text Property (TypeID)

```xml
<cac:Item>
    <cbc:Name>Ventilation Diffuser IRIS-125</cbc:Name>
    <cac:AdditionalItemProperty>
        <cbc:Name>TypeID</cbc:Name>
        <cbc:NameCode listID="SE:BIP">TypeID</cbc:NameCode>
        <cbc:Value>TD100</cbc:Value>
    </cac:AdditionalItemProperty>
</cac:Item>
```

### Example 2: Numeric Property with Units (Height)

```xml
<cac:Item>
    <cbc:Name>Door 10M</cbc:Name>
    <cac:AdditionalItemProperty>
        <cbc:Name>Height</cbc:Name>
        <cbc:NameCode listID="SE:BIP">Height</cbc:NameCode>
        <cbc:Value>2100 mm</cbc:Value>
        <cbc:ValueQuantity unitCode="MMT">2100</cbc:ValueQuantity>
    </cac:AdditionalItemProperty>
</cac:Item>
```

### Example 3: Discipline-Specific Property (SystemName for MEP)

```xml
<cac:Item>
    <cbc:Name>Supply Air Damper</cbc:Name>
    <cac:AdditionalItemProperty>
        <cbc:Name>SystemName</cbc:Name>
        <cbc:NameCode listID="SE:BIP">SystemName</cbc:NameCode>
        <cbc:Value>Tilluft LB101</cbc:Value>
        <cbc:ValueQualifier>MEP System</cbc:ValueQualifier>
    </cac:AdditionalItemProperty>
    <cac:AdditionalItemProperty>
        <cbc:Name>Flow_l/s</cbc:Name>
        <cbc:NameCode listID="SE:BIP">Flow_l/s</cbc:NameCode>
        <cbc:Value>5.2 l/s</cbc:Value>
        <cbc:ValueQuantity unitCode="E97">5.2</cbc:ValueQuantity>
    </cac:AdditionalItemProperty>
</cac:Item>
```

### Example 4: Boolean Property (FireSeparating)

```xml
<cac:Item>
    <cbc:Name>Fire Door EI60</cbc:Name>
    <cac:AdditionalItemProperty>
        <cbc:Name>FireSeparating</cbc:Name>
        <cbc:NameCode listID="SE:BIP">FireSeparating</cbc:NameCode>
        <cbc:Value>Yes</cbc:Value>
    </cac:AdditionalItemProperty>
    <cac:AdditionalItemProperty>
        <cbc:Name>FireRating</cbc:Name>
        <cbc:NameCode listID="SE:BIP">FireRating</cbc:NameCode>
        <cbc:Value>EI60</cbc:Value>
    </cac:AdditionalItemProperty>
</cac:Item>
```

### Example 5: Multiple Properties for Electrical Equipment

```xml
<cac:Item>
    <cbc:Name>LED Panel Light</cbc:Name>
    <cac:AdditionalItemProperty>
        <cbc:Name>Voltage_V</cbc:Name>
        <cbc:NameCode listID="SE:BIP">Voltage_V</cbc:NameCode>
        <cbc:Value>230 V</cbc:Value>
        <cbc:ValueQuantity unitCode="VLT">230</cbc:ValueQuantity>
    </cac:AdditionalItemProperty>
    <cac:AdditionalItemProperty>
        <cbc:Name>PowerElectrical_W</cbc:Name>
        <cbc:NameCode listID="SE:BIP">PowerElectrical_W</cbc:NameCode>
        <cbc:Value>36 W</cbc:Value>
        <cbc:ValueQuantity unitCode="WTT">36</cbc:ValueQuantity>
    </cac:AdditionalItemProperty>
    <cac:AdditionalItemProperty>
        <cbc:Name>IPClass</cbc:Name>
        <cbc:NameCode listID="SE:BIP">IPClass</cbc:NameCode>
        <cbc:Value>IP44</cbc:Value>
    </cac:AdditionalItemProperty>
</cac:Item>
```

### Example 6: Complete Item with Multiple Properties

```xml
<cac:CatalogueLine>
    <cbc:ID>Item-12345</cbc:ID>
    <cac:Item>
        <cbc:Description>Rectangular ventilation duct with insulation</cbc:Description>
        <cbc:Name>Duct 400x200</cbc:Name>
        
        <!-- Common Properties -->
        <cac:AdditionalItemProperty>
            <cbc:Name>TypeID</cbc:Name>
            <cbc:NameCode listID="SE:BIP">TypeID</cbc:NameCode>
            <cbc:Value>KR-400x200</cbc:Value>
        </cac:AdditionalItemProperty>
        
        <cac:AdditionalItemProperty>
            <cbc:Name>Manufacturer</cbc:Name>
            <cbc:NameCode listID="SE:BIP">Manufacturer</cbc:NameCode>
            <cbc:Value>Lindab</cbc:Value>
        </cac:AdditionalItemProperty>
        
        <!-- Dimensional Properties -->
        <cac:AdditionalItemProperty>
            <cbc:Name>Height</cbc:Name>
            <cbc:NameCode listID="SE:BIP">Height</cbc:NameCode>
            <cbc:Value>200 mm</cbc:Value>
            <cbc:ValueQuantity unitCode="MMT">200</cbc:ValueQuantity>
        </cac:AdditionalItemProperty>
        
        <cac:AdditionalItemProperty>
            <cbc:Name>Width</cbc:Name>
            <cbc:NameCode listID="SE:BIP">Width</cbc:NameCode>
            <cbc:Value>400 mm</cbc:Value>
            <cbc:ValueQuantity unitCode="MMT">400</cbc:ValueQuantity>
        </cac:AdditionalItemProperty>
        
        <!-- MEP-specific Properties -->
        <cac:AdditionalItemProperty>
            <cbc:Name>SystemName</cbc:Name>
            <cbc:NameCode listID="SE:BIP">SystemName</cbc:NameCode>
            <cbc:Value>Tilluft LB101</cbc:Value>
        </cac:AdditionalItemProperty>
        
        <cac:AdditionalItemProperty>
            <cbc:Name>InsulationThickness</cbc:Name>
            <cbc:NameCode listID="SE:BIP">InsulationThickness</cbc:NameCode>
            <cbc:Value>40 mm</cbc:Value>
            <cbc:ValueQuantity unitCode="MMT">40</cbc:ValueQuantity>
        </cac:AdditionalItemProperty>
        
        <cac:AdditionalItemProperty>
            <cbc:Name>InsulationMaterial</cbc:Name>
            <cbc:NameCode listID="SE:BIP">InsulationMaterial</cbc:NameCode>
            <cbc:Value>Glasull</cbc:Value>
        </cac:AdditionalItemProperty>
    </cac:Item>
</cac:CatalogueLine>
```

## Common Unit Codes

The following UN/CEFACT unit codes are commonly used with BIP properties:

| Unit Code | Description | Used For |
|-----------|-------------|----------|
| MMT | Millimeter | Length, Height, Width, Thickness |
| MTR | Meter | Large dimensions |
| MTK | Square meter | Area |
| MTQ | Cubic meter | Volume |
| KGM | Kilogram | Weight |
| VLT | Volt | Voltage |
| AMP | Ampere | Current |
| WTT | Watt | Power |
| E97 | Liters per second | Flow rate (ventilation, water) |
| MQH | Cubic meters per hour | Flow rate |
| CEL | Degree Celsius | Temperature |
| PAL | Pascal | Pressure |
| KPA | Kilopascal | Pressure |
| 2N | Decibel | Sound levels |

## Implementation Notes

### Data Type Mapping

BIP DataType → Peppol Representation:

- **Label, Text, String, Identifier**: Use `cbc:Value` only
- **PositiveLength, Real, Integer**: Use both `cbc:Value` (with unit) and `cbc:ValueQuantity` (with unitCode)
- **Boolean**: Use `cbc:Value` with "Yes"/"No" or "True"/"False"
- **Area, Volume, Power, etc.**: Use both `cbc:Value` and `cbc:ValueQuantity` with appropriate unit codes

### Best Practices

1. **Always include the listID**: `cbc:NameCode listID="SE:BIP"` ensures proper identification of the BIP property set
2. **Provide human-readable values**: `cbc:Value` should include units for clarity (e.g., "600 mm", "5.2 l/s")
3. **Use standard unit codes**: Follow UN/CEFACT Recommendation 20 for unit codes in `cbc:ValueQuantity`
4. **Context matters**: Use `cbc:ValueQualifier` to provide additional classification when properties need context (e.g., "Object eller Data template referens")

### Property Priority Classes

BIP properties have priority levels (1-6) indicating their importance:
- **Priority 1-2**: Critical properties, should be included when relevant
- **Priority 3-4**: Standard properties, commonly used
- **Priority 5-6**: Optional properties, use as needed

## References

### Documentation Links

- [BEAst Supply - Peppol Catalogue AdditionalItemProperty](https://bis.beast.se/syntax/Catalogue/cac-CatalogueLine/cac-Item/cac-AdditionalItemProperty/)
- [BEAst Supply - Item Property Name Code](https://bis.beast.se/syntax/Catalogue/cac-CatalogueLine/cac-Item/cac-AdditionalItemProperty/cbc-NameCode/)
- [BIP (BIM In Production) - Property Specification](http://www.bipkoder.se/)
- [UN/CEFACT Recommendation 20 - Unit Codes](https://unece.org/trade/uncefact/cl-recommendations)

### Standards

- **BIP (BIM In Production)**: Swedish standard for BIM properties (version 1.8+)
- **Peppol BIS**: Business Interoperability Specifications for e-procurement
- **BEAst Supply**: Swedish extension of Peppol BIS for construction supply chain
- **UBL 2.1**: Universal Business Language - base for Peppol transactions
- **ISO 12006-2**: Building construction — Organization of information about construction works

### Property Source

Complete BIP property definitions are available in:
- [`property.json`](./property.json) - Comprehensive BIP property database with descriptions, examples, and discipline mappings

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-17  
**Author**: BIP-Peppol Integration Working Group  
**License**: CC BY 4.0


