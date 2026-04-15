#!/usr/bin/env python3
"""
Validate Peppol Catalogue XML files against the BIM2BOM XML Message Reference.

Checks namespace correctness, required elements, UBL element ordering,
ComponentRelatedItem integrity, traceable/standard catalogue consistency,
AdditionalItemProperty listID values, known property names, and GTIN format.

Usage:
    python validate_xml_reference.py <file.xml> [file2.xml ...]
"""

import json
import re
import sys
from pathlib import Path

try:
    from lxml import etree
except ImportError:
    print(json.dumps([{
        "severity": "error",
        "element": "dependency",
        "message": "lxml is required. Install with: pip install lxml",
        "line": 0,
    }]))
    sys.exit(1)


def _safe_parse(filepath):
    """Parse XML with entity resolution and network access disabled (XXE-safe)."""
    parser = etree.XMLParser(resolve_entities=False, no_network=True)
    return etree.parse(filepath, parser)  # noqa: AIK_python_B320 -- safe parser used

NS = {
    "cat": "urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2",
    "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
}

EXPECTED_CUSTOMIZATION_ID = "urn:fdc:peppol.eu:poacc:trns:catalogue:3"
EXPECTED_PROFILE_ID = "urn:fdc:peppol.eu:poacc:bis:catalogue_only:3"

VALID_HEADER_ACTION_CODES = {"Add", "Replace", "Update", "Delete"}
VALID_LINE_ACTION_CODES = {"Add", "Update", "Delete"}

VALID_LIST_IDS = {"ORG:BEAst", "SE:BIP-koder"}

KNOWN_BEAST_PROPERTIES = {"AuthoringToolId", "CDEGuid"}

DISALLOWED_BEAST_PROPERTIES = {
    "ItemType", "ParentAuthoringToolId", "ParentItemID", "RecipeArticle",
    "SourceSystem", "Traceability", "LeadTime",
}

KNOWN_BIP_PROPERTIES = {
    "thickness", "height", "width", "length", "net area", "net volume",
    "weight", "is load bearing", "is external", "floor", "TypeID", "MMI",
    "FireRating", "AcousticRating", "Colour", "Material",
    "type name id", "Manufacturer", "TypeDescription", "BSAB 96",
    "materials/components", "StatusConstruction",
    "renovation component status", "SystemName",
    "Flow_l/s", "InsulationThickness", "HeatingPower_W",
    "Voltage_V", "Current_A", "PowerElectrical_W", "IPClass",
    "LotNumberID", "ObjectType",
}

ITEM_CHILD_ORDER = [
    "Description", "Name", "PackQuantity", "PackSizeNumeric",
    "BrandName", "Keyword",
    "BuyersItemIdentification", "SellersItemIdentification",
    "ManufacturersItemIdentification", "StandardItemIdentification",
    "ItemSpecificationDocumentReference",
    "OriginCountry", "CommodityClassification",
    "TransactionConditions", "HazardousItem",
    "ClassifiedTaxCategory", "AdditionalItemProperty",
    "ManufacturerParty", "Certificate", "Dimension",
]


def _line(el):
    return el.sourceline if el is not None and hasattr(el, "sourceline") else 0


