# IfcConvert

IfcConvert is a command-line utility for converting IFC (Industry Foundation Classes) files to various output formats including XML, OBJ, DAE, STP, and more.

## Usage

### Windows
```batch
IfcConvert.exe [options] input.ifc output.ext
```

### Linux/macOS
```bash
./IfcConvert [options] input.ifc output.ext
```

## Quick Start

### Convert IFC to XML
```batch
# Windows
IfcConvert.exe --threads 7 input.ifc output.xml

# Linux/macOS
./IfcConvert --threads 7 input.ifc output.xml
```

### Convert IFC to OBJ
```batch
# Windows
IfcConvert.exe input.ifc output.obj

# Linux/macOS
./IfcConvert input.ifc output.obj
```

## Common Options

- `--threads N` - Use N threads for processing (default: 4)
- `--help` - Show help message
- `--validate` - Validate geometrical output
- `--use-element-names` - Use element names instead of IDs
- `--use-element-guids` - Use element GUIDs instead of IDs

## Supported Output Formats

- **XML** - Structured XML representation
- **OBJ** - 3D model format
- **DAE** - COLLADA 3D model format
- **STP** - STEP format
- **SVG** - 2D vector graphics
- **glTF** - 3D transmission format

## Examples

### Convert with validation
```batch
IfcConvert.exe --validate --threads 8 model.ifc model.xml
```

### Convert to OBJ with element names
```batch
IfcConvert.exe --use-element-names model.ifc model.obj
```

### Convert to SVG with auto-sections
```batch
IfcConvert.exe --auto-section model.ifc model.svg
```

## Documentation

For complete documentation and all available options, visit:
https://docs.ifcopenshell.org/ifcconvert/usage.html

## Credits

IfcConvert is part of the IfcOpenShell project, an open source (LGPL) software library that helps users and software developers to work with the IFC file format.

**IfcOpenShell Contributors** - Copyright © 2011-2025

For more information about IfcOpenShell, visit: https://ifcopenshell.org/
