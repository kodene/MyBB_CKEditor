::
:: Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
:: For licensing, see LICENSE.html or http://ckeditor.com/license
::

@ECHO OFF

CLS
ECHO.

:: rmdir /S /Q release
rmdir /S /Q ../../..\ckbuild\ 2> NUL

java -jar ckreleaser/ckreleaser.jar ckreleaser.release ../.. ../../../ckbuild "3.6.3 (mybb)" ckeditor_3.6.3_mybb --run-before-release=langtool.bat

pause
