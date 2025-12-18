# IFC2Peppol Use Cases

## Overview

This document describes practical use cases for the IFC2Peppol transformer, explaining when and how to use it in real-world scenarios within the BIM2BOM project context.

## Target Users

### 1. Building Owners (Byggherrar)

**Primary Need:** Quality assurance and accurate quantity take-offs from BIM models

**Use Case:** Automated Material Lists for Procurement
- Extract complete material lists directly from BIM models
- Ensure all elements meet quality standards (MMI >= 375)
- Generate standardized Peppol catalogues for supplier tendering
- Track materials from design to production

**Benefits:**
- Reduced manual work in quantity take-offs
- Consistent data quality across projects
- Better cost control and budget tracking
- Full traceability from BIM to procurement

**Example Workflow:**
```
1. Receive IFC model from architect/engineer
2. Validate model against BIM2BOM.ids requirements
3. Run IFC2Peppol transformer
4. Review generated Peppol catalogue
5. Send catalogue to suppliers for quotations
6. Compare quotations based on standardized format
```

### 2. Contractors (Entreprenörer)

**Primary Need:** Seamless transition from design files to procurement systems

**Use Case:** Production-Ready Material Lists
- Convert BIM models to procurement-ready catalogues
- Filter only production-ready elements (MMI >= 375)
- Reduce risk of incorrect material orders
- Better cost tracking during production

**Benefits:**
- Eliminates manual data entry errors
- Faster procurement process
- Reduced risk of incorrect orders
- Better integration with ERP systems

**Example Workflow:**
```
1. Receive approved IFC model from client
2. Transform to Peppol catalogue
3. Import catalogue into ERP/procurement system
4. Generate purchase orders automatically
5. Track deliveries against catalogue items
```

### 3. Designers/Engineers (Projektörer)

**Primary Need:** Clear requirements on model information quality

**Use Case:** Model Quality Validation
- Validate BIM models against BIM2BOM requirements
- Ensure BIP property sets are correctly populated
- Verify MMI levels meet production standards
- Generate test catalogues to verify completeness

**Benefits:**
- Clear quality requirements
- Direct feedback on model completeness
- Reduced rework in later project phases
- Better collaboration with contractors

**Example Workflow:**
```
1. Develop BIM model with BIP property sets
2. Run validation against BIM2BOM.ids
3. Generate test Peppol catalogue
4. Review catalogue completeness
5. Adjust model based on feedback
6. Deliver validated model to client
```

### 4. Suppliers (Leverantörer)

**Primary Need:** Standardized product information for e-procurement

**Use Case:** Product Catalogue Integration
- Receive standardized Peppol catalogues from clients
- Match products against catalogue requirements
- Provide quotations in compatible format
- Integrate with e-procurement platforms

**Benefits:**
- Standardized communication format
- Better visibility in procurement process
- Reduced manual quotation work
- Integration with digital procurement systems

## Common Scenarios

### Scenario 1: New Construction Project

**Context:** Large residential building project with detailed BIM model

**Requirements:**
- Complete material list for all building elements
- Standardized format for supplier tendering
- Production-ready data (MMI >= 375)
- Traceability from design to production

**Process:**
1. Architect delivers IFC model with BIP properties
2. Validate model quality
3. Transform to Peppol catalogue
4. Review and validate catalogue
5. Distribute to suppliers
6. Collect quotations
7. Award contracts
8. Track deliveries against catalogue

**Expected Output:**
- Peppol catalogue with 200-500 catalogue lines
- All major building elements included
- Complete property information
- Ready for supplier integration

### Scenario 2: Renovation Project

**Context:** Existing building renovation with mixed new/existing elements

**Requirements:**
- Separate new and existing elements
- Complete specifications for new elements
- Integration with existing procurement systems
- Compliance with renovation standards

