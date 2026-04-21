# BEAst BIM Validering - Krav och Plan

## Projektöversikt

En webbaserad BIM-applikation som använder That Open Components för att ladda IFC-filer, validera dem mot IDS-krav (Information Delivery Specification) och visa valideringsresultaten för användarna.

## Krav

### Funktionella krav

1. **Filhantering**

   - [X] Applikationen ska uppmana användare att välja en IFC-fil vid start
   - [X] Stöd för val av lokala filer via webbläsarens fil-API
   - [ ] Visa en laddningsindikator medan filer bearbetas
2. **IFC-visning**

   - [X] Ladda och visa den valda IFC-modellen i en 3D-visare
   - [X] Tillhandahålla grundläggande navigeringskontroller (panorera, zooma, rotera)
   - [ ] Visa modellstruktur/hierarki
   - [ ] Klicka på objekt för att visa properties
3. **IDS-laddning**

   - [X] Ladda den fördefinierade IDS-filen (`BIM2BOM.ids`) från rotkatalogen
   - [X] Analysera IDS-specifikationerna med hjälp av IDSSpecifications-komponenten
   - [X] Stöd för felhantering vid problem med IDS-laddning
4. **IDS-validering**

   - [X] Validera den laddade IFC-filen mot de fördefinierade IDS-specifikationerna
   - [X] Använd IDSSpecifications-klassen från That Open Components
   - [X] Bearbeta validering asynkront utan att blockera användargränssnittet
   - [X] Generera godkänt/underkänt-resultat för varje kontrollerat krav
5. **Resultatvisning**

   - [X] Presentera valideringsresultat med hjälp av IDSCheckResult-gränssnittet
   - [X] Visa godkända/underkända kontroller i ett strukturerat, lättförståeligt format
   - [ ] Markera felaktiga element direkt i 3D-modellvyn
   - [ ] Låt användare filtrera och sortera valideringsresultat
6. **Användargränssnitt**

   - [ ] Rent, responsivt användargränssnitt kompatibelt med stationära och mobila enheter
   - [X] Tydligt separerade paneler för modellvisning och valideringsresultat
   - [ ] Möjlighet att exportera valideringsresultat

### Icke-funktionella krav

1. **Prestanda**

   - [X] Ladda och bearbeta medelstora IFC-filer (<100MB) inom rimlig tid
   - [ ] Behåll responsivt användargränssnitt under validering
   - [ ] Optimera minnesanvändning vid arbete med stora modeller
2. **Användbarhet**

   - [X] Intuitivt gränssnitt som kräver minimal utbildning
   - [X] Tydlig visuell återkoppling för alla operationer
   - [ ] Hjälpsamma felmeddelanden
3. **Kompatibilitet**

   - [ ] Stöd för moderna webbläsare (Chrome, Firefox, Safari, Edge)
   - [ ] Responsiv design för olika skärmstorlekar

## Teknisk arkitektur

### Teknologier

- **Frontend-ramverk**: Vanilla JavaScript/TypeScript med That Open Components
- **3D-motor**: THREE.js via That Open Components
- **IFC-bearbetning**: web-ifc och That Open Components
- **UI-komponenter**: @thatopen/ui för gränssnittselement

### Kärnkomponenter

1. **OBC.Components**: Huvudbehållare för alla komponenter
2. **OBC.Worlds**: Hanterar 3D-scenen
3. **OBC.FragmentsManager**: Hanterar geometrifragmenten
4. **OBC.IfcLoader**: Laddar IFC-filer
5. **OBC.IDSSpecifications**: Hanterar IDS-valideringsregler
6. **OBC.IDSCheckResult**: Presenterar valideringsresultat
7. **OBC.Highlighter**: Markerar element i 3D-visaren baserat på valideringsresultat
