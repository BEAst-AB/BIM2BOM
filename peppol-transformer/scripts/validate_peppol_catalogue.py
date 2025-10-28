#!/usr/bin/env python3
"""
Peppol Catalogue Validator

Validates a Peppol catalogue XML against the official Peppol validator API.

Usage:
    python validate_peppol_catalogue.py <catalogue.xml>
    
Example:
    python validate_peppol_catalogue.py BIM2BOM_Peppol_Catalogue.xml
"""

import sys
import requests
from pathlib import Path

VALIDATOR_URL = "https://validator.logiq.no/api/v1/document-validation/validate-upload"


def validate_catalogue(xml_path):
    """
    Upload and validate a Peppol catalogue.
    
    Args:
        xml_path: Path to the catalogue XML file
        
    Returns:
        dict: Validation results from the API
    """
    
    print("=" * 70)
    print("Peppol Catalogue Validator")
    print("=" * 70)
    print()
    
    # Check file exists
    if not Path(xml_path).exists():
        print(f"ERROR: File not found: {xml_path}")
        return None
    
    print(f"Validating: {xml_path}")
    print(f"Validator:  {VALIDATOR_URL}")
    print()
    
    try:
        # Read XML file
        with open(xml_path, 'rb') as f:
            xml_content = f.read()
        
        # Prepare multipart form data
        files = {
            'file': ('catalogue.xml', xml_content, 'application/xml')
        }
        
        # Make request
        print("Uploading to validator...")
        response = requests.post(
            VALIDATOR_URL,
            files=files,
            timeout=30
        )
        
        # Check HTTP status
        if response.status_code != 200:
            print(f"ERROR: HTTP {response.status_code}")
            print(response.text)
            return None
        
        # Parse response
        result = response.json()
        
        # Display results
        print()
        print("=" * 70)
        print("VALIDATION RESULTS")
        print("=" * 70)
        print()
        
        if result.get('hasError'):
            print("[ERROR] Validation request failed")
            return result
        
        # Get document info
        doc_result = result.get('result', {})
        status = doc_result.get('documentStatus', 'UNKNOWN')
        title = doc_result.get('documentTitle', 'Unknown')
        
        print(f"Document: {title}")
        print(f"Status:   {status}")
        print()
        
        # Show errors
        errors = doc_result.get('errors', [])
        warnings = doc_result.get('warnings', [])
        
        if status == 'VALID':
            print("[VALID] DOCUMENT IS VALID!")
            print()
            print("Your Peppol catalogue is ready to use!")
        else:
            if errors:
                print(f"ERRORS: {len(errors)}")
                print("-" * 70)
                for i, error in enumerate(errors, 1):
                    print(f"\nError #{i}:")
                    print(f"  Rule:     {error.get('ruleName', 'N/A')}")
                    print(f"  Message:  {error.get('message', 'N/A')}")
                    
                    location = error.get('location', '')
                    if location:
                        # Simplify location path
                        location_parts = location.split('/')
                        simplified = ' / '.join([p.split('[')[0].split(':')[-1] for p in location_parts if p and not p.startswith('*')])
                        print(f"  Location: {simplified}")
                    
                    print(f"  Type:     {error.get('type', 'N/A')}")
                print()
        
        if warnings:
            print(f"WARNINGS: {len(warnings)}")
            print("-" * 70)
            for i, warning in enumerate(warnings, 1):
                print(f"\nWarning #{i}:")
                print(f"  Rule:    {warning.get('ruleName', 'N/A')}")
                print(f"  Message: {warning.get('message', 'N/A')}")
            print()
        
        # Summary
        print("=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"Status:   {status}")
        print(f"Errors:   {len(errors)}")
        print(f"Warnings: {len(warnings)}")
        print()
        
        if status != 'VALID':
            print("Fix the errors above and validate again.")
            print()
            print("Common issues:")
            print("  - Invalid listID values (use UNCL7143 codes)")
            print("  - Missing required elements")
            print("  - Invalid date formats")
            print("  - Incorrect namespace declarations")
        
        return result
        
    except requests.exceptions.Timeout:
        print("ERROR: Request timed out")
        print("The validator might be slow or unavailable. Try again later.")
        return None
        
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to validator")
        print("Check your internet connection or try again later.")
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Request failed: {e}")
        return None
        
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Main entry point."""
    
    if len(sys.argv) < 2:
        print("Usage: python validate_peppol_catalogue.py <catalogue.xml>")
        print()
        print("Example:")
        print("  python validate_peppol_catalogue.py BIM2BOM_Peppol_Catalogue.xml")
        print()
        print("This script validates your Peppol catalogue against the official")
        print("Peppol validator at validator.logiq.no")
        sys.exit(1)
    
    xml_path = sys.argv[1]
    result = validate_catalogue(xml_path)
    
    if result is None:
        sys.exit(1)
    
    # Exit with error code if validation failed
    doc_status = result.get('result', {}).get('documentStatus', 'UNKNOWN')
    if doc_status == 'VALID':
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()