**Process:**
1. Survey existing building
2. Create BIM model with renovation elements
3. Mark new vs. existing elements (BIP property)
4. Transform to Peppol catalogue
5. Filter for new elements only
6. Generate procurement catalogue

**Expected Output:**
- Peppol catalogue with only new elements
- Clear marking of renovation status
- Complete specifications for procurement
- Integration-ready format

### Scenario 3: Prefabricated Components

**Context:** Prefabricated building elements with manufacturer specifications

**Requirements:**
- Include manufacturer information
- Product codes and specifications
- Standardized format for ordering
- Integration with manufacturer systems

**Process:**
1. Design with prefabricated components
2. Include manufacturer data in BIP properties
3. Transform to Peppol catalogue
4. Manufacturer information included automatically
5. Send catalogue to manufacturer
6. Generate production orders

**Expected Output:**
- Peppol catalogue with manufacturer parties
- Product identification codes
- Complete specifications
- Ready for manufacturer integration

### Scenario 4: Multi-Stage Project

**Context:** Large project divided into multiple construction phases

**Requirements:**
- Separate catalogues per phase
- Track materials per phase
- Stage-specific procurement
- Overall project tracking

**Process:**
1. Create phase-specific IFC models
2. Transform each phase separately
3. Generate phase-specific catalogues
4. Track procurement per phase
5. Aggregate for overall project view

**Expected Output:**
- Multiple Peppol catalogues (one per phase)
- Phase-specific material lists
- Individual procurement tracking
- Overall project aggregation capability

## Technical Use Cases

### Use Case 1: Direct IFC Processing

**When to Use:** When you have IFC files and want to skip intermediate XML conversion

**Advantages:**
- Faster processing
- No intermediate files
- Lower memory usage
- Simplified workflow

**Example:**
```bash
python scripts/transform_ifc_to_peppol.py model.ifc
```

### Use Case 2: Batch Processing

**When to Use:** Processing multiple IFC files or project phases

**Process:**
```bash
# Process multiple files
for file in models/*.ifc; do
    python scripts/transform_ifc_to_peppol.py "$file"
done
```

**Output:** Multiple catalogues, one per input file

### Use Case 3: Integration with CI/CD

**When to Use:** Automated validation in development pipelines

**Process:**
1. Commit IFC model to repository
2. CI/CD pipeline runs validation
3. Generate Peppol catalogue
4. Validate against schema
5. Report results

**Benefits:**
- Automated quality checks
- Early detection of issues
- Consistent validation
- Reduced manual effort

### Use Case 4: Quality Assurance

**When to Use:** Validating model completeness before delivery

**Process:**
1. Transform IFC to Peppol
2. Check number of catalogue lines
3. Verify property completeness
4. Compare against expected counts
5. Report missing elements

**Metrics:**
- Elements processed
- Elements passing MMI filter
- Properties extracted
- Catalogue lines generated

## Integration Scenarios

### Integration 1: ERP Systems

**System:** SAP, Oracle, Microsoft Dynamics

**Process:**
1. Generate Peppol catalogue
2. Convert to ERP format (if needed)
3. Import into ERP system
4. Generate purchase orders
5. Track deliveries

**Benefits:**
- Eliminates manual data entry
- Reduces errors
- Faster procurement
- Better cost tracking

### Integration 2: Procurement Platforms

**Platform:** Peppol network, e-procurement systems

**Process:**
1. Generate Peppol catalogue
2. Validate against Peppol BIS
3. Upload to platform
4. Distribute to suppliers
5. Collect quotations

**Benefits:**
- Standardized format
- Network compatibility
- Automated distribution
- Digital quotations

### Integration 3: BIM Management Systems

**System:** BIM 360, Autodesk Construction Cloud, Procore

**Process:**
1. Extract IFC from BIM platform
2. Transform to Peppol
3. Link catalogue to BIM model
4. Track procurement status
5. Update BIM with delivery information

