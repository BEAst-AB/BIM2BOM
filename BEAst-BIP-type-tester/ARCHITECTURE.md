# BIM2BOM Validation Framework - Architecture

## 🏗️ System Architecture

### Complete System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  BIM2BOM Validation Framework                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────────┐
│   Centralized Config     │      Validation Methods              │
├──────────────────────────┼──────────────────────────────────────┤
│                          │  Method 1: Gherkin Framework ⭐      │
│  bip_type_name_id_       │  ┌────────────────────────────────┐  │
│  properties.csv          │  │ run_validation.py               │  │
│  ┌──────────────┐        │  │   ↓                             │  │
│  │ property_name│        │  │ python -m behave                │  │
│  │ data_type    │────────┼─→│   ↓                             │  │
│  │ required     │        │  │ features/environment.py         │  │
│  │ description  │        │  │   ↓ (loads IFC via ifcopenshell)│  │
│  └──────────────┘        │  │ features/rules/*.feature        │  │
│                          │  │   ↓                             │  │
│                          │  │ features/steps/*.py             │  │
│                          │  │   ↓ (loads CSV)                 │  │
│                          │  │ Validation Results              │  │
│                          │  └────────────────────────────────┘  │
│                          │                                      │
│                          │  Method 2: Standalone XML            │
│                          │  ┌────────────────────────────────┐  │
│                          │  │ validate_bip_type_name_id_xml.py│  │
│                          │  │   ↓ (loads CSV)                 │  │
│                          │──→│ XML Parser (ElementTree)        │  │
│                          │  │   ↓                             │  │
│                          │  │ Validation Logic                │  │
│                          │  │   ↓                             │  │
│                          │  │ TXT + JSON Reports              │  │
│                          │  └────────────────────────────────┘  │
│                          │                                      │
│                          │  Method 3: Standalone STEP           │
│                          │  ┌────────────────────────────────┐  │
│                          │  │ validate_bip_type_name_id.py    │  │
│                          │  │   ↓ (loads CSV)                 │  │
│                          │──→│ IfcOpenShell Parser             │  │
│                          │  │   ↓                             │  │
│                          │  │ Validation Logic                │  │
│                          │  │   ↓                             │  │
│                          │  │ TXT + JSON Reports              │  │
│                          │  └────────────────────────────────┘  │
└──────────────────────────┴──────────────────────────────────────┘
```

## 📁 Detailed Component Architecture

### Layer 1: Configuration (CSV)

```
features/resources/bip_type_name_id_properties.csv
│
├─ Defines: Which properties to validate
├─ Format: property_name, data_type, required, description
├─ Used by: ALL three validation methods
└─ Editable: Yes, changes take effect immediately
```

### Layer 2: Gherkin Features

```
features/rules/BIP001_Type-name-id-uniqueness.feature
│
├─ Language: Gherkin (Given-When-Then)
├─ Defines: Business rules in natural language
├─ Tags: @BIP, @version1
├─ Scenarios:
│   ├─ Consistency validation
│   └─ Uniqueness validation
└─ Executed by: Behave test runner
```

### Layer 3: Step Definitions

```
features/steps/
├─ __init__.py
│   └─ ValidationOutcome, OutcomeSeverity classes
│
├─ common_steps.py
│   ├─ @given("An {entity}")
│   ├─ @given("its attribute .{attribute}.")
│   ├─ @given("[its entity type] ^is^ '{type}'")
│   └─ @given("its .{attribute}. attribute ^is^ '{value}'")
│
└─ bip_steps.py
    ├─ load_bip_property_definitions()
    ├─ extract_bip_properties_step()
    ├─ @then("...identical values [according to the table]...")
    └─ @then("...unique combination [according to the table]...")
```

### Layer 4: Execution Environment

```
features/environment.py
│
├─ before_all() → Setup logging
├─ before_feature() → Load IFC file with ifcopenshell
├─ before_scenario() → Initialize context.instance_stack
└─ after_scenario() → Cleanup
```

### Layer 5: Runners

```
run_validation.py
│
├─ Simple CLI interface
├─ Builds behave command
├─ Runs: python -m behave ...
└─ Returns: Exit code (0=pass, 1=fail)
```

## 🔄 Data Flow

### Gherkin Framework Execution Flow

```
1. User runs:
   python run_validation.py "file.ifc" BIP001

2. run_validation.py executes:
   python -m behave -i BIP001 --define input=file.ifc

3. Behave loads:
   - behave.ini (configuration)
   - features/environment.py (hooks)
   - features/steps/*.py (step definitions)

4. before_feature() runs:
   - Opens IFC file with ifcopenshell
   - Stores in context.model

5. For each scenario:
   a. before_scenario() → Initialize context.instance_stack
   
   b. Background steps run:
      - Given An IfcElement → Filters all elements
      - Given its attribute .IsDefinedBy. → Navigates to definitions
      - ... more filters → Narrows to BIP property sets
      
   c. Then step runs:
      - Loads CSV properties
      - Extracts from filtered instances
      - Validates consistency or uniqueness
      - Asserts if violations found
   
   d. after_scenario() → Cleanup

6. Results displayed:
   - Feature summary
   - Scenario results (passed/failed)
   - Step details
   - Timing information
```

## 🎯 Validation Logic Flow

### Consistency Validation

```
Input: All IfcPropertySingleValue instances with Name='type name id'
  ↓
Load: Property names from CSV (required=true only)
  ↓
Extract: For each instance, get property values
  ↓
Group: By type_name_id value
  ↓
Check: Within each group, all properties identical?
  ↓
Report: Violations if properties differ
  ↓
Output: PASS or FAIL with details
```

### Uniqueness Validation

```
Input: All IfcPropertySingleValue instances with Name='type name id'
  ↓
Load: Property names from CSV (required=true only)
  ↓
Extract: For each instance, get property values
  ↓
Group: By property combination (tuple)
  ↓
Check: Each combination maps to only one type_name_id?
  ↓
Report: Violations if multiple type_name_ids found
  ↓
Output: PASS or FAIL with details
```

## 🔧 Technical Stack

### Core Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Test Framework** | Behave 1.2.6 | Gherkin/BDD execution |
| **IFC Parser** | IfcOpenShell | STEP format parsing |
| **XML Parser** | ElementTree | XML format parsing |
| **CSV Reader** | Python csv module | Configuration loading |
| **Path Handling** | pathlib.Path | Cross-platform paths |

### Dependencies

Minimal dependencies for easy deployment:
```
behave==1.2.6         # Gherkin test runner
ifcopenshell          # IFC file parsing
```

No Django, no Celery, no database - just the essentials!

## 📊 Extensibility Points

### 1. Add New Validation Rules

**Where**: `features/rules/BIPXXX_Rule-name.feature`

**How**:
```gherkin
Feature: BIP002 - New Rule
  Background:
    Given An IfcElement
    # Filter to what you need
  
  Scenario: Your check
    Then Your validation
```

### 2. Add Custom Step Definitions

**Where**: `features/steps/bip_steps.py`

**How**:
```python
@then("Your validation")
def step_your_validation(context):
    # Your logic
    pass
```

### 3. Add New Property Sets

**Where**: `features/resources/your_properties.csv`

**How**:
```csv
property_name,data_type,required,description
your_property,IfcText,true,Description
```

Reference in feature:
```gherkin
Then Properties must match [according to the table] 'your_properties'
```

### 4. Custom Formatters

**Where**: `features/environment.py`

**How**:
```python
def after_feature(context, feature):
    # Generate HTML report
    with open('report.html', 'w') as f:
        f.write(generate_html(context.validation_results))
```

### 5. Integration Points

- **CI/CD**: Return exit codes (0=pass, 1=fail)
- **Reports**: JSON output for automation
- **Logging**: Behave's built-in logging
- **Hooks**: Before/after hooks for custom actions

## 🎨 Design Principles

### 1. Separation of Concerns

- **Features** = Business logic (Gherkin)
- **Steps** = Implementation (Python)
- **Resources** = Configuration (CSV)
- **Environment** = Infrastructure (Setup/teardown)

### 2. Reusability

- Common steps reused across features
- CSV configuration reused across validators
- Patterns can be copied for new rules

### 3. Maintainability

- Single CSV to update
- Clear file organization
- Self-documenting Gherkin
- Minimal dependencies

### 4. Extensibility

- Add features without modifying code
- Add steps in isolated files
- Add CSV configs as needed
- No tight coupling

## 💡 Best Practices Implemented

### From ifc-gherkin-rules

✅ Gherkin syntax for rules  
✅ CSV-based configuration  
✅ Step definition patterns  
✅ Background for filtering  
✅ Table references: `[according to the table] 'name'`

### BIM2BOM-Specific

✅ Simplified setup (no Django)  
✅ Direct execution (no workers)  
✅ File-based reports  
✅ Multiple validation methods  
✅ Centralized configuration

## 🏆 Summary

**You now have**:

1. ✅ **Standalone Gherkin framework** - Complete BDD setup
2. ✅ **CSV-configured** - Centralized property definitions
3. ✅ **Three validators** - Gherkin, XML, STEP
4. ✅ **Working validation** - Finding real violations
5. ✅ **Extensible structure** - Ready for new rules
6. ✅ **Production-ready** - Can use immediately

**All controlled by one CSV file**: `bip_type_name_id_properties.csv`

---

**Framework Status**: ✅ Complete  
**Test Status**: ✅ Working (found violation in '011')  
**Documentation**: ✅ Comprehensive  
**Ready for**: ✅ Production use & extension

