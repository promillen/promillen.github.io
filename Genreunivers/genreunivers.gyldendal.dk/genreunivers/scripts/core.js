/**
 * Gyldendal GenreUnivers Core Handler.
 *
 * This file contains the core handler for Gyldendal GenreUnivers. It initia-
 * lizes the app by setting up event-handlers and parsing the data received in
 * the XML-feed. Also handles zooming and dragging around in the map.
 */

$GenreUnivers = {
	/**
	 * Determine whether various features are supported by the clients browser.
	 */
	supports : {
		// Is this a desktop- or touch-device?
		touch : ('ontouchend' in document)
	},

	/**
	 * This variable contains the current center of the map.
	 */
	center : {
		x : 1367,
		y : 628
	},

	/**
	 * This variable contains the current offset of the map on touch devices.
	 */
	offset : {
		x : 0,
		y : 0
	},

	/**
	 * This variable contains the current zoom-level of the map.
	 */
	zoom : 1,

	/**
	 * This function initializes Gyldendal GenreUnivers by setting up event-
	 * handlers and inserting the planets and galaxies into the DOM.
	 */
	initialize : function() {
		// Assign touch or desktop class
		document.body.className = !this.supports.touch? 'desktop' : 'touch';

		// Initialize media-types (for IE)
		$('.media span').css({opacity: 0});

		// Setup event-handlers
		if (!this.supports.touch) {
			// Handle zooming and dragging the map around
			$('#map-wrapper').bind('mousedown', function(e) { $GenreUnivers.startDrag(e); });
			$('#map-wrapper').bind('dblclick', function(e) { $GenreUnivers.dblClick(e); });

			// Handle drag'n'drop of the zoom-slider
			$('.zoom-slider').bind('mousedown', function(e) { $GenreUnivers.zoomDragStart(e); });

			// Prevent default behaviours!
			$('#map-wrapper').bind('mousedown', function(e) { e.preventDefault(); });
			$('#map-wrapper').bind('mousemove', function(e) { e.preventDefault(); });
			$('#map-wrapper').bind('mouseup', function(e) { e.preventDefault(); });
			$('#map-wrapper').bind('click', function(e) { e.preventDefault(); });

			// Handle keyboard inputs
			$(window).bind('keydown', function(e) { $GenreUnivers.onKeyPress(e); });
		} else {
			// Handle zooming and dragging the map around
			$('#map-wrapper').bind('touchstart.drag', function(e) { $GenreUnivers.startDrag(e); });
			$('#map-wrapper').bind('touchstart.dbltap', function(e) { $GenreUnivers.tapHandler(e); });

			// Handle drag'n'drop of the zoom-slider
			$('.zoom-slider').bind('touchstart', function(e) { $GenreUnivers.zoomDragStart(e); });

			// Prevent default behaviours!
			$('#map-wrapper').bind('touchmove', function(e) { e.preventDefault(); });
		}
	},

	/**
	 * This function preloads all images used to handle the different zoom-
	 * levels for both galaxies and planets.
	 */
	preload : function() {
		// Preload map backgrounds
		(new Image).src = 'layout/images/maps/zoom-2.jpg';
		if (!this.supports.touch) { (new Image).src = 'layout/images/maps/zoom-3.jpg'; }

		// Preload iPad background grid
		if (this.supports.touch) {
			(new Image).src = 'layout/images/maps/zoom-3-1-1.jpg';
			(new Image).src = 'layout/images/maps/zoom-3-1-2.jpg';
			(new Image).src = 'layout/images/maps/zoom-3-1-3.jpg';
			(new Image).src = 'layout/images/maps/zoom-3-2-1.jpg';
			(new Image).src = 'layout/images/maps/zoom-3-2-2.jpg';
			(new Image).src = 'layout/images/maps/zoom-3-2-3.jpg';
			(new Image).src = 'layout/images/maps/zoom-3-3-1.jpg';
			(new Image).src = 'layout/images/maps/zoom-3-3-2.jpg';
			(new Image).src = 'layout/images/maps/zoom-3-3-3.jpg';
		}

		// Preload galaxies
		(new Image).src = 'layout/images/galaxies/fiction/zoom-2.png';
		(new Image).src = 'layout/images/galaxies/fiction/zoom-3.png';
		(new Image).src = 'layout/images/galaxies/non-fiction/zoom-2.png';
		(new Image).src = 'layout/images/galaxies/non-fiction/zoom-3.png';

		// Preload info-box and lightbox backgrounds
		(new Image).src = 'layout/images/misc/infobox.png';
		(new Image).src = 'layout/images/misc/textbox.png';
		(new Image).src = 'layout/images/misc/shadow.png';

		// Preload text-box images
		(new Image).src = 'layout/images/misc/throbber.gif';
		(new Image).src = 'layout/images/misc/throbber2.gif';		
	},

	/**
	 * This function updates the center of the map as specified with the coor-
	 * dinates.
	 */
	setCenter : function(x, y) {
		// Create a temporary reference to the map and the shadow
		var map = document.getElementById('map');
		//var shadow = document.getElementById('map-shadow');

		// Calculate offsets to maintain the current center of the map
		var center_x = Math.max(0, Math.min(2733 / 3 * this.zoom - 911, Math.round(x / 3 * this.zoom - 455)));
		var center_y = Math.max(0, Math.min(1257 / 3 * this.zoom - 419, Math.round(y / 3 * this.zoom - 209)));

		// Maintain the current center of the map
		if (!this.supports.touch) {
			// Center the map!
			map.style.left = -center_x +'px';
			map.style.top = -center_y +'px';

			// Adjust shadow!
			//shadow.style.left = center_x +'px';
			//shadow.style.top = center_y +'px';
		} else {
			// Center the map!
			map.style.webkitTransform = 'translate3d(-'+ center_x +'px, -'+ center_y +'px, 0)';
			this.offset.x = center_x;
			this.offset.y = center_y;

			// Adjust shadow!
			//shadow.style.webkitTransform = 'translate3d('+ center_x +'px, '+ center_y +'px, 0)';
		}

		// Clean up memory
		map = null; shadow = null;

		// Store new center-coordinates
		this.center.x = x;
		this.center.y = y;
	},

	/**
	 * This function zooms to the specified level, maintaining the current
	 * center of the map.
	 */
	setZoom : function(level) {
		// Make sure the zoom-level is within bounds!
		var level = Math.max(1, Math.min(3, level));

		// If we're already at this zoom-level
		if (level === this.zoom) { return; }
		this.zoom = level;

		// Create a temporary reference to the map and the shadow
		var map = document.getElementById('map');
		//var shadow = document.getElementById('map-shadow');

		// Set the zoom-level
		map.className = 'map map-zoom-'+ level;

		// Calculate offsets to maintain the current center of the map
		var center_x = Math.max(0, Math.min(2733 / 3 * level - 911, Math.round(this.center.x / 3 * level - 455)));
		var center_y = Math.max(0, Math.min(1257 / 3 * level - 419, Math.round(this.center.y / 3 * level - 209)));

		// Maintain the current center of the map
		if (!this.supports.touch) {
			// Center the map!
			map.style.left = -center_x +'px';
			map.style.top = -center_y +'px';

			// Adjust shadow!
			//shadow.style.left = center_x +'px';
			//shadow.style.top = center_y +'px';
		} else {
			// Center the map!
			map.style.webkitTransform = 'translate3d(-'+ center_x +'px, -'+ center_y +'px, 0)';
			this.offset.x = center_x;
			this.offset.y = center_y;

			// Adjust shadow!
			//shadow.style.webkitTransform = 'translate3d('+ center_x +'px, '+ center_y +'px, 0)';
		}

		// Clean up memory
		map = null; shadow = null;

		// Show or hide fiction / non-fiction labels
		if (level > 1) {
			$('.fiction').hide();
			$('.non-fiction').hide();
		} else {
			$('.fiction').show();
			$('.non-fiction').show();
		}

		// Update the position of the zoom-slider
		$('.zoom-slider').css({left : (level * 60 - 6) +'px'});
	},

	/**
	 * This function is automatically executed, when the user clicks the map,
	 * and initializes the drag'n'drop functionality
	 */
	startDrag : function(e) {
		// If the user has not zoomed in currently, abort this function!
		if (this.zoom === 1) { return; }

		// Calculate using regular mouse or touch-events?
		if (!this.supports.touch) {
			var x = e.pageX;
			var y = e.pageY;
		} else {
			var x = e.originalEvent.touches[0].pageX;
			var y = e.originalEvent.touches[0].pageY;
		}

		// Store the current coordinates of the event
		this.dragInfo = {
			start : {
				x : x,
				y : y
			},

			end : {
				x : x,
				y : y
			}
		};

		// Setup event-handlers
		if (!this.supports.touch) {
			$(document).bind('mousemove.GenreUnivers_drag', function(e) { $GenreUnivers.drag(e); });
			$(document).bind('mouseup.GenreUnivers_drag', function(e) { $GenreUnivers.drop(e); });
		} else {
			$(document).bind('touchmove.GenreUnivers_drag', function(e) { $GenreUnivers.drag(e); });
			$(document).bind('touchend.GenreUnivers_drag', function(e) { $GenreUnivers.drop(e); });
		}

		// Assign the move-cursor
		document.body.style.cursor = 'move';

		// Stop event propagation
		e.stopPropagation();
		e.preventDefault();
	},

	/**
	 * This function is automatically executed, when the user drags the map
	 * around, and updates the positioning.
	 */
	drag : function(e) {
		// Calculate using regular mouse or touch-events?
		if (!this.supports.touch) {
			var x = e.pageX;
			var y = e.pageY;
		} else {
			var x = e.originalEvent.touches[0].pageX;
			var y = e.originalEvent.touches[0].pageY;
		}

		// Store the coordinates
		this.dragInfo.end = {
			x : x,
			y : y
		};

		// Calculate offsets relative to the current center of the map
		var center_x = Math.max(0, Math.min(2733 / 3 * this.zoom - 911, Math.round(this.center.x / 3 * this.zoom + (this.dragInfo.start.x - x) - 455)));
		var center_y = Math.max(0, Math.min(1257 / 3 * this.zoom - 419, Math.round(this.center.y / 3 * this.zoom + (this.dragInfo.start.y - y) - 209)));

		// Close any currently open info-box
		$('.planet-title').remove();
		$GenreUnivers_InfoBox.hideBox();

		// Create a temporary reference to the map and shadow
		var map = document.getElementById('map');
		//var shadow = document.getElementById('map-shadow');

		// Maintain the current center of the map
		if (!this.supports.touch) {
			// Center the map!
			map.style.left = -center_x +'px';
			map.style.top = -center_y +'px';

			// Adjust shadow!
			//shadow.style.left = center_x +'px';
			//shadow.style.top = center_y +'px';
		} else {
			// Center the map!
			map.style.webkitTransform = 'translate3d(-'+ center_x +'px, -'+ center_y +'px, 0)';
			this.offset.x = center_x;
			this.offset.y = center_y;

			// Adjust shadow!
			//shadow.style.webkitTransform = 'translate3d('+ center_x +'px, '+ center_y +'px, 0)';
		}

		// Clean up memory
		map = null; shadow = null;

		// Stop event propagation
		e.stopPropagation();
		e.preventDefault();
	},

	/**
	 * This function is automatically executed, when the user releases the map,
	 * and updates the coordinates of the current center of the map and unbinds
	 * any event-handlers associated with the drag'n'drop-functionality.
	 */
	drop : function(e) {
		// Reset the cursor
		document.body.style.cursor = 'auto';

		// Calculate offsets and update the current center of the map
		this.center.x = Math.max(455, Math.min(2733 / 3 * this.zoom - 456, Math.round(this.center.x / 3 * this.zoom + (this.dragInfo.start.x - this.dragInfo.end.x)))) / this.zoom * 3;
 		this.center.y = Math.max(209, Math.min(1257 / 3 * this.zoom - 210, Math.round(this.center.y / 3 * this.zoom + (this.dragInfo.start.y - this.dragInfo.end.y)))) / this.zoom * 3;

		// Unbind event-handlers
		if (!this.supports.touch) {
			$(document).unbind('mousemove.GenreUnivers_drag');
			$(document).unbind('mouseup.GenreUnivers_drag');
		} else {
			$(document).unbind('touchmove.GenreUnivers_drag');
			$(document).unbind('touchend.GenreUnivers_drag');
		}

		// Stop event-propagation
		e.stopPropagation();
		e.preventDefault();
	},

	/**
	 * This function is automatically executed everytime the user touches the
	 * map, and checks whether he/she has made a double-tap.
	 */
	tapHandler : function(e) {
		// Register the current timestamp
		var tstamp = +new Date;

		// Has the user tapped twice within 350ms? - Then execute the dblClick-
		// function and abort further execution of this function
		if (tstamp - this._lastTap <= 350) {
			// Execute the dblClick-function
			this.dblClick(e);

			// Abort further execution of this function
			return;
		}

		// Register the timestamp of this tap
		this._lastTap = tstamp;
	},

	/**
	 * This function is automatically executed, if the user double-clicks the
	 * map, and zooms a level in (if possible).
	 */
	dblClick : function(e) {
		// If we're already at level 3, abort this function
		if (this.zoom === 3) { return; }

		// Calculate using regular mouse or touch-events?
		if (!this.supports.touch) {
			var x = e.pageX;
			var y = e.pageY;
		} else {
			var x = e.originalEvent.touches[0].pageX;
			var y = e.originalEvent.touches[0].pageY;
		}		

		// Make the coordinates relative to the map container
		var tmp = document.getElementById('map-wrapper');
		while (tmp) {
			x -= tmp.offsetLeft;
			y -= tmp.offsetTop;
			tmp = tmp.offsetParent;
		}

		// Calculate the new center based on the coordinates of the mouse
		this.center.x += Math.round((x - 455) / this.zoom * 3);
		this.center.y += Math.round((y - 209) / this.zoom * 3);

		// Zoom in!
		this.setZoom(this.zoom + 1);
	},

	/**
	 * This function is automatically executed, when the user clicks the zoom-
	 * slider, and initializes the drag'n'drop-handling.
	 */
	zoomDragStart : function(e) {
		// Calculate using regular mouse or touch-events?
		if (!this.supports.touch) {
			var x = e.pageX;
		} else {
			var x = e.originalEvent.touches[0].pageX;
		}

		// Store the current position of the mouse and slider
		this.zoomDragInfo = {
			x : x,
			offset : (60 * this.zoom - 1)
		};

		// Setup event-handlers
		if (!this.supports.touch) {
			$(document).bind('mousemove.GenreUnivers_zoomDrag', function(e) { $GenreUnivers.zoomDrag(e); });
			$(document).bind('mouseup.GenreUnivers_zoomDrag', function(e) { $GenreUnivers.zoomDrop(e); });
		} else {
			$(document).bind('touchmove.GenreUnivers_zoomDrag', function(e) { $GenreUnivers.zoomDrag(e); });
			$(document).bind('touchend.GenreUnivers_zoomDrag', function(e) { $GenreUnivers.zoomDrop(e); });
		}

		// Assign the move-cursor
		document.body.style.cursor = 'move';
		$('.zoom-slider').css({cursor : 'move'});

		// Stop event propagation
		e.stopPropagation();
		e.preventDefault();
	},

	/**
	 * This function is automatically executed, as the user drags the zoom-
	 * slider around, and calculates which zoom level to display.
	 */
	zoomDrag : function(e) {
		// Calculate using regular mouse or touch-events?
		if (!this.supports.touch) {
			var x = e.pageX;
		} else {
			var x = e.originalEvent.touches[0].pageX;
		}

		// Calculate the current position of the slider
		var x = this.zoomDragInfo.offset - (this.zoomDragInfo.x - x);

		// Determine which zoom-level to display
		if (x < 98) { this.setZoom(1); }
		else if (x < 148) { this.setZoom(2); }
		else { this.setZoom(3); }
	},

	/**
	 * This function is automatically executed, when the user drops the zoom-
	 * slider again, and finishes the drag'n'drop process by unbinding event-
	 * handlers.
	 */
	zoomDrop : function(e) {
		// Reset the cursor
		document.body.style.cursor = 'auto';
		$('.zoom-slider').css({cursor : 'pointer'});

		// Unbind event-handlers
		if (!this.supports.touch) {
			$(document).unbind('mousemove.GenreUnivers_zoomDrag');
			$(document).unbind('mouseup.GenreUnivers_zoomDrag');
		} else {
			$(document).unbind('touchmove.GenreUnivers_zoomDrag');
			$(document).unbind('touchend.GenreUnivers_zoomDrag');
		}

		// Stop event-propagation
		e.stopPropagation();
		e.preventDefault();
	},

	/**
	 * This function is automatically executed, when the user uses the keyboard
	 * to zoom in/out or navigate around the map.
	 */
	onKeyPress : function (e) {
		// If either search or basket is currently open, then abort this function
		if ($GenreUnivers_Search.open || $GenreUnivers_Basket.open) { return; }

		// Did the user try to zoom out?
		if ((e.metaKey || e.ctrlKey) && e.keyCode == 107) {
			// Zoom!
			if (this.zoom < 3) { this.setZoom(this.zoom + 1); }

			// Prevent default interaction
			e.preventDefault();
			e.stopPropagation();

		// Did the user try to zoom out?
		} else if ((e.metaKey || e.ctrlKey) && e.keyCode == 109) {
			// Zoom!
			if (this.zoom > 1) { this.setZoom(this.zoom - 1); }

			// Prevent default interaction
			e.preventDefault();
			e.stopPropagation();

		// Did the user try to navigate up?
		} else if (e.keyCode == 38) {
			// Navigate up
			this.setCenter(this.center.x, this.center.y - 10 * this.zoom);

			// Prevent default interaction
			e.preventDefault();
			e.stopPropagation();

		// Did the user try to navigate down?
		} else if (e.keyCode == 40) {
			// Navigate down
			this.setCenter(this.center.x, this.center.y + 10 * this.zoom);

			// Prevent default interaction
			e.preventDefault();
			e.stopPropagation();

		// Did the user try to navigate left?
		} else if (e.keyCode == 37) {
			// Navigate left
			this.setCenter(this.center.x - 10 * this.zoom, this.center.y);

			// Prevent default interaction
			e.preventDefault();
			e.stopPropagation();

		// Did the user try to navigate right?
		} else if (e.keyCode == 39) {
			// Navigate right
			this.setCenter(this.center.x + 10 * this.zoom, this.center.y);

			// Prevent default interaction
			e.preventDefault();
			e.stopPropagation();
		}
	}
};

// Initialize GenreUnivers, when the document is ready
$(document).ready(function() { $GenreUnivers.initialize(); });

// Preload images, when the window is loaded
$(window).load(function() { $GenreUnivers.preload(); });