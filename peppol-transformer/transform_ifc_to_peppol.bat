@echo off
REM IFC to Peppol Catalogue Transformation (Windows Batch)
REM 
REM Usage: transform_ifc_to_peppol.bat <input_ifc.xml> [output_catalogue.xml]
REM
REM Creates both XML and Excel outputs automatically
REM
REM Example: transform_ifc_to_peppol.bat ..\A-40-V-000_BIM2BOM.ifc.xml output.xml

setlocal

if "%~1"=="" (
    echo Usage: transform_ifc_to_peppol.bat ^<input_ifc.xml^> [output_catalogue.xml]
    echo.
    echo Creates both XML and Excel ^(.xlsx^) outputs automatically
    echo.
    echo Example:
    echo   transform_ifc_to_peppol.bat ..\A-40-V-000_BIM2BOM.ifc.xml output.xml
    exit /b 1
)

set "INPUT_FILE=%~1"

if not exist "%INPUT_FILE%" (
    echo ERROR: Input file not found: %INPUT_FILE%
    exit /b 1
)

if "%~2"=="" (
    set "OUTPUT_FILE=%~dp0output\%~n1_peppol_catalogue.xml"
) else (
    set "OUTPUT_FILE=%~2"
)

REM Set Excel output path (same as XML but with .xlsx extension)
set "EXCEL_FILE=%OUTPUT_FILE:.xml=.xlsx%"

set "XSLT_FILE=%~dp0stylesheets\default-stylesheet-bip_to_peppol.xslt"

if not exist "%XSLT_FILE%" (
    echo ERROR: XSLT stylesheet not found: %XSLT_FILE%
    exit /b 1
)

echo ============================================================
echo IFC to Peppol Catalogue Transformation
echo ============================================================
echo.
echo Input:      %INPUT_FILE%
echo XSLT:       %XSLT_FILE%
echo XML Output: %OUTPUT_FILE%
echo Excel Out:  %EXCEL_FILE%
echo.

REM Try Python with lxml first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Python transformation...
    python "%~dp0scripts\transform_ifc_to_peppol.py" "%INPUT_FILE%" "%OUTPUT_FILE%" --excel
    if %errorlevel% equ 0 (
        echo.
        echo Transformation completed successfully!
        echo.
        echo XML Output:   %OUTPUT_FILE%
        echo Excel Output: %EXCEL_FILE%
        exit /b 0
    ) else (
        echo Python transformation failed. Check that lxml and openpyxl are installed.
        echo Install with: pip install lxml openpyxl
        exit /b 1
    )
)

REM If Python not available, suggest alternatives
echo Python not found. Please install Python and required libraries:
echo.
echo   1. Install Python from https://www.python.org/
echo   2. Run: pip install lxml openpyxl
echo   3. Run this script again
echo.
echo Note: Both XML and Excel outputs will be created automatically
echo.

exit /b 1
