---
name: validate-xml-reference
description: >-
  Validate Peppol catalogue XML files against the BIM2BOM XML Message Reference.
  Use when creating, editing, or reviewing XML files in POC-Leverables/, or when
  the user asks to check XML compliance, validate catalogue structure, or verify
  BIM2BOM XML patterns.
---

# Validate XML Against BIM2BOM Reference

## When to Use

- After creating or modifying Peppol catalogue XML in `POC-Leverables/`
- When the user asks to validate, check, or review XML files
- When a hook reports validation issues that need investigation

## Run Validation

```bash
python .cursor/skills/validate-xml-reference/scripts/validate_xml_reference.py <path-to-xml>
```

Multiple files:

```bash
python .cursor/skills/validate-xml-reference/scripts/validate_xml_reference.py POC-Leverables/**/*.xml
```

## Interpret Results

The script outputs JSON. Each issue has:
- `severity`: `error` or `warning`
- `element`: XPath or element name
- `message`: What is wrong and which reference section applies
- `line`: approximate line number (when available)

Zero issues = the file conforms to the reference.

The script does not enforce prose in `cbc:Description` or `cbc:Name` against `cac:ItemSpecificationDocumentReference`; for that pairing, also apply [Section 8](POC-Leverables/XML_MESSAGE_REFERENCE.md#8-item-name-and-description) and [Section 9](POC-Leverables/XML_MESSAGE_REFERENCE.md#9-item-specification-document-reference) manually or via the project rule.

## Fix Issues

Cross-reference each issue with [XML_MESSAGE_REFERENCE.md](POC-Leverables/XML_MESSAGE_REFERENCE.md) to understand the correct pattern. Report findings to the user with the specific section number.

## Requirements

- Python 3.8+
- `lxml` (already used by the project's transformer scripts)
