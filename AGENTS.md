# AGENTS.md

## Cursor Cloud specific instructions

### Repository overview

BIM2BOM is a monorepo with independent sub-projects (no shared build system). The core workflow is a Python CLI pipeline that converts IFC building models to Peppol e-procurement XML catalogues. Three React web apps provide visualization/simulation UIs.

### Key services


| Service             | Path                   | Run command   | Port |
| ------------------- | ---------------------- | ------------- | ---- |
| bimtobomsimulator   | `bimtobomsimulator/`   | `npm run dev` | 5173 |
| bim2bom-canvas-app  | `bim2bom-canvas-app/`  | `npm run dev` | 5174 |
| peppol-bip-explorer | `peppol-bip-explorer/` | `npm run dev` | 5175 |


### Python pipeline

- Three separate `requirements.txt` files: `peppol-transformer/scripts/`, `ifc2peppol/scripts/`, `BEAst-BIP-type-tester/scripts/`.
- `IfcConvert/IfcConvert` is a pre-built Linux ELF binary; ensure it has `+x` permission (`chmod +x IfcConvert/IfcConvert`).
- The E2E test script `test_workflow.py` references `IfcConvert.exe` (Windows path). On Linux, run `IfcConvert/IfcConvert` directly, or use `python test_workflow.py --skip-ifcconvert` after manually producing the XML with the Linux binary.
- The XSLT file `peppol-transformer/stylesheets/default-stylesheet-bip_to_peppol.xslt` contains `--` inside an XML comment (line 226), which newer lxml versions reject. Pin `lxml==6.0.2` to avoid breakage, or parse with `etree.XMLParser(recover=True)`.

### Linting

- `bimtobomsimulator`: `npm run lint` (ESLint, has 1 pre-existing error)
- `peppol-bip-explorer`: `npm run lint` (ESLint + TypeScript, has pre-existing errors)
- `bim2bom-canvas-app`: No lint script configured.

### Testing

- **E2E Python workflow**: `python test_workflow.py --skip-ifcconvert --keep-files` (see `TEST_README.md`)
- **BDD tests**: `cd BEAst-BIP-type-tester && python -m behave --define input=../models/A-40-V-000_BIM2BOM.ifc`
- **POC validation**: `cd POC-Leverables && python validate_all.py` (requires internet for external Peppol validator API)

### Gotchas

- Each React app uses `npm` (lockfile: `package-lock.json`). Do not use pnpm or yarn.
- `peppol-bip-explorer` uses Vite 5 (React 18), while the other two apps use Vite 7 (React 19). They are independent.
- `behave` binary installs to `~/.local/bin`; ensure it is on `PATH`.

