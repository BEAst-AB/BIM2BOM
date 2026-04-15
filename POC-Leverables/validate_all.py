#!/usr/bin/env python3
"""
Batch Validator for POC Leverables Peppol Catalogues

Validates all Peppol catalogue XML files in the POC-Leverables folder.
Supports both remote Peppol API validation and local NameCode/listID checks.

Usage:
    python validate_all.py --local              # Local NameCode checks (offline)
    python validate_all.py                      # Remote Peppol API validation
    python validate_all.py --verbose
    python validate_all.py --file UseCase1-WallTypes-PriceRequest/UC1_Buyer_WallTypes_Request.xml

Requirements:
    pip install requests  (only for remote validation)
"""

import sys
import os
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path

# Add parent directory to path to import the validation module
sys.path.insert(0, str(Path(__file__).parent.parent / "peppol-transformer" / "scripts"))

try:
    from validate_peppol_catalogue import validate_catalogue
except ImportError:
    # Fallback: inline implementation
    import requests
    
    VALIDATOR_URL = "https://validator.logiq.no/api/v1/document-validation/validate-upload"
    
    def validate_catalogue(xml_path):
        """Validate a Peppol catalogue."""
        if not Path(xml_path).exists():
            print(f"  ERROR: File not found: {xml_path}")
            return None
        
        try:
            with open(xml_path, 'rb') as f:
                xml_content = f.read()
            
            files = {'file': ('catalogue.xml', xml_content, 'application/xml')}
            response = requests.post(VALIDATOR_URL, files=files, timeout=60)
            
            if response.status_code != 200:
                print(f"  ERROR: HTTP {response.status_code}")
                return None
            
            return response.json()
        except Exception as e:
            print(f"  ERROR: {e}")
            return None


VALID_LIST_IDS = {'SE:BIP-koder', 'ORG:BEAst'}

NS = {
    'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
}


def validate_namecodes(xml_path, verbose=False):
    """Validate NameCode + listID on every AdditionalItemProperty in a file.

    Returns (passed: bool, issues: list[str]).
    """
    issues = []
    try:
        tree = ET.parse(xml_path)
    except ET.ParseError as exc:
        return False, [f"XML parse error: {exc}"]

    root = tree.getroot()
    props = root.findall('.//cac:AdditionalItemProperty', NS)

    if not props:
        issues.append("No AdditionalItemProperty elements found")
        return False, issues

    for idx, prop in enumerate(props, 1):
        name_el = prop.find('cbc:Name', NS)
        name_code_el = prop.find('cbc:NameCode', NS)
        name_text = name_el.text if name_el is not None else '<missing>'

        if name_code_el is None:
            issues.append(f"  Property #{idx} '{name_text}': missing NameCode element")
            continue

        list_id = name_code_el.get('listID')
        if not list_id:
            issues.append(f"  Property #{idx} '{name_text}': NameCode missing listID attribute")
        elif list_id not in VALID_LIST_IDS:
            issues.append(
                f"  Property #{idx} '{name_text}': invalid listID '{list_id}' "
                f"(expected one of {VALID_LIST_IDS})"
            )

        if name_code_el.text != (name_el.text if name_el is not None else None):
            issues.append(
                f"  Property #{idx} '{name_text}': NameCode text '{name_code_el.text}' "
                f"does not match Name text '{name_text}'"
            )

    passed = len(issues) == 0
    if passed and verbose:
        print(f"  {len(props)} properties, all have valid NameCode + listID")
    return passed, issues


def find_xml_files(base_path):
    """Find all XML files in the POC-Leverables directory."""
    xml_files = []
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.xml'):
                xml_files.append(Path(root) / file)
    return sorted(xml_files)


def validate_file(xml_path, verbose=False):
    """Validate a single file and return status."""
    rel_path = xml_path.relative_to(Path(__file__).parent) if xml_path.is_absolute() else xml_path
    
    print(f"\nValidating: {rel_path}")
    print("-" * 60)
    
    result = validate_catalogue(str(xml_path))
    
    if result is None:
        return "ERROR", None
    
    if result.get('hasError'):
        return "ERROR", result
    
    doc_result = result.get('result', {})
    status = doc_result.get('documentStatus', 'UNKNOWN')
    errors = doc_result.get('errors', [])
    warnings = doc_result.get('warnings', [])
    
    if status == 'VALID':
        print(f"  Status: VALID [OK]")
        if warnings and verbose:
            print(f"  Warnings: {len(warnings)}")
            for w in warnings[:3]:
                print(f"    - {w.get('ruleName', 'N/A')}: {w.get('message', 'N/A')[:80]}")
        return "VALID", result
    else:
        print(f"  Status: {status} [FAIL]")
        print(f"  Errors: {len(errors)}")
        if verbose or len(errors) <= 5:
            for e in errors[:5]:
                print(f"    - {e.get('ruleName', 'N/A')}: {e.get('message', 'N/A')[:80]}")
        if len(errors) > 5:
            print(f"    ... and {len(errors) - 5} more errors")
        return status, result


