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
mkdir %CKEDITOR%\plugins

:: Copy MyBB content into Upload
xcopy /Q /E /Y mybb\* %MYBB%

:: Copy CKEditor content into Upload
xcopy /Q /E /Y %CKBUILD%\images				%CKEDITOR%\images\
xcopy /Q /E /Y %CKBUILD%\plugins\image		%CKEDITOR%\plugins\image\
xcopy /Q /E /Y %CKBUILD%\plugins\link		%CKEDITOR%\plugins\link\
xcopy /Q /E /Y %CKBUILD%\plugins\mybb		%CKEDITOR%\plugins\mybb\
xcopy /Q /E /Y %CKBUILD%\plugins\mybbcode	%CKEDITOR%\plugins\mybbcode\
xcopy /Q /E /Y %CKBUILD%\plugins\mybbvideo	%CKEDITOR%\plugins\mybbvideo\
xcopy /Q /E /Y %CKBUILD%\plugins\smiley		%CKEDITOR%\plugins\smiley\
xcopy /Q /E /Y %CKBUILD%\skins\mybb			%CKEDITOR%\skins\mybb\
xcopy /Q /E /Y %CKBUILD%\themes				%CKEDITOR%\themes\
copy %CKBUILD%\ckeditor.js					%CKEDITOR%\
copy %CKBUILD%\mybb_config.js				%CKEDITOR%\
copy %CKBUILD%\lang\en.js					%CKEDITOR%\lang\

:: Create archive
7z a -tzip MyBB_CKEditor-PACKAGE.zip Upload LICENSE README

pause