/**
 * Gyldendal GenreUnivers Planet Handler.
 *
 * This file handles all functionality associated with planets and orbits,
 * such as hover-effects and opening info-boxes.
 */

$GenreUnivers_Planet = {
	/**
	 * This function is automatically executed, when the user hovers a planet,
	 * and highlights the media associated with it. Possibly displays the title
	 * in a info-box.
	 */
	onMouseOver : function(elem) {
		// Make sure the system is ready!
		if (!$GenreUnivers.data) { return; }

		// Abort this function on touch-devices
		if ($GenreUnivers.supports.touch) { return; }

		// Abort this function, if an info-box is open!
		if ($GenreUnivers_InfoBox.open) { return; }

		// Create a reference to the planet
		var planet = $(elem.parentNode);

		// Read data about the planet
		var data = null;
		if (planet.data('type') === 'planet') {
			data = $GenreUnivers.data[planet.data('galaxy')].children[planet.data('planet')];
		} else if (planet.data('type') === 'orbit') {
			data = $GenreUnivers.data[planet.data('galaxy')].children[planet.data('planet')].children[planet.data('orbit')];
		}

		// If no data was found, abort this function
		if (!data) { return; }

		// Loop through the list of media and highlight matching ones
		for (var id in data.media) {
			// Highlight media?
			if (data.media[id] == "1") { $('.media-'+ id).animate({opacity: 1}, {duration: 250, easing: 'linear', queue: false}); }
		}

		// If this is a planet and we're at zoom level 1 or this is an orbit
		// and we're at zoom level 2, display a title-box
		if ((planet.data('type') === 'planet' && $GenreUnivers.zoom === 1) || (planet.data('type') === 'orbit' && $GenreUnivers.zoom === 2)) {
			// Calculate the position of the planet
			var x = 15; y = -17; var tmp = elem;
			while (tmp) {
				x += tmp.offsetLeft;
				y += tmp.offsetTop;
				tmp = tmp.offsetParent;
			}

			// Create the box
			var box = $('<div class="planet-title" style="top:'+ y +'px; left:'+ x +'px;"><img src="layout/images/misc/blank.gif" alt=""/>'+ planet.find('span').html() +'</div>');

			// Insert the title-box into the DOM
			$('body').append(box);

			// Reposition the box
			box.css({left : Math.round(x - box.width() / 2) +'px'});

			// Clean up memory
			box = null;
		}

		// Highlight planet parent
		if (planet.data('type') === 'orbit') {
			$('#trigger-'+ planet.data('galaxy') +'-'+ planet.data('planet')).addClass('active');
		}

		// Clean up memory
		data = null; planet = null;
	},

	/**
	 * This function is automatically executed, when the user leaves a planet,
	 * and removes all highlights of associated media and any displayed info-
	 * boxes.
	 */
	onMouseOut : function(elem) {
		// Make sure the system is ready!
		if (!$GenreUnivers.data) { return; }

		// Abort this function on touch-devices
		if ($GenreUnivers.supports.touch) { return; }

		// Create a reference to the planet
		var planet = $(elem.parentNode);

		// Remove highlight from planet parent
		if (planet.data('type') === 'orbit') {
			$('#trigger-'+ planet.data('galaxy') +'-'+ planet.data('planet')).removeClass('active');
		}

		// Abort this function, if an info-box is open!
		if ($GenreUnivers_InfoBox.open) { return; }

		// Begin fading all media highlights out!
		$('.media span').animate({opacity: 0}, {duration: 250, easing: 'linear', queue: false});

		// Remove any info-boxes
		$('.planet-title').remove();

		// Clean up memory
		planet = null;
	}
}