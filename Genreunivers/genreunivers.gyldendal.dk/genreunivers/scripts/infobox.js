/**
 * Gyldendal GenreUnivers Infobox Handler.
 *
 * This file is used to render and display info-boxes based on the information
 * in the XML-feed.
 */

$GenreUnivers_InfoBox = {
	/**
	 * This function opens an info-box and displays the data that has been
	 * sent to it.
	 */
	displayBox : function(e, trigger, type, galaxy_id, planet_id, orbit_id, sub_orbit_id) {
		// Make sure the system is ready!
		if (!$GenreUnivers.data) { return; }

		// Read data about the genre
		var data;
		if (type === 'planet') {
			// Grab data
			data = $GenreUnivers.data[galaxy_id].children[planet_id];

			// Assign path and type ID's
			data.path		= galaxy_id +', '+ planet_id;
			data.type		= 'planet';
			data.sub_type	= 'orbit';

		} else if (type === 'orbit') {
			// Grab data
			data = $GenreUnivers.data[galaxy_id].children[planet_id].children[orbit_id];

			// Assign path and type ID's
			data.path		= galaxy_id +', '+ planet_id +', '+ orbit_id;
			data.type		= 'orbit';
			data.sub_type	= 'sub-orbit';

		} else if (type === 'sub-orbit') {
			// Grab data
			data = $GenreUnivers.data[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id];

			// Assign path and type ID's
			data.path		= galaxy_id +', '+ planet_id +', '+ orbit_id +', '+ sub_orbit_id;
			data.type		= 'sub-orbit';
			data.sub_type	= null;
		}

		// If no matching data was found, abort this function
		if (!data) { return; }

		// Make sure no other info-boxes are open
		this.hideBox();
		$GenreUnivers_Basket.hideBasket();
		$GenreUnivers_Search.hideDropdown();

		// Remove planet titles!
		$('.galaxy-info').remove();
		$('.planet-title').remove();

		// Prepare the HTML-structure
		var html = '<div class="info-top"></div>';

		// Display the header
		html += '<div class="info-header">\
					'+ $GenreUnivers.data[galaxy_id].title +'\
					<h3 class="info-header-h3">'+ data.title +'</h3>\
					<a class="info-header-close" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_InfoBox.hideBox(event); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_InfoBox.hideBox(event); }">'+ _('Luk') +'</a>\
				</div>';

		// Prepare the content-container
		html += '<div class="info-contents">';

		// Output the teasers
		if (data.info.teaser && data.info.teaser.length) {
			html += '<ul class="info-teasers">';

			for (var i = 0, j = data.info.teaser.length; i < j; i++) {
				html += '<li>'+ data.info.teaser[i] +'</li>';
			}

			html += '</ul>';
		}

		// Output options
		html += '<a class="add-to-basket href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_Basket.addItem(\''+ data.type +'\', '+ data.path +'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_Basket.addItem(\''+ data.type +'\', '+ data.path +'); }">'+ _('Tilføj til kurv') +'</a>\
				 <a class="info-more" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayBox(\''+ data.type +'\', '+ data.path +'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayBox(\''+ data.type +'\', '+ data.path +'); }">'+ ((data.info.text && data.info.links && data.info.links.length) ? _('Læs mere og se eksempler') : (data.info.text ? _('Læs mere') : _('Se eksempler'))) +'</a>';

		// Output sub-genres
		if (data.children && data.children.length) {
			// Prepare the list
			html += '<ul class="info-sub-items">';

			// Loop through the list of children and add them to the list
			for (var i = 0, j = data.children.length; i < j; i++) {
				html += '<li class="info-sub-items-li">\
							<a class="add-to-basket" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_Basket.addItem(\''+ data.sub_type +'\', '+ data.path +', '+ i +'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_Basket.addItem(\''+ data.sub_type +'\', '+ data.path +', '+ i +'); }">'+ _('Tilføj til kurv') +'</a>\
							<a class="info-sub-items-a" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayBox(\''+ data.sub_type +'\', '+ data.path +', '+ i +'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayBox(\''+ data.sub_type +'\', '+ data.path +', '+ i +'); }">'+ data.children[i].title +'</a>\
						 </li>';
			}

			// Wrap up the list
			html += '</ul>';
		}

		// Wrap up the HTML-structure
		html += '</div><img class="info-arrow" src="layout/images/misc/blank.gif" alt=""/>';

		// Create the container and insert the HTML-structure
		var container = $('<div class="master-info"/>').html(html).css({visibility: 'hidden'}).appendTo($('.master-container')); html = null;

		// Calculate the position of the trigger
		var x = -$GenreUnivers.offset.x; var y = -$GenreUnivers.offset.y; var tmp = trigger;
		while (tmp && tmp.className.toLowerCase() !== 'master-container') {
			x += tmp.offsetLeft;
			y += tmp.offsetTop;
			tmp = tmp.offsetParent;
		} tmp = null;

		// Calculate the position of the arrow
		var arrow_y = 102 - Math.round((trigger.offsetHeight - 14) / 2);

		// Should we position the info-box on the right side of the planet?
		if(x - $('.master-container').position().left <= 546) {
			// Add the CSS-class to the arrow
			container.find('.info-arrow').addClass('info-arrow-left');

			// Position the info-box on the x-axis
			container.css({left : (x + trigger.offsetWidth + 10) +'px'});

		// ... Or to the left side?
		} else {
			// Add the CSS-class to the arrow
			container.find('.info-arrow').addClass('info-arrow-right');

			// Position the info-box on the x-axis
			container.css({left : (x - 334) +'px'});
		}

		// Position the container on the y-axis
		if (y - arrow_y + container.height() <= 579) {
			// Position the container on the y-axis
			container.css({top : (y - arrow_y) +'px'});
		} else {
			// Position the container on the y-axis
			container.css({top : (579 - container.height()) +'px'});

			// Position the info-arrow
			container.find('.info-arrow').css({top: (y - (582 - container.height()) + Math.round((trigger.offsetHeight - 14) / 2)) +'px'});
		}

		// Display the info-box!
		container.css({visibility: 'visible'});

		// Handle closing the info-box
		if (!$GenreUnivers.supports.touch) {
			// Close the info-box, when the user clicks anywhere in the
			// document
			$(document).bind('click.GenreUnivers_InfoBox_close', function() { $GenreUnivers_InfoBox.hideBox(); });

			// Except for clicks inside the info-box
			$(container).bind('click', function(e) { e.stopPropagation(); });
		} else {
			// Close the info-box, when the user clicks anywhere in the
			// document
			$(document).bind('touchend.GenreUnivers_InfoBox_close', function() { $GenreUnivers_InfoBox.hideBox(); });

			// Except for clicks inside the info-box
			$(container).bind('touchend', function(e) { e.stopPropagation(); });
		}

		// Clean up memory
		container = null;

		// Loop through the list of media and highlight matching ones
		for (var id in data.media) {
			// Highlight media?
			if (data.media[id] == "1") {
				$('.media-'+ id).animate({opacity: 1}, {duration: 250, easing: 'linear', queue: false});
			} else {
				$('.media-'+ id).animate({opacity: 0}, {duration: 250, easing: 'linear', queue: false});
			}
		}

		// Register that we opened an info-box
		this.open = true;

		// Update window hash
		window.location.hash = 'info='+ type +','+ (galaxy_id || 0) +','+ (planet_id || 0) +','+ (orbit_id || 0) +','+ (sub_orbit_id || 0);
		this.currentHash = 'info='+ type +','+ (galaxy_id || 0) +','+ (planet_id || 0) +','+ (orbit_id || 0) +','+ (sub_orbit_id || 0);

		// Stop event-propagation
		var e = e || window.event;
		e.stopPropagation && e.stopPropagation();
		e.cancelBubble = true;
	},

	/**
	 * This function closes the info-box again, when the user clicks anywhere
	 * on the document.
	 */
	hideBox : function() {
		// Make sure the system is ready!
		if (!$GenreUnivers.data) { return; }

		// If no info-boxes are opened currently, abort this funciton
		if (!this.open) { return; }

		// Remove the info-box from the DOM
		$('.master-info').remove();

		// Begin fading all media highlights out!
		$('.media span').animate({opacity: 0}, {duration: 250, easing: 'linear', queue: false});

		// Unbind event-handlers associated with the info-box
		if (!$GenreUnivers.supports.touch) {
			$(document).unbind('click.GenreUnivers_InfoBox_close');
		} else {
			$(document).unbind('touchend.GenreUnivers_InfoBox_close');
		}

		// Update window hash
		window.location.hash = '';
		this.currentHash = '';

		// Register that the info-box is no longer open
		this.open = false;
	},

	/**
	 * Automatically executed every 500ms and checks if the hash URL of the
	 * page has been changed.
	 */
	checkHashChange : function() {
		// Has the hash URL changed? - If not, abort this function
		if (window.location.hash == this.currentHash) { return; }

		// Close info-boxes?
		if (!window.location.hash) {
			this.hideBox();

		// Or open info-box?
		} else {
			// Break data down
			var hash = window.location.hash.split('info=')[1].split('&')[0].split(',');

			// Read data and create a temporary reference to the trigger
			if (hash[0] === 'planet') {
				// Read data and create the reference
				var trigger = document.getElementById('trigger-'+ hash[1] +'-'+ hash[2]);
				var data = $GenreUnivers.data[hash[1]].children[hash[2]];

			} else if (hash[0] === 'orbit') {
				// Read data and create the reference
				var trigger = document.getElementById('trigger-'+ hash[1] +'-'+ hash[2] +'-'+ hash[3]);
				var data = $GenreUnivers.data[hash[1]].children[hash[2]].children[hash[3]];

			} else if (hash[0] === 'sub_orbit') {
				// Read data and create the reference
				var trigger = document.getElementById('trigger-'+ hash[1] +'-'+ hash[2] +'-'+ hash[3] +'-'+ hash[4]);
				var data = $GenreUnivers.data[hash[1]].children[hash[2]].children[hash[3]].children[hash[4]];
			}

			// Set center!
			$GenreUnivers.setCenter(data.coords.x, data.coords.y);

			// Zoom in!
			$GenreUnivers.setZoom(3);

			// Open the info-box
			this.displayBox({}, trigger, hash[0], hash[1], hash[2], hash[3], hash[4]);
		}
	}
};

// Check for hash changes
$(document).ready(function() { $GenreUnivers_InfoBox.checkHashChange(); });