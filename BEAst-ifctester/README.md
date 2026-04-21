![beastlogotyp](https://github.com/user-attachments/assets/fd756bf5-f736-415e-b223-2579367a7369)

> ⚠️ 🚧 **WORK IN PROGRESS** 🚧 ⚠️
> 
> Detta projekt är **INTE KLART** och dokumentationen kan vara ofullständig eller ändras. Funktioner kan vara ofullständiga eller innehålla buggar.

# BEAst BIM IFC Validator

En webbaserad applikation för validering av BIM-modeller mot BEAst:s krav för IFC-modeller.

## Om projektet

Denna applikation möjliggör validering av IFC-modeller (Industry Foundation Classes) mot förutbestämda IDS-specifkationer (Information Delivery Specification). Projektet är byggt med That Open Components, ett ramverk för BIM-applikationer, och använder modern webbteknologi för att möjliggöra validering av BIM-modeller direkt i webbläsaren.

Applikationen låter användare:

- Ladda upp IFC-filer via webbläsarens fil-API
- Visa IFC-modeller i en interaktiv 3D-visare
- Validera modeller mot BEAst:s specifika IDS-krav
- Se detaljerade valideringsresultat för varje kontrollerat krav

## Nuvarande status

Projektet är under utveckling. För nuvarande stöds följande funktioner:

- ✅ Filuppladdning via dra-och-släpp eller filväljare
- ✅ Visning av 3D-modeller med grundläggande navigeringskontroller
- ✅ Laddning och analys av IDS-specifikationer
- ✅ Validering av IFC-modeller mot fördefinierade krav
- ✅ Visning av valideringsresultat i strukturerat format

**Begränsningar:**

- IDS-valideringen stödjer inte idag fullt ut alla kontroller
- Highlightingfunktionalitet för att markera problematiska element är under utveckling
- UI behöver ytterligare förbättringar för responsivitet

## Installation

För att installera och köra projektet lokalt:

```bash
# Klona repositoryt
git clone [repo-url]

# Navigera till projektmappen
cd BEAst\ Modelleringskrav

# Installera beroenden
npm install

# Starta utvecklingsservern
npm start
```

Applikationen kommer sedan att vara tillgänglig på `http://localhost:5173` (eller den port som Vite använder).

## Projektstruktur

```
├── src/
│   ├── app.ts                 # Huvudapplikationens startpunkt
│   ├── components/         
│   │   ├── Viewer.ts          # 3D-visningskomponent
│   │   ├── FileLoader.ts      # Filladdningskomponent
│   │   ├── IDSLoader.ts       # IDS-laddningskomponent
│   │   └── Validator.ts       # IDS-valideringskomponent
│   ├── utils/                 # Hjälpfunktioner
│   └── styles/                # CSS-stilar
├── public/                    # Statiska tillgångar
├── index.html                 # Huvudsida för applikationen
├── package.json               # Projektberoenden
└── styles.css                 # Globala stilar
```

## Teknologier

Projektet använder följande teknologier:

- **TypeScript** - För typning och bättre kodkvalitet
- **That Open Components** - Ramverk för BIM-applikationer
- **THREE.js** - För 3D-rendering
- **web-ifc** - För hantering av IFC-filer
- **Vite** - För utveckling och bygge

## Användning

1. Öppna applikationen i din webbläsare
2. Dra och släpp en IFC-fil på webbsidan eller klicka för att välja en fil
3. När filen laddats kommer 3D-modellen att visas i visningspanelen
4. Automatisk validering kommer att utföras mot BEAst:s IDS-specifikationer
5. Valideringsresultat visas i resultatpanelen

## Utvecklingsstatus

Detta projekt följer en iterativ utvecklingsprocess. Följande funktioner planeras för framtida versioner:

- Förbättrad highlighting av problematiska element i 3D-vyn
- Filter- och sorteringsfunktioner för valideringsresultat
- Objektegenskaper vid klick på 3D-modell
- Exportmöjligheter för valideringsresultat
- Optimerad prestanda för stora modeller
- Responsiv design som stödjer mobila enheter
- Förbättrad felhantering och användbarhet

## Bidrag

## Licens

## Kontakt
