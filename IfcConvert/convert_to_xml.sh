#!/bin/bash
# Convert IFC to XML using IfcConvert
# Usage: ./convert_to_xml.sh

set -e  # Exit on any error

# Set paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IFCCONVERT_PATH="$SCRIPT_DIR/IfcConvert"
INPUT_FILE="$SCRIPT_DIR/../models/A-40-V-000_BIM2BOM.ifc"
OUTPUT_FILE="$SCRIPT_DIR/output/A-40-V-000_BIM2BOM.ifc.xml"

# Check if IfcConvert exists
if [ ! -f "$IFCCONVERT_PATH" ]; then
    echo "Error: IfcConvert not found at $IFCCONVERT_PATH"
    exit 1
fi

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found at $INPUT_FILE"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/output"

# Make IfcConvert executable
chmod +x "$IFCCONVERT_PATH"

# Run IfcConvert with 7 threads
echo "Converting IFC to XML..."
echo "Input:  $INPUT_FILE"
echo "Output: $OUTPUT_FILE"
echo

"$IFCCONVERT_PATH" --threads 7 "$INPUT_FILE" "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo
    echo "Conversion completed successfully!"
    echo "Output saved to: $OUTPUT_FILE"
else
    echo
    echo "Conversion failed with error code: $?"
    exit $?
fi
