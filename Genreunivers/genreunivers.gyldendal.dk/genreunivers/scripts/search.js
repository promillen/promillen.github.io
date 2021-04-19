/**
 * Gyldendal GenreUnivers Search Handler.
 *
 * This file is used to search for genres across the system, using AJAX.
 */

$GenreUnivers_Search = {
	/**
	 * Initializes the basket by setting up event-handlers used to open the dropdown
	 */
	initialize : function() {
		// Create a temporary reference to the search-input
		var input = $('#search-input');

		// Bind event-listeners to the input
		input
			.bind('focus', function() { $GenreUnivers_Search.onFocus(); })
			.bind('blur', function() { $GenreUnivers_Search.onBlur(); })
			.bind('keydown', function(e) { $GenreUnivers_Search.onKeyPress2(e); })
			.bind('keyup', function() { $GenreUnivers_Search.onKeyPress(); });

		// Update text and color
		input.val(_('Indtast søgeord'));
		input.css({color: '#cbc7be'});

		// Clean up memory
		input = null;
	},

	/**
	 * This function is automatically executed, when the user puts focus in the sea
	 */
	onFocus : function() {
		// Create a temporary reference to the input
		var input = document.getElementById('search-input');

		// Remove default placeholder
		if (input.value === _('Indtast søgeord')) {
			input.value = '';
			input.style.color = '#978f7c';
		}

		// Has any text been displayed? Then simulate the keyPress-event
		if (input.value) { this.onKeyPress(); }

		// Clean up memory
		input = null;
	},

	/**
	 * This function is automatically executed, when the user removes focus
	 * from the search-input. It displays the default placeholder-string and
	 * removes the search-dropdown from the DOM.
	 */
	onBlur : function() {
		// Create a temporary reference to the input
		var input = document.getElementById('search-input');

		// Display default placeholder
		if (input.value === '') {
			input.style.color = '#cbc7be';
			input.value = _('Indtast søgeord');
		}

		// Make sure to hide the search-dropdown
		setTimeout(function() { $GenreUnivers_Search.hideDropdown(); }, 250);

		// Clean up memory
		input = null;
	},

	/**
	 * This function is automatically executed, when the user inputs text into
	 * the search-input, and fetches the list of matching results from the 
	 * server via AJAX.
	 */
	onKeyPress : function() {
		// Grab user input
		var q = document.getElementById('search-input').value;

		// If the user has entered more than 2 characters, then search!
		if (q.length >= 2) {
			// If no changes was made to the query, then abort this function
			if (q !== this.q) {
				// Register the current timestamp
				var tstamp = +new Date;

				// Abort any currently running AJAX-requests
				this.ajax && this.ajax.abort();

				// Fetch matching results using AJAX
				this.ajax = $.ajax('scripts/search03d2.html?q='+ encodeURIComponent(q), {
					complete : function(data, status) {
						// Did the AJAX-request finish successfully?
						if (status === 'success' || status === 'notmodified') {
							// Parse the result 350ms after the user released the key
							// (to avoid constant updating of the DOM, if the user keeps
							// inputting text for a while)
							clearTimeout($GenreUnivers_Search._timeout);
							$GenreUnivers_Search._timeout = setTimeout(function() { $GenreUnivers_Search.parseResults(JSON.parse(data.responseText)); }, Math.max(0, 350 - (+ new Date) - tstamp));
						}
					}
				});
			}

			// Store the last query searched for
			this.q = q;

		// Otherwise hide the dropdown again
		} else {
			this.hideDropdown();
		}
	},

	/**
	 * This function is automatically executed, as the user hits the up / down /
	 * enter keys and handles keyboard interaction with the search results.
	 */
	onKeyPress2 : function (e) {
		// If this is a touch-device, then cancel this function
		if ($GenreUnivers.supports.touch) { return; }

		// If no results are currently active, abort this function
		if (!this.result_length) { return; }

		// Did the user hit the down-arrow
		if (e.keyCode == 40) {
			// Make sure the user is not at the last result yet
			if (this.result_index < this.result_length - 1) {
				// Update result index
				this.result_index++;

				// Highlight the proper search result
				$('.search-dropdown-list-highlight').removeClass('search-dropdown-list-highlight');
				$('.search-dropdown-list-a').eq(this.result_index).addClass('search-dropdown-list-highlight');
			}

			// Abort default event interaction
			e.preventDefault();

		// Did the user hit the up-arrow?
		} else if (e.keyCode == 38) {
			// Remove any current highlights
			$('.search-dropdown-list-highlight').removeClass('search-dropdown-list-highlight');

			// Make sure the user is not at the last result yet
			if (this.result_index >= 0) {
				// Update result index
				this.result_index--;

				// Highlight the proper search result
				if (this.result_index >= 0) { $('.search-dropdown-list-a').eq(this.result_index).addClass('search-dropdown-list-highlight'); }
			}

			// Abort default event interaction
			e.preventDefault();

		// Did the user hit enter?
		} else if (e.keyCode == 13) {
			// Make sure a result was highlighted
			if (this.result_index >= 0) {
				// Load data about the currently active result
				var result = $('.search-dropdown-list-a').eq(this.result_index);

				// Load data to highlight the result
				eval('$GenreUnivers_Search.goTo(e, "'+ result.data('coords-x') +'", "'+ result.data('coords-y') +'", '+ result.data('path') +')');

				// Hide the dropdown
				document.getElementById('search-input').blur();
				this.hideDropdown();
			}

			// Abort default event interaction
			e.preventDefault();
		}
	},

	/**
	 * This function is automatically 
	 */
	parseResults : function(results) {
		// Make sure that the dropdown is displayed
		this.displayDropdown();

		// Loop through the list of results and insert them into the DOM
		var html = '';
		for (var i = -1, j = Math.min($GenreUnivers.supports.touch ? 3 : 5, results.length); ++i < j; ) {
			// Parse path ID
			if (results[i].type === 'planet') {
				var path = ', \'planet\', '+ results[i].galaxy_id +', '+ results[i].planet_id;
			} else if (results[i].type === 'orbit') {
				var path = ', \'orbit\', '+ results[i].galaxy_id +', '+ results[i].planet_id +', '+ results[i].orbit_id;
			} else if (results[i].type === 'sub-orbit') {
				var path = ', \'sub-orbit\', '+ results[i].galaxy_id +', '+ results[i].planet_id +', '+ results[i].orbit_id +', '+ results[i].sub_orbit_id;
			}

			// Add to HTML output
			html += '<li class="search-dropdown-list-li"><a class="search-dropdown-list-a" data-coords-x="'+ results[i].coords.x +'" data-coords-y="'+ results[i].coords.y + '" data-path="'+ path.substr(2) +'" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_Search.goTo(event, '+ results[i].coords.x +', '+ results[i].coords.y + path +'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_Search.goTo(event, '+ results[i].coords.x +', '+ results[i].coords.y + path +'); }">'+ results[i].title +'</a></li>';
		}

		// Handle the "no results"-message
		if (!html) {
			html += '<li class="search-dropdown-list-none">'+ _('Ingen matchende genrer...') +'</li>';
		}

		// Insert the HTML into the DOM
		$('.search-dropdown-list').html(html);
		html = null;

		// Store the length of the results
		this.result_length = Math.min($GenreUnivers.supports.touch ? 3 : 5, results.length);
		this.result_index = -1;
	},

	/**
	 * This function inserts the live search dropdown into the DOM and fades
	 * it in.
	 */
	displayDropdown : function() {
		// If the dropdown is already open, abort this function
		if (this.open) { return; }

		// Close any open info-boxes
		$GenreUnivers_InfoBox.hideBox();

		// Prepare the HTML-structure
		var html = '<div class="search-dropdown-top"></div><img class="search-dropdown-arrow" src="layout/images/misc/blank.gif" alt=""/>';
		html += '<ul class="search-dropdown-list"></ul>';

		// Create the wrapper and insert it into the DOM
		var container = $('<div class="search-dropdown"/>').html(html).appendTo($('.search')); html = null;
		setTimeout(function() { container[0].style.opacity = 1; container = null; }, 25);

		// Register that we opened the search dropdown
		this.open = true;
	},

	/**
	 * This function closes the dropdown again, whenever the user removes focus
	 * from the search-input.
	 */
	hideDropdown : function() {
		// If the dropdown is not currently open, abort this function
		if (!this.open) { return; }

		// Remove the dropdown from the DOM
		$('.search-dropdown').remove();

		// Register that the dropdown is no longer open
		this.open = false;

		// Reset variables
		this.result_length = 0;
		this.q = null;
	},

	/**
	 * This function zooms into the specified planet!
	 */
	goTo : function(e, x, y, type, galaxy_id, planet_id, orbit_id, sub_orbit_id) {
		// Set center!
		$GenreUnivers.setCenter(x, y);

		// Zoom in!
		$GenreUnivers.setZoom(3);

		// Highlight planet
		if (type === 'planet') {
			// Insert search-highlight
			var highlight = $('<div class="search-highlight"></div>').appendTo($('#trigger-'+ galaxy_id +'-'+ planet_id).parent());

		// Highlight orbit
		} else if (type === 'orbit' || type === 'sub-orbit') {
			// Insert search-highlight
			var highlight = $('<div class="search-highlight"></div>').appendTo($('#trigger-'+ galaxy_id +'-'+ planet_id +'-'+ orbit_id).parent());
		}

		// Animate highlight
		if (highlight) {
			// Abort any other animation
			if (this.highlight) {
				// Unbind event-listeners
				this.highlight.parent().unbind($GenreUnivers.supports.touch ? 'touchend.search-highlight' : 'mouseover.search-highlight');

				// Remove the highlight from the DOM
				this.highlight.remove();

				// Abort interval and clear memory
				clearInterval(this.interval); this.highlight = null;
			}

			// Start the animation
			var frame = 0, interval = setInterval(function () {
				// Update index
				frame++;

				// Update visual animation
				highlight.css({'background-position' : '0 '+ (frame * -89) +'px'});
			}, 55);

			// Abort the animation once the user hovers the planet
			highlight.parent().bind($GenreUnivers.supports.touch ? 'touchend.search-highlight' : 'mouseover.search-highlight', function () {
				// Unbind event-listeners
				highlight.parent().unbind($GenreUnivers.supports.touch ? 'touchend.search-highlight' : 'mouseover.search-highlight');

				// Remove the highlight from the DOM
				highlight.remove();

				// Abort interval and clear memory
				clearInterval(interval); highlight = null;
				$GenreUnivers_Search.highlight = null;
			});

			this.highlight = highlight;
			this.interval = interval;
		}
	}
};

// Initialize the basket, when the document is ready
$(document).ready(function() { $GenreUnivers_Search.initialize(); });