#!/usr/bin/env python3
"""
Cursor afterFileEdit hook: validates POC XML files against the BIM2BOM reference.

Reads hook JSON from stdin, checks if the edited file is a POC XML,
runs the validation script, and returns additional_context with any issues.
"""

import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent.parent
VALIDATOR = SCRIPT_DIR / "skills" / "validate-xml-reference" / "scripts" / "validate_xml_reference.py"


def main():
    raw = sys.stdin.read()
    try:
        hook_input = json.loads(raw)
    except json.JSONDecodeError:
        print("{}")
        return

    file_path = hook_input.get("filePath", "")
    if not file_path:
        print("{}")
        return

    p = Path(file_path)
    if p.suffix.lower() != ".xml":
        print("{}")
        return

    normalized = p.as_posix()
    if "POC-Leverables" not in normalized:
        print("{}")
        return

    if not p.is_file():
        print("{}")
        return

    try:
        result = subprocess.run(
            [sys.executable, str(VALIDATOR), str(p)],
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("{}")
        return

    stdout = result.stdout.strip()
    if result.returncode == 0:
        print("{}")
        return

    context_lines = [f"XML Reference Validation issues in {p.name}:"]
    try:
        issues_data = json.loads(stdout)
        for fname, file_issues in issues_data.items():
            for issue in file_issues:
                sev = issue.get("severity", "info").upper()
                elem = issue.get("element", "?")
                msg = issue.get("message", "")
                context_lines.append(f"  [{sev}] {elem}: {msg}")
    except (json.JSONDecodeError, AttributeError):
        context_lines.append(f"  Raw output: {stdout[:500]}")

    print(json.dumps({"additional_context": "\n".join(context_lines)}))


if __name__ == "__main__":
    main()
