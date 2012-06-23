/*
Copyright (c) 2012, Brian McCloskey. All rights reserved.
For licensing, see LICENSE.
*/
(function()
{
	CKEDITOR.plugins.add( 'mybbvideo',
	{
		lang : [ 'en' ],
		init : function( editor )
		{
			var lang = editor.lang.mybbvideo;
			editor.addCommand( 'mybbvideo', new CKEDITOR.dialogCommand( 'mybbvideo' ) );
			
			editor.ui.addButton( 'Video',
			{
				label : lang.button,
				command : 'mybbvideo',
				icon : this.path + 'images/video.png'
			} );
		
			CKEDITOR.dialog.add( 'mybbvideo', this.path + 'dialogs/mybbvideo.js' );
			
			editor.addCss(
				'img.mybb_dailymotion' +
				'{' +
					'background-image: url(' + CKEDITOR.getUrl( this.path + 'images/dailymotion.png' ) + ');' +
					'background-color: #3d3d3d;' +
					'background-position: center center;' +
					'background-repeat: no-repeat;' +
					'border: 1px solid #888;' +
					'width: 100px;' +
					'height: 100px;' +
				'}'
			);
			editor.addCss(
				'img.mybb_metacafe' +
				'{' +
					'background-image: url(' + CKEDITOR.getUrl( this.path + 'images/metacafe.png' ) + ');' +
					'background-color: #3d3d3d;' +
					'background-position: center center;' +
					'background-repeat: no-repeat;' +
					'border: 1px solid #888;' +
					'width: 100px;' +
					'height: 100px;' +
				'}'
			);
			editor.addCss(
				'img.mybb_myspacetv' +
				'{' +
					'background-image: url(' + CKEDITOR.getUrl( this.path + 'images/myspace.png' ) + ');' +
					'background-color: #3d3d3d;' +
					'background-position: center center;' +
					'background-repeat: no-repeat;' +
					'border: 1px solid #888;' +
					'width: 100px;' +
					'height: 100px;' +
				'}'
			);
			editor.addCss(
				'img.mybb_vimeo' +
				'{' +
					'background-image: url(' + CKEDITOR.getUrl( this.path + 'images/vimeo.png' ) + ');' +
					'background-color: #3d3d3d;' +
					'background-position: center center;' +
					'background-repeat: no-repeat;' +
					'border: 1px solid #888;' +
					'width: 100px;' +
					'height: 100px;' +
				'}'
			);
			editor.addCss(
				'img.mybb_yahoo' +
				'{' +
					'background-image: url(' + CKEDITOR.getUrl( this.path + 'images/yahoo.png' ) + ');' +
					'background-color: #3d3d3d;' +
					'background-position: center center;' +
					'background-repeat: no-repeat;' +
					'border: 1px solid #888;' +
					'width: 100px;' +
					'height: 100px;' +
				'}'
			);
			editor.addCss(
				'img.mybb_youtube' +
				'{' +
					'background-image: url(' + CKEDITOR.getUrl( this.path + 'images/youtube.png' ) + ');' +
					'background-color: #3d3d3d;' +
					'background-position: center center;' +
					'background-repeat: no-repeat;' +
					'border: 1px solid #888;' +
					'width: 100px;' +
					'height: 100px;' +
				'}'
			);

			editor.on( 'doubleclick', function( evt )
			{
				var element = evt.data.element;
				
				if ( element.is( 'img' ) && element.data( 'cke-real-element-type' ) == 'mybbvideo' )
					evt.data.dialog = 'mybbvideo';
			} );
			
			if ( editor.addMenuItems )
			{
				editor.addMenuGroup('mybbvideo');
				editor.addMenuItem('videoprop',
				{
					label : lang.title,
					command : 'mybbvideo',
					group : 'mybbvideo'

				});
			}
			
			if ( editor.contextMenu )
			{
				editor.contextMenu.addListener( function( element, selection )
				{
					if ( element && element.is( 'img' ) && element.data( 'cke-real-element-type' ) == 'mybbvideo' )
						return { videoprop : CKEDITOR.TRISTATE_OFF };
				});
			}
		},
		
		afterInit : function( editor )
		{
			var dataProcessor = editor.dataProcessor,
				dataFilter = dataProcessor && dataProcessor.dataFilter,
				videoAltMap =
				{
					alt : [ { type : 'dailymotion', name : lang.dailymotion }, 
							{ type : 'metacafe', name : lang.metacafe },
							{ type : 'vimeo', name : lang.vimeo },
							{ type : 'yahoo', name : lang.yahoo },
							{ type : 'myspacetv', name : lang.myspacetv },
							{ type : 'youtube', name : lang.youtube } ]
				};

			
			if ( dataFilter )
			{
				dataFilter.addRules(
				{
					elements :
					{
						'mybbvideo' : function( element )
						{
							var attributes = element.attributes,
								cssName = 'mybb_' + attributes.videotype,
								newFakeImage;
							
							element.attributes.src = element.children[0].value;
							newFakeImage = editor.createFakeParserElement( element, cssName, 'mybbvideo', false );
							for ( var i = 0 ; i < videoAltMap['alt'].length ; i++ )
							{
								if ( attributes.videotype == videoAltMap['alt'][i].type )
								{
									newFakeImage.attributes.alt = videoAltMap['alt'][i].name;
									newFakeImage.attributes.title = videoAltMap['alt'][i].name;
								}
							}

							return newFakeImage;
						}
					}
				},
				1);
			}
		},
			
		requires : [ 'fakeobjects' ]
	});
})();