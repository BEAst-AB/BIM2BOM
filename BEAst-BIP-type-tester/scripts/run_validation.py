"""
BIM2BOM Validation Runner

Simple script to run Gherkin-based validations on IFC files
"""

import subprocess
import sys
import os
from pathlib import Path


def run_validation(ifc_file, rules=None, verbose=True):
    """
    Run BIM2BOM validations on an IFC file
    
    Args:
        ifc_file: Path to IFC file to validate
        rules: Optional list of rule codes (e.g., ['BIP001']) or None for all rules
        verbose: Show detailed output
        
    Returns:
        Exit code (0 = passed, 1 = failed)
    """
    script_dir = Path(__file__).parent
    
    # Build behave command
    cmd = [
        sys.executable, "-m", "behave",
        "--define", f"input={os.path.abspath(ifc_file)}"
    ]
    
    if verbose:
        cmd.extend(["--no-capture", "-v"])
    
    # Filter by rule codes if specified
    if rules:
        for rule in rules:
            cmd.extend(["-i", rule])
    
    # Run behave
    print(f"Running BIM2BOM validation on: {ifc_file}")
    print(f"Command: {' '.join(cmd)}\n")
    
    result = subprocess.run(cmd, cwd=script_dir)
    return result.returncode


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("BIM2BOM Validation Framework")
        print("\nUsage:")
        print("  python run_validation.py <ifc_file> [rule_code...]")
        print("\nExamples:")
        print('  python run_validation.py "path/to/file.ifc"              # Run all rules')
        print('  python run_validation.py "path/to/file.ifc" BIP001       # Run specific rule')
        print('  python run_validation.py "path/to/file.ifc" BIP001 BIP002  # Run multiple rules')
        print("\nAvailable Rules:")
        print("  BIP001 - Type Name ID Uniqueness and Consistency")
        sys.exit(1)
    
    ifc_file = sys.argv[1]
    rules = sys.argv[2:] if len(sys.argv) > 2 else None
    
    exit_code = run_validation(ifc_file, rules)
    sys.exit(exit_code)


if __name__ == '__main__':
    main()

