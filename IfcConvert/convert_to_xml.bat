@echo off
REM Convert IFC to XML using IfcConvert
REM Usage: Run this batch file to convert the IFC file to XML

setlocal

REM Set paths
set IFCCONVERT_PATH=%~dp0IfcConvert.exe
set INPUT_FILE=%~dp0..\models\A-40-V-000_BIM2BOM.ifc
set OUTPUT_FILE=%~dp0output\A-40-V-000_BIM2BOM.xml

REM Check if IfcConvert exists
if not exist "%IFCCONVERT_PATH%" (
    echo Error: IfcConvert.exe not found at %IFCCONVERT_PATH%
    exit /b 1
)

REM Check if input file exists
if not exist "%INPUT_FILE%" (
    echo Error: Input file not found at %INPUT_FILE%
    exit /b 1
)

REM Create output directory if it doesn't exist
if not exist "%~dp0output" mkdir "%~dp0output"

REM Run IfcConvert with 7 threads
echo Converting IFC to XML...
echo Input:  %INPUT_FILE%
echo Output: %OUTPUT_FILE%
echo.

"%IFCCONVERT_PATH%" --threads 7 "%INPUT_FILE%" "%OUTPUT_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Conversion completed successfully!
    echo Output saved to: %OUTPUT_FILE%
) else (
    echo.
    echo Conversion failed with error code: %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

endlocal

