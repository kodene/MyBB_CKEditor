/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license

Copyright (c) 2012, Brian McCloskey. All rights reserved.
For licensing, see LICENSE, or <http://www.gnu.org/licenses/>

This code was modififed from the CKEditor plugin bbcode.
*/

(function()
{
	CKEDITOR.on( 'dialogDefinition', function( ev )
	{
		var tab, field, name = ev.data.name,
			definition = ev.data.definition,
			editor = CKEDITOR.instances.message || CKEDITOR.instances.signature;
			ckeditorImageWidth = editor.config.ckeditorImageWidth;

		if ( name == 'link' )
		{
			definition.height = 100;
			definition.resizable = false;
			definition.removeContents( 'target' );
			definition.removeContents( 'upload' );
			definition.removeContents( 'advanced' );
			tab = definition.getContents( 'info' );
			field = tab.get( 'linkType' );
			field['items'].splice( 1, 1 );
			tab.remove( 'emailSubject' );
			tab.remove( 'emailBody' );
			tab.remove( 'htmlPreview' );
		}
		else if ( name == 'image' )
		{
			definition.height = 75;
			definition.resizable = false;
			definition.removeContents( 'advanced' );
			definition.removeContents( 'Link' );
			tab = definition.getContents( 'info' );
			field = tab.get( 'txtWidth' );
			if ( ckeditorImageWidth > 0 )
				field['default'] = ckeditorImageWidth + 'px';
			field.style = 'display: none';
			tab.remove( 'txtHeight' );
			tab.remove( 'ratioLock' );
			tab.remove( 'txtBorder' );
			tab.remove( 'txtHSpace' );
			tab.remove( 'txtVSpace' );
			tab.remove( 'cmbAlign' );
			tab.remove( 'txtAlt' );
			tab.remove( 'htmlPreview' );
		}
		else if ( name == 'specialchar' )
		{
			definition.resizable = false;
		}
		else if ( name == 'colordialog' )
		{
			definition.resizable = false;
		}
	});

	var editor = CKEDITOR.instances.message || CKEDITOR.instances.signature;
	
	var bbcodeMap = { 'b' : 'strong', 'hr' : 'hr', 's' : 's', 'u': 'u', 'i' : 'em', 'color' : 'span', 'size' : 'span', 'font' : 'span', 'quote' : 'blockquote', 'url' : 'a', 'email' : 'span', 'img' : 'span', '*' : 'li', 'list' : 'ol', 'align' : 'div', 'code' : 'span', 'php' : 'span', 'video' : 'span' },
		convertMap = { 'strong' : 'b' , 'hr' : 'hr', 'b' : 'b', 's' : 's', 'strike' : 's', 'u': 'u', 'em' : 'i', 'i': 'i', 'li' : '*' },
		tagnameMap = { 'strong' : 'b', 'hr' : 'hr', 'em' : 'i', 'u' : 'u', 'li' : '*', 'ul' : 'list', 'ol' : 'list', 'a' : 'link', 'img' : 'img', 'blockquote' : 'quote' },
		stylesMap = { 'color' : 'color', 'size' : 'font-size', 'font' : 'font-family', 'align' : 'text-align' },
		attributesMap = { 'url' : 'href', 'email' : 'mailhref', 'quote': 'cite', 'list' : 'listType', 'video' : 'videotype' };

	var insideCode = 0;
	
	// List of block-like tags.
	var dtd =  CKEDITOR.dtd,
		blockLikeTags = CKEDITOR.tools.extend( { table:1 }, dtd.$block, dtd.$listItem, dtd.$tableContent, dtd.$list );

	if ( editor.config.useSpoiler > 0 )
	{
		bbcodeMap['spoiler'] = 'div';
		if ( editor.config.useSpoiler == 2 )
		{
			attributesMap['spoiler'] = 'title';
		}
	}
	
	var semicolonFixRegex = /\s*(?:;\s*|$)/;
	function serializeStyleText( stylesObject )
	{
		var styleText = '';
		for ( var style in stylesObject )
		{
			var styleVal = stylesObject[ style ],
				text = ( style + ':' + styleVal ).replace( semicolonFixRegex, ';' );

			styleText += text;
		}
		return styleText;
	}

	function parseStyleText( styleText )
	{
		var retval = {};
		( styleText || '' )
				.replace( /&quot;/g, '"' )
				.replace( /\s*([^ :;]+)\s*:\s*([^;]+)\s*(?=;|$)/g, function( match, name, value )
		{
			retval[ name.toLowerCase() ] = value;
		} );
		return retval;
	}

	function RGBToHex( cssStyle )
	{
		return cssStyle.replace( /(?:rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\))/gi, function( match, red, green, blue )
			{
				red = parseInt( red, 10 ).toString( 16 );
				green = parseInt( green, 10 ).toString( 16 );
				blue = parseInt( blue, 10 ).toString( 16 );
				var color = [red, green, blue] ;

				// Add padding zeros if the hex value is less than 0x10.
				for ( var i = 0 ; i < color.length ; i++ )
					color[i] = String( '0' + color[i] ).slice( -2 ) ;

				return '#' + color.join( '' ) ;
			});
	}

	// Maintain the map of smiley-to-description.
	var smileyMap = {};

	for ( var i = 0 ; i < editor.config.smiley_descriptions.length ; i ++ )
	{
		smileyMap[ editor.config.smiley_descriptions[ i ] ] = editor.config.smiley_names[ i ];
	}
	
	var	smileyReverseMap = {},
		smileyRegExp = [];

	// Build regexp for the list of smiley text.
	for ( var i in smileyMap )
	{
		smileyReverseMap[ smileyMap[ i ] ] = i;
		smileyRegExp.push( smileyMap[ i ].replace( /\(|\)|\:|\/|\?|\+|\$|\.|\^|\*|\-|\|/g, function( match ) { return '\\' + match; } ) );
	}

	smileyRegExp = new RegExp( smileyRegExp.join( '|' ), 'g' );

	var decodeHtml = ( function ()
	{
		var regex = [],
			entities =
			{
				nbsp	: '\u00A0',		// IE | FF
				shy		: '\u00AD',		// IE
				gt		: '\u003E',		// IE | FF |   --   | Opera
				lt		: '\u003C'		// IE | FF | Safari | Opera
			};

		for ( var entity in entities )
			regex.push( entity );

		regex = new RegExp( '&(' + regex.join( '|' ) + ');', 'g' );

		return function( html )
		{
			return html.replace( regex, function( match, entity )
			{
				return entities[ entity ];
			});
		};
	})();

	CKEDITOR.BBCodeParser = function()
	{
		this._ =
		{
			bbcPartsRegex : /(?:\[([^\/\]=]*?)(?:=([^\]]*?))?\])|(?:\[\/([a-zA-Z0-9]{1,16})\])/ig
		};
	};

	CKEDITOR.BBCodeParser.prototype =
	{
		parse : function( bbcode )
		{
			var parts,
					part,
					lastIndex = 0;

			while ( ( parts = this._.bbcPartsRegex.exec( bbcode ) ) )
			{
				
				var tagIndex = parts.index;
				if ( tagIndex > lastIndex )
				{
					var text = bbcode.substring( lastIndex, tagIndex );
					this.onText( text, 1 );
				}

				lastIndex = this._.bbcPartsRegex.lastIndex;

				/*
				 "parts" is an array with the following items:
				 0 : The entire match for opening/closing tags and line-break;
				 1 : line-break;
				 2 : open of tag excludes option;
				 3 : tag option;
				 4 : close of tag;
				 */

				part = ( parts[ 1 ] || parts[ 3 ] || '' ).toLowerCase();
				if ( parts[3] == 'code' )
					insideCode = 0;

				// Unrecognized tags should be delivered as a simple text (#7860).
				if ( part && !bbcodeMap[ part ] || insideCode )
				{
					this.onText( parts[ 0 ] );
					continue;
				}

				// Opening tag
				if ( parts[ 1 ] )
				{
					var tagName = bbcodeMap[ part ],
							attribs = {},
							styles = {},
							optionPart = parts[ 2 ];

					if ( optionPart )
					{
						if ( part == 'list' )
						{
							if ( !isNaN( optionPart ) )
								optionPart = 'decimal';
							else if ( /^[a-z]+$/.test( optionPart ) )
								optionPart = 'lower-alpha';
							else if ( /^[A-Z]+$/.test( optionPart ) )
								optionPart = 'upper-alpha';
						}

						if ( stylesMap[ part ] )
						{
							styles[ stylesMap[ part ] ] = optionPart;
							attribs.style = serializeStyleText( styles );
						}
						else if ( attributesMap[ part ] )
							attribs[ attributesMap[ part ] ] = optionPart;
					}

					// Two special handling - image and email, protect them
					// as "span" with an attribute marker.
					if ( part == 'email' || part == 'img' || part == 'code' || part == 'php' || part == 'video' || part == 'spoiler' )
						attribs[ 'bbcode' ] = part;

					this.onTagOpen( tagName, attribs, CKEDITOR.dtd.$empty[ tagName ] );
					if ( parts[0] == '[code]' )
						insideCode = 1;

				}
				// Closing tag
				else if ( parts[ 3 ] )
					this.onTagClose( bbcodeMap[ part ] );
			}

			if ( bbcode.length > lastIndex )
				this.onText( bbcode.substring( lastIndex, bbcode.length ), 1 );
		}
	};

	/**
	 * Creates a {@link CKEDITOR.htmlParser.fragment} from an HTML string.
	 * @param {String} source The HTML to be parsed, filling the fragment.
	 * @param {Number} [fixForBody=false] Wrap body with specified element if needed.
	 * @returns CKEDITOR.htmlParser.fragment The fragment created.
	 * @example
	 * var fragment = CKEDITOR.htmlParser.fragment.fromHtml( '<b>Sample</b> Text' );
	 * alert( fragment.children[0].name );  "b"
	 * alert( fragment.children[1].value );  " Text"
	 */
	CKEDITOR.htmlParser.fragment.fromBBCode = function( source )
	{
		var parser = new CKEDITOR.BBCodeParser(),
			fragment = new CKEDITOR.htmlParser.fragment(),
			pendingInline = [],
			pendingBrs = 0,
			currentNode = fragment,
			returnPoint;

		function checkPending( newTagName )
		{
			if ( pendingInline.length > 0 )
			{
				for ( var i = 0 ; i < pendingInline.length ; i++ )
				{
					var pendingElement = pendingInline[ i ],
						pendingName = pendingElement.name,
						pendingDtd = CKEDITOR.dtd[ pendingName ],
						currentDtd = currentNode.name && CKEDITOR.dtd[ currentNode.name ];

					if ( ( !currentDtd || currentDtd[ pendingName ] ) && ( !newTagName || !pendingDtd || pendingDtd[ newTagName ] || !CKEDITOR.dtd[ newTagName ] ) )
					{
						// Get a clone for the pending element.
						pendingElement = pendingElement.clone();

						// Add it to the current node and make it the current,
						// so the new element will be added inside of it.
						pendingElement.parent = currentNode;
						currentNode = pendingElement;

						// Remove the pending element (back the index by one
						// to properly process the next entry).
						pendingInline.splice( i, 1 );
						i--;
					}
				}
			}
		}

		function checkPendingBrs( tagName, closing )
		{
			var len = currentNode.children.length,
				previous = len > 0 && currentNode.children[ len - 1 ],
				lineBreakParent = !previous && BBCodeWriter.getRule( tagnameMap[ currentNode.name ], 'breakAfterOpen' ),
				lineBreakPrevious = previous && previous.type == CKEDITOR.NODE_ELEMENT && BBCodeWriter.getRule( tagnameMap[ previous.name ], 'breakAfterClose' ),
				lineBreakCurrent = tagName && BBCodeWriter.getRule( tagnameMap[ tagName ], closing ? 'breakBeforeClose' : 'breakBeforeOpen' );

			if ( pendingBrs && ( lineBreakParent || lineBreakPrevious || lineBreakCurrent ) )
				pendingBrs--;

			// 1. Either we're at the end of block, where it requires us to compensate the br filler
			// removing logic (from htmldataprocessor).
			// 2. Or we're at the end of pseudo block, where it requires us to compensate
			// the bogus br effect.
			if ( pendingBrs && tagName in blockLikeTags )
				pendingBrs++;

			while ( pendingBrs && pendingBrs-- )
				currentNode.children.push( previous = new CKEDITOR.htmlParser.element( 'br' ) );
		}

		function addElement( node, target )
		{
			checkPendingBrs( node.name, 1 );

			target = target || currentNode || fragment;

			var len = target.children.length,
				previous = len > 0 && target.children[ len - 1 ] || null;

			node.previous = previous;
			node.parent = target;

			target.children.push( node );

			if ( node.returnPoint )
			{
				currentNode = node.returnPoint;
				delete node.returnPoint;
			}
		}

		parser.onTagOpen = function( tagName, attributes, selfClosing )
		{
			var element = new CKEDITOR.htmlParser.element( tagName, attributes );

			// This is a tag to be removed if empty, so do not add it immediately.
			if ( CKEDITOR.dtd.$removeEmpty[ tagName ] )
			{
				pendingInline.push( element );
				return;
			}

			var currentName = currentNode.name;

			var currentDtd = currentName
				&& ( CKEDITOR.dtd[ currentName ]
					|| ( currentNode._.isBlockLike ? CKEDITOR.dtd.div : CKEDITOR.dtd.span ) );

			// If the element cannot be child of the current element.
			if ( currentDtd && !currentDtd[ tagName ] )
			{
				var reApply = false,
					addPoint;   // New position to start adding nodes.
				
				// If the element name is the same as the current element name,
				// then just close the current one and append the new one to the
				// parent. This situation usually happens with <p>, <li>, <dt> and
				// <dd>, specially in IE. Do not enter in this if block in this case.
				if ( tagName == currentName )
					addElement( currentNode, currentNode.parent );
				else if ( tagName in CKEDITOR.dtd.$listItem )
				{
					parser.onTagOpen( 'ul', {} );
					addPoint = currentNode;
					reApply = true;
				}
				else
				{
					addElement( currentNode, currentNode.parent );

					// The current element is an inline element, which
					// cannot hold the new one. Put it in the pending list,
					// and try adding the new one after it.
					pendingInline.unshift( currentNode );
					reApply = true;
				}

				if ( addPoint )
					currentNode = addPoint;
				// Try adding it to the return point, or the parent element.
				else
					currentNode = currentNode.returnPoint || currentNode.parent;

				if ( reApply )
				{
					parser.onTagOpen.apply( this, arguments );
					return;
				}
			}

			checkPending( tagName );
			checkPendingBrs( tagName );

			element.parent = currentNode;
			element.returnPoint = returnPoint;
			returnPoint = 0;

			if ( element.isEmpty )
				addElement( element );
			else
				currentNode = element;
		};

		parser.onTagClose = function( tagName )
		{
			// Check if there is any pending tag to be closed.
			for ( var i = pendingInline.length - 1 ; i >= 0 ; i-- )
			{
				// If found, just remove it from the list.
				if ( tagName == pendingInline[ i ].name )
				{
					pendingInline.splice( i, 1 );
					return;
				}
			}

			var pendingAdd = [],
				newPendingInline = [],
				candidate = currentNode;

			while ( candidate.type && candidate.name != tagName )
			{
				// If this is an inline element, add it to the pending list, if we're
				// really closing one of the parents element later, they will continue
				// after it.
				if ( !candidate._.isBlockLike )
					newPendingInline.unshift( candidate );

				// This node should be added to it's parent at this point. But,
				// it should happen only if the closing tag is really closing
				// one of the nodes. So, for now, we just cache it.
				pendingAdd.push( candidate );

				candidate = candidate.parent;
			}

			if ( candidate.type )
			{
				// Add all elements that have been found in the above loop.
				for ( i = 0 ; i < pendingAdd.length ; i++ )
				{
					var node = pendingAdd[ i ];
					addElement( node, node.parent );
				}

				currentNode = candidate;


				addElement( candidate, candidate.parent );

				// The parent should start receiving new nodes now, except if
				// addElement changed the currentNode.
				if ( candidate == currentNode )
					currentNode = currentNode.parent;

				pendingInline = pendingInline.concat( newPendingInline );
			}
		};

		parser.onText = function( text )
		{
			var currentDtd = CKEDITOR.dtd[ currentNode.name ];
			if ( !currentDtd || currentDtd[ '#' ] )
			{
				checkPendingBrs();
				checkPending();

				text.replace(/([\r\n])|[^\r\n]*/g, function( piece, lineBreak )
				{
					if ( lineBreak !== undefined && lineBreak.length )
						pendingBrs++;
					else if ( piece.length )
					{
						var lastIndex = 0;

						// Create smiley from text emotion.
						piece.replace( smileyRegExp, function( match, index )
						{
							addElement( new CKEDITOR.htmlParser.text( piece.substring( lastIndex, index ) ), currentNode );
							addElement( new CKEDITOR.htmlParser.element( 'smiley', { 'desc': smileyReverseMap[ match ] } ), currentNode );
							lastIndex = index + match.length;
						});

						if ( lastIndex != piece.length )
							addElement( new CKEDITOR.htmlParser.text( piece.substring( lastIndex, piece.length ) ), currentNode );
					}
				});
			}
			// Need to do on more br check, otherwise replies with a first level
			// quote block do not get the <br> placed in the right location.
			checkPendingBrs();
		};

		// Parse it.
		parser.parse( CKEDITOR.tools.htmlEncode( source ) );

		// Close all hanging nodes.
		while ( currentNode.type )
		{
			var parent = currentNode.parent,
				node = currentNode;

			addElement( node, parent );
			currentNode = parent;
		}

		return fragment;
	};

	CKEDITOR.htmlParser.BBCodeWriter = CKEDITOR.tools.createClass(
	{
		$ : function()
		{
			this._ =
			{
				output : [],
				rules : []
			};

			// List and list item.
			this.setRules( 'list',
			{
				breakBeforeOpen : true,
				breakAfterOpen : true,
				breakBeforeClose : true,
				breakAfterClose : true
			} );

			this.setRules( '*',
			{
				breakBeforeOpen : true,
				breakAfterOpen : false,
				breakBeforeClose : true,
				breakAfterClose : false
			} );

			this.setRules( 'quote',
			{
				breakBeforeOpen : true,
				breakAfterOpen : false,
				breakBeforeClose : false,
				breakAfterClose : true
			} );
			
			this.setRules( 'align',
			{
				breakBeforeOpen : false,
				breakAfterOpen : false,
				breakBeforeClose : false,
				breakAfterClose : false
			} );
		
			this.setRules( 'code',
			{
				breakBeforeOpen : true,
				breakAfterOpen : false,
				breakBeforeClose : false,
				breakAfterClose : true
			} );
		
			this.setRules( 'php',
			{
				breakBeforeOpen : true,
				breakAfterOpen : false,
				breakBeforeClose : false,
				breakAfterClose : true
			} );
		
			this.setRules( 'video',
			{
				breakBeforeOpen : true,
				breakAfterOpen : false,
				breakBeforeClose : false,
				breakAfterClose : true
			} );
		
			this.setRules( 'spoiler',
			{
				breakBeforeOpen : true,
				breakAfterOpen : false,
				breakBeforeClose : false,
				breakAfterClose : true
			} );
		},

		proto :
		{
			/**
			 * Sets formatting rules for a given tag. The possible rules are:
			 * <ul>
			 *	<li><b>breakBeforeOpen</b>: break line before the opener tag for this element.</li>
			 *	<li><b>breakAfterOpen</b>: break line after the opener tag for this element.</li>
			 *	<li><b>breakBeforeClose</b>: break line before the closer tag for this element.</li>
			 *	<li><b>breakAfterClose</b>: break line after the closer tag for this element.</li>
			 * </ul>
			 *
			 * All rules default to "false". Each call to the function overrides
			 * already present rules, leaving the undefined untouched.
			 *
			 * @param {String} tagName The tag name to which set the rules.
			 * @param {Object} rules An object containing the element rules.
			 * @example
			 * // Break line before and after "img" tags.
			 * writer.setRules( 'list',
			 *     {
			 *         breakBeforeOpen : true
			 *         breakAfterOpen : true
			 *     });
			 */
			setRules : function( tagName, rules )
			{
				var currentRules = this._.rules[ tagName ];

				if ( currentRules )
					CKEDITOR.tools.extend( currentRules, rules, true );
				else
					this._.rules[ tagName ] = rules;
			},

			getRule : function( tagName, ruleName )
			{
				return this._.rules[ tagName ] && this._.rules[ tagName ][ ruleName ];
			},

			openTag : function( tag, attributes )
			{
				if ( tag in bbcodeMap )
				{
					if ( this.getRule( tag, 'breakBeforeOpen' ) )
						this.lineBreak( 1 );

					this.write( '[', tag );
					var option = attributes.option;
					option && this.write( '=', option );
					this.write( ']' );

					if ( this.getRule( tag, 'breakAfterOpen' ) )
						this.lineBreak( 1 );
				}
				else if ( tag == 'br' )
					this._.output.push( '\n' );
			},

			openTagClose : function() { },
			attribute : function() { },

			closeTag : function( tag )
			{
				if ( tag in bbcodeMap )
				{
					if ( this.getRule( tag, 'breakBeforeClose' ) )
						this.lineBreak( 1 );

					tag != '*' && this.write( '[/', tag, ']' );

					if ( this.getRule( tag, 'breakAfterClose' ) )
						this.lineBreak( 1 );
				}
			},

			text : function( text )
			{
				this.write( text );
			},

			/**
			 * Writes a comment.
			 * @param {String} comment The comment text.
			 * @example
			 * // Writes "&lt;!-- My comment --&gt;".
			 * writer.comment( ' My comment ' );
			 */
			comment : function() {},

			/*
			* Output line-break for formatting.
			 */
			lineBreak : function()
			{
				// Avoid line break when:
				// 1) Previous tag already put one.
				// 2) We're at output start.
				if ( !this._.hasLineBreak && this._.output.length )
				{
					this.write( '\n' );
					this._.hasLineBreak = 1;
				}
			},

			write : function()
			{
				this._.hasLineBreak = 0;
				var data = Array.prototype.join.call( arguments, '' );
				this._.output.push( data );
			},

			reset : function()
			{
				this._.output = [];
				this._.hasLineBreak = 0;
			},

			getHtml : function( reset )
			{
				var bbcode = this._.output.join( '' );

				if ( reset )
					this.reset();

				return decodeHtml ( bbcode );
			}
		}
	});

	var BBCodeWriter = new CKEDITOR.htmlParser.BBCodeWriter();

	CKEDITOR.plugins.add( 'mybb',
	{
		requires : [ 'htmldataprocessor', 'entities' ],
		beforeInit : function( editor )
		{
			// Adapt some critical editor configuration for better support
			// of BBCode environment.
			var config = editor.config;
			CKEDITOR.tools.extend( config,
			{
				enterMode : CKEDITOR.ENTER_BR,
				basicEntities: false,
				entities : false,
				fillEmptyBlocks : false
			}, true );
		},
		init : function( editor )
		{
			var config = editor.config;

			function BBCodeToHtml( code )
			{
				var fragment = CKEDITOR.htmlParser.fragment.fromBBCode( code ),
						writer = new CKEDITOR.htmlParser.basicWriter(),
						htmlFragment, re = new RegExp( "<br />$" );

				fragment.writeHtml( writer, dataFilter );
				htmlFragment = writer.getHtml( true );
				// Need to add a br to the end if none exists, but only if the
				// content isn't empty.
				if ( ! re.test( htmlFragment ) && htmlFragment != '' )
					htmlFragment = htmlFragment + '<br />';
				return htmlFragment;
			}

			var dataFilter = new CKEDITOR.htmlParser.filter();
			dataFilter.addRules(
			{
				elements :
				{
					'div' : function( element )
					{
						var bbcode;
						
						if ( bbcode = element.attributes.bbcode )
						{
							if ( bbcode == 'spoiler' )
							{
								if ( editor.config.useSpoiler > 0 )
								{
									if ( editor.config.useSpoiler == 2 && element.attributes.title )
										element.attributes.title = 'Spoiler: ' + element.attributes.title;
									else
										element.attributes.title = 'Spoiler:';
								}
							}
						}
					},
					'blockquote' : function( element )
					{
						var quoted = new CKEDITOR.htmlParser.element( 'div' );
						quoted.children = element.children;
						
						try {
							if ( quoted.children[ 0 ].name == 'br' )
								quoted.children.splice( 0, 1 );
						}
						catch( e ) 
						{
						}
						
						element.children = [ quoted ];
						var citeText = element.attributes.cite;
						if ( citeText )
						{
							var cite = new CKEDITOR.htmlParser.element( 'cite' );
							var re = new RegExp( 'Wrote' );
							
							citeText = citeText.replace( /^"|"$/g, '' );
							
							if ( re.test ( citeText ) )
								cite.add( new CKEDITOR.htmlParser.text( citeText.replace( /^'|'$/g, '' ) ) );
							else
							{
								var citeHide = new CKEDITOR.htmlParser.element( 'span' );
								var citeInfo = citeText.match( /'([^']*)'/g );
								
								cite.add( new CKEDITOR.htmlParser.text( citeInfo[ 0 ].replace( /^'|'$/g, '' ) + ' Wrote' ) );
								citeHide.attributes.style = 'display: none;';
								citeHide.add( new CKEDITOR.htmlParser.text( citeInfo[ 0 ] ) );
								citeHide.add( new CKEDITOR.htmlParser.text( citeInfo[ 1 ] ) );
								citeHide.add( new CKEDITOR.htmlParser.text( citeInfo[ 2 ] ) );
								cite.add( citeHide );
							}
							
							delete element.attributes.cite;
							element.children.unshift( cite );
						}
					},
					'span' : function( element )
					{
						var bbcode,
							editor = CKEDITOR.instances.message || CKEDITOR.instances.signature;
						if ( ( bbcode = element.attributes.bbcode ) )
						{
							if ( bbcode == 'img' )
							{
								element.name = 'img';
								element.attributes.src = element.children[ 0 ].value;
								element.children = [];
								if ( editor.config.ckeditorImageWidth > 0 )
									element.attributes.style = 'width:' + editor.config.ckeditorImageWidth + 'px;';
							}
							else if ( bbcode == 'email' )
							{
								element.name = 'a';
								element.attributes.href = 'mailto:' + element.attributes.mailhref;
							}
							else if ( bbcode == 'code' || bbcode == 'php' )
							{
								var code = new CKEDITOR.htmlParser.element( 'code' );
								var codeTitle = new CKEDITOR.htmlParser.element( 'div' );
								
								if ( bbcode == 'code' )
									var titleText = new CKEDITOR.htmlParser.text( 'CODE:' );
								else
									var titleText = new CKEDITOR.htmlParser.text( 'PHP CODE:' );
								
								codeTitle.attributes['class'] = 'title';
								codeTitle.children = [ titleText ];
								code.children = element.children;
								
								try {
									if ( code.children[ 0 ].name == 'br' )
										code.children.splice( 0, 1 );
								}
								catch( e ) 
								{
								}

								element.children = [ codeTitle, code ];
								element.name = 'div';
								
								if ( bbcode == 'code' )
									element.attributes['class'] = 'codeblock';
								else
									element.attributes['class'] = 'codeblock phpblock';
							}
							else if ( bbcode == 'video' )
							{
								element.name = 'mybbvideo';
							}
							delete element.attributes.bbcode;
						}
					},
					'ol' : function ( element )
					{
						if ( element.attributes.listType )
						{
							if ( element.attributes.listType != 'decimal' )
								element.attributes.style = 'list-style-type:' + element.attributes.listType;
						}
						else
							element.name = 'ul';

						delete element.attributes.listType;
					},
					'a' : function( element )
					{
						if ( !element.attributes.href )
							element.attributes.href = element.children[ 0 ].value;
					},
					'smiley' : function( element )
					{
						element.name = 'img';

						var description = element.attributes.desc,
							image = config.smiley_images[ CKEDITOR.tools.indexOf( config.smiley_descriptions, description ) ],
							src = CKEDITOR.tools.htmlEncode( config.smiley_path + image );

						element.attributes =
						{
							src : src,
								'data-cke-saved-src' : src,
								title :  description,
								alt : description
						};
					},

						
				}
			} );

			editor.dataProcessor.htmlFilter.addRules(
			{
				elements :
				{
					$ : function( element )
					{
						var attributes = element.attributes,
								style = parseStyleText( attributes.style ),
								value;

						var tagName = element.name;
						if ( tagName in convertMap )
							tagName = convertMap[ tagName ];
						else if ( tagName == 'span' )
						{
							if ( ( value = style.color ) )
							{
								tagName = 'color';
								value = RGBToHex( value );
							}
							else if ( ( value = style[ 'font-size' ] ) )
							{
								tagName = 'size';
							}
							else if ( ( value = style[ 'font-family' ] ) )
							{
								tagName = 'font';
							}
						}
						else if ( tagName == 'div' )
						{
							if ( element.attributes[ 'class' ] == 'cke_spoiler' )
							{
								tagName = 'spoiler';
							}
							else if ( element.attributes['class'] == 'title' )
							{
								element.children = [];
							}
							else if ( ( value = style[ 'text-align' ] ) )
							{
								tagName = 'align';
							}
						}
						else if ( tagName == 'ol' || tagName == 'ul' )
						{
							if ( ( value = style[ 'list-style-type'] ) )
							{
								switch ( value )
								{
									case 'lower-alpha':
										value = 'a';
										break;
									case 'upper-alpha':
										value = 'A';
										break;
								}
							}
							else if ( tagName == 'ol' )
								value = 1;

							tagName = 'list';
						}
						else if ( tagName == 'spoiler' )
						{
							if ( editor.config.useSpoiler == 2 )
							{
								var title = element.children[0].children[0].value.replace( /^Spoiler:/, '' );
								title = title.replace( /&nbsp;/g, '' );
								title = CKEDITOR.tools.ltrim( title );
								if ( title )
									value = title;
							}
							element.children[0].children[0].value = '';
						}
						else if ( tagName == 'blockquote' )
						{
							try
							{
								var cite = element.children[ 0 ],
										quoted = element.children[ 1 ],
										citeText = cite.name == 'cite' && cite.children[ 0 ].value;

								if ( citeText )
								{
									if ( cite.children.length == 2 )
									{
										var author = cite.children[1].children[0].value.split(/('[^']*')/);
										value = author[1] + " pid=" + author[3] + " dateline=" + author[5];
									}
									else
									{
										value = "'" + citeText + "'";
									}
									
									element.children = quoted.children;
								}

							}
							catch( er )
							{
							}

							tagName = 'quote';
						}
						
						else if ( tagName == 'a' )
						{
							if ( ( value = attributes.href ) )
							{
								if ( value.indexOf( 'mailto:' ) !== -1 )
								{
									tagName = 'email';
									value = value.replace( 'mailto:', '' );
								}
								else
								{
									var singleton = element.children.length == 1 && element.children[ 0 ];
									if ( singleton
											&& singleton.type == CKEDITOR.NODE_TEXT
											&& singleton.value == value )
										value = '';
									else
										value = value.replace( /&amp;/g, '&' );
									tagName = 'url';
								}
							}
						}
						else if ( tagName == 'img' )
						{
							element.isEmpty = 0;

							// Translate smiley (image) to text emotion.
							var src = attributes[ 'data-cke-saved-src' ];
							
							if ( src && src.indexOf( editor.config.smiley_path ) == 0 )
								return new CKEDITOR.htmlParser.text( smileyMap[ attributes.alt ] );
							else
							{
								element.children = [ new CKEDITOR.htmlParser.text( src ) ];
							}
						}
						else if ( tagName == 'code' )
						{
							try
							{
								if ( element.parent.attributes['class'] == 'codeblock phpblock' ||
									element.parent.parent.attributes['class'] == 'codeblock phpblock' )
									tagName = 'php';
							}
							catch( e ) { return null; }
						}
						else if ( tagName == 'mybbvideo' )
						{
							var videoURL = new CKEDITOR.htmlParser.text( element.attributes.src );
							tagName = 'video';
							value = element.attributes.videotype;
							element.children = [ videoURL ];
						}

						element.name = tagName;
						value && ( element.attributes.option = value );

						return null;
					},

					// Remove any bogus br from the end of a pseudo block,
					// e.g. <div>some text<br /><p>paragraph</p></div>
					br : function( element )
					{
						var next = element.next;
						if ( next && next.name in blockLikeTags )
							return false;
					}
				}
			}, 1 );

			editor.dataProcessor.writer = BBCodeWriter;

			editor.on( 'beforeSetMode', function( evt )
			{
				evt.removeListener();
				var wysiwyg = editor._.modes[ 'wysiwyg' ];
				wysiwyg.loadData = CKEDITOR.tools.override( wysiwyg.loadData, function( org )
				{
					return function( data )
					{
						return ( org.call( this, BBCodeToHtml( data ) ) );
					};
				} );
			} );
		},

		afterInit : function( editor )
		{
			var filters;
			if ( editor._.elementsPath  )
			{
				// Eliminate irrelevant elements from displaying, e.g body and p.
				if ( ( filters = editor._.elementsPath.filters ) )
					filters.push( function( element )
					{
						var htmlName = element.getName(),
							name = tagnameMap[ htmlName ] || false;

						// Specialized anchor presents as email.
						if ( name == 'link' && element.getAttribute( 'href' ).indexOf( 'mailto:' ) === 0 )
							name = 'email';
						// Styled span could be either size or color.
						else if ( htmlName == 'span' )
						{
							if ( element.getStyle( 'font-size' ) )
								name = 'size';
							else if ( element.getStyle( 'font-family' ) )
								name = 'font';
							else if ( element.getStyle( 'color' ) )
								name = 'color';
						}
						else if ( name == 'img' )
						{
							var src = element.data( 'cke-saved-src' );
							if ( src && src.indexOf( editor.config.smiley_path ) === 0 )
								name = 'smiley';
						}

						return name;
					});
			}
		}
	} );
})();
