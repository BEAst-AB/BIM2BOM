#!/usr/bin/env python3
"""
BIM2BOM Complete Workflow Test Script

This script tests the entire workflow from IFC model to Peppol catalogue:
1. Environment check
2. IFC to XML conversion (IfcConvert)
3. XML to Peppol transformation
4. Excel generation
5. Catalogue verification
6. Test report generation

Usage:
    python test_workflow.py [--skip-ifcconvert] [--keep-files]
    
Options:
    --skip-ifcconvert    Skip IFC conversion (use existing XML)
    --keep-files        Keep test output files after completion
"""

import sys
import os
import subprocess
import time
import argparse
from pathlib import Path
from datetime import datetime
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except:
        pass  # If it fails, continue with default encoding

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Symbol definitions with ASCII fallback
class Symbols:
    try:
        # Try Unicode symbols
        '▶'.encode(sys.stdout.encoding or 'utf-8')
        ARROW = '▶'
        CHECK = '✓'
        CROSS = '✗'
        WARNING = '⚠'
        CIRCLE = '○'
    except (UnicodeEncodeError, LookupError):
        # Fallback to ASCII
        ARROW = '>'
        CHECK = '+'
        CROSS = 'x'
        WARNING = '!'
        CIRCLE = 'o'

class TestResult:
    def __init__(self, name, status, duration, details=""):
        self.name = name
        self.status = status  # "PASS", "FAIL", "SKIP", "WARN"
        self.duration = duration
        self.details = details

