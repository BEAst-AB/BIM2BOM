<img width="1536" height="468" alt="427398987-fd756bf5-f736-415e-b223-2579367a7369" src="https://github.com/user-attachments/assets/a1c36490-7ba9-4f30-abd3-26fe6fbb9ad0" />

# BIM2BOM - Från digital modell till materiallista

## Vad är BIM2BOM?

BIM2BOM är ett projekt som skapar en obruten digital kedja från byggnadsmodeller (BIM) till materiallistor (BOM) för att effektivisera byggprocessen. Projektet utvecklar verktyg och standarder som gör det möjligt att automatiskt hämta materialdata direkt från digitala byggnadsmodeller och omvandla denna information till standardiserade format som kan användas i anbud, inköp och produktion.

## Varför behövs detta?

Idag används information i byggnadsmodeller huvudsakligen under projektering, men det finns liten koppling till faktiska inköp och budgetuppföljning under produktion. Detta leder till ineffektivitet, svårigheter med standardisering och utmaningar i att följa upp miljöpåverkan genom hela byggprocessen. BIM2BOM skapar en transparent och spårbar process där all information kommer från en källa - BIM-modellen.

## Vad innehåller projektet?

Projektet levererar verktyg och standarder för att:

- **Validera BIM-modeller** mot BEAst Modelleringskrav för att säkerställa att de innehåller rätt information
- **Konvertera IFC-filer** till XML-format för vidare bearbetning
- **Skapa Peppol-kataloger** med materialdata som kan användas i digitala handelsprocesser
- **Verifiera och validera** de genererade katalogerna för att säkerställa kvalitet

## Vem kan använda detta?

- **Byggherrar** får bättre kvalitetssäkring och mer exakta mängdavtagningar
- **Entreprenörer** får sömlös övergång från design till produktion med minskad risk för felbeställningar
- **Projektörer** får tydliga krav på vilken information som ska finnas i modellerna

## Tekniska komponenter

Projektet innehåller flera verktyg som arbetar tillsammans:

1. **BIM2BOM.ids** - Standard för vilken information som ska finnas i BIM-modeller, inkluderar MMI-krav (Model Maturity Index)
2. **BEAst-ifctester** - Verktyg för att validera IFC-filer mot kraven
3. **BEAst-BIP-type-tester** - Verktyg för att testa typbeteckningar
4. **ifcconvert** - Konverterar IFC-filer till XML-format med MMI-filtrering (≥375)
5. **peppol-transformer** - Omvandlar XML till Peppol-kataloger med MMI-validering och kvalitetskontroll

### MMI-filtrering (Model Maturity Index)

För att säkerställa hög datakvalitet använder BIM2BOM MMI-filtrering på nivå 375 eller högre. Detta innebär att endast modellelement med tillräcklig informationsmognad inkluderas i materiallistor och Peppol-kataloger. MMI-skalan följer standardiserade nivåer från 100 (grundläggande information) till 500 (as-built dokumentation).

## Resultat

Genom BIM2BOM skapas en digitaliserad, standardiserad och automatiserad process från BIM till levererad produkt som följer principerna i SS-EN ISO 19650. Detta bidrar till ökad transparens, bättre resursanvändning och minskade klimatutsläpp genom hela byggprocessen.
