#!/usr/bin/env python3
"""
Peppol Catalogue Verification Script

This script validates the generated Peppol catalogue and shows statistics.

Usage:
    python verify_catalogue.py BIM2BOM_Peppol_Catalogue.xml
"""

import sys
from lxml import etree

def verify_catalogue(xml_path):
    """Verify and show statistics for a Peppol catalogue."""
    
    print("=" * 70)
    print("Peppol Catalogue Verification")
    print("=" * 70)
    print()
    
    try:
        # Parse XML
        print(f"Loading: {xml_path}")
        doc = etree.parse(xml_path)
        print("[OK] XML is well-formed\n")
        
        # Define namespaces
        ns = {
            'cat': 'urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2',
            'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
            'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
        }
        
        # Check Peppol identifiers
        print("Peppol BIS Identifiers:")
        customization = doc.xpath('//cbc:CustomizationID/text()', namespaces=ns)
        profile = doc.xpath('//cbc:ProfileID/text()', namespaces=ns)
        if customization:
            print(f"  Customization: {customization[0]}")
        if profile:
            print(f"  Profile: {profile[0]}")
        print()
        
        # Catalogue metadata
        print("Catalogue Metadata:")
        cat_id = doc.xpath('//cbc:ID/text()', namespaces=ns)
        cat_name = doc.xpath('//cat:Catalogue/cbc:Name/text()', namespaces=ns)
        issue_date = doc.xpath('//cat:Catalogue/cbc:IssueDate/text()', namespaces=ns)
        
        if cat_id:
            print(f"  ID: {cat_id[0]}")
        if cat_name:
            print(f"  Name: {cat_name[0]}")
        if issue_date:
            print(f"  Issue Date: {issue_date[0]}")
        print()
        
        # Party information
        print("Parties:")
        provider = doc.xpath('//cac:ProviderParty/cac:PartyLegalEntity/cbc:RegistrationName/text()', namespaces=ns)
        receiver = doc.xpath('//cac:ReceiverParty/cac:PartyLegalEntity/cbc:RegistrationName/text()', namespaces=ns)
        
        if provider:
            print(f"  Provider: {provider[0]}")
        if receiver:
            print(f"  Receiver: {receiver[0]}")
        print()
        
        # Catalogue lines
        catalogue_lines = doc.xpath('//cac:CatalogueLine', namespaces=ns)
        print(f"Catalogue Lines: {len(catalogue_lines)}")
        print()
        
        # BIP properties
        bip_props = doc.xpath('//cac:AdditionalItemProperty', namespaces=ns)
        print(f"BIP Properties:")
        print(f"  Total: {len(bip_props)}")
        if len(catalogue_lines) > 0:
            print(f"  Average per wall: {len(bip_props)/len(catalogue_lines):.1f}")
        else:
            print(f"  Average per wall: N/A (no catalogue lines)")
        print()
        
        # Property types breakdown
        print("Property Types:")
        props_with_quantity = doc.xpath('//cac:AdditionalItemProperty[cbc:ValueQuantity]', namespaces=ns)
        print(f"  With units (ValueQuantity): {len(props_with_quantity)}")
        print(f"  Text only (Value only): {len(bip_props) - len(props_with_quantity)}")
        print()
        
        # Unit code breakdown
        print("Unit Codes Used:")
        unit_codes = {}
        for prop in doc.xpath('//cbc:ValueQuantity/@unitCode', namespaces=ns):
            unit_codes[prop] = unit_codes.get(prop, 0) + 1
        
        for unit, count in sorted(unit_codes.items(), key=lambda x: x[1], reverse=True):
            unit_name = {
                'MMT': 'Millimeter',
                'MTK': 'Square meter',
                'MTQ': 'Cubic meter',
                'KGM': 'Kilogram'
            }.get(unit, 'Unknown')
            print(f"  {unit} ({unit_name}): {count}")
        print()
        
        # Sample properties
        if len(catalogue_lines) > 0:
            print("Sample Catalogue Line (First Wall):")
            first_line = catalogue_lines[0]
            item_name = first_line.xpath('.//cbc:Name/text()', namespaces=ns)
            description = first_line.xpath('.//cbc:Description/text()', namespaces=ns)
            prop_count = len(first_line.xpath('.//cac:AdditionalItemProperty', namespaces=ns))
            
            if item_name:
                print(f"  Name: {item_name[0]}")
            if description:
                print(f"  Description: {description[0][:80]}...")
            print(f"  BIP Properties: {prop_count}")
            print()
            
            # Sample properties from first wall
            print("  Sample BIP Properties:")
            sample_props = first_line.xpath('.//cac:AdditionalItemProperty', namespaces=ns)[:5]
            for prop in sample_props:
                name = prop.xpath('.//cbc:Name/text()', namespaces=ns)
                value = prop.xpath('.//cbc:Value/text()', namespaces=ns)
                unit = prop.xpath('.//cbc:ValueQuantity/@unitCode', namespaces=ns)
                
                if name and value:
                    if unit:
                        print(f"    - {name[0]}: {value[0]} (unitCode={unit[0]})")
                    else:
                        print(f"    - {name[0]}: {value[0]}")
            print()
        else:
            print("No catalogue lines found in the document.")
            print()
        
        # Validation checks
        print("Validation Checks:")
        
        # Check required elements
        checks = []
        checks.append(("CustomizationID present", len(customization) > 0))
        checks.append(("ProfileID present", len(profile) > 0))
        checks.append(("Catalogue ID present", len(cat_id) > 0))
        checks.append(("All lines have Item/Name", 
                      len(catalogue_lines) == len(doc.xpath('//cac:CatalogueLine/cac:Item/cbc:Name', namespaces=ns))))
        checks.append(("All BIP props have NameCode", 
                      len(bip_props) == len(doc.xpath('//cac:AdditionalItemProperty/cbc:NameCode', namespaces=ns))))
        namecodes_bip = len(doc.xpath('//cac:AdditionalItemProperty/cbc:NameCode[@listID="SE:BIP-koder"]', namespaces=ns))
        namecodes_beast = len(doc.xpath('//cac:AdditionalItemProperty/cbc:NameCode[@listID="ORG:BEAst"]', namespaces=ns))
        checks.append(("All NameCodes have SE:BIP-koder or ORG:BEAst listID",
                      len(bip_props) == namecodes_bip + namecodes_beast))
        
        all_passed = True
        for check_name, check_result in checks:
            status = "[PASS]" if check_result else "[FAIL]"
            print(f"  {status} {check_name}")
            if not check_result:
                all_passed = False
        
        print()
        if all_passed:
            print("[SUCCESS] All validation checks passed!")
            print()
            print("Next steps:")
            print("  1. Update party organization numbers (currently 0000000000)")
            print("  2. Update receiver organization name (currently 'Receiver Organization (TBD)')")
            print("  3. Validate at https://bis.beast.se/")
            return True
        else:
            print("[WARNING] Some validation checks failed")
            return False
            
    except etree.XMLSyntaxError as e:
        print(f"[ERROR] XML syntax error: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_catalogue.py <catalogue.xml>")
        print("\nExample:")
        print("  python verify_catalogue.py BIM2BOM_Peppol_Catalogue.xml")
        sys.exit(1)
    
    success = verify_catalogue(sys.argv[1])
    sys.exit(0 if success else 1)