class WorkflowTester:
    def __init__(self, skip_ifcconvert=False, keep_files=False):
        self.skip_ifcconvert = skip_ifcconvert
        self.keep_files = keep_files
        self.results = []
        self.start_time = datetime.now()
        
        # Paths
        self.project_root = Path(__file__).parent
        self.ifc_model = self.project_root / "models" / "A-40-V-000_BIM2BOM.ifc"
        self.ifcconvert_exe = self.project_root / "IfcConvert" / "IfcConvert.exe"
        self.xml_output = self.project_root / "IfcConvert" / "output" / "test_workflow.xml"
        self.peppol_output = self.project_root / "peppol-transformer" / "output" / "test_workflow_catalogue.xml"
        self.excel_output = self.peppol_output.with_suffix('.xlsx')
        self.xslt_stylesheet = self.project_root / "peppol-transformer" / "stylesheets" / "default-stylesheet-bip_to_peppol.xslt"
        self.transform_script = self.project_root / "peppol-transformer" / "scripts" / "transform_ifc_to_peppol.py"
        self.verify_script = self.project_root / "peppol-transformer" / "scripts" / "verify_catalogue.py"
        
        # ifcopenshell transformer paths
        self.ifc2peppol_script = self.project_root / "ifc2peppol" / "scripts" / "transform_ifc_to_peppol.py"
        self.ifc2peppol_output = self.project_root / "ifc2peppol" / "output" / "test_workflow_ifcopenshell_catalogue.xml"
        
    def print_header(self, text):
        """Print a formatted header."""
        print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{text:^70}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")
    
    def print_step(self, text):
        """Print a step message."""
        print(f"{Colors.OKCYAN}{Colors.BOLD}{Symbols.ARROW} {text}{Colors.ENDC}")
    
    def print_success(self, text):
        """Print a success message."""
        print(f"{Colors.OKGREEN}{Symbols.CHECK} {text}{Colors.ENDC}")
    
    def print_error(self, text):
        """Print an error message."""
        print(f"{Colors.FAIL}{Symbols.CROSS} {text}{Colors.ENDC}")
    
    def print_warning(self, text):
        """Print a warning message."""
        print(f"{Colors.WARNING}{Symbols.WARNING} {text}{Colors.ENDC}")
    
    def add_result(self, name, status, duration, details=""):
        """Add a test result."""
        result = TestResult(name, status, duration, details)
        self.results.append(result)
        return result
    
    def test_environment(self):
        """Test 1: Check environment and dependencies."""
        self.print_step("Test 1: Environment Check")
        start = time.time()
        
        try:
            # Check Python version
            python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
            print(f"  Python version: {python_version}")
            
            if sys.version_info < (3, 7):
                raise Exception("Python 3.7+ required")
            
            # Check required files
            required_files = [
                ("IFC model", self.ifc_model),
                ("XSLT stylesheet", self.xslt_stylesheet),
                ("Transform script", self.transform_script),
                ("Verify script", self.verify_script),
            ]
            
            if not self.skip_ifcconvert:
                required_files.insert(0, ("IfcConvert executable", self.ifcconvert_exe))
            
            missing_files = []
            for name, path in required_files:
                if path.exists():
                    self.print_success(f"{name}: {path.name}")
                else:
                    self.print_error(f"{name} not found: {path}")
                    missing_files.append(name)
            
            if missing_files:
                raise Exception(f"Missing files: {', '.join(missing_files)}")
            
            # Check Python dependencies
            print("\n  Checking dependencies:")
            dependencies = ['lxml', 'openpyxl', 'requests', 'ifcopenshell']
            missing_deps = []
            
            for dep in dependencies:
                try:
                    __import__(dep)
                    self.print_success(f"{dep}")
                except ImportError:
                    self.print_error(f"{dep} not installed")
                    missing_deps.append(dep)
            
            if missing_deps:
                raise Exception(f"Missing dependencies: {', '.join(missing_deps)}")
            
            # Check ifc2peppol script
            if self.ifc2peppol_script.exists():
                self.print_success(f"ifc2peppol script: {self.ifc2peppol_script.name}")
            else:
                self.print_error(f"ifc2peppol script not found: {self.ifc2peppol_script}")
                missing_files.append("ifc2peppol script")
            
            duration = time.time() - start
            self.add_result("Environment Check", "PASS", duration, "All requirements met")
            self.print_success(f"Environment check passed ({duration:.2f}s)")
            return True
            
        except Exception as e:
            duration = time.time() - start
            self.add_result("Environment Check", "FAIL", duration, str(e))
            self.print_error(f"Environment check failed: {e}")
            return False
    
    def test_ifc_to_xml(self):
        """Test 2: IFC to XML conversion."""
        if self.skip_ifcconvert:
            self.add_result("IFC to XML Conversion", "SKIP", 0, "Skipped by user")
            self.print_warning("Skipping IFC conversion (using existing XML)")
            
            if not self.xml_output.exists():
                self.print_error(f"XML file not found: {self.xml_output}")
                return False
            
            return True
        
        self.print_step("Test 2: IFC to XML Conversion")
        start = time.time()
        
        try:
            # Remove existing XML if present
            if self.xml_output.exists():
                self.xml_output.unlink()
                print(f"  Removed existing XML file")
            
            # Create output directory
            self.xml_output.parent.mkdir(parents=True, exist_ok=True)
            
            # Run IfcConvert
            cmd = [
                str(self.ifcconvert_exe),
                "--threads", "7",
                str(self.ifc_model),
                str(self.xml_output)
            ]
            
            print(f"  Running: {' '.join(cmd)}")
            result = subprocess.run(
                cmd,
                cwd=self.ifcconvert_exe.parent,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"IfcConvert failed with code {result.returncode}")
            
            # Check output file
            if not self.xml_output.exists():
                raise Exception("XML file not created")
            
            file_size_mb = self.xml_output.stat().st_size / (1024 * 1024)
            
            duration = time.time() - start
            details = f"Output: {file_size_mb:.2f} MB XML file"
            self.add_result("IFC to XML Conversion", "PASS", duration, details)
            self.print_success(f"IFC conversion completed ({duration:.2f}s) - {file_size_mb:.2f} MB")
            return True
            
        except subprocess.TimeoutExpired:
            duration = time.time() - start
            self.add_result("IFC to XML Conversion", "FAIL", duration, "Timeout (>300s)")
            self.print_error("IFC conversion timed out")
            return False
            
        except Exception as e:
            duration = time.time() - start
            self.add_result("IFC to XML Conversion", "FAIL", duration, str(e))
            self.print_error(f"IFC conversion failed: {e}")
            return False
    
    def test_xml_to_peppol(self):
        """Test 3: XML to Peppol transformation."""
        self.print_step("Test 3: XML to Peppol Transformation")
        start = time.time()
        
        try:
            # Remove existing catalogue if present
            if self.peppol_output.exists():
                self.peppol_output.unlink()
            
            # Create output directory
            self.peppol_output.parent.mkdir(parents=True, exist_ok=True)
            
            # Run transformation script
            cmd = [
                sys.executable,
                str(self.transform_script),
                str(self.xml_output),
                str(self.peppol_output)
            ]
            
            print(f"  Running transformation...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60  # 1 minute timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"Transformation failed: {result.stderr}")
            
            # Check output file
            if not self.peppol_output.exists():
                raise Exception("Peppol catalogue not created")
            
            # Parse output to get statistics
            from lxml import etree
            doc = etree.parse(str(self.peppol_output))
            ns = {'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2'}
            catalogue_lines = doc.xpath('//cac:CatalogueLine', namespaces=ns)
            
            file_size_kb = self.peppol_output.stat().st_size / 1024
            
            duration = time.time() - start
            details = f"{len(catalogue_lines)} catalogue lines, {file_size_kb:.2f} KB"
            self.add_result("XML to Peppol Transformation", "PASS", duration, details)
            self.print_success(f"Peppol transformation completed ({duration:.2f}s) - {len(catalogue_lines)} lines")
            return True
            
        except subprocess.TimeoutExpired:
            duration = time.time() - start
            self.add_result("XML to Peppol Transformation", "FAIL", duration, "Timeout (>60s)")
            self.print_error("Transformation timed out")
            return False
            
        except Exception as e:
            duration = time.time() - start
            self.add_result("XML to Peppol Transformation", "FAIL", duration, str(e))
            self.print_error(f"Transformation failed: {e}")
            return False
    
    def test_excel_generation(self):
        """Test 4: Excel generation."""
        self.print_step("Test 4: Excel Generation")
        start = time.time()
        
        try:
            # Remove existing Excel if present
            if self.excel_output.exists():
                self.excel_output.unlink()
            
            # Run transformation with Excel flag
            cmd = [
                sys.executable,
                str(self.transform_script),
                str(self.xml_output),
                str(self.peppol_output),
                "--excel"
            ]
            
            print(f"  Generating Excel file...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                raise Exception(f"Excel generation failed: {result.stderr}")
            
            # Check output file
            if not self.excel_output.exists():
                raise Exception("Excel file not created")
            
            # Check Excel file
            from openpyxl import load_workbook
            wb = load_workbook(str(self.excel_output))
            sheet_count = len(wb.sheetnames)
            
            file_size_kb = self.excel_output.stat().st_size / 1024
            
            duration = time.time() - start
            details = f"{sheet_count} sheets, {file_size_kb:.2f} KB"
            self.add_result("Excel Generation", "PASS", duration, details)
            self.print_success(f"Excel generation completed ({duration:.2f}s) - {sheet_count} sheets")
            return True
            
        except Exception as e:
            duration = time.time() - start
            self.add_result("Excel Generation", "FAIL", duration, str(e))
            self.print_error(f"Excel generation failed: {e}")
            return False
    
    def test_catalogue_verification(self):
        """Test 5: Catalogue verification."""
        self.print_step("Test 5: Catalogue Verification")
        start = time.time()
        
        try:
            # Run verification script
            cmd = [
                sys.executable,
                str(self.verify_script),
                str(self.peppol_output)
            ]
            
            print(f"  Running verification...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Parse verification output
            from lxml import etree
            doc = etree.parse(str(self.peppol_output))
            ns = {
                'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
                'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
            }
            
            # Run validation checks
            checks = []
            
            # Check 1: CustomizationID
            customization = doc.xpath('//cbc:CustomizationID/text()', namespaces=ns)
            checks.append(("CustomizationID present", len(customization) > 0))
            
            # Check 2: ProfileID
            profile = doc.xpath('//cbc:ProfileID/text()', namespaces=ns)
            checks.append(("ProfileID present", len(profile) > 0))
            
            # Check 3: Catalogue ID
            cat_id = doc.xpath('//cbc:ID/text()', namespaces=ns)
            checks.append(("Catalogue ID present", len(cat_id) > 0))
            
            # Check 4: All lines have Item/Name
            catalogue_lines = doc.xpath('//cac:CatalogueLine', namespaces=ns)
            item_names = doc.xpath('//cac:CatalogueLine/cac:Item/cbc:Name', namespaces=ns)
            checks.append(("All lines have Item/Name", len(catalogue_lines) == len(item_names)))
            
            # Check 5: All BIP props have NameCode
            bip_props = doc.xpath('//cac:AdditionalItemProperty', namespaces=ns)
            name_codes = doc.xpath('//cac:AdditionalItemProperty/cbc:NameCode', namespaces=ns)
            checks.append(("All BIP props have NameCode", len(bip_props) == len(name_codes)))
            
            # Check 6: All NameCodes have SE:BIP listID
            bip_list_ids = doc.xpath('//cac:AdditionalItemProperty/cbc:NameCode[@listID="SE:BIP"]', namespaces=ns)
            checks.append(("All NameCodes have SE:BIP listID", len(bip_props) == len(bip_list_ids)))
            
            # Print results
            passed = 0
            failed = 0
            for check_name, check_result in checks:
                if check_result:
                    self.print_success(check_name)
                    passed += 1
                else:
                    self.print_error(check_name)
                    failed += 1
            
            duration = time.time() - start
            
            if failed == 0:
                details = f"{passed}/{len(checks)} checks passed, {len(catalogue_lines)} lines, {len(bip_props)} BIP properties"
                self.add_result("Catalogue Verification", "PASS", duration, details)
                self.print_success(f"Verification completed ({duration:.2f}s) - All checks passed")
                return True
            else:
                details = f"{failed}/{len(checks)} checks failed"
                self.add_result("Catalogue Verification", "FAIL", duration, details)
                self.print_error(f"Verification failed: {failed} checks failed")
                return False
            
        except Exception as e:
            duration = time.time() - start
            self.add_result("Catalogue Verification", "FAIL", duration, str(e))
            self.print_error(f"Verification failed: {e}")
            return False
    
    def test_ifcopenshell_to_peppol(self):
        """Test: IFC to Peppol transformation using ifcopenshell."""
        self.print_step("Test: IFC to Peppol Transformation (ifcopenshell)")
        start = time.time()
        
        try:
            # Remove existing catalogue if present
            if self.ifc2peppol_output.exists():
                self.ifc2peppol_output.unlink()
            
            # Create output directory
            self.ifc2peppol_output.parent.mkdir(parents=True, exist_ok=True)
            
            # Run transformation script
            cmd = [
                sys.executable,
                str(self.ifc2peppol_script),
                str(self.ifc_model),
                str(self.ifc2peppol_output)
            ]
            
            print(f"  Running transformation...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120  # 2 minute timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"Transformation failed: {result.stderr}")
            
            # Check output file
            if not self.ifc2peppol_output.exists():
                raise Exception("Peppol catalogue not created")
            
            # Parse output to get statistics
            from lxml import etree
            doc = etree.parse(str(self.ifc2peppol_output))
            ns = {'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2'}
            catalogue_lines = doc.xpath('//cac:CatalogueLine', namespaces=ns)
            
            file_size_kb = self.ifc2peppol_output.stat().st_size / 1024
            
            duration = time.time() - start
            details = f"{len(catalogue_lines)} catalogue lines, {file_size_kb:.2f} KB"
            self.add_result("IFC to Peppol (ifcopenshell)", "PASS", duration, details)
            self.print_success(f"Peppol transformation completed ({duration:.2f}s) - {len(catalogue_lines)} lines")
            return True
            
        except subprocess.TimeoutExpired:
            duration = time.time() - start
            self.add_result("IFC to Peppol (ifcopenshell)", "FAIL", duration, "Timeout (>120s)")
            self.print_error("Transformation timed out")
            return False
            
        except Exception as e:
            duration = time.time() - start
            self.add_result("IFC to Peppol (ifcopenshell)", "FAIL", duration, str(e))
            self.print_error(f"Transformation failed: {e}")
            return False
    
    def compare_peppol_outputs(self):
        """Compare ifcconvert and ifcopenshell Peppol outputs."""
        self.print_step("Test: Compare Peppol Outputs")
        start = time.time()
        
        try:
            from lxml import etree
            
            # Load both XML files
            if not self.peppol_output.exists():
                raise Exception(f"ifcconvert output not found: {self.peppol_output}")
            if not self.ifc2peppol_output.exists():
                raise Exception(f"ifcopenshell output not found: {self.ifc2peppol_output}")
            
            doc_ifcconvert = etree.parse(str(self.peppol_output))
            doc_ifcopenshell = etree.parse(str(self.ifc2peppol_output))
            
            ns = {
                'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
                'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
            }
            
            # Compare catalogue lines
            lines_ifcconvert = doc_ifcconvert.xpath('//cac:CatalogueLine', namespaces=ns)
            lines_ifcopenshell = doc_ifcopenshell.xpath('//cac:CatalogueLine', namespaces=ns)
            
            print(f"  ifcconvert lines: {len(lines_ifcconvert)}")
            print(f"  ifcopenshell lines: {len(lines_ifcopenshell)}")
            
            differences = []
            
            # Check line count
            if len(lines_ifcconvert) != len(lines_ifcopenshell):
                differences.append(f"Line count mismatch: {len(lines_ifcconvert)} vs {len(lines_ifcopenshell)}")
            
            # Get all line IDs
            ids_ifcconvert = set()
            for line in lines_ifcconvert:
                id_elem = line.xpath('./cbc:ID/text()', namespaces=ns)
                if id_elem:
                    ids_ifcconvert.add(id_elem[0])
            
            ids_ifcopenshell = set()
            for line in lines_ifcopenshell:
                id_elem = line.xpath('./cbc:ID/text()', namespaces=ns)
                if id_elem:
                    ids_ifcopenshell.add(id_elem[0])
            
            # Check for missing IDs
            missing_in_ifcopenshell = ids_ifcconvert - ids_ifcopenshell
            extra_in_ifcopenshell = ids_ifcopenshell - ids_ifcconvert
            
            if missing_in_ifcopenshell:
                differences.append(f"Missing {len(missing_in_ifcopenshell)} IDs in ifcopenshell output")
                if len(missing_in_ifcopenshell) <= 10:
                    for missing_id in list(missing_in_ifcopenshell)[:10]:
                        differences.append(f"  - Missing: {missing_id}")
            
            if extra_in_ifcopenshell:
                differences.append(f"Extra {len(extra_in_ifcopenshell)} IDs in ifcopenshell output")
                if len(extra_in_ifcopenshell) <= 10:
                    for extra_id in list(extra_in_ifcopenshell)[:10]:
                        differences.append(f"  - Extra: {extra_id}")
            
            # Compare common elements (sample)
            common_ids = ids_ifcconvert & ids_ifcopenshell
            if common_ids:
                sample_ids = list(common_ids)[:5]  # Check first 5
                for line_id in sample_ids:
                    line_ifcconvert = doc_ifcconvert.xpath(f'//cac:CatalogueLine[cbc:ID/text()="{line_id}"]', namespaces=ns)[0]
                    line_ifcopenshell = doc_ifcopenshell.xpath(f'//cac:CatalogueLine[cbc:ID/text()="{line_id}"]', namespaces=ns)[0]
                    
                    # Compare Name (get first Item Name, not all Names)
                    name_ifcconvert = line_ifcconvert.xpath('.//cac:Item/cbc:Name/text()', namespaces=ns)
                    name_ifcopenshell = line_ifcopenshell.xpath('.//cac:Item/cbc:Name/text()', namespaces=ns)
                    name_ifcconvert_str = name_ifcconvert[0] if name_ifcconvert else ""
                    name_ifcopenshell_str = name_ifcopenshell[0] if name_ifcopenshell else ""
                    if name_ifcconvert_str != name_ifcopenshell_str:
                        differences.append(f"  ID {line_id}: Name mismatch - '{name_ifcconvert_str[:50]}' vs '{name_ifcopenshell_str[:50]}'")
            
            duration = time.time() - start
            
            if differences:
                details = f"{len(differences)} difference(s) found"
                self.add_result("Output Comparison", "FAIL", duration, details)
                self.print_error(f"Comparison failed: {len(differences)} difference(s)")
                for diff in differences[:20]:  # Show first 20 differences
                    print(f"    {diff}")
                return False
            else:
                details = f"Both outputs match: {len(lines_ifcconvert)} lines"
                self.add_result("Output Comparison", "PASS", duration, details)
                self.print_success(f"Comparison passed ({duration:.2f}s) - Outputs match")
                return True
                
        except Exception as e:
            duration = time.time() - start
            self.add_result("Output Comparison", "FAIL", duration, str(e))
            self.print_error(f"Comparison failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def cleanup(self):
        """Cleanup test files."""
        if self.keep_files:
            self.print_warning("Keeping test output files (--keep-files flag)")
            return
        
        self.print_step("Cleanup")
        
        files_to_remove = [
            self.peppol_output,
            self.excel_output,
            self.ifc2peppol_output,
        ]
        
        if not self.skip_ifcconvert:
            files_to_remove.append(self.xml_output)
        
        for file_path in files_to_remove:
            if file_path.exists():
                try:
                    file_path.unlink()
                    print(f"  Removed: {file_path.name}")
                except Exception as e:
                    self.print_warning(f"Could not remove {file_path.name}: {e}")
    
    def generate_report(self):
        """Generate test report."""
        self.print_header("TEST REPORT")
        
        total_duration = (datetime.now() - self.start_time).total_seconds()
        
        # Summary
        passed = sum(1 for r in self.results if r.status == "PASS")
        failed = sum(1 for r in self.results if r.status == "FAIL")
        skipped = sum(1 for r in self.results if r.status == "SKIP")
        
        print(f"Test Date:     {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total Duration: {total_duration:.2f}s")
        print(f"Tests Run:     {len(self.results)}")
        print(f"  {Colors.OKGREEN}Passed: {passed}{Colors.ENDC}")
        print(f"  {Colors.FAIL}Failed: {failed}{Colors.ENDC}")
        if skipped > 0:
            print(f"  {Colors.WARNING}Skipped: {skipped}{Colors.ENDC}")
        
        print(f"\n{Colors.BOLD}Detailed Results:{Colors.ENDC}\n")
        
        # Detailed results
        for i, result in enumerate(self.results, 1):
            status_color = {
                "PASS": Colors.OKGREEN,
                "FAIL": Colors.FAIL,
                "SKIP": Colors.WARNING,
                "WARN": Colors.WARNING
            }.get(result.status, "")
            
            status_symbol = {
                "PASS": Symbols.CHECK,
                "FAIL": Symbols.CROSS,
                "SKIP": Symbols.CIRCLE,
                "WARN": Symbols.WARNING
            }.get(result.status, "?")
            
            print(f"{i}. {status_color}{status_symbol} {result.name}{Colors.ENDC}")
            print(f"   Status: {status_color}{result.status}{Colors.ENDC}")
            print(f"   Duration: {result.duration:.2f}s")
            if result.details:
                print(f"   Details: {result.details}")
            print()
        
        # Final verdict
        print(f"{Colors.BOLD}{'='*70}{Colors.ENDC}")
        if failed == 0:
            print(f"{Colors.OKGREEN}{Colors.BOLD}{Symbols.CHECK} ALL TESTS PASSED - WORKFLOW IS PRODUCTION READY{Colors.ENDC}")
        else:
            print(f"{Colors.FAIL}{Colors.BOLD}{Symbols.CROSS} TESTS FAILED - PLEASE FIX ERRORS ABOVE{Colors.ENDC}")
        print(f"{Colors.BOLD}{'='*70}{Colors.ENDC}\n")
        
        return failed == 0
    
    def run(self):
        """Run all tests."""
        self.print_header("BIM2BOM WORKFLOW TEST SUITE")
        
        print(f"Project Root: {self.project_root}")
        print(f"Test Started: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Run tests in sequence
        tests = [
            ("Environment Check", self.test_environment),
            ("IFC to XML", self.test_ifc_to_xml),
            ("XML to Peppol", self.test_xml_to_peppol),
            ("IFC to Peppol (ifcopenshell)", self.test_ifcopenshell_to_peppol),
            ("Output Comparison", self.compare_peppol_outputs),
            ("Excel Generation", self.test_excel_generation),
            ("Verification", self.test_catalogue_verification),
        ]
        
        for test_name, test_func in tests:
            success = test_func()
            if not success and test_name in ["Environment Check", "IFC to XML", "XML to Peppol"]:
                # Critical test failed, stop execution
                self.print_error(f"Critical test '{test_name}' failed. Stopping execution.")
                break
            print()
        
        # Cleanup
        self.cleanup()
        print()
        
        # Generate report
        return self.generate_report()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Test the complete BIM2BOM workflow',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_workflow.py                    # Run all tests
  python test_workflow.py --skip-ifcconvert  # Skip IFC conversion
  python test_workflow.py --keep-files       # Keep test output files
        """
    )
    
    parser.add_argument('--skip-ifcconvert', action='store_true',
                       help='Skip IFC to XML conversion (use existing XML)')
    parser.add_argument('--keep-files', action='store_true',
                       help='Keep test output files after completion')
    
    args = parser.parse_args()
    
    # Create and run tester
    tester = WorkflowTester(
        skip_ifcconvert=args.skip_ifcconvert,
        keep_files=args.keep_files
    )
    
    success = tester.run()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

