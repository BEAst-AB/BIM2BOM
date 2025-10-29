<?xml version="1.0" encoding="UTF-8"?>
<!--
    IFC to Peppol Catalogue XSLT Transformation
    
    This stylesheet transforms IFC XML files (exported from Revit or other BIM tools)
    into Peppol BIS Catalogue format with BIP (BIM In Production) property mapping.
    
    Version: 1.0
    Date: 2025-10-28
    XSLT Version: 2.0
    
    Input: IFC XML file with IfcWall elements and BIP property sets
    Output: Peppol Catalogue (UBL 2.1) with cac:AdditionalItemProperty for BIP properties
-->
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="urn:oasis:names:specification:ubl:schema:xsd:Catalogue-2"
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    exclude-result-prefixes="xsl xlink">
    
    <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
    
    <!-- Character translation for case conversion (XSLT 1.0 compatible) -->
    <xsl:variable name="lowercase" select="'abcdefghijklmnopqrstuvwxyz'"/>
    <xsl:variable name="uppercase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
    
    <!-- ========================================
         Global Variables - Project Information
         ======================================== -->
    
    <!-- Extract project metadata from IFC properties -->
    <xsl:variable name="projectNumber" select="//IfcPropertySingleValue[@Name='Project Number']/@NominalValue"/>
    <xsl:variable name="projectName" select="//IfcPropertySingleValue[@Name='Project Name']/@NominalValue"/>
    <xsl:variable name="organizationName" select="//IfcPropertySingleValue[@Name='Organization Name']/@NominalValue"/>
    <xsl:variable name="projectStatus" select="//IfcPropertySingleValue[@Name='Project Status']/@NominalValue"/>
    <xsl:variable name="issueDate" select="//ifc/header/file_name/time_stamp/text()"/>
    
    <!-- Fallback current date if IFC timestamp not available -->
    <xsl:variable name="catalogueDate">
        <xsl:choose>
            <xsl:when test="$issueDate">
                <xsl:value-of select="substring-before($issueDate, 'T')"/>
            </xsl:when>
            <xsl:otherwise>2025-10-28</xsl:otherwise>
        </xsl:choose>
    </xsl:variable>
    
    <!-- Key for efficient PropertySet lookup by ID -->
    <xsl:key name="propertySetById" match="//IfcPropertySet" use="@id"/>
    
    <!-- ========================================
         Root Template - Generate Catalogue
         ======================================== -->
    
    <xsl:template match="/">
        <xsl:processing-instruction name="DocumentTerm">Catalogue</xsl:processing-instruction>
        <xsl:processing-instruction name="Property">key="sch:prefix" PEPPOL-T19</xsl:processing-instruction>
        <xsl:processing-instruction name="Property">key="sch:identifier" T19-basic</xsl:processing-instruction>
        
        <Catalogue>
            <!-- Peppol BIS identifiers -->
            <cbc:CustomizationID>urn:fdc:peppol.eu:poacc:trns:catalogue:3</cbc:CustomizationID>
            <cbc:ProfileID>urn:fdc:peppol.eu:poacc:bis:catalogue_only:3</cbc:ProfileID>
            
            <!-- Catalogue metadata -->
            <cbc:ID>
                <xsl:choose>
                    <xsl:when test="$projectNumber">
                        <xsl:value-of select="$projectNumber"/>
                    </xsl:when>
                    <xsl:otherwise>CATALOGUE-001</xsl:otherwise>
                </xsl:choose>
            </cbc:ID>
            <cbc:ActionCode>Add</cbc:ActionCode>
            <cbc:Name>
                <xsl:choose>
                    <xsl:when test="$projectName">
                        <xsl:value-of select="$projectName"/>
                    </xsl:when>
                    <xsl:otherwise>BIM2BOM Catalogue</xsl:otherwise>
                </xsl:choose>
            </cbc:Name>
            <cbc:IssueDate>
                <xsl:value-of select="$catalogueDate"/>
            </cbc:IssueDate>
            
            <!-- Validity period (optional) -->
            <cac:ValidityPeriod>
                <cbc:StartDate>
                    <xsl:value-of select="$catalogueDate"/>
                </cbc:StartDate>
            </cac:ValidityPeriod>
            
            <!-- Referenced Contract (optional placeholder) -->
            <cac:ReferencedContract>
                <cbc:ID>
                    <xsl:choose>
                        <xsl:when test="$projectNumber">
                            <xsl:value-of select="concat('CONTRACT-', $projectNumber)"/>
                        </xsl:when>
                        <xsl:otherwise>CONTRACT-001</xsl:otherwise>
                    </xsl:choose>
                </cbc:ID>
            </cac:ReferencedContract>
            
            <!-- Provider Party (from IFC project organization) -->
            <cac:ProviderParty>
                <cbc:EndpointID schemeID="0007">0000000000</cbc:EndpointID>
                <cac:PartyIdentification>
                    <cbc:ID schemeID="0007">0000000000</cbc:ID>
                </cac:PartyIdentification>
                <cac:PartyLegalEntity>
                    <cbc:RegistrationName>
                        <xsl:choose>
                            <xsl:when test="$organizationName">
                                <xsl:value-of select="$organizationName"/>
                            </xsl:when>
                            <xsl:otherwise>Provider Organization</xsl:otherwise>
                        </xsl:choose>
                    </cbc:RegistrationName>
                </cac:PartyLegalEntity>
            </cac:ProviderParty>
            
            <!-- Receiver Party (placeholder) -->
            <cac:ReceiverParty>
                <cbc:EndpointID schemeID="0007">0000000000</cbc:EndpointID>
                <cac:PartyIdentification>
                    <cbc:ID schemeID="0007">0000000000</cbc:ID>
                </cac:PartyIdentification>
                <cac:PartyLegalEntity>
                    <cbc:RegistrationName>TBD</cbc:RegistrationName>
                </cac:PartyLegalEntity>
            </cac:ReceiverParty>
            
            <!-- Process all IfcWall elements -->
            <xsl:apply-templates select="//IfcWall"/>
            
        </Catalogue>
    </xsl:template>
    
    <!-- ========================================
         Template: IfcWall to CatalogueLine
         ======================================== -->
    
    <xsl:template match="IfcWall">
        <cac:CatalogueLine>
            <!-- Line ID: instance GlobalID -->
            <cbc:ID>
                <xsl:value-of select="@id"/>
            </cbc:ID>
            
            <!-- Action Code -->
            <cbc:ActionCode>Add</cbc:ActionCode>
            
            <!-- Orderable Indicator -->
            <cbc:OrderableIndicator>true</cbc:OrderableIndicator>
            
            <!-- Item Details -->
            <cac:Item>
                <!-- Process in correct UBL 2.1 order: Description BEFORE Name -->
                <xsl:call-template name="processItemContent">
                    <xsl:with-param name="wallElement" select="."/>
                </xsl:call-template>
                
            </cac:Item>
        </cac:CatalogueLine>
    </xsl:template>
    
    <!-- ========================================
         Template: Process Item Content in Correct Order
         ======================================== -->
    
    <xsl:template name="processItemContent">
        <xsl:param name="wallElement"/>
        
        <!-- Find BIP property set -->
        <xsl:for-each select="$wallElement/IfcPropertySet">
            <xsl:variable name="propSetId" select="substring-after(@xlink:href, '#')"/>
            <xsl:variable name="propSet" select="key('propertySetById', $propSetId)"/>
            
            <xsl:if test="$propSet[@Name='BIP']">
                <!-- Extract key properties for structure -->
                <xsl:variable name="typeDesc" select="$propSet/IfcPropertySingleValue[@Name='TypeDescription']/@NominalValue"/>
                <xsl:variable name="materials" select="$propSet/IfcPropertySingleValue[@Name='materials/components']/@NominalValue"/>
                <xsl:variable name="typeId" select="$propSet/IfcPropertySingleValue[@Name='type name id']/@NominalValue"/>
                <xsl:variable name="bsabCode" select="$propSet/IfcPropertySingleValue[@Name='BSAB 96']/@NominalValue"/>
                <xsl:variable name="manufacturer" select="$propSet/IfcPropertySingleValue[@Name='Manufacturer']/@NominalValue"/>
                
                <!-- 1. Name (REQUIRED) -->
                <cbc:Name>
                    <xsl:value-of select="$wallElement/@Name"/>
                </cbc:Name>
                
                <!-- 2. Description -->
                <xsl:if test="$typeDesc">
                    <cbc:Description>
                        <xsl:value-of select="$typeDesc"/>
                        <xsl:if test="$materials">
                            <xsl:text>. Materials: </xsl:text>
                            <xsl:value-of select="$materials"/>
                        </xsl:if>
                    </cbc:Description>
                </xsl:if>
                
                <!-- 3. BrandName (from BIP.Manufacturer if available, otherwise from type name id) -->
                <xsl:choose>
                    <xsl:when test="$manufacturer">
                        <cbc:BrandName>
                            <xsl:value-of select="$manufacturer"/>
                        </cbc:BrandName>
                    </xsl:when>
                </xsl:choose>
                
                <!-- 4. Keywords (derived from BSAB code, type, and other properties) -->
                <xsl:if test="$bsabCode">
                    <cbc:Keyword>
                        <xsl:value-of select="$bsabCode"/>
                    </cbc:Keyword>
                </xsl:if>
                
                <!-- Add keyword from wall type -->
                <xsl:variable name="wallType" select="$wallElement/@ObjectType"/>
                <xsl:if test="$wallType">
                    <cbc:Keyword>
                        <xsl:value-of select="$wallType"/>
                    </cbc:Keyword>
                </xsl:if>
                
                <!-- Add keyword if external/internal -->
                <xsl:variable name="isExternal" select="$propSet/IfcPropertySingleValue[@Name='is external']/@NominalValue"/>
                <xsl:if test="$isExternal">
                    <cbc:Keyword>
                        <xsl:choose>
                            <xsl:when test="translate($isExternal, 'TRUE', 'true') = 'true'">external wall</xsl:when>
                            <xsl:otherwise>internal wall</xsl:otherwise>
                        </xsl:choose>
                    </cbc:Keyword>
                </xsl:if>
                
                <!-- 5. ManufacturersItemIdentification -->
                <xsl:if test="$typeId">
                    <cac:ManufacturersItemIdentification>
                        <cbc:ID>
                            <xsl:value-of select="$typeId"/>
                        </cbc:ID>
                    </cac:ManufacturersItemIdentification>
                </xsl:if>
                
                <!-- 6. ManufacturerParty (only if BIP.Manufacturer exists) -->
                <xsl:if test="$manufacturer">
                    <cac:ManufacturerParty>
                        <cac:PartyName>
                            <cbc:Name>
                                <xsl:value-of select="$manufacturer"/>
                            </cbc:Name>
                        </cac:PartyName>
                    </cac:ManufacturerParty>
                </xsl:if>
                
                <!-- 7. ItemInstance (Optional - for lot/batch information) -->
                <xsl:variable name="lotNumber" select="$propSet/IfcPropertySingleValue[@Name='LotNumberID']/@NominalValue"/>
                
                <xsl:if test="$lotNumber">
                    <cac:ItemInstance>
                        <xsl:if test="$lotNumber">
                            <cac:LotIdentification>
                                <cbc:LotNumberID>
                                    <xsl:value-of select="$lotNumber"/>
                                </cbc:LotNumberID>
                            </cac:LotIdentification>
                        </xsl:if>
                    </cac:ItemInstance>
                </xsl:if>
                
                <!-- 8. AdditionalItemProperty (BIP properties) -->
                <xsl:apply-templates select="$propSet/IfcPropertySingleValue" mode="bip-property"/>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
    
    <!-- ========================================
         Template: BIP Property to AdditionalItemProperty
         ======================================== -->
    
    <xsl:template match="IfcPropertySingleValue" mode="bip-property">
        <xsl:variable name="propertyName" select="@Name"/>
        <xsl:variable name="propertyValue" select="@NominalValue"/>
        
        <!-- Only process properties with values -->
        <xsl:if test="$propertyValue and $propertyValue != ''">
            <cac:AdditionalItemProperty>
                <!-- Property Name -->
                <cbc:Name>
                    <xsl:value-of select="$propertyName"/>
                </cbc:Name>
                
                <!-- Property Name Code with BIP list identifier -->
                <cbc:NameCode listID="SE:BIP">
                    <xsl:value-of select="$propertyName"/>
                </cbc:NameCode>
                
                <!-- Property Value with human-readable unit suffix -->
                <cbc:Value>
                    <xsl:call-template name="formatValue">
                        <xsl:with-param name="propertyName" select="$propertyName"/>
                        <xsl:with-param name="value" select="$propertyValue"/>
                    </xsl:call-template>
                </cbc:Value>
                
                <!-- Property Value Quantity (for numeric values with units) -->
                <xsl:variable name="unitCode">
                    <xsl:call-template name="getUnitCode">
                        <xsl:with-param name="propertyName" select="$propertyName"/>
                    </xsl:call-template>
                </xsl:variable>
                
                <xsl:if test="$unitCode != ''">
                    <cbc:ValueQuantity unitCode="{$unitCode}">
                        <xsl:value-of select="$propertyValue"/>
                    </cbc:ValueQuantity>
                </xsl:if>
                
            </cac:AdditionalItemProperty>
        </xsl:if>
    </xsl:template>
    
    <!-- ========================================
         Named Template: Get Unit Code
         ======================================== -->
    
    <xsl:template name="getUnitCode">
        <xsl:param name="propertyName"/>
        
        <xsl:variable name="lowerName" select="translate($propertyName, $uppercase, $lowercase)"/>
        
        <xsl:choose>
            <!-- Millimeters (length dimensions) -->
            <xsl:when test="contains($lowerName, 'height') or 
                          contains($lowerName, 'length') or 
                          contains($lowerName, 'width') or 
                          contains($lowerName, 'thickness') or
                          contains($lowerName, 'diameter')">
                <xsl:text>MMT</xsl:text>
            </xsl:when>
            
            <!-- Square meters (area) -->
            <xsl:when test="contains($lowerName, 'area')">
                <xsl:text>MTK</xsl:text>
            </xsl:when>
            
            <!-- Cubic meters (volume) -->
            <xsl:when test="contains($lowerName, 'volume')">
                <xsl:text>MTQ</xsl:text>
            </xsl:when>
            
            <!-- Kilograms (weight) -->
            <xsl:when test="contains($lowerName, 'weight')">
                <xsl:text>KGM</xsl:text>
            </xsl:when>
            
            <!-- No unit code for text, boolean, or other properties -->
            <xsl:otherwise>
                <xsl:text></xsl:text>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <!-- ========================================
         Named Template: Format Value with Unit Suffix
         ======================================== -->
    
    <xsl:template name="formatValue">
        <xsl:param name="propertyName"/>
        <xsl:param name="value"/>
        
        <xsl:variable name="lowerName" select="translate($propertyName, $uppercase, $lowercase)"/>
        <xsl:variable name="lowerValue" select="translate($value, $uppercase, $lowercase)"/>
        
        <xsl:choose>
            <!-- Boolean values: translate to Yes/No -->
            <xsl:when test="$lowerValue = 'true' or $value = '1'">
                <xsl:text>Yes</xsl:text>
            </xsl:when>
            <xsl:when test="$lowerValue = 'false' or $value = '0'">
                <xsl:text>No</xsl:text>
            </xsl:when>
            
            <!-- Dimension values: add mm suffix if not already present -->
            <xsl:when test="(contains($lowerName, 'height') or 
                           contains($lowerName, 'length') or 
                           contains($lowerName, 'width') or 
                           contains($lowerName, 'thickness') or
                           contains($lowerName, 'diameter')) and 
                           not(contains($value, 'mm'))">
                <xsl:value-of select="concat($value, ' mm')"/>
            </xsl:when>
            
            <!-- Area values: add m² suffix if not already present -->
            <xsl:when test="contains($lowerName, 'area') and not(contains($value, 'm'))">
                <xsl:value-of select="concat($value, ' m²')"/>
            </xsl:when>
            
            <!-- Volume values: add m³ suffix if not already present -->
            <xsl:when test="contains($lowerName, 'volume') and not(contains($value, 'm'))">
                <xsl:value-of select="concat($value, ' m³')"/>
            </xsl:when>
            
            <!-- Weight values: add kg suffix if not already present -->
            <xsl:when test="contains($lowerName, 'weight') and not(contains($value, 'kg'))">
                <xsl:value-of select="concat($value, ' kg')"/>
            </xsl:when>
            
            <!-- Default: return value as-is -->
            <xsl:otherwise>
                <xsl:value-of select="$value"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
</xsl:stylesheet>
