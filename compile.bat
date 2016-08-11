set PATH=%CYGWIN_HOME%\bin;%PATH%

:: Check if 'make.exe' exist
IF EXIST %CYGWIN_HOME%\bin\make.exe (
ECHO make.exe exist.
) ELSE (
cp make.exe %CYGWIN_HOME%\bin\

)
bash compile.sh
