/*
Copyright (c) 2012, Brian McCloskey. All rights reserved.
For licensing, see LICENSE, or <http://www.gnu.org/licenses/>
*/
CKEDITOR.editorConfig = function( config )
{
	config.extraPlugins = 'mybb,autogrow,mybbcode,mybbvideo,spoiler';
	config.removePlugins = 'a11yhelp,about,bidi,colordialog,colorbutton,contextmenu,dialogadvtab,div,elementspath,filebrowser,find,flash,format,forms,iframe,liststyle,menubutton,newpage,pagebreak,pastefromword,pastetext,preview,print,scayt,showblocks,showborders,stylescombo,table,tabletools,wsc,wordcount';
	config.fontSize_sizes = 'XX Small/xx-small;X Small/x-small;Small/small;Medium/medium;Large/large;X Large/x-large;XX Large/xx-large';
	config.font_names = 'Arial;Courier;Impact;Tahoma;Times New Roman;Trebuchet MS;Verdana';
	config.skin = 'mybb';
	config.forcePasteAsPlainText = true;
	config.autoGrow_maxHeight = '500';
	config.dialog_backgroundCoverColor = 'rgb(0,0,0)';
	config.dialog_backgroundCoverOpacity = 0.5;
	config.enterMode = CKEDITOR.ENTER_BR;
	config.disableNativeSpellChecker = false;
	
	config.keystrokes =
	[
		[ CKEDITOR.ALT + 121 /*F10*/, 'toolbarFocus' ],
		[ CKEDITOR.ALT + 122 /*F11*/, 'elementsPathFocus' ],
		[ CKEDITOR.SHIFT + 121 /*F10*/, 'contextMenu' ],
		[ CKEDITOR.CTRL + 90 /*Z*/, 'undo' ],
		[ CKEDITOR.CTRL + 89 /*Y*/, 'redo' ],
		[ CKEDITOR.CTRL + CKEDITOR.SHIFT + 90 /*Z*/, 'redo' ],
		[ CKEDITOR.CTRL + 76 /*L*/, 'link' ],
		[ CKEDITOR.CTRL + 66 /*B*/, 'bold' ],
		[ CKEDITOR.CTRL + 73 /*I*/, 'italic' ],
		[ CKEDITOR.CTRL + 85 /*U*/, 'underline' ],
		[ CKEDITOR.ALT + 109 /*-*/, 'toolbarCollapse' ],
		[ CKEDITOR.CTRL + CKEDITOR.ALT + 73 /*I*/, 'indent' ],
		[ CKEDITOR.CTRL + CKEDITOR.ALT + 79 /*O*/, 'outdent' ]
	];

	var spoiler;
	ckeditorSpoiler ? spoiler = ['Spoiler'] : spoiler = '';
	
	config.toolbar =
	[
		['Source','-','Maximize','-','Undo','Redo','Save'],
		['Font','FontSize','TextColor'],
		['Bold','Italic','Underline','Strike','-','JustifyLeft','JustifyCenter','JustifyRight','-','RemoveFormat'],
		'/',
		['NumberedList','BulletedList','Indent','Outdent','-','HorizontalRule'],
		['Link','Unlink','-','Blockquote','Code','PHP','-','Image','Video'], 
		['Smiley','SpecialChar'], spoiler,
	];
};

if ( typeof Thread === 'object' )
{
	Thread.loadMultiQuoted = function()
	{
		if(use_xmlhttprequest == 1)
		{
			this.spinner = new ActivityIndicator("body", {image: imagepath + "/spinner_big.gif"});
			new Ajax.Request('xmlhttp.php?action=get_multiquoted&load_all=1', {method: 'get', onComplete: function(request) {quotedCleanup(request); }});
			return false;
		}
		else
		{
			return true;
		}
	}

	quotedCleanup = function(request)
	{
		Thread.multiQuotedLoaded(request);
		CKEDITOR.instances.message.setData($('message').value);
	};
}
