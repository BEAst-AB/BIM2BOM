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

### Convert IFC to XML (Basic)
```batch
# Windows
IfcConvert.exe --threads 7 input.ifc output.xml

# Linux/macOS
./IfcConvert --threads 7 input.ifc output.xml
```

### Convert IFC to XML med MMI-filtrering (BIM2BOM)
```batch
# Windows - endast element med BIP.MMI >= 375
IfcConvert.exe --threads 7 --include="*[BIP.MMI>=375]" input.ifc output.xml

# Linux/macOS - endast element med BIP.MMI >= 375
./IfcConvert --threads 7 --include='*[BIP.MMI>=375]' input.ifc output.xml
```

**MMI-filtrering:** Använd `--include` parameter för att filtrera modellelement baserat på Model Maturity Index (MMI). Tröskelvärdet 375 säkerställer att endast element med tillräcklig detaljeringsgrad inkluderas i materiallistor och upphandlingsdokument.

### Convert IFC to OBJ
```batch
# Windows
IfcConvert.exe input.ifc output.obj

# Linux/macOS
./IfcConvert input.ifc output.obj
```

## Common Options

- `--threads N` - Use N threads for processing (default: 4)
- `--include SELECTOR` - Filter elements using selector syntax (t.ex. `*[BIP.MMI>=375]`)
- `--exclude SELECTOR` - Exclude elements using selector syntax
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
