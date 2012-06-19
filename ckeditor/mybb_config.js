/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

CKEDITOR.editorConfig = function( config )
{
	config.extraPlugins = 'mybb,autogrow,mybbcode,mybbvideo';
	config.removePlugins = 'bidi,dialogadvtab,div,elementspath,filebrowser,find,format,forms,iframe,liststyle,newpage,pagebreak,pastefromword,preview,print,scayt,showborders,stylescombo,table,tabletools,wsc';
	config.fontSize_sizes = 'XX Small/xx-small;X Small/x-small;Small/small;Medium/medium;Large/large;X Large/x-large;XX Large/xx-large';
	config.font_names = 'Arial;Courier;Impact;Tahoma;Times New Roman;Trebuchet MS;Verdana';
	config.skin = 'mybb';
	config.smiley_path = '/';
	config.forcePasteAsPlainText = true;
	config.autoGrow_maxHeight = '500';
	config.dialog_backgroundCoverColor = 'rgb(0,0,0)';
	config.dialog_backgroundCoverOpacity = 0.5;
	config.enterMode = CKEDITOR.ENTER_BR;
	
	config.toolbar =
	[
		['Source','-','Maximize','-','Undo','Redo','Save'],
		['Font','FontSize','TextColor'], 
		['Bold','Italic','Underline','Strike','-','JustifyLeft','JustifyCenter','JustifyRight','-','RemoveFormat'],
		'/',
		['NumberedList','BulletedList','-','HorizontalRule'],
		['Link','Unlink','-','Blockquote','Code','PHP','-','Image','Video'],
		['Smiley','SpecialChar'],
	];
};
