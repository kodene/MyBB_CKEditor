::
:: Package CKEditor plugin for MyBB
::
@ECHO ON
CLS

set MYBB=Upload\inc
set CKBUILD=ckbuild\release
set CKEDITOR=Upload\jscripts\editor_themes\ckeditor

:: Make backup of previous archive
IF EXIST MyBB_CKEditor.tar.gz move MyBB_CKEditor.tar.gz MyBB_CKEditor_OLD.tar.gz
IF EXIST MyBB_CKEditor.tar move MyBB_CKEditor.tar MyBB_CKEditor_OLD.tar

:: Clear Upload directory from previous build
rmdir /S /Q Upload

:: Create inital directories
mkdir %MYBB%
mkdir %CKEDITOR%

:: Copy MyBB content into Upload
xcopy /Q /E /Y mybb\* %MYBB%

:: Copy CKEditor content into Upload
xcopy /Q /E /Y %CKBUILD%\images			%CKEDITOR%\images\
xcopy /Q /E /Y %CKBUILD%\lang			%CKEDITOR%\lang\
xcopy /Q /E /Y %CKBUILD%\plugins		%CKEDITOR%\plugins\
xcopy /Q /E /Y %CKBUILD%\skins			%CKEDITOR%\skins\
xcopy /Q /E /Y %CKBUILD%\themes			%CKEDITOR%\themes\
copy %CKBUILD%\ckeditor.js				%CKEDITOR%\
copy %CKBUILD%\mybb_config.js			%CKEDITOR%\

:: Create archive
cd Upload
7z a -ttar MyBB_CKEditor.tar inc jscripts
7z a -tgzip MyBB_CKEditor.tar.gz MyBB_CKEditor.tar
move MyBB_CKEditor.tar ..
move MyBB_CKEditor.tar.gz ..

pause