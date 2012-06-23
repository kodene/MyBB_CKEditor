/*
Copyright (c) 2012, Brian McCloskey. All rights reserved.
For licensing, see LICENSE.

This file is part of MYBB_CKEditor.

MYBB_CKEditor is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Foobar is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
*/
(function()
{
	function loadValue( object )
	{
		if ( !object )
			return;
		var value = object.getAttribute( this.id );
		this.setValue( value );
	}
	
	function commitValue( object )
	{
		object.setAttribute( this.id, this.getValue() );
	}
	
	CKEDITOR.dialog.add( 'mybbvideo', function( editor )
	{
		var lang = editor.lang.mybbvideo;
		var	videoAltMap =
			{
				alt : [ { type : 'dailymotion', name : lang.dailymotion }, 
						{ type : 'metacafe', name : lang.metacafe },
						{ type : 'vimeo', name : lang.vimeo },
						{ type : 'yahoo', name : lang.yahoo },
						{ type : 'myspacetv', name : lang.myspacetv },
						{ type : 'youtube', name : lang.youtube } ]
			};
		return {
			title : lang.title,
			resizable : CKEDITOR.DIALOG_RESIZE_NONE,
			minWidth : 400,
			minHeight : 75,
			onShow : function()
			{
				this.fakeImage = this.object = null;
				var fakeImage = this.getSelectedElement();
				if ( fakeImage )
				{
					this.fakeImage = fakeImage;
					object = editor.restoreRealElement( fakeImage );
					this.object = object;
					this.setupContent( object );
				}
			},
			
			onOk : function()
			{
				var object = null;

				//	paramMap = null;
				if ( !this.fakeImage )
					object = CKEDITOR.dom.element.createFromHtml( '<mybbvideo></mybbvideo>' );
				else
					object = this.object;
				
				this.commitContent( object );
				
				var cssName = "mybb_" + object.getAttribute( 'videoType' ),
					altTitle,
					newFakeImage = editor.createFakeElement( object, cssName, 'mybbvideo', false );
				
				for ( var i = 0 ; i < videoAltMap['alt'].length ; i++ )
				{
					if ( object.getAttribute( 'videoType' ) == videoAltMap['alt'][i].type )
					{
						newFakeImage.setAttribute( 'alt', videoAltMap['alt'][i].name )
						newFakeImage.setAttribute( 'title', videoAltMap['alt'][i].name )
					}
				}
				
				if ( this.fakeImage )
				{
					newFakeImage.replace( this.fakeImage );
					editor.getSelection().selectElement( newFakeImage );
				}
				else
					editor.insertElement( newFakeImage );
			},
				
			onHide : function()
			{
			},
			
			contents : [
			{
				id : 'info',
				elements :
				[
					{
						type : 'hbox',
						widths : [ '75%', '25%' ],
						style : 'margin:10px;',
						children :
						[
							{
								id : 'src',
								type : 'text',
								label : editor.lang.common.url,
								required : true,
								validate : CKEDITOR.dialog.validate.notEmpty( lang.validateURL ),
								setup : loadValue,
								commit : commitValue
							},
							{
								id : 'videoType',
								type : 'select',
								'default' : 'youtube',
								label : lang.videoType,
								items :
								[
									[ lang.dailymotion, 'dailymotion' ],
									[ lang.metacafe, 'metacafe' ],
									[ lang.myspacetv, 'myspacetv' ],
									[ lang.vimeo, 'vimeo' ],
									[ lang.yahoo, 'yahoo' ],
									[ lang.youtube, 'youtube' ]
								],
								setup : loadValue,
								commit : commitValue
							}
						]
					}
				]
			}]
		};
	});
})();
		
			