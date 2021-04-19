/**
 * Gyldendal GenreUnivers Basket Handler.
 *
 * This file is used to add texts to the basket, display the list of items in
 * the basket and handling the download-functionality.
 */

$GenreUnivers_Basket = {
	/**
	 * This variable contains the list of items in the basket.
	 */
	items : {
		latest : [],
		ordered : []
	},

	/**
	 * Initializes the basket by setting up event-handlers used to open the dropdown
	 */
	initialize : function() {
		// Bind event-listeners to the basket
		if (!$GenreUnivers.supports.touch) {
			$('.basket').bind('click', function(e) { $GenreUnivers_Basket.displayBasket(e); });
			$(window).keydown(function (e) { $GenreUnivers_Basket.onKeyPress(e); });
		} else {
			$('.basket').bind('touchend', function(e) { $GenreUnivers_Basket.displayBasket(e); });
		}

		// Update the basket-label
		$('.basket-label').html(_('Du har {%x} emner i din mappe', {x: 0}));
	},

	/**
	 * This function adds a genre to the basket.
	 */
	addItem : function(type, galaxy_id, planet_id, orbit_id, sub_orbit_id) {
		// Has this planet already been added? - Then skip this function
		try {
			if (type === 'planet' && this.items.ordered[galaxy_id].children[planet_id].data) { return; }
			if (type === 'orbit' && this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].data) { return; }
			if (type === 'sub-orbit' && this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id].data) { return; }
		} catch(e) {}
		
		// Store the data about the genre as an object
		var data = {
			type : type,
			galaxy_id : galaxy_id,
			planet_id : planet_id,
			orbit_id : orbit_id,
			sub_orbit_id : sub_orbit_id
		};

		// Store path and data from the XML-feed
		if (type === 'planet') {
			// Store data from the XML-feed
			data.data = $GenreUnivers.data[galaxy_id].children[planet_id];

			// Store path
			data.path = galaxy_id +', '+ planet_id;

		} else if (type === 'orbit') {
			// Store data from the XML-feed
			data.data = $GenreUnivers.data[galaxy_id].children[planet_id].children[orbit_id];

			// Store path
			data.path = galaxy_id +', '+ planet_id +', '+ orbit_id;

		} else if (type === 'sub-orbit') {
			// Store data from the XML-feed
			data.data = $GenreUnivers.data[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id];

			// Store path
			data.path = galaxy_id +', '+ planet_id +', '+ orbit_id +', '+ sub_orbit_id;
		}

		// If no matching data was found, abort this function
		if (!data.data) { return; }

		// Add the item to the list of latest added items
		this.items.latest[this.items.latest.length] = data;

		// Add the item to the ordered list of items
		if (type === 'planet') {
			// Prepare arrays
			if (!this.items.ordered[galaxy_id]) { this.items.ordered[galaxy_id] = {'children' : {}}; }
			if (!this.items.ordered[galaxy_id].children[planet_id]) { this.items.ordered[galaxy_id].children[planet_id] = {'children' : {}}; }

			// Add the item
			this.items.ordered[galaxy_id].children[planet_id].data = data;

		} else if (type === 'orbit') {
			// Prepare arrays
			if (!this.items.ordered[galaxy_id]) { this.items.ordered[galaxy_id] = {'children' : {}}; }
			if (!this.items.ordered[galaxy_id].children[planet_id]) { this.items.ordered[galaxy_id].children[planet_id] = {'children' : {}}; }
			if (!this.items.ordered[galaxy_id].children[planet_id].children[orbit_id]) { this.items.ordered[galaxy_id].children[planet_id].children[orbit_id] = {'children' : {}}; }

			// Add the item
			this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].data = data;

		} else if (type === 'sub-orbit') {
			// Prepare arrays
			if (!this.items.ordered[galaxy_id]) { this.items.ordered[galaxy_id] = {'children' : {}}; }
			if (!this.items.ordered[galaxy_id].children[planet_id]) { this.items.ordered[galaxy_id].children[planet_id] = {'children' : {}}; }
			if (!this.items.ordered[galaxy_id].children[planet_id].children[orbit_id]) { this.items.ordered[galaxy_id].children[planet_id].children[orbit_id] = {'children' : {}}; }
			if (!this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id]) { this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id] = {'children' : {}}; }

			// Add the item
			this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id].data = data;
		}

		// Update the basket-label
		$('.basket-label').html(_('Du har {%x} emne'+ ((this.items.latest.length !== 1) ? 'r' : '') +' i din mappe', {x: this.items.latest.length}));
	},

	/**
	 * This function removes an item from the basket again.
	 */
	removeItem : function(type, galaxy_id, planet_id, orbit_id, sub_orbit_id) {
		// Remove the planet from the list of ordered items
		try {
			if (type === 'planet' && this.items.ordered[galaxy_id].children[planet_id].data) {
				// Remove the planet!
				this.items.ordered[galaxy_id].children[planet_id].data = null;
				delete this.items.ordered[galaxy_id].children[planet_id].data;

			} else if (type === 'orbit' && this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].data) {
				// Remove the planet!
				this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].data = null;
				delete this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].data;

			} else if (type === 'sub-orbit' && this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id].data) {
				// Remove the planet!
				this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id].data = null;
				delete this.items.ordered[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id].data;
			}
		} catch(e) {}

		// Calculate path
		if (type === 'planet') {
			// Store path
			var path = galaxy_id +', '+ planet_id;

		} else if (type === 'orbit') {
			// Store path
			var path = galaxy_id +', '+ planet_id +', '+ orbit_id;

		} else if (type === 'sub-orbit') {
			// Store path
			var path = galaxy_id +', '+ planet_id +', '+ orbit_id +', '+ sub_orbit_id;
		}

		// Remove the planet from the list of latest items
		for (var i = -1, j = this.items.latest.length; ++i < j; ) {
			// Remove this planet?
			if (this.items.latest[i].path === path) {
				// Remove the planet
				this.items.latest[i] = null;
				this.items.latest.splice(i, 1);

				// Abort this loop
				break;
			}
		}

		// Update the basket-label
		$('.basket-label').html(_('Du har {%x} emne'+ ((this.items.latest.length !== 1) ? 'r' : '') +' i din mappe', {x: this.items.latest.length}));
	},

	/**
	 * This function displays the contents of the cart.
	 */
	displayBasket : function(e) {
		// If the basket is already open, abort this function
		if (this.open) { return; }

		// Close any open info-boxes
		$GenreUnivers_InfoBox.hideBox();

		// Prepare the HTML-structure
		var html = '<div class="basket-dropdown-top"></div><img class="basket-dropdown-arrow" src="layout/images/misc/blank.gif" alt=""/>';

		// Output the list of items added to the cart
		html += '<ul class="basket-dropdown-list">';

		var i = this.items.latest.length;
		while (i--) {
			// Add the item to the output
			html += '<li class="basket-dropdown-list-li"><a class="basket-dropdown-list-a" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayBox(\''+ this.items.latest[i].type +'\', '+ this.items.latest[i].path +', '+ i +'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayBox(\''+ this.items.latest[i].type +'\', '+ this.items.latest[i].path +', '+ i +'); }">'+ this.items.latest[i].data.title +'</a></li>';
		}

		if (this.items.latest.length === 0) {
			html += '<li class="basket-dropdown-list-none">'+ _('Ingen emner i din mappe...') +'</li>';
		}

		html += '</ul>';

		// Add the download link to the HTML
		if (this.items.latest.length) {
			html += '<a class="basket-dropdown-download" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_Basket.download(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_Basket.download(); }">'+ _('Download indhold') +'</a>';
		}

		// Create the wrapper and insert it into the DOM
		var container = $('<div class="basket-dropdown"/>').html(html).appendTo($('.basket')); html = null;
		setTimeout(function() { container[0].style.opacity = 1; }, 25);

		// Handle closing the info-box
		if (!$GenreUnivers.supports.touch) {
			// Close the basket, when the user clicks anywhere in the document
			$(document).bind('click.GenreUnivers_Basket_close', function() { $GenreUnivers_Basket.hideBasket(); });
		} else {
			// Close the basket, when the user clicks anywhere in the document
			$(document).bind('touchend.GenreUnivers_Basket_close', function() { $GenreUnivers_Basket.hideBasket(); });
		}

		// Clean up memory
		//container = null;

		// Register that we opened the basket dropdown
		this.open = true;
		this.highlight_index = -1;

		// Stop event-propagation
		e.stopPropagation();
	},

	/**
	 * This function is automatically executed, when the user uses the keyboard
	 * to interact with the basket.
	 */
	onKeyPress : function (e) {
		// If the basket is not currently open, abort this function
		if (!this.open) { return; }

		// If nothing has been added to the basket, abort this function
		if (!this.items.latest.length) { return; }

		// Did the user hit the down-arrow?
		if (e.keyCode == 40) {
			// Make sure the user has not reached the bottom of the list yet
			if (this.highlight_index < this.items.latest.length) {
				// Update the highlight index
				this.highlight_index++;

				// Highlight the proper element
				$('.basket-dropdown-list-highlight').removeClass('basket-dropdown-list-highlight');

				// Highlight a regular entry?
				if (this.highlight_index < this.items.latest.length) { $('.basket-dropdown-list-a').eq(this.highlight_index).addClass('basket-dropdown-list-highlight'); }
				else { $('.basket-dropdown-download').addClass('basket-dropdown-list-highlight'); }
			}

			// Abort default event-interaction
			e.preventDefault();
			e.stopPropagation();

		// Did the user hit the up-arrow?
		} else if (e.keyCode == 38) {
			// Remove any current highlight
			$('.basket-dropdown-list-highlight').removeClass('basket-dropdown-list-highlight');

			// Make sure the user has not reached the top of the list yet
			if (this.highlight_index > -1) {
				// Update the highlight index
				this.highlight_index--;

				// Highlight the proper element
				if (this.highlight_index > -1) { $('.basket-dropdown-list-a').eq(this.highlight_index).addClass('basket-dropdown-list-highlight'); }
			}

			// Abort default event-interaction
			e.preventDefault();
			e.stopPropagation();

		// Did the user hit the enter-key?
		} else if (e.keyCode == 13) {
			// Make sure an element was selected
			if (this.highlight_index > -1) {
				// Should we open an element from the basket?
				if (this.highlight_index < this.items.latest.length) {
					// Reverse index
					var i = this.items.latest.length - this.highlight_index - 1;
					eval('$GenreUnivers_TextBox.displayBox("'+ this.items.latest[i].type +'", '+ this.items.latest[i].path +', '+ i +');');

				// ... Or should we download the contents?
				} else {
					this.download();
				}

				// Hide the basket
				this.hideBasket();

				// Abort default event-interaction
				e.preventDefault();
				e.stopPropagation();
			}
		}
	},

	/**
	 * This function closes the info-box again, when the user clicks anywhere
	 * on the document.
	 */
	hideBasket : function() {
		// If the basket is not currently open, abort this function
		if (!this.open) { return; }

		// Remove the basket from the DOM
		$('.basket-dropdown').remove();

		// Unbind event-handlers associated with the info-box
		if (!$GenreUnivers.supports.touch) {
			$(document).unbind('click.GenreUnivers_Basket_close');
		} else {
			$(document).unbind('touchend.GenreUnivers_Basket_close');
		}

		// Register that the info-box is no longer open
		this.open = false;
	},

	/**
	 * This function loops through the list of added genres and prepares the
	 * HTML-output used for the download-process.
	 */
	download : function() {
		// Prepare the HTML-output
		var html = '';

		// Loop through the list of galaxies, and add them to the output
		for (var galaxy_id in this.items.ordered) {
			// Load data about the galaxy
			var galaxy = this.items.ordered[galaxy_id];

			// Add the title of the galaxy
			html += '<h1>'+ $GenreUnivers.data[galaxy_id].title +'</h1>';

			// Loop through the list of planets on the galaxy
			for (var planet_id in galaxy.children) {
				// Load data about the planet
				var planet = galaxy.children[planet_id];

				// Add the planet to the output?
				if (planet.data) { html += this.downloadPlanet(planet.data.data.title, planet.data.data); }

				// Loop through and the list of orbits around the planet
				for (var orbit_id in planet.children) {
					// Load data about the orbit
					var orbit = planet.children[orbit_id];

					// Add the orbit to the output?
					if (orbit.data) {
						// Parse the title
						var title = $GenreUnivers.data[galaxy_id].children[planet_id].title +' &raquo; '+ orbit.data.data.title;

						// Add the orbit to the output
						html += this.downloadPlanet(title, orbit.data.data);
					}

					// Loop through and the list of sub-orbits around the orbit
					for (var sub_orbit_id in orbit.children) {
						// Load data about the sub-orbit
						var sub_orbit = orbit.children[sub_orbit_id];

						// Add the sub-orbit to the output?
						if (sub_orbit.data) {
							// Parse the title
							var title = $GenreUnivers.data[galaxy_id].children[planet_id].title +' &raquo; '+ $GenreUnivers.data[galaxy_id].children[planet_id].children[orbit_id].title +' &raquo; '+ sub_orbit.data.data.title;

							// Add the sub-orbit to the output
							html += this.downloadPlanet(title, sub_orbit.data.data);
						}
					}
				}
			}
		}

		// Calculate the dimensions of the current window
		var win_w = (window.innerWidth || document.documentElement.offsetWidth || document.body.offsetWidth || 0);
		var win_h = (window.innerHeight || document.documentElement.offsetHeight || document.body.offsetHeight || 0);

		// Calculate dimensions of the popup
		var popup_w = 650;
		var popup_h = 400;

		// Calculate the size of the screen
		var screen_w = screen.width;
		var screen_h = screen.height;

		// Calculate the position of the popup
		var popup_x = Math.max(0, Math.min(screen_w - popup_w, Math.round((window.screenLeft || window.screenX || 0) + (win_w - popup_w) / 2)));
		var popup_y = Math.max(0, Math.min(screen_h - popup_h, Math.round((window.screenTop || window.screenY || 0) + (win_h - popup_h) / 2)));

		// Open a new window and insert the HTML in there
		var win = window.open('download.html', 'GenreUniversDownload_'+ (+new Date), 'status=0,toolbar=0,location=0,menubar=0,directories=0,resizeable=1,scrollbars=1,width='+ popup_w +',height='+ popup_h +',left='+ popup_x +',top='+ popup_y);

		// When the window has loaded, insert the HTML-structure
		win.onload = function() { win.document.getElementById('contents_container').innerHTML = html; }
		var _interval = setInterval(function() {
			// Has the window loaded?
			if (win.document && win.document.getElementById && win.document.getElementById('contents_container')) {
				// Insert the HTML-structure
				win.document.getElementById('contents_container').innerHTML = html;

				// Abort interval
				clearInterval(_interval);
			}
		}, 50);
	},

	/**
	 * This function is used to add a planet to the output, used to download
	 * the genres added to the basket.
	 */
	downloadPlanet : function(title, data) {
		// Prepare the output
		var html = '<h2>'+ title +'</h2>';

		// Add teaser
		if (data.info.teaser && data.info.teaser.length) {
			// Prepare the list
			html += '<ul>';

			// Loop through and add the teasers
			for (var i = 0, j = data.info.teaser.length; i < j; i++) {
				html += '<li>' + data.info.teaser[i] +'</li>';
			}

			// Wrap the list up
			html += '</ul>';
		}

		// Add actual text
		html += data.info.text;

		// Add links
		if (data.info.links && data.info.links.length) {
			// Prepare the example-output
			var examples = '';

			// Loop through and add the links
			for (var i = 0, j = data.info.links.length; i < j; i++) {
				// External links
				if (data.info.links[i].type === 'external') {
					examples += '<p>'+ data.info.links[i].title +':<br/><a href="'+ data.info.links[i].url +'">'+ data.info.links[i].url +'</a></p>';

				// Photos
				} else if (data.info.links[i].type === 'photo') {
					examples += '<p>'+ data.info.links[i].title +':<br/><img src="'+ data.info.links[i].url +'" alt="" style="width:600px;" /></p>';
				}
			}

			// Add the examples
			if (examples) {
				html += '<p><b>Eksempler:</b></p>';
				html += examples;
			}
		}

		// Return the HTML-structure
		return html;
	}
};

// Initialize the basket, when the document is ready
$(document).ready(function() { $GenreUnivers_Basket.initialize(); });