def _local(tag):
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def validate_file(path):
    issues = []

    try:
        tree = _safe_parse(str(path))
    except etree.XMLSyntaxError as exc:
        return [{"severity": "error", "element": "XML", "message": str(exc), "line": 0}]

    root = tree.getroot()

    if root.tag != f"{{{NS['cat']}}}Catalogue":
        issues.append({
            "severity": "error",
            "element": "Catalogue",
            "message": f"Root element must be UBL Catalogue. Found: {root.tag} (Ref: Section 2.1)",
            "line": _line(root),
        })
        return issues

    def _get_text(parent, xpath):
        el = parent.find(xpath, NS)
        return (el.text.strip() if el is not None and el.text else None), el

    cid, cid_el = _get_text(root, "cbc:CustomizationID")
    if cid is None:
        issues.append({"severity": "error", "element": "cbc:CustomizationID", "message": "Missing required element (Ref: Section 2.2)", "line": _line(root)})
    elif cid != EXPECTED_CUSTOMIZATION_ID:
        issues.append({"severity": "error", "element": "cbc:CustomizationID", "message": f"Expected '{EXPECTED_CUSTOMIZATION_ID}', found '{cid}' (Ref: Section 2.2)", "line": _line(cid_el)})

    pid, pid_el = _get_text(root, "cbc:ProfileID")
    if pid is None:
        issues.append({"severity": "error", "element": "cbc:ProfileID", "message": "Missing required element (Ref: Section 2.2)", "line": _line(root)})
    elif pid != EXPECTED_PROFILE_ID:
        issues.append({"severity": "error", "element": "cbc:ProfileID", "message": f"Expected '{EXPECTED_PROFILE_ID}', found '{pid}' (Ref: Section 2.2)", "line": _line(pid_el)})

    for tag, section in [("cbc:ID", "2.3"), ("cbc:ActionCode", "2.4"), ("cbc:IssueDate", "2.6")]:
        val, el = _get_text(root, tag)
        if val is None:
            issues.append({"severity": "error", "element": tag, "message": f"Missing required header element (Ref: Section {section})", "line": _line(root)})

    ac, ac_el = _get_text(root, "cbc:ActionCode")
    if ac and ac not in VALID_HEADER_ACTION_CODES:
        issues.append({"severity": "error", "element": "cbc:ActionCode", "message": f"Invalid header ActionCode '{ac}'. Must be one of {VALID_HEADER_ACTION_CODES} (Ref: Section 2.4)", "line": _line(ac_el)})

    # ValidityPeriod EndDate check (Ref §2.7)
    vp = root.find("cac:ValidityPeriod", NS)
    if vp is not None:
        end_date = vp.find("cbc:EndDate", NS)
        if end_date is None:
            issues.append({"severity": "warning", "element": "cac:ValidityPeriod", "message": "Missing cbc:EndDate in ValidityPeriod (Ref: Section 2.7)", "line": _line(vp)})

    # SourceCatalogueReference for seller responses (Ref §2.9)
    source_cat_ref = root.find("cac:SourceCatalogueReference", NS)
    cat_name_text, _ = _get_text(root, "cbc:Name")
    cat_id_text, _ = _get_text(root, "cbc:ID")
    combined = f"{cat_name_text or ''} {cat_id_text or ''}".lower()
    is_likely_response = ("response" in combined or "seller" in combined or "svar" in combined)
    if is_likely_response and source_cat_ref is None:
        issues.append({"severity": "warning", "element": "cac:SourceCatalogueReference", "message": "Seller response catalogues should include SourceCatalogueReference (Ref: Section 2.9)", "line": _line(root)})

    for party_tag, section in [("cac:ProviderParty", "3.1"), ("cac:ReceiverParty", "3.2")]:
        party = root.find(party_tag, NS)
        if party is None:
            issues.append({"severity": "error", "element": party_tag, "message": f"Missing required party (Ref: Section {section})", "line": _line(root)})
        else:
            for sub, desc in [("cbc:EndpointID", "EndpointID"), ("cac:PartyIdentification", "PartyIdentification"), ("cac:PartyLegalEntity", "PartyLegalEntity")]:
                if party.find(sub, NS) is None:
                    issues.append({"severity": "error", "element": f"{party_tag}/{sub}", "message": f"Missing {desc} in {party_tag} (Ref: Section {section})", "line": _line(party)})

    lines = root.findall("cac:CatalogueLine", NS)
    if not lines:
        issues.append({"severity": "error", "element": "cac:CatalogueLine", "message": "Catalogue must contain at least one CatalogueLine (Ref: Section 4)", "line": _line(root)})

    line_ids = set()
    line_id_map = {}
    for cat_line in lines:
        lid, lid_el = _get_text(cat_line, "cbc:ID")
        if lid is None:
            issues.append({"severity": "error", "element": "cac:CatalogueLine/cbc:ID", "message": "Missing line identifier (Ref: Section 4.1)", "line": _line(cat_line)})
        else:
            if lid in line_ids:
                issues.append({"severity": "error", "element": "cac:CatalogueLine/cbc:ID", "message": f"Duplicate line ID '{lid}' (Ref: Section 4.1)", "line": _line(lid_el)})
            line_ids.add(lid)
            line_id_map[lid] = cat_line

    for cat_line in lines:
        lid, _ = _get_text(cat_line, "cbc:ID")
        lid = lid or "?"

        lac, lac_el = _get_text(cat_line, "cbc:ActionCode")
        if lac and lac not in VALID_LINE_ACTION_CODES:
            issues.append({"severity": "error", "element": f"Line {lid}/cbc:ActionCode", "message": f"Invalid line ActionCode '{lac}'. Must be one of {VALID_LINE_ACTION_CODES} (Ref: Section 4.2)", "line": _line(lac_el)})

        comp_items = cat_line.findall("cac:ComponentRelatedItem", NS)
        for ci in comp_items:
            ci_id, ci_id_el = _get_text(ci, "cbc:ID")
            if ci_id and ci_id not in line_ids:
                issues.append({"severity": "error", "element": f"Line {lid}/cac:ComponentRelatedItem", "message": f"References non-existent CatalogueLine ID '{ci_id}' (Ref: Section 5.1)", "line": _line(ci_id_el)})
            if ci_id == lid:
                issues.append({"severity": "error", "element": f"Line {lid}/cac:ComponentRelatedItem", "message": "Line references itself as parent (Ref: Section 5.1)", "line": _line(ci_id_el)})

        item = cat_line.find("cac:Item", NS)
        if item is None:
            issues.append({"severity": "error", "element": f"Line {lid}/cac:Item", "message": "Missing cac:Item (Ref: Section 7)", "line": _line(cat_line)})
            continue

        child_locals = [_local(ch.tag) for ch in item if isinstance(ch.tag, str)]
        filtered = [n for n in child_locals if n in ITEM_CHILD_ORDER]
        expected_indices = [ITEM_CHILD_ORDER.index(n) for n in filtered]
        if expected_indices != sorted(expected_indices):
            issues.append({"severity": "warning", "element": f"Line {lid}/cac:Item", "message": f"UBL element ordering violation. Found sequence: {filtered} (Ref: Section 7, element ordering)", "line": _line(item)})

        # Minimum item identification (Ref §1.4, §7)
        has_buyers = item.find("cac:BuyersItemIdentification", NS) is not None
        has_sellers = item.find("cac:SellersItemIdentification", NS) is not None
        has_standard = item.find("cac:StandardItemIdentification", NS) is not None
        if not (has_buyers or has_sellers or has_standard):
            issues.append({"severity": "warning", "element": f"Line {lid}/cac:Item", "message": "No item identification found. At least one of BuyersItemIdentification, SellersItemIdentification, or StandardItemIdentification should be present (Ref: Section 1.4, 7)", "line": _line(item)})

        gtin_el = item.find("cac:StandardItemIdentification/cbc:ID", NS)
        if gtin_el is not None:
            scheme = gtin_el.get("schemeID", "")
            val = (gtin_el.text or "").strip()
            if scheme == "0160" and not re.fullmatch(r"\d{13}", val):
                issues.append({"severity": "warning", "element": f"Line {lid}/StandardItemIdentification", "message": f"GTIN should be a 13-digit number, found '{val}' (Ref: Section 7.4)", "line": _line(gtin_el)})

        props = item.findall("cac:AdditionalItemProperty", NS)
        for prop in props:
            name_code = prop.find("cbc:NameCode", NS)
            prop_name, _ = _get_text(prop, "cbc:Name")
            if name_code is not None:
                list_id = name_code.get("listID", "")
                if list_id and list_id not in VALID_LIST_IDS:
                    issues.append({"severity": "warning", "element": f"Line {lid}/AdditionalItemProperty[{prop_name}]", "message": f"Unknown listID '{list_id}'. Expected one of {VALID_LIST_IDS} (Ref: Section 10)", "line": _line(name_code)})
                elif list_id == "ORG:BEAst" and prop_name in DISALLOWED_BEAST_PROPERTIES:
                    issues.append({"severity": "error", "element": f"Line {lid}/AdditionalItemProperty[{prop_name}]", "message": f"BEAst property '{prop_name}' is not used in BIM2BOM POC (Ref: Section 10.1)", "line": _line(prop)})
                elif list_id == "ORG:BEAst" and prop_name and prop_name not in KNOWN_BEAST_PROPERTIES:
                    issues.append({"severity": "warning", "element": f"Line {lid}/AdditionalItemProperty[{prop_name}]", "message": f"Unrecognized BEAst property '{prop_name}' (Ref: Section 10.1)", "line": _line(prop)})
                elif list_id == "SE:BIP-koder" and prop_name and prop_name not in KNOWN_BIP_PROPERTIES:
                    issues.append({"severity": "warning", "element": f"Line {lid}/AdditionalItemProperty[{prop_name}]", "message": f"Unrecognized BIP property '{prop_name}' (Ref: Section 10.2)", "line": _line(prop)})

    def _get_cdeguid(cat_line_el):
        item_el = cat_line_el.find("cac:Item", NS)
        if item_el is None:
            return None
        for p in item_el.findall("cac:AdditionalItemProperty", NS):
            nc = p.find("cbc:NameCode", NS)
            if nc is not None and nc.get("listID") == "ORG:BEAst" and (nc.text or "").strip() == "CDEGuid":
                v = p.find("cbc:Value", NS)
                return (v.text or "").strip() if v is not None else None
        return None

    for cat_line in lines:
        lid, _ = _get_text(cat_line, "cbc:ID")
        lid = lid or "?"
        comp_items = cat_line.findall("cac:ComponentRelatedItem", NS)
        child_cdeguid = _get_cdeguid(cat_line)

        for ci in comp_items:
            parent_id, _ = _get_text(ci, "cbc:ID")
            if parent_id and parent_id in line_id_map:
                parent_cdeguid = _get_cdeguid(line_id_map[parent_id])
                if child_cdeguid and parent_cdeguid and child_cdeguid != parent_cdeguid:
                    issues.append({"severity": "error", "element": f"Line {lid}", "message": f"Traceable catalogue violation: child CDEGuid '{child_cdeguid}' differs from parent CDEGuid '{parent_cdeguid}' (Ref: Section 5.2, 10.1 CDEGuid)", "line": _line(cat_line)})

    return issues


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <file.xml> [file2.xml ...]", file=sys.stderr)
        sys.exit(2)

    all_issues = {}
    for arg in sys.argv[1:]:
        for p in [Path(arg)] if not any(c in arg for c in "*?[") else Path(".").glob(arg):
            if p.is_file() and p.suffix.lower() == ".xml":
                issues = validate_file(p)
                if issues:
                    all_issues[str(p)] = issues

    if all_issues:
        print(json.dumps(all_issues, indent=2, ensure_ascii=False))
        sys.exit(1)
    else:
        print(json.dumps({"status": "ok", "message": "All files conform to the XML Message Reference."}))
        sys.exit(0)


if __name__ == "__main__":
    main()