**Benefits:**
- Bidirectional data flow
- Complete traceability
- Integrated workflow
- Real-time updates

## Performance Considerations

### Small Projects (< 100 elements)

**Typical Use:** Small buildings, renovations

**Performance:**
- Processing time: < 2 seconds
- Memory usage: < 50 MB
- Output size: < 100 KB

**Considerations:**
- Fast enough for interactive use
- Can process multiple files quickly
- Suitable for batch operations

### Medium Projects (100-500 elements)

**Typical Use:** Residential buildings, small commercial

**Performance:**
- Processing time: 3-10 seconds
- Memory usage: 50-150 MB
- Output size: 100-500 KB

**Considerations:**
- Good balance of speed and features
- Suitable for most projects
- Can handle complex models

### Large Projects (500-2000 elements)

**Typical Use:** Large commercial, industrial buildings

**Performance:**
- Processing time: 10-30 seconds
- Memory usage: 150-300 MB
- Output size: 500 KB - 2 MB

**Considerations:**
- May require longer processing
- Consider batch processing
- Monitor memory usage

### Very Large Projects (2000+ elements)

**Typical Use:** Complex buildings, infrastructure

**Performance:**
- Processing time: 30+ seconds
- Memory usage: 300-500 MB
- Output size: 2+ MB

**Considerations:**
- May benefit from phase-based processing
- Consider splitting models
- Monitor system resources

## Best Practices

### 1. Model Preparation

**Before Transformation:**
- ✅ Validate IFC file opens correctly
- ✅ Ensure BIP property sets exist
- ✅ Verify MMI >= 375 on elements
- ✅ Check required properties are populated
- ✅ Use BIM2BOM.ids validation

### 2. Element Type Selection

**Considerations:**
- Current hardcoded types cover most use cases
- If needed, modify `IFC_ELEMENT_TYPES` list
- Test with sample data first
- Document any customizations

### 3. Property Mapping

**Ensure:**
- BIP property set name is exactly "BIP"
- Property names match expected values
- Required properties are present
- Values are formatted correctly

### 4. Quality Assurance

**After Transformation:**
- ✅ Validate XML structure
- ✅ Check catalogue line count
- ✅ Verify property completeness
- ✅ Use BEAst Supply Validator
- ✅ Review sample catalogue lines

### 5. Integration

**When Integrating:**
- Validate Peppol format first
- Test with sample data
- Handle errors gracefully
- Monitor processing times
- Document integration points

## Troubleshooting by Use Case

### Issue: No Elements Processed

**Possible Causes:**
- Element types not in hardcoded list
- Missing BIP property sets
- MMI values below 375

**Solutions:**
- Check element types in model
- Verify BIP property sets exist
- Review MMI values
- Consider adjusting thresholds

### Issue: Missing Properties

**Possible Causes:**
- BIP property set not named correctly
- Properties not populated in model
- Property names don't match

**Solutions:**
- Validate against BIM2BOM.ids
- Check property set naming
- Review property population
- Use BEAst-ifctester

### Issue: Performance Issues

**Possible Causes:**
- Very large models
- Complex geometry
- System resource limits

**Solutions:**
- Split models by phase
- Process in batches
- Increase system resources
- Consider alternative workflows

## Future Enhancements

Potential improvements for future versions:

1. **Configurable Element Types**: Allow configuration file instead of hardcoding
2. **Batch Processing**: Built-in support for multiple files
3. **Property Mapping Config**: Customizable property mappings
4. **Progress Reporting**: Better progress indicators for large models
5. **Error Recovery**: Continue processing after errors
6. **Validation Integration**: Built-in Peppol validation
7. **API Interface**: REST API for integration
8. **Database Output**: Direct database integration

## References

- **BIM2BOM Project**: See main README.md
- **Workflow Documentation**: See WORKFLOW.md
- **BEAst Supply Validator**: https://bis.beast.se/
- **Peppol BIS**: https://peppol.eu/








