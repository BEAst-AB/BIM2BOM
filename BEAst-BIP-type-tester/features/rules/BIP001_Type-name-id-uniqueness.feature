@BIP
@version1

Feature: BIP001 - Type Name ID Uniqueness and Consistency
  The rule verifies that the "type name id" property in BIP property sets maintains both:
  1. Consistency: Elements with the same "type name id" must have identical BIP property values
  2. Uniqueness: Each unique combination of BIP properties must map to exactly one "type name id"
  
  The validation checks BIP properties defined in the table 'bip_type_name_id_properties':
  - TypeDescription (IFCTEXT)
  - BSAB 96 (IFCLABEL)
  - materials/components (IFCTEXT)
  - thickness (IFCPOSITIVELENGTHMEASURE)
  - is load bearing (IFCBOOLEAN)
  - is external (IFCBOOLEAN)

  Background:
    Given An IfcElement
    Given its attribute .IsDefinedBy.
    Given [its entity type] ^is^ 'IfcRelDefinesByProperties'
    Given its attribute .RelatingPropertyDefinition.
    Given [its entity type] ^is^ 'IfcPropertySet'
    Given its .Name. attribute ^is^ 'BIP'
    Given its attribute .HasProperties.
    Given [its entity type] ^is^ 'IfcPropertySingleValue'
    Given its .Name. attribute ^is^ 'type name id'

  Scenario: Consistency - Elements with same type name id must have identical BIP properties
    
    Then All elements with the same value of 'type name id' must have identical values [according to the table] 'bip_type_name_id_properties'

  Scenario: Uniqueness - Each unique combination of BIP properties must map to one type name id
    
    Then Each unique combination [according to the table] 'bip_type_name_id_properties' must correspond to exactly one value of 'type name id'
