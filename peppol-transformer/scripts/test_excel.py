from openpyxl import load_workbook

wb = load_workbook('output/A-40-V-000_BIM2BOM_peppol_catalogue.xlsx')
cat_sheet = wb['Catalogue']

print(f'Total columns: {cat_sheet.max_column}')
print(f'Total rows: {cat_sheet.max_row}')
print(f'\nFirst 20 column headers:')
for i in range(1, min(21, cat_sheet.max_column + 1)):
    print(f'{i}. {cat_sheet.cell(1, i).value}')

print(f'\nSample data from row 2:')
for i in range(1, min(21, cat_sheet.max_column + 1)):
    value = cat_sheet.cell(2, i).value
    if value:
        print(f'{cat_sheet.cell(1, i).value}: {value}')