def main():
    parser = argparse.ArgumentParser(description='Validate POC Leverables Peppol Catalogues')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed output')
    parser.add_argument('--file', '-f', type=str, help='Validate a specific file')
    parser.add_argument('--continue-on-error', '-c', action='store_true', 
                        help='Continue validation even if errors found')
    parser.add_argument('--local', action='store_true',
                        help='Run local NameCode/listID checks (offline, no API needed)')
    args = parser.parse_args()
    
    base_path = Path(__file__).parent
    
    # Find files to validate
    if args.file:
        xml_files = [base_path / args.file]
        if not xml_files[0].exists():
            print(f"\nERROR: File not found: {args.file}")
            sys.exit(1)
    else:
        xml_files = find_xml_files(base_path)
    
    if args.local:
        print("=" * 70)
        print("POC Leverables - Local NameCode/listID Validator")
        print("=" * 70)
        print(f"Valid listID values: {VALID_LIST_IDS}")
        print(f"Found {len(xml_files)} XML file(s) to check")

        pass_count = 0
        fail_count = 0

        for xml_file in xml_files:
            rel = xml_file.relative_to(base_path)
            print(f"\n  Checking: {rel}")
            passed, issues = validate_namecodes(xml_file, verbose=args.verbose)
            if passed:
                print(f"    [PASS] All NameCode + listID valid")
                pass_count += 1
            else:
                for issue in issues:
                    print(f"    [FAIL] {issue}")
                fail_count += 1

        print("\n" + "=" * 70)
        print("LOCAL VALIDATION SUMMARY")
        print("=" * 70)
        print(f"Total files:  {len(xml_files)}")
        print(f"Passed:       {pass_count}")
        print(f"Failed:       {fail_count}")

        sys.exit(1 if fail_count > 0 else 0)
    
    print("=" * 70)
    print("POC Leverables - Peppol Catalogue Batch Validator")
    print("=" * 70)
    print(f"Validator: https://validator.logiq.no")
    print(f"Base path: {base_path}")
    print(f"\nFound {len(xml_files)} XML file(s) to validate")
    
    # Validate each file
    results = {
        'VALID': [],
        'INVALID': [],
        'ERROR': []
    }
    
    for xml_file in xml_files:
        status, result = validate_file(xml_file, verbose=args.verbose)
        
        if status == 'VALID':
            results['VALID'].append(xml_file)
        elif status == 'ERROR':
            results['ERROR'].append(xml_file)
            if not args.continue_on_error:
                print("\n\nStopping validation due to error. Use --continue-on-error to continue.")
                break
        else:
            results['INVALID'].append(xml_file)
            if not args.continue_on_error:
                print("\n\nStopping validation due to invalid file. Use --continue-on-error to continue.")
                break
    
    # Print summary
    print("\n")
    print("=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    print(f"Total files:  {len(xml_files)}")
    print(f"Valid:        {len(results['VALID'])} [OK]")
    print(f"Invalid:      {len(results['INVALID'])} [FAIL]")
    print(f"Errors:       {len(results['ERROR'])} [ERR]")
    
    if results['VALID']:
        print("\nValid files:")
        for f in results['VALID']:
            print(f"  [OK] {f.relative_to(base_path)}")
    
    if results['INVALID']:
        print("\nInvalid files (need fixing):")
        for f in results['INVALID']:
            print(f"  [FAIL] {f.relative_to(base_path)}")
    
    if results['ERROR']:
        print("\nFiles with errors:")
        for f in results['ERROR']:
            print(f"  [ERR] {f.relative_to(base_path)}")
    
    # Exit code
    if results['INVALID'] or results['ERROR']:
        print("\n\nSome files need attention. Fix errors and run validation again.")
        sys.exit(1)
    else:
        print("\n\nAll catalogues are VALID! Ready for use.")
        sys.exit(0)


if __name__ == "__main__":
    main()
