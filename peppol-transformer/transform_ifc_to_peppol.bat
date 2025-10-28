@echo off
REM IFC to Peppol Catalogue Transformation (Windows Batch)
REM 
REM Usage: transform_ifc_to_peppol.bat <input_ifc.xml> [output_catalogue.xml]
REM
REM Example: transform_ifc_to_peppol.bat ..\A-40-V-000_BIM2BOM.ifc.xml output.xml

setlocal

if "%~1"=="" (
    echo Usage: transform_ifc_to_peppol.bat ^<input_ifc.xml^> [output_catalogue.xml]
    echo.
    echo Example:
    echo   transform_ifc_to_peppol.bat ..\A-40-V-000_BIM2BOM.ifc.xml output.xml
    exit /b 1
)

set INPUT_FILE=%~1

if not exist "%INPUT_FILE%" (
    echo ERROR: Input file not found: %INPUT_FILE%
    exit /b 1
)

if "%~2"=="" (
    set OUTPUT_FILE=%~dp0output\%~n1_peppol_catalogue.xml
) else (
    set OUTPUT_FILE=%~2
)

set XSLT_FILE=%~dp0Stylesheet-ifc_to_peppol_catalogue.xslt

if not exist "%XSLT_FILE%" (
    echo ERROR: XSLT stylesheet not found: %XSLT_FILE%
    exit /b 1
)

echo ============================================================
echo IFC to Peppol Catalogue Transformation
echo ============================================================
echo.
echo Input:  %INPUT_FILE%
echo XSLT:   %XSLT_FILE%
echo Output: %OUTPUT_FILE%
echo.

REM Try Python with lxml first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Python transformation...
    python "%~dp0scripts\transform_ifc_to_peppol.py" "%INPUT_FILE%" "%OUTPUT_FILE%"
    if %errorlevel% equ 0 (
        echo.
        echo Transformation completed successfully!
        exit /b 0
    ) else (
        echo Python transformation failed. Check that lxml is installed.
        echo Install with: pip install lxml
        exit /b 1
    )
)

REM If Python not available, suggest alternatives
echo Python not found. Please install Python and lxml, or use Saxon:
echo.
echo   1. Install Python from https://www.python.org/
echo   2. Run: pip install lxml
echo   3. Run this script again
echo.
echo Alternative: Download Saxon-HE from https://sourceforge.net/projects/saxon/
echo Then run: java -jar saxon-he-X.X.jar -s:"%INPUT_FILE%" -xsl:"%XSLT_FILE%" -o:"%OUTPUT_FILE%"
echo.

exit /b 1

