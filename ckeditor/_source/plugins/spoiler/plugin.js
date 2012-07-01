/*
Copyright (c) 2012, Brian McCloskey. All rights reserved.
For licensing, see LICENSE, or <http://www.gnu.org/licenses/>
*/
(function()
{
	var spoilerCommand =
	{
		exec : function( editor )
		{
			
			var selection = editor.getSelection(),
				range = selection && selection.getRanges( true )[0];
				
			if ( ! range )
				return
			
			var bookmarks = selection.createBookmarks(),
				iterator = range.createIterator(),
				block;
			iterator.enlargeBR = true;
			
			var paragraphs = [];
			while ( ( block = iterator.getNextParagraph() ) )
				paragraphs.push( block );
			
			if ( paragraphs.lenght < 1 )
			{
				var para = editor.document.createElement( 'p' ),
					firstBookmark = bookmarks.shift();
				range.insertNode( para );
				para.append( new CKEDITOR.dom.txt( '\ufeff', editor.document ) );
				range.moveToBookmark( firstBookmark );
				range.selectNodeContents( para );
				range.collapse( true );
				firstBookmark = range.createBookmark();
				paragraphs.push( para );
				bookmarks.unshift( firstBookmark );
			}
			
			var commonParent = paragraphs[0].getParent(),
				tmp = [];
			for ( var i = 0 ; i < paragraphs.length ; i++ )
			{
				block = paragraphs[i];
				commonParent = commonParent.getCommonAncestor( block.getParent() );
			}
			
			var denyTags = { ol : 1, ul : 1, li : 1 };
			while ( denyTags[ commonParent.getName() ] )
				commonParent = commonParent.getParent();

			var lastBlock = null;
			while ( paragraphs.length > 0 )
			{
				block = paragraphs.shift();
				while ( !block.getParent().equals( commonParent ) )
					block = block.getParent();
				if ( !block.equals( lastBlock ) )
					tmp.push( block );
				lastBlock = block;
			}

			while ( tmp.length > 0 )
				paragraphs.push( tmp.shift() );
			
			var spoiler = editor.document.createElement( 'div' ),
				title = editor.document.createElement( 'div' );

			title.addClass( 'cke_spoiler_title' );
			title.setText( 'Spoiler:' );
			spoiler.addClass( 'cke_spoiler' );
			spoiler.append( title );

			spoiler.insertBefore( paragraphs[0] );
			while ( paragraphs.length > 0 )
			{
				block = paragraphs.shift();
				spoiler.append( block );
			}

			selection.selectBookmarks( bookmarks );
			editor.focus();
		}
	};
		
	CKEDITOR.plugins.add( 'spoiler',
	{
		init : function( editor )
		{
			editor.addCommand( 'spoiler', spoilerCommand );
			
			editor.ui.addButton( 'Spoiler',
			{
				label : 'Spoiler',
				command : 'spoiler',
				icon : this.path + 'images/spoiler.png'
			});
		},
			
		afterInit : function( editor )
		{
			var dataProcessor = editor.dataProcessor,
				dataFilter = dataProcessor && dataProcessor.dataFilter;
			
			if ( dataFilter )
			{
				dataFilter.addRules(
				{
					elements :
					{
						'div' : function( element )
						{
							var attributes = element.attributes;
							
							if ( attributes.bbcode == 'spoiler' )
							{
								if ( ckeditorSpoiler > 0 )
								{
									element.attributes[ 'class' ] = 'cke_spoiler';
									
									var title = new CKEDITOR.htmlParser.element( 'div' );
									title.add( new CKEDITOR.htmlParser.text( attributes.title ) );
									title.attributes[ 'class' ] = 'cke_spoiler_title';
									element.children.unshift( title );
									element.add( new CKEDITOR.htmlParser.element( 'p' ) );
								}
							}
						}
					}
				},
				1);
			}
		},

		requires : [ 'mybb' ]
	});
})();

