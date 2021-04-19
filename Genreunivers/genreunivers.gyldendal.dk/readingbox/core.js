/**
 * Main handler for Gyldendals 'LÃ¦serude'. It integrates seamlessly with
 * different sites by exposing an API, allowing the site to open the lightbox.
 *
 * The lightbox is opened by calling $ReadingBox.open, passing the contents
 * to display as a string. If needed, a handle can also be passed to a Flow
 * Player, allowing the user to control the media from within the lightbox.
 */

$ReadingBox = {
	/**
	 * Determine whether to enable touch functionality to the wheel or not.
	 */
	touch : ("ontouchend" in document),

	/**
	 * Automatically executed on the DOM-ready event, and loads external
	 * ressources (stylesheets and scripts) to make the reading-box work.
	 */
	initialize : function() {
		// Create a temporary reference to the head of the document
		var head = document.getElementsByTagName('head')[0];

		// Include JavaScripts
		var script = document.createElement('script');
		script.type = 'text/javascript'; script.src = '../readingbox/jquery.ui.js';
		head.appendChild(script);

		var script = document.createElement('script');
		script.type = 'text/javascript'; script.src = '../readingbox/jquery.ui.touch.js';
		head.appendChild(script);

		var script = document.createElement('script');
		script.type = 'text/javascript'; script.src = '../readingbox/jquery.jplayer.min.js';
		head.appendChild(script);

		// Include stylesheets
		var style= document.createElement('link');
		style.rel = 'stylesheet'; style.type = 'text/css'; style.href = '../readingbox/style.css';
		head.appendChild(style);

		// Clean up memory
		style = null; script = null; head = null;
	},

	/**
	 * This function opens the lightbox with the specified contents.
	 */
	open : function(contents, soundFile) {
		// If touch has been enabled, determine whether the user has zoomed the
		// page
		if (this.touch) {
			// Compare window.innerWidth with document.clientWidth
			if (window.innerWidth < document.body.clientWidth) {
				alert('Zoom helt ud fÃ¸r du Ã¥bner lÃ¦seruden.');
				return false;
			}

			// Disable scrolling!
			if (document.attachEvent) { document.attachEvent('ontouchmove', function(e) { (e || window.event).preventDefault(); }); }
			else { document.addEventListener('touchmove', function(e) { (e || window.event).preventDefault(); }, false); }
		}

		// Create a wrapper for the actual contents of the current page
		this.elements.getWrapper();

		// Scroll to the top of the window
		window.scrollTo(this.viewport.getScrollX(), 0);

		// Display the black overlay
		this.elements.getOverlay().style.display = 'block';

		// Insert the contents into the lightbox
		var lightbox = this.elements.getLightBox();
		this.elements.contentsContainer.innerHTML = contents;

		// Display the lightbox
		lightbox.style.display = 'block';

		// Clean up memory
		lightbox = null;

		// Register that the lightbox has been opened
		this.isOpen = true;

		// Initialize settings
		this.settings.init();

		// Update the paging nav
		this.paging.reset();

		// Initialize the jPlayer
		if (soundFile) {
			this.audioPlayer = (soundFile.indexOf('.') !== -1 || soundFile.indexOf('https://genreunivers.gyldendal.dk/') !== -1) ? this.jPlayer : this.flowPlayer;
			this.audioPlayer.init(soundFile);
		} else {
			this.elements.audioPlayer.style.display = 'none';
		}

		// Automatically hide the toolbar after 10 seconds
		clearTimeout(this._hideTimer);
		this._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000);

		// On touch-devices, disallow zooming!
		if (this.touch) {
			// Register current viewportMeta
			this.viewportMeta = $('head meta[name=viewport]').attr('content');

			// Reset viewport-meta
			$('head meta[name=viewport]').remove();
			$('head').prepend('<meta name="viewport" content="user-scalable=0" />');
		}

		// Assign event-listeners to keyboard- and scroll-events
		if (window.attachEvent) {
			document.attachEvent('onkeydown', $ReadingBox.events.keyPress);
		} else {
			document.addEventListener('keydown', $ReadingBox.events.keyPress, false);
			window.addEventListener('DOMMouseScroll', $ReadingBox.events.scrollWheel, false);
		}
		window.onmousewheel = document.onmousewheel = $ReadingBox.events.scrollWheel;
	},

	/**
	 * This function closes the lightbox, when the user clicks the close-icon.
	 */
	close : function() {
		// Prompt the user to store his settings
		this.settings.store();

		// Register that the lightbox has been closed
		this.isOpen = false;

		// Hide the lightbox and the overlay
		this.elements.getLightBox().style.display = 'none';
		this.elements.getOverlay().style.display = 'none';

		// Create a reference to the content-wrapper
		var wrapper = this.elements.wrapper;
		var offset = -wrapper.offsetTop;

		// Reset CSS-styling of the wrapper
		wrapper.style.height	= 'auto';
		wrapper.style.top		= 0;
		wrapper.style.overflow	= 'visible';

		// Scroll to the correct offset on the page
		window.scrollTo(this.viewport.getScrollX(), offset);

		// Clean up memory
		wrapper = null;

		// Handle closing the jPlayer
		this.audioPlayer.close();

		// On touch-devices, re-allow zooming!
		if (this.touch) {
			// Read the current viewport-meta
			var meta = this.viewportMeta || '';
			if (meta.indexOf('user-scalable') === -1) { meta += (meta ? ', ': '') + 'user-scalable=1'; }

			// Reset viewport-meta
			$('head meta[name=viewport]').remove();
			$('head').prepend('<meta name="viewport" content="'+ meta +'" />');
		}

		// Remove event-listeners from keyboard- and scroll-events
		if (window.detachEvent) {
			window.detachEvent('onkeydown', $ReadingBox.events.keyPress);
		} else {
			window.removeEventListener('keydown', $ReadingBox.events.keyPress, false);
			window.removeEventListener('DOMMouseScroll', $ReadingBox.events.scrollWheel, false);
		}
		window.onmousewheel = document.onmousewheel = null;
	},

	/**
	 * This function is automatically executed, when the window is resized, and
	 * updates the size of the lightbox.
	 */
	resize : function() {
		// If the lightbox is not currently opened, abort this function
		if (!this.isOpen) { return false; }

		// Update the CSS of the wrapper
		this.elements.wrapper.style.height		= (this.viewport.getHeight() + this.viewport.getScrollY()) +'px';

		// Update the size of the lightbox
		this.elements.getOverlay();
		this.elements.getLightBox();

		// We need to update the paging!
		var tmpOffset = this.paging.page / this.paging.pages;
		this.paging.update();
		this.paging.goTo(Math.round(this.paging.pages * tmpOffset), true);

		// Update column width
		this.settings.selectColumnWidth(this.settings.data.columnWidth, true);

		// Scroll to the top!
		window.scrollTo(0, 0);
	},

	/**
	 * The events-elements contains function used for handling keyboard-
	 * shortcuts and mousescrolling in the readingbox.
	 */
	events : {
		/**
		 * This function is automatically executed, when the user presses a
		 * keyboard button.
		 */
		keyPress : function(e) {
			// Grab data about user input
			var e	= e || window.event;
			var key = e.keyCode || e.which;

			// Go to previous page?
			if (key == 37 || key == 38) {
				// Go to the previous page
				$ReadingBox.paging.previous();

			// Go to next page?
			} else if (key == 39 || key == 40) {
				// Go to the next page
				$ReadingBox.paging.next();
			}
		},

		/**
		 * This function is automatically executed, when the user presses uses
		 * the scrollwheel, and navigates to the previous/next page.
		 */
		scrollWheel : function(e) {
			// Grab data about the user input
			var e = e || window.event;
			var delta = e.wheelDelta ? e.wheelDelta / 120 : -e.detail / 3;

			// Correct Opera
			if (window.opera) { delta = -delta; }

			// Navigate to the next page?
			if (delta < 0 && ($ReadingBox.events._lastDirection !== 'next' || $ReadingBox.events._lastTstamp <= (+new Date - 100))) {
				// Go to the next page
				$ReadingBox.paging.next();

				// Store data about the page shift
				$ReadingBox.events._lastDirection	= 'next';
				$ReadingBox.events._lastTstamp	= +new Date;

			// Navigate to the previous page?
			} else if (delta > 0 && ($ReadingBox.events._lastDirection !== 'previous' || $ReadingBox.events._lastTstamp <= (+new Date - 100))) {
				// Go to the previous page
				$ReadingBox.paging.previous();

				// Store data about the page shift
				$ReadingBox.events._lastDirection	= 'previous';
				$ReadingBox.events._lastTstamp	= +new Date;
			}

			// Prevent default behaviour
			if (e.preventDefault) { e.preventDefault(); }
			e.returnValue = false;
		}
	},

	/**
	 * The toolbar-element contains functions used for displaying and hiding
	 * the toolbar.
	 */
	toolbar : {
		/**
		 * This function hides the toolbar upon click on the hide-button.
		 */
		hide : function() {
			// Hide the toolbar
			if (!$ReadingBox.touch) {
				$($ReadingBox.elements.toolbar).animate({top: -50}, {duration: 300, easing: 'swing', queue: false, complete : function() { $ReadingBox.elements.showToolbar.style.display = 'block'; }});
			} else {
				$ReadingBox.elements.toolbar.style.top = '-50px';
				$ReadingBox.elements.showToolbar.style.display = 'block';
			}
		},

		/**
		 * This function displays the toolbar upon hover of the show-button.
		 */
		show : function() {
			// Display the toolbar
			if (!$ReadingBox.touch) {
				$($ReadingBox.elements.toolbar).animate({top: 0}, {duration: 300, easing: 'swing', queue: false});
				$ReadingBox.elements.showToolbar.style.display = 'none';
			} else {
				$ReadingBox.elements.toolbar.style.top = '0';
				$ReadingBox.elements.showToolbar.style.display = 'none';
			}

			// Automatically hide the toolbar after 10 seconds
			clearTimeout($ReadingBox._hideTimer);
			$ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000);
		}
	},

	/**
	 * The paging-element creates the bottom nav (slider) and updates the
	 * number of current pages based on the size of the contents vs. the
	 * lightbox. It also handles navigating to the specified page.
	 */
	paging : {
		page : 1,

		/**
		 * This funciton resets the pagination by updating the number of pages
		 * in the bottom nav and navigates to page 1 immediately.
		 */
		reset : function() {
			// Update the navigation
			this.update();

			// Go to page 1 immediately!
			this.goTo(1, true);
		},

		/**
		 * This function updates the number of matching pages in the bottom nav
		 * of the reading box.
		 */
		update : function() {
			// Calculate the number of pages
			this.pages = Math.round(($ReadingBox.elements.contentsContainer.offsetHeight + 53) / ($ReadingBox.elements.contents.offsetHeight - 53));

			// Display the page indicator?
			if (this.pages > 1) {
				// Display the pagigng
				$ReadingBox.elements.paging.style.display = 'block';

				// Loop through the list of pages and prepare the pagination
				$ReadingBox.elements.pagingIndicators.innerHTML = ''; var width = Math.floor(($ReadingBox.elements.pagingIndicators.offsetWidth - 80) / (this.pages - 1));
				for (var i = 1; i <= this.pages; i++) {
					// Create the indicator
					var indicator = document.createElement('li');
					indicator.innerHTML = i;

					// Assign CSS-styling
					indicator.style.left = (32 + width * (i - 1)) +'px';

					// Add event listeners
					if (document.attachEvent) {
						indicator.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function(e) { var e = e || window.event; var src = e.srcElement || e.target; $ReadingBox.paging.goTo(parseInt(src.innerHTML)); src = null; e = null; });
					} else {
						indicator.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function(e) { var e = e || window.event; var src = e.srcElement || e.target; $ReadingBox.paging.goTo(parseInt(src.innerHTML)); src = null; e = null; }, false);
					}

					// Append to the list
					$ReadingBox.elements.pagingIndicators.appendChild(indicator);
				}

				// Clean up memory
				indicator = null;

				// Update the grid for the slider pin
				$($ReadingBox.elements.pagingSliderPin).draggable('option', 'grid', [width, 1]);

				// Update the containment coordinates for the slider pin
				$($ReadingBox.elements.pagingSliderPin).draggable('option', 'containment', [$ReadingBox.elements.pagingIndicators.getElementsByTagName('li')[0].offsetLeft, 0, $ReadingBox.elements.pagingIndicators.getElementsByTagName('li')[this.pages - 1].offsetLeft + 25, 0]);

			// Or hide it?
			} else {
				$ReadingBox.elements.paging.style.display = 'none';
			}

			// If the user is on a non-existing page, go to the last page in
			// the reading box immediately!
			if (this.page > this.pages) {
				this.goTo(this.pages, true);

			// Otherwise simply make sure to update the positioning of the
			// slider in the bottom nav to match the new grid
			} else if (this.pages > 1) {
				$ReadingBox.elements.pagingSliderBarActive.style.width 	= ($ReadingBox.elements.pagingIndicators.getElementsByTagName('li')[this.page - 1].offsetLeft - 30) +'px';
				$ReadingBox.elements.pagingSliderPin.style.left			= ($ReadingBox.elements.pagingIndicators.getElementsByTagName('li')[this.page - 1].offsetLeft - 5) +'px';
			}
		},

		/**
		 * This function navigates to the selected page.
		 */
		goTo : function(page, immediately) {
			// Make sure the user doesn't navigate out of bounds!
			if (page > this.pages || page < 1) { return false; }

			// Register the current page
			this.page = page;

			// Scroll to the correct page offset
			if (!immediately && !$ReadingBox.touch) { $($ReadingBox.elements.contentsContainer).animate({top: -($ReadingBox.elements.contents.offsetHeight - 53) * (page - 1)}, {duration: 650, easing: 'swing', queue: false}); }
			else { $ReadingBox.elements.contentsContainer.style.top = (-($ReadingBox.elements.contents.offsetHeight - 53) * (page - 1)) +'px'; }

			// Update the bottom nav by positioning the slider correctly
			if (this.pages > 1) {
				$ReadingBox.elements.pagingSliderBarActive.style.width	= ($ReadingBox.elements.pagingIndicators.getElementsByTagName('li')[page - 1].offsetLeft - 30) +'px';
				$ReadingBox.elements.pagingSliderPin.style.left			= ($ReadingBox.elements.pagingIndicators.getElementsByTagName('li')[page - 1].offsetLeft - 5) +'px';
			}
		},

		/**
		 * This function navigates to the next page.
		 */
		next : function() {
			// Go to the next page
			this.goTo(this.page + 1);
		},

		/**
		 * This function navigates to the previous page.
		 */
		previous : function() {
			// Go to the previous page
			this.goTo(this.page - 1);
		},

		/**
		 * This function is automatically executed, while the user drags the
		 * slider pin around, and updates the size of the active bar.
		 */
		drag : function(left) {
			$ReadingBox.elements.pagingSliderBarActive.style.width = (left - 25) +'px';
		},

		/**
		 * This function is automatically executed, when the user releases the
		 * slider pin, and navigates to the selected page.
		 */
		stopDrag : function(left) {
			// Loop through the list of indicators, and determine which page to
			// display
			var indicators = $ReadingBox.elements.pagingIndicators.getElementsByTagName('li'); var i = indicators.length;
			while (i--) {
				// Is this the active page?
				if (left + 15 >= indicators[i].offsetLeft) { break; }
			}

			// Clean up memory
			indicators = null;

			// Go to the selected page
			this.goTo(i + 1);
		}
	},

	/**
	 * The settings-element contains functions used for switching the settings
	 * and storing the them in a cookie when closing the lightbox.
	 */
	settings : {
		/**
		 * This variable is used to contain the current settings of the reading
		 * box.
		 */
		data : {},

		/**
		 * This function loads the default settings of the reading box.
		 */
		init : function() {
			// If the settings has already been initialized, abort this
			// function
			if (this.data.init) { this.data.hasChanged = false; return false; }

			// Load default settings from cookies
			this.selectFontSize($ReadingBox.cookies.get('font-size') || 31);
			this.selectColumnWidth($ReadingBox.cookies.get('column-width') || Math.round(130 / ($ReadingBox.elements.lightbox.offsetWidth - 460) * 63));
			this.selectFont($ReadingBox.cookies.get('font') || 'georgia');
			this.selectBackground($ReadingBox.cookies.get('background') || 'yellow');

			// Register that the settings has been initialized
			this.data.init			= true;
			this.data.hasChanged	= false;
		},

		/**
		 * This function is automatically executed, when the user closes the
		 * lightbox. If he has changed the settings of the display, he is
		 * prompted whether or not he wants to save his current settings in a
		 * cookie.
		 */
		store : function() {
			// If the settings has not been changed, abort this function
			if (!this.data.hasChanged) { return false; }

			// Does the user want to store his settings in a cookie? - If not,
			// abort this function
			if (!confirm('Vil du gemme dine visningsindstillinger i en cookie?')) { return false; }

			// Store the settings in a cookie
			$ReadingBox.cookies.set('font-size', this.data.fontSize);
			$ReadingBox.cookies.set('column-width', this.data.columnWidth);
			$ReadingBox.cookies.set('font', this.data.font);
			$ReadingBox.cookies.set('background', this.data.background);
		},

		/**
		 * This function is executed, when the user drags the font-size
		 * indicator, and updates the size of the text.
		 */
		selectFontSize : function(size) {
			// Abort this function, if the reading box is not open
			if (!$ReadingBox.isOpen) { return false; }

			// If this font-size is already selected, abort this function
			if (size === this.data.fontSize) { return false; }

			// Update the position of the slider
			$ReadingBox.elements.sizeSliderIndicator.style.left	= size +'px';
			$ReadingBox.elements.sizeSliderActive.style.width	= (parseInt(size, 10) + 10) +'px';

			// Update the font-size of the reading box
			$ReadingBox.elements.contents.style.fontSize = (10 + 14 * size / 63) +'px';

			// Store the selected fontsize in the settings
			this.data.fontSize		= size;
			this.data.hasChanged	= true;

			// Update the paging navigation
			$ReadingBox.paging.update();

			// Automatically hide the toolbar after 10 seconds
			clearTimeout($ReadingBox._hideTimer);
			$ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000);
		},

		/**
		 * This function is executed, when the user drags the column-width
		 * indicator, and updates the width correspondingly.
		 */
		selectColumnWidth : function(size, force) {
			// Abort this function, if the reading box is not open
			if (!$ReadingBox.isOpen) { return false; }

			// If this font-size is already selected, abort this function
			if (size === this.data.columnWidth && !force) { return false; }

			// Update the position of the slider
			$ReadingBox.elements.columnWidthSliderIndicator.style.left	= size +'px';
			$ReadingBox.elements.columnWidthSliderActive.style.width		= (parseInt(size, 10) + 10) +'px';

			// Update the font-size of the reading box
			$ReadingBox.elements.contents.style.width	= (400 + ($ReadingBox.elements.lightbox.offsetWidth - 460) * size / 63) +'px';

			// Store the selected fontsize in the settings
			this.data.columnWidth	= size;
			this.data.hasChanged	= true;

			// Update the paging navigation
			$ReadingBox.paging.update();

			// Automatically hide the toolbar after 10 seconds
			clearTimeout($ReadingBox._hideTimer);
			$ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000);
		},

		/**
		 * This function is used for switching the font-type of the contents in
		 * the lightbox.
		 */
		selectFont : function(font) {
			// Abort this function, if the reading box is not open
			if (!$ReadingBox.isOpen) { return false; }

			// If this font is already selected, abort this function
			if (font === this.data.font) { return false; }

			// Update the font of the reading box
			$ReadingBox.elements.contents.style.fontFamily = font;

			// Update the highlighted font in the toolbar
			$ReadingBox.elements.fontVerdana.className = 'gu-reading-box-toolbar-font-verdana'+ ((font === 'verdana') ? ' active' : '');
			$ReadingBox.elements.fontGeorgia.className = 'gu-reading-box-toolbar-font-georgia'+ ((font === 'georgia') ? ' active' : '');

			// Store the selected font in the settings
			this.data.font			= font;
			this.data.hasChanged	= true;

			// Update the paging navigation
			$ReadingBox.paging.update();

			// Automatically hide the toolbar after 10 seconds
			clearTimeout($ReadingBox._hideTimer);
			$ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000);
		},

		/**
		 * This function is used for switching the background-color of the
		 * contents in the lightbox.
		 */
		selectBackground : function(color) {
			// Abort this function, if the reading box is not open
			if (!$ReadingBox.isOpen) { return false; }

			// If this font is already selected, abort this function
			if (color === this.data.background) { return false; }

			// Update the background of the reading box
			if (color === 'yellow') {
				$ReadingBox.elements.lightbox.style.background = '#ffffcd';
				$ReadingBox.elements.contents.style.color = '#000000';
			} else if (color === 'white') {
				$ReadingBox.elements.lightbox.style.background = '#ffffff';
				$ReadingBox.elements.contents.style.color = '#2d2d2d';
			} else {
				$ReadingBox.elements.lightbox.style.background = '#000000';
				$ReadingBox.elements.contents.style.color = '#e5e5e5';
			}

			// Assign CSS-class
			$ReadingBox.elements.contents.className = 'gu-reading-box-contents gu-reading-box-contents-'+ color;
			$ReadingBox.elements.paging.className = 'gu-reading-box-paging gu-reading-box-paging-'+ color;

			// Update the highlighted font in the toolbar
			$ReadingBox.elements.backgroundBlack.className	= 'gu-reading-box-toolbar-background-black'+ ((color === 'black') ? ' active' : '');
			$ReadingBox.elements.backgroundYellow.className	= 'gu-reading-box-toolbar-background-yellow'+ ((color === 'yellow') ? ' active' : '');
			$ReadingBox.elements.backgroundWhite.className	= 'gu-reading-box-toolbar-background-white'+ ((color === 'white') ? ' active' : '');

			// Store the selected font in the settings
			this.data.background	= color;
			this.data.hasChanged	= true;

			// Automatically hide the toolbar after 10 seconds
			clearTimeout($ReadingBox._hideTimer);
			$ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000);
		}
	},

	/**
	 * The jPlayer-element contains functions to integrate the jPlayer API
	 * into the reading box.
	 */
	jPlayer : {
		/**
		 * This function initializes the jPlayer-integration, when the
		 * lightbox has been opened.
		 */
		init : function(soundFile) {
			// If no player ID was specified, hide the player and abort this
			// function!
			if (!soundFile) {
				$ReadingBox.elements.audioPlayer.style.display = 'none';
				return false;
			}

			// Make sure the player is visible
			$ReadingBox.elements.audioPlayer.style.display = 'block';

			// Store the soundFile
			this.soundFile = soundFile;

			// Reset buttons!
			$ReadingBox.elements.audioPlayerToggle.className						= 'gu-reading-box-toolbar-audioplayer-toggle';
			$ReadingBox.elements.audioPlayerProgressBarSliderIndicator.style.left	= 0;
			$ReadingBox.elements.audioPlayerProgressBarSliderActive.style.width		= '9px';
			$ReadingBox.elements.audioPlayerMute.className							= 'gu-reading-box-toolbar-audioplayer-mute';
			$ReadingBox.elements.audioPlayerProgressBarNow.innerHTML		= '0:00';
			$ReadingBox.elements.audioPlayerProgressBarDuration.innerHTML	= '0:00';

			$($ReadingBox.elements.audioPlayerAudio).jPlayer({
				// Initialize the jPlayer
				ready : function() {
					// Set path to MP3-file in jPlayer
					$(this).jPlayer("setMedia", { mp3: soundFile });

					// Load the file
					$(this).jPlayer('load');
				},

				// Automatically executed, when jPlayer is ready to display
				// duration of the file
				loadstart : function(event) {
					// Reset timestamps!
					$ReadingBox.elements.audioPlayerProgressBarNow.innerHTML		= '0:00';
					$ReadingBox.elements.audioPlayerProgressBarDuration.innerHTML	= $.jPlayer.convertTime(event.jPlayer.status.duration);

					// Store duration
					$ReadingBox.jPlayer.duration = event.jPlayer.status.duration;

					// Make sure to unmute the player
					$(this).jPlayer("unmute");
					if ($ReadingBox.touch) { $(this).jPlayer("volume", 1); }

					// Enable seeking!
					$($ReadingBox.elements.audioPlayerProgressBarSliderIndicator).draggable('enable');
				},

				// Automatically executed, when the volume changes
				volumechange : function(event) {
					// Update the height of the indicator
					$ReadingBox.elements.audioPlayerVolumeActive.style.height = Math.max(0, Math.min(22, 22 * event.jPlayer.options.volume)) +'px';
				},

				// Automatically executed, when "currentTime" changes in jPlayer
				timeupdate : function(event) {
					// Update the position of the slider
					var pos = Math.round(63 * event.jPlayer.status.currentPercentAbsolute / 100);
					$ReadingBox.elements.audioPlayerProgressBarSliderIndicator.style.left	= pos +'px';
					$ReadingBox.elements.audioPlayerProgressBarSliderActive.style.width		= (parseInt(pos, 10) + 10) +'px';

					// Update the timestamp
					$ReadingBox.elements.audioPlayerProgressBarNow.innerHTML 		= $.jPlayer.convertTime(event.jPlayer.status.currentTime);
					$ReadingBox.elements.audioPlayerProgressBarDuration.innerHTML	= $.jPlayer.convertTime(event.jPlayer.status.duration);

					// Store duration
					$ReadingBox.jPlayer.duration = event.jPlayer.status.duration;
				},

				// When the file has ended, reset positioning
				ended : function() {
					// Update CSS-class
					$ReadingBox.elements.audioPlayerToggle.className = 'gu-reading-box-toolbar-audioplayer-toggle';

					// Update the position of the slider
					$ReadingBox.elements.audioPlayerProgressBarSliderIndicator.style.left	= '0px';
					$ReadingBox.elements.audioPlayerProgressBarSliderActive.style.width		= '9px';
					$ReadingBox.elements.audioPlayerProgressBarNow.innerHTML				= '0:00';
				},

				// Set HTML5 vs FLASH priority
				solution: 'flash, html',

				// Set flash folder
				swfPath: "//genreunivers.gyldendal.dk/readingbox/",

				// File type supplied
				supplied: "mp3",

				// Flash wmode
				wmode: "transparent"
			});

			// Disable seeking, until the player is ready
			$($ReadingBox.elements.audioPlayerProgressBarSliderIndicator).draggable('disable');
		},

		/**
		 * This function is automatically executed, when the lightbox is closed.
		 */
		close : function() {
		},

		/**
		 * This function plays/pauses a clip in the jPlayer.
		 */
		toggle : function() {
			// Play?
			if ($ReadingBox.elements.audioPlayerToggle.className.indexOf('gu-reading-box-toolbar-audioplayer-progress-bar-toggle-pause') === -1) {
				// Update CSS-class
				$ReadingBox.elements.audioPlayerToggle.className = 'gu-reading-box-toolbar-audioplayer-toggle gu-reading-box-toolbar-audioplayer-progress-bar-toggle-pause';

				// Play!
				$($ReadingBox.elements.audioPlayerAudio).jPlayer('play');

			// ... Or pause?
			} else {
				// Update CSS-class
				$ReadingBox.elements.audioPlayerToggle.className = 'gu-reading-box-toolbar-audioplayer-toggle';

				// Pause!
				$($ReadingBox.elements.audioPlayerAudio).jPlayer('pause');
			}
		},

		/**
		 * This function seeks to the specified position in the track.
		 */
		seek : function(pos) {
			// Abort this function, if the duration has not been calculated yet!
			if (!this.duration) { return false; }

			// Update the position of the slider
			$ReadingBox.elements.audioPlayerProgressBarSliderIndicator.style.left	= pos +'px';
			$ReadingBox.elements.audioPlayerProgressBarSliderActive.style.width		= (parseInt(pos, 10) + 10) +'px';

			// Seek in the jPlayer!
			$($ReadingBox.elements.audioPlayerAudio).jPlayer('play', Math.round(this.duration * pos / 63));
		},

		/**
		 * This function updates the volume of the jPlayer based on the
		 * users input.
		 */
		setVolume : function(e) {
			// Read user input
			var e = e || window.event;
			var y = e.pageY || e.clientY;

			// Calculate the absolute position of the volume-bar
			var tmp = $ReadingBox.elements.audioPlayerVolume;
			while (tmp) { y -= tmp.offsetTop; tmp = tmp.offsetParent; }

			// Invert the offset
			y = Math.max(0, Math.min(22, 22 - y));

			// Update the volume of the jPlayer
			$($ReadingBox.elements.audioPlayerAudio).jPlayer('volume', (Math.round(1 / 22 * y)));

			// Update the height of the indicator
			$ReadingBox.elements.audioPlayerVolumeActive.style.height = y +'px';

			// Prevent default behaviour
			if (e.preventDefault) { e.preventDefault(); }
			e.returnValue = false;
		},

		/**
		 * This function mutes/unmutes the player, when the user clicks the
		 * button.
		 */
		mute : function() {
			// Mute the player?
			if ($ReadingBox.elements.audioPlayerMute.className.indexOf('gu-reading-box-toolbar-audioplayer-unmute') === -1) {
				// Mute the player!
				$($ReadingBox.elements.audioPlayerAudio).jPlayer('mute');
				$($ReadingBox.elements.audioPlayerMute).addClass('gu-reading-box-toolbar-audioplayer-unmute');
			} else {
				// Unmute the player!
				$($ReadingBox.elements.audioPlayerAudio).jPlayer('unmute');
				$($ReadingBox.elements.audioPlayerMute).removeClass('gu-reading-box-toolbar-audioplayer-unmute');
			}
		}
	},

	/**
	 * The flowPlayer-element contains functions to integrate the flowPlayer API
	 * into the reading box.
	 */
	flowPlayer : {
		/**
		 * This function initializes the flowplayer-integration, when the
		 * lightbox has been opened.
		 */
		init : function(playerID) {
			// If no player ID was specified, hide the player and abort this
			// function!
			if (!playerID || $ReadingBox.touch) {
				$ReadingBox.elements.audioPlayer.style.display = 'none';
				return false;
			}

			// Make sure the player is visible
			$ReadingBox.elements.audioPlayer.style.display = 'block';

			// Store the player ID
			this.playerID = playerID;

			// Reset buttons!
			$ReadingBox.elements.audioPlayerToggle.className						= 'gu-reading-box-toolbar-audioplayer-toggle';
			$ReadingBox.elements.audioPlayerProgressBarSliderIndicator.style.left	= 0;
			$ReadingBox.elements.audioPlayerProgressBarSliderActive.style.width	= '9px';
			$ReadingBox.elements.audioPlayerMute.className							= 'gu-reading-box-toolbar-audioplayer-mute';

			// Calculate the duration of the clip
			this.duration = 0;
			var minutes = Math.floor(this.duration / 60);
			var seconds = this.duration % 60;

			// Reset timestamps!
			$ReadingBox.elements.audioPlayerProgressBarNow.innerHTML			= '0:00';
			$ReadingBox.elements.audioPlayerProgressBarDuration.innerHTML	= minutes + ':' + ((seconds < 10) ? '0' : '') + seconds;

			// Disable seeking!
			$($ReadingBox.elements.audioPlayerProgressBarSliderIndicator).draggable('disable');

			// Reset timestamps, when the flowplayer is started
			$f(playerID).getClip().onResume(function() {
				// Calculate the duration of the clip
				$ReadingBox.flowPlayer.duration = Math.floor($f(playerID).getClip().fullDuration);
				var minutes = Math.floor($ReadingBox.flowPlayer.duration / 60);
				var seconds = $ReadingBox.flowPlayer.duration % 60;

				// Reset timestamps!
				$ReadingBox.elements.audioPlayerProgressBarDuration.innerHTML	= minutes + ':' + ((seconds < 10) ? '0' : '') + seconds;

				// Enable seeking!
				$($ReadingBox.elements.audioPlayerProgressBarSliderIndicator).draggable('enable');
			});

			// Handle pause and stop events
			$f(this.playerID).getClip().onSeek(function() { $ReadingBox.flowPlayer.onSeek(); });
			$f(this.playerID).getClip().onStop(function() { $ReadingBox.flowPlayer.onStop(); });
			$f(this.playerID).getClip().onFinish(function() { $ReadingBox.flowPlayer.onStop(); });

			// Update the current timestamp every 300ms
			this._interval = setInterval(function() { $ReadingBox.flowPlayer.onSeek(); }, 300);

			// Update the height of the volume indicator
			$f(this.playerID).onLoad(function() { $f(playerID).unmute(); $ReadingBox.elements.audioPlayerVolumeActive.style.height = Math.round($f(playerID).getVolume() / 100 * 22) +'px'; });
		},

		/**
		 * This function is automatically executed, when the lightbox is closed.
		 */
		close : function() {
			// Abort the interval
			if (this._interval) { window.clearInterval(this._interval); }
			this._interval = null;
		},

		/**
		 * This function plays/pauses a clip in the flowplayer.
		 */
		toggle : function() {
			// Play?
			if ($ReadingBox.elements.audioPlayerToggle.className.indexOf('gu-reading-box-toolbar-audioplayer-progress-bar-toggle-pause') === -1) {
				// Update CSS-class
				$ReadingBox.elements.audioPlayerToggle.className = 'gu-reading-box-toolbar-audioplayer-toggle gu-reading-box-toolbar-audioplayer-progress-bar-toggle-pause';

				// Play!
				$f(this.playerID).play();

			// ... Or pause?
			} else {
				// Update CSS-class
				$ReadingBox.elements.audioPlayerToggle.className = 'gu-reading-box-toolbar-audioplayer-toggle';

				// Pause!
				$f(this.playerID).pause();
			}
		},

		/**
		 * This function seeks to the specified position in the track.
		 */
		seek : function(pos) {
			// Abort this function, if the duration has not been calculated yet!
			if (!this.duration) { return false; }

			// Update the position of the slider
			$ReadingBox.elements.audioPlayerProgressBarSliderIndicator.style.left	= pos +'px';
			$ReadingBox.elements.audioPlayerProgressBarSliderActive.style.width		= (parseInt(pos, 10) + 10) +'px';

			// Seek in the flowplayer!
			$f(this.playerID).seek(Math.round(this.duration * pos / 63));
		},

		/**
		 * This function automatically updates the position of the slider
		 * according to how long we are in the clip.
		 */
		onSeek : function() {
			// Calculate how long we have gotten
			var time = parseInt($f(this.playerID).getTime(), 10);
			if (isNaN(time) || time <= 0) { return; }

			// Calculate the percentage
			var percent = time / this.duration;

			// Update the position of the slider
			var pos = Math.round(63 * percent);
			$ReadingBox.elements.audioPlayerProgressBarSliderIndicator.style.left	= pos +'px';
			$ReadingBox.elements.audioPlayerProgressBarSliderActive.style.width	= (parseInt(pos, 10) + 10) +'px';

			// Calculate the how long the clip has played
			var minutes = Math.floor(time / 60);
			var seconds = Math.round(time % 60);

			// Update the timestamp
			$ReadingBox.elements.audioPlayerProgressBarNow.innerHTML = minutes + ':' + ((seconds < 10) ? '0' : '') + seconds;
		},

		/**
		 * This function is automatically executed, when the player is paused.
		 */
		onStop : function() {
			// Update CSS-class
			$ReadingBox.elements.audioPlayerToggle.className = 'gu-reading-box-toolbar-audioplayer-toggle';

			// Update the position of the slider
			$ReadingBox.elements.audioPlayerProgressBarSliderIndicator.style.left	= '0px';
			$ReadingBox.elements.audioPlayerProgressBarSliderActive.style.width	= '9px';
			$ReadingBox.elements.audioPlayerProgressBarNow.innerHTML				= '0:00';
		},

		/**
		 * This function updates the volume of the flowplayer based on the
		 * users input.
		 */
		setVolume : function(e) {
			// Read user input
			var e = e || window.event;
			var y = e.pageY || e.clientY;

			// Calculate the absolute position of the volume-bar
			var tmp = $ReadingBox.elements.audioPlayerVolume;
			while (tmp) { y -= tmp.offsetTop; tmp = tmp.offsetParent; }

			// Invert the offset
			y = Math.max(0, Math.min(22, 22 - y));

			// Update the volume of the flowplayer
			$f(this.playerID).setVolume(Math.round(100 / 22 * y));

			// Update the height of the indicator
			$ReadingBox.elements.audioPlayerVolumeActive.style.height = y +'px';

			// Prevent default behaviour
			if (e.preventDefault) { e.preventDefault(); }
			e.returnValue = false;
		},

		/**
		 * This function mutes/unmutes the player, when the user clicks the
		 * button.
		 */
		mute : function() {
			// Mute the player?
			if ($ReadingBox.elements.audioPlayerMute.className.indexOf('gu-reading-box-toolbar-audioplayer-unmute') === -1) {
				// Mute the player!
				$f(this.playerID).mute();

				// Update CSS-styling
				$ReadingBox.elements.audioPlayerVolumeActive.style.height	= 0;
				$ReadingBox.elements.audioPlayerMute.className				= 'gu-reading-box-toolbar-audioplayer-mute gu-reading-box-toolbar-audioplayer-unmute';
			} else {
				// Unmute the player!
				$f(this.playerID).unmute();

				// Update CSS-styling
				$ReadingBox.elements.audioPlayerVolumeActive.style.height	= Math.round($f(this.playerID).getVolume() / 100 * 22) +'px';
				$ReadingBox.elements.audioPlayerMute.className				= 'gu-reading-box-toolbar-audioplayer-mute';
			}
		}
	},

	/**
	 * The elements-object contains functions to initially create the lightbox
	 * as well as references to the elements within it.
	 */
	elements : {
		/**
		 * This function creates the wrapper for the contents of the original
		 * page and returns a reference to it.
		 */
		getWrapper : function() {
			// If the wrapper has not been created yet, do it now
			if (!this.wrapper) {
				// Create the wrapper
				this.wrapper = document.createElement('div');

				// Assign CSS-styling to the wrapper
				this.wrapper.style.position	= 'absolute';
				this.wrapper.style.left		= 0;
				this.wrapper.style.width	= '100%';

				// Put all contents of the current page into the wrapper
				var elms = document.body.getElementsByTagName('*');
				while (elms[0]) { this.wrapper.appendChild(elms[0]); }
				elms = null;

				// Insert the wrapper into the DOM
				document.body.appendChild(this.wrapper);
			}

			// Update the CSS of the wrapper
			this.wrapper.style.height	= ($ReadingBox.viewport.getHeight() + $ReadingBox.viewport.getScrollY()) +'px';
			this.wrapper.style.top		= (-$ReadingBox.viewport.getScrollY()) +'px';
			this.wrapper.style.overflow	= 'hidden';

			// Return a reference to the wrapper
			return this.wrapper;
		},

		/**
		 * This function creates the black overlay for the contents of the
		 * original page and returns a reference to it.
		 */
		getOverlay : function() {
			// If the overlay has not been created yet, do it now
			if (!this.overlay) {
				// Create the overlay
				this.overlay = document.createElement('div');

				// Assign CSS-styling to the overlay
				this.overlay.style.position 	= 'fixed';
				this.overlay.style.top			= 0;
				this.overlay.style.left			= 0;
				this.overlay.style.zIndex		= 1000000;
				this.overlay.style.width		= '100%';
				this.overlay.style.background	= '#000000';
				this.overlay.style.opacity		= 0.85;
				this.overlay.style.filter		= 'progid:DXImageTransform.Microsoft.Alpha(Opacity=85)';
				this.overlay.style.display		= 'none';

				// Assign event-handlers to the overlay
				if (!$ReadingBox.touch) {
					if (document.attachEvent) { this.overlay.attachEvent('onclick', function() { $ReadingBox.close(); }); }
					else { this.overlay.addEventListener('click', function() { $ReadingBox.close(); }, false); }
				}

				// Insert the overlay into the DOM
				document.body.appendChild(this.overlay);
			}

			// Resize the overlay according to the screen-size
			this.overlay.style.height = $ReadingBox.viewport.getHeight() +'px';

			// Return a reference to the overlay
			return this.overlay;
		},

		/**
		 * This function creates the main lightbox as well as the toolbar etc.
		 */
		getLightBox : function() {
			// If the lightbox has not been created yet, do it now
			if (!this.lightbox) {
				// Create the lightbox
				this.lightbox = document.createElement('div');
				this.lightbox.className = 'gu-reading-box '+ (!$ReadingBox.touch? 'gu-reading-box-desktop' : 'gu-reading-box-touch');

				// Create the toolbar of the lightbox
				this.toolbar = document.createElement('div');
				this.toolbar.className = 'gu-reading-box-toolbar';

				// Create the toolbar-wrapper
				this.toolbarWrapper = document.createElement('div');
				this.toolbarWrapper.className = 'gu-reading-box-toolbar-wrapper';
				this.toolbar.appendChild(this.toolbarWrapper);

				// Create the close-icon
				this.close = document.createElement('a');
				this.close.className	= 'gu-reading-box-toolbar-close';
				this.close.innerHTML	= 'Luk';

				if (document.attachEvent) { this.close.attachEvent('onclick', function() { $ReadingBox.close(); }); }
				else { this.close.addEventListener('click', function() { $ReadingBox.close(); }, false); }

				this.toolbarWrapper.appendChild(this.close);

				// Create the font-size selector
				this.size = document.createElement('div');
				this.size.className = 'gu-reading-box-toolbar-size';

				this.sizeIcon1 = document.createElement('div');
				this.sizeIcon1.className = 'gu-reading-box-toolbar-size-icon-small';

				this.sizeIcon2 = document.createElement('div');
				this.sizeIcon2.className = 'gu-reading-box-toolbar-size-icon-large';

				this.sizeSlider = document.createElement('div');
				this.sizeSlider.className = 'gu-reading-box-toolbar-slider';

				this.sizeSliderActive = document.createElement('div');
				this.sizeSliderActive.className = 'gu-reading-box-toolbar-slider-active';

				this.sizeSliderIndicator = document.createElement('div');
				this.sizeSliderIndicator.className = 'gu-reading-box-toolbar-slider-indicator';

				if (!$ReadingBox.touch) {
					$(this.sizeSliderIndicator).draggable({
						axis		: 'x',
						containment	: 'parent',
						start		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox.paging.tmpOffset = $ReadingBox.paging.page / $ReadingBox.paging.pages; },
						drag		: function(events, ui) { $ReadingBox.settings.selectFontSize(ui.position.left); $ReadingBox.paging.goTo(Math.round($ReadingBox.paging.pages * $ReadingBox.paging.tmpOffset), true); },
						stop		: function() { $ReadingBox.paging.tmpOffset = null; clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
					});
				} else {
					$(this.sizeSliderIndicator).draggable({
						axis		: 'x',
						containment	: 'parent',
						start		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox.paging.tmpOffset = $ReadingBox.paging.page / $ReadingBox.paging.pages; },
						drag		: function(events, ui) { $ReadingBox.elements.sizeSliderIndicator.style.left = (ui.position.left) +'px'; $ReadingBox.elements.sizeSliderActive.style.width = (parseInt(ui.position.left, 10) + 10) +'px'; },
						stop		: function(events, ui) { $ReadingBox.settings.selectFontSize(ui.position.left); $ReadingBox.paging.goTo(Math.round($ReadingBox.paging.pages * $ReadingBox.paging.tmpOffset), true); clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
					}).addTouch();
				}

				this.sizeSlider.appendChild(this.sizeSliderActive);
				this.sizeSlider.appendChild(this.sizeSliderIndicator);
				this.size.appendChild(this.sizeIcon1);
				this.size.appendChild(this.sizeSlider);
				this.size.appendChild(this.sizeIcon2);
				this.toolbarWrapper.appendChild(this.size);

				// Create the column-width selector
				this.columnWidth = document.createElement('div');
				this.columnWidth.className = 'gu-reading-box-toolbar-column-width';

				this.columnWidthIcon1 = document.createElement('div');
				this.columnWidthIcon1.className = 'gu-reading-box-toolbar-column-width-icon-small';

				this.columnWidthIcon2 = document.createElement('div');
				this.columnWidthIcon2.className = 'gu-reading-box-toolbar-column-width-icon-large';

				this.columnWidthSlider = document.createElement('div');
				this.columnWidthSlider.className = 'gu-reading-box-toolbar-slider';

				this.columnWidthSliderActive = document.createElement('div');
				this.columnWidthSliderActive.className = 'gu-reading-box-toolbar-slider-active';

				this.columnWidthSliderIndicator = document.createElement('div');
				this.columnWidthSliderIndicator.className = 'gu-reading-box-toolbar-slider-indicator';

				if (!$ReadingBox.touch) {
					$(this.columnWidthSliderIndicator).draggable({
						axis		: 'x',
						containment	: 'parent',
						start		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox.paging.tmpOffset = $ReadingBox.paging.page / $ReadingBox.paging.pages; },
						drag		: function(events, ui) { $ReadingBox.settings.selectColumnWidth(ui.position.left); $ReadingBox.paging.goTo(Math.round($ReadingBox.paging.pages * $ReadingBox.paging.tmpOffset), true); },
						stop		: function() { $ReadingBox.paging.tmpOffset = null; clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
					});
				} else {
					$(this.columnWidthSliderIndicator).draggable({
						axis		: 'x',
						containment	: 'parent',
						start		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox.paging.tmpOffset = $ReadingBox.paging.page / $ReadingBox.paging.pages; },
						drag		: function(events, ui) { $ReadingBox.elements.columnWidthSliderIndicator.style.left = (ui.position.left) +'px'; $ReadingBox.elements.columnWidthSliderActive.style.width = (parseInt(ui.position.left, 10) + 10) +'px'; },
						stop		: function(events, ui) { $ReadingBox.settings.selectColumnWidth(ui.position.left); $ReadingBox.paging.goTo(Math.round($ReadingBox.paging.pages * $ReadingBox.paging.tmpOffset), true); clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
					}).addTouch();
				}

				this.columnWidthSlider.appendChild(this.columnWidthSliderActive);
				this.columnWidthSlider.appendChild(this.columnWidthSliderIndicator);
				this.columnWidth.appendChild(this.columnWidthIcon1);
				this.columnWidth.appendChild(this.columnWidthSlider);
				this.columnWidth.appendChild(this.columnWidthIcon2);
				this.toolbarWrapper.appendChild(this.columnWidth);

				// Create the font-selector
				this.font = document.createElement('div');
				this.font.className = 'gu-reading-box-toolbar-font';

				this.fontVerdana = document.createElement('a');
				this.fontVerdana.className	= 'gu-reading-box-toolbar-font-verdana';
				this.fontVerdana.innerHTML	= 'Verdana';

				this.fontGeorgia = document.createElement('a');
				this.fontGeorgia.className	= 'gu-reading-box-toolbar-font-georgia';
				this.fontGeorgia.innerHTML	= 'Georgia';

				if (document.attachEvent) {
					this.fontVerdana.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectFont('verdana'); });
					this.fontGeorgia.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectFont('georgia'); });
				} else {
					this.fontVerdana.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectFont('verdana'); }, false);
					this.fontGeorgia.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectFont('georgia'); }, false);
				}

				this.font.appendChild(this.fontVerdana);
				this.font.appendChild(this.fontGeorgia);
				this.toolbarWrapper.appendChild(this.font);

				// Create the background-selector
				this.background = document.createElement('div');
				this.background.className = 'gu-reading-box-toolbar-background';

				this.backgroundBlack = document.createElement('a');
				this.backgroundBlack.className	= 'gu-reading-box-toolbar-background-black';
				this.backgroundBlack.innerHTML	= 'Aa';

				this.backgroundYellow = document.createElement('a');
				this.backgroundYellow.className	= 'gu-reading-box-toolbar-background-yellow';
				this.backgroundYellow.innerHTML	= 'Aa';

				this.backgroundWhite = document.createElement('a');
				this.backgroundWhite.className	= 'gu-reading-box-toolbar-background-white';
				this.backgroundWhite.innerHTML	= 'Aa';

				if (document.attachEvent) {
					this.backgroundBlack.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectBackground('black'); });
					this.backgroundYellow.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectBackground('yellow'); });
					this.backgroundWhite.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectBackground('white'); });
				} else {
					this.backgroundBlack.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectBackground('black'); }, false);
					this.backgroundYellow.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectBackground('yellow'); }, false);
					this.backgroundWhite.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectBackground('white'); }, false);
				}

				this.background.appendChild(this.backgroundBlack);
				this.background.appendChild(this.backgroundYellow);
				this.background.appendChild(this.backgroundWhite);
				this.toolbarWrapper.appendChild(this.background);

				// Create the flowplayer-integration
				this.flowPlayer = document.createElement('div');
				this.flowPlayer.className = 'gu-reading-box-toolbar-flowplayer';

				this.flowPlayerToggle = document.createElement('a');
				this.flowPlayerToggle.className	= 'gu-reading-box-toolbar-audioplayer-toggle';
				this.flowPlayerToggle.innerHTML	= 'Play/pause';
				this.flowPlayerToggle.href		= 'javascript:$ReadingBox.flowPlayer.toggle();';
				this.flowPlayer.appendChild(this.flowPlayerToggle);

				this.flowPlayerProgressBar = document.createElement('div');
				this.flowPlayerProgressBar.className = 'gu-reading-box-toolbar-audioplayer-progress-bar';

				this.flowPlayerProgressBarNow = document.createElement('div');
				this.flowPlayerProgressBarNow.className	= 'gu-reading-box-toolbar-audioplayer-progress-bar-now';
				this.flowPlayerProgressBarNow.innerHTML	= '0:00';

				this.flowPlayerProgressBarDuration = document.createElement('div');
				this.flowPlayerProgressBarDuration.className	= 'gu-reading-box-toolbar-audioplayer-progress-bar-duration';
				this.flowPlayerProgressBarDuration.innerHTML	= '0:00';

				this.flowPlayerProgressBarSlider = document.createElement('div');
				this.flowPlayerProgressBarSlider.className = 'gu-reading-box-toolbar-slider';

				this.flowPlayerProgressBarSliderActive = document.createElement('div');
				this.flowPlayerProgressBarSliderActive.className = 'gu-reading-box-toolbar-slider-active';

				this.flowPlayerProgressBarSliderIndicator = document.createElement('div');
				this.flowPlayerProgressBarSliderIndicator.className = 'gu-reading-box-toolbar-slider-indicator';

				$(this.flowPlayerProgressBarSliderIndicator).draggable({
					axis		: 'x',
					containment	: 'parent',
					start		: function() { clearTimeout($ReadingBox._hideTimer); },
					drag		: function(events, ui) { $ReadingBox.flowPlayer.seek(ui.position.left); },
					stop		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
				}).addTouch();

				this.flowPlayerProgressBarSlider.appendChild(this.flowPlayerProgressBarSliderActive);
				this.flowPlayerProgressBarSlider.appendChild(this.flowPlayerProgressBarSliderIndicator);
				this.flowPlayerProgressBar.appendChild(this.flowPlayerProgressBarNow);
				this.flowPlayerProgressBar.appendChild(this.flowPlayerProgressBarSlider);
				this.flowPlayerProgressBar.appendChild(this.flowPlayerProgressBarDuration);
				this.flowPlayer.appendChild(this.flowPlayerProgressBar);

				this.flowPlayerVolume = document.createElement('div');
				this.flowPlayerVolume.className = 'gu-reading-box-toolbar-audioplayer-volume';

				this.flowPlayerVolumeActive = document.createElement('div');
				this.flowPlayerVolumeActive.className = 'gu-reading-box-toolbar-audioplayer-volume-active';

				if (document.attachEvent) {
					this.flowPlayerVolume.attachEvent('onmousedown', function(e) { $ReadingBox.flowPlayer.setVolume(e); $ReadingBox.elements.audioPlayerVolume.isDown = true; });
					document.attachEvent('onmousemove', function(e) { if($ReadingBox.elements.audioPlayerVolume.isDown) { $ReadingBox.flowPlayer.setVolume(e); } });
					document.attachEvent('onmouseup', function(e) { if($ReadingBox.elements.audioPlayerVolume.isDown) { $ReadingBox.flowPlayer.setVolume(e); } $ReadingBox.elements.audioPlayerVolume.isDown = false; });
				} else {
					this.flowPlayerVolume.addEventListener('mousedown', function(e) { $ReadingBox.flowPlayer.setVolume(e); $ReadingBox.elements.audioPlayerVolume.isDown = true; }, false);
					document.addEventListener('mousemove', function(e) { if($ReadingBox.elements.audioPlayerVolume.isDown) { $ReadingBox.flowPlayer.setVolume(e); } }, false);
					document.addEventListener('mouseup', function(e) { if($ReadingBox.elements.audioPlayerVolume.isDown) { $ReadingBox.flowPlayer.setVolume(e); } $ReadingBox.elements.audioPlayerVolume.isDown = false; }, false);
				}

				this.flowPlayerVolume.appendChild(this.flowPlayerVolumeActive);
				this.flowPlayer.appendChild(this.flowPlayerVolume);

				this.flowPlayerMute = document.createElement('a');
				this.flowPlayerMute.className	= 'gu-reading-box-toolbar-audioplayer-mute';
				this.flowPlayerMute.innerHTML	= 'Mute';
				this.flowPlayerMute.href		= 'javascript:$ReadingBox.flowPlayer.mute();';
				this.flowPlayer.appendChild(this.flowPlayerMute);

				this.toolbarWrapper.appendChild(this.flowPlayer);

				// Create the hide toolbar-button
				this.hideToolbar = document.createElement('a');
				this.hideToolbar.className	= 'gu-reading-box-toolbar-hide';
				this.hideToolbar.innerHTML	= 'Skjul vÃ¦rktÃ¸jslinje';

				if (document.attachEvent) { this.hideToolbar.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.toolbar.hide(); }); }
				else { this.hideToolbar.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.toolbar.hide(); }, false); }

				this.toolbar.appendChild(this.hideToolbar);

				// Create the show toolbar-button
				this.showToolbar = document.createElement('a');
				this.showToolbar.className	= 'gu-reading-box-toolbar-show';
				this.showToolbar.innerHTML	= 'Vis vÃ¦rktÃ¸jslinje';

				if (document.attachEvent) {
					this.showToolbar.attachEvent('onmouseover', function() { $ReadingBox.toolbar.show(); });
					this.showToolbar.attachEvent('ontouchend', function() { $ReadingBox.toolbar.show(); });
				} else {
					this.showToolbar.addEventListener('mouseover', function() { $ReadingBox.toolbar.show(); }, false);
					this.showToolbar.addEventListener('touchend', function() { $ReadingBox.toolbar.show(); }, false);
				}

				this.toolbar.appendChild(this.showToolbar);

				// Create the content-container
				this.contents = document.createElement('div');
				this.contents.className = 'gu-reading-box-contents';

				// Create the fade overlays
				this.contentsFadeTop = document.createElement('div');
				this.contentsFadeTop.className = 'gu-reading-box-contents-fade-top';

				this.contentsFadeBottom = document.createElement('div');
				this.contentsFadeBottom.className = 'gu-reading-box-contents-fade-bottom';

				this.contents.appendChild(this.contentsFadeTop);
				this.contents.appendChild(this.contentsFadeBottom);

				// Create the content-container
				this.contentsContainer = document.createElement('div');
				this.contentsContainer.className = 'gu-reading-box-contents-container';
				this.contents.appendChild(this.contentsContainer);

				// Create the paging container
				this.paging = document.createElement('div');
				this.paging.className = 'gu-reading-box-paging';

				// Create the page indicator container
				this.pagingIndicators = document.createElement('ul');
				this.pagingIndicators.className = 'gu-reading-box-paging-indicators';
				this.paging.appendChild(this.pagingIndicators);

				// Create the slider
				this.pagingSlider = document.createElement('div');
				this.pagingSlider.className = 'gu-reading-box-paging-slider';

				// Create the scale corners
				this.pagingSliderCornerLeft = document.createElement('div');
				this.pagingSliderCornerLeft.className = 'gu-reading-box-paging-slider-corner-left';

				this.pagingSliderCornerRight = document.createElement('div');
				this.pagingSliderCornerRight.className = 'gu-reading-box-paging-slider-corner-right';

				this.pagingSlider.appendChild(this.pagingSliderCornerLeft);
				this.pagingSlider.appendChild(this.pagingSliderCornerRight);

				// Create the slider bar
				this.pagingSliderBar = document.createElement('div');
				this.pagingSliderBar.className = 'gu-reading-box-paging-slider-bar';
				this.pagingSlider.appendChild(this.pagingSliderBar);

				// Create the active state for the slider bar
				this.pagingSliderBarActive = document.createElement('div');
				this.pagingSliderBarActive.className = 'gu-reading-box-paging-slider-bar-active';
				this.pagingSlider.appendChild(this.pagingSliderBarActive);

				// Create the pin
				this.pagingSliderPin = document.createElement('div');
				this.pagingSliderPin.className = 'gu-reading-box-paging-slider-pin';

				$(this.pagingSliderPin).draggable({
					axis		: 'x',
					drag		: function(events, ui) { $ReadingBox.paging.drag(ui.position.left); },
					stop		: function(events, ui) { $ReadingBox.paging.stopDrag(ui.position.left); }
				}).addTouch();

				this.paging.appendChild(this.pagingSlider);
				this.paging.appendChild(this.pagingSliderPin);

				this.pagingSliderPin.style.position = 'absolute';

				if (!$ReadingBox.touch) {
					// Create the previous page-button
					this.pagingPrevious = document.createElement('a');
					this.pagingPrevious.className	= 'gu-reading-box-paging-prev';
					this.pagingPrevious.innerHTML	= 'Forrige side';
					this.pagingPrevious.href		= 'javascript:$ReadingBox.paging.previous();';

					this.pagingPreviousOverlay = document.createElement('div');
					this.pagingPreviousOverlay.className = 'gu-reading-box-paging-prev-overlay';

					if (document.attachEvent) {
						this.pagingPreviousOverlay.attachEvent('onmouseover', function() { $ReadingBox.elements.pagingPrevious.style.display = 'block'; });
						this.pagingPreviousOverlay.attachEvent('onmouseout', function() { $ReadingBox.elements.pagingPrevious.style.display = 'none'; });
					} else {
						this.pagingPreviousOverlay.addEventListener('mouseover', function() { $ReadingBox.elements.pagingPrevious.style.display = 'block'; }, false);
						this.pagingPreviousOverlay.addEventListener('mouseout', function() { $ReadingBox.elements.pagingPrevious.style.display = 'none'; }, false);
					}

					this.pagingPreviousOverlay.appendChild(this.pagingPrevious);
					this.lightbox.appendChild(this.pagingPreviousOverlay);

					// Create the next page-button
					this.pagingNext = document.createElement('a');
					this.pagingNext.className	= 'gu-reading-box-paging-next';
					this.pagingNext.innerHTML	= 'NÃ¦ste side';
					this.pagingNext.href		= 'javascript:$ReadingBox.paging.next();';

					this.pagingNextOverlay = document.createElement('div');
					this.pagingNextOverlay.className = 'gu-reading-box-paging-next-overlay';

					if (document.attachEvent) {
						this.pagingNextOverlay.attachEvent('onmouseover', function() { $ReadingBox.elements.pagingNext.style.display = 'block'; });
						this.pagingNextOverlay.attachEvent('onmouseout', function() { $ReadingBox.elements.pagingNext.style.display = 'none'; });
					} else {
						this.pagingNextOverlay.addEventListener('mouseover', function() { $ReadingBox.elements.pagingNext.style.display = 'block'; }, false);
						this.pagingNextOverlay.addEventListener('mouseout', function() { $ReadingBox.elements.pagingNext.style.display = 'none'; }, false);
					}

					this.pagingNextOverlay.appendChild(this.pagingNext);
					this.lightbox.appendChild(this.pagingNextOverlay);
				}

				// Insert the toolbar and content-container into the lightbox
				this.lightbox.appendChild(this.toolbar);
				this.lightbox.appendChild(this.contents);
				this.lightbox.appendChild(this.paging);

				// Insert the lightbox into the DOM
				document.body.appendChild(this.lightbox);
			}

			// Adjust the size of the lightbox
			this.lightbox.style.width	= ($ReadingBox.viewport.getWidth() - 40) +'px';
			this.lightbox.style.height	= ($ReadingBox.viewport.getHeight() - 40) +'px';

			// Adjust the height of the content-area
			this.contents.style.height = ($ReadingBox.viewport.getHeight() - 200) +'px';

			// Return a reference to the lightbox
			return this.lightbox;
		}
	},

	/**
	 * The elements-object contains functions to initially create the lightbox
	 * as well as references to the elements within it.
	 */
	elements : {
		/**
		 * This function creates the wrapper for the contents of the original
		 * page and returns a reference to it.
		 */
		getWrapper : function() {
			// If the wrapper has not been created yet, do it now
			if (!this.wrapper) {
				// Create the wrapper
				this.wrapper = document.createElement('div');

				// Assign CSS-styling to the wrapper
				this.wrapper.style.position	= 'absolute';
				this.wrapper.style.left		= 0;
				this.wrapper.style.width	= '100%';

				// Put all contents of the current page into the wrapper
				var elms = document.body.getElementsByTagName('*');
				while (elms[0]) { this.wrapper.appendChild(elms[0]); }
				elms = null;

				// Insert the wrapper into the DOM
				document.body.appendChild(this.wrapper);
			}

			// Update the CSS of the wrapper
			this.wrapper.style.height	= ($ReadingBox.viewport.getHeight() + $ReadingBox.viewport.getScrollY()) +'px';
			this.wrapper.style.top		= (-$ReadingBox.viewport.getScrollY()) +'px';
			this.wrapper.style.overflow	= 'hidden';

			// Return a reference to the wrapper
			return this.wrapper;
		},

		/**
		 * This function creates the black overlay for the contents of the
		 * original page and returns a reference to it.
		 */
		getOverlay : function() {
			// If the overlay has not been created yet, do it now
			if (!this.overlay) {
				// Create the overlay
				this.overlay = document.createElement('div');

				// Assign CSS-styling to the overlay
				this.overlay.style.position 	= 'fixed';
				this.overlay.style.top			= 0;
				this.overlay.style.left			= 0;
				this.overlay.style.zIndex		= 1000000;
				this.overlay.style.width		= '100%';
				this.overlay.style.background	= '#000000';
				this.overlay.style.opacity		= 0.85;
				this.overlay.style.filter		= 'progid:DXImageTransform.Microsoft.Alpha(Opacity=85)';
				this.overlay.style.display		= 'none';

				// Assign event-handlers to the overlay
				if (!$ReadingBox.touch) {
					if (document.attachEvent) { this.overlay.attachEvent('onclick', function() { $ReadingBox.close(); }); }
					else { this.overlay.addEventListener('click', function() { $ReadingBox.close(); }, false); }
				}

				// Insert the overlay into the DOM
				document.body.appendChild(this.overlay);
			}

			// Resize the overlay according to the screen-size
			this.overlay.style.height = $ReadingBox.viewport.getHeight() +'px';

			// Return a reference to the overlay
			return this.overlay;
		},

		/**
		 * This function creates the main lightbox as well as the toolbar etc.
		 */
		getLightBox : function() {
			// If the lightbox has not been created yet, do it now
			if (!this.lightbox) {
				// Create the lightbox
				this.lightbox = document.createElement('div');
				this.lightbox.className = 'gu-reading-box '+ (!$ReadingBox.touch? 'gu-reading-box-desktop' : 'gu-reading-box-touch');

				// Create the toolbar of the lightbox
				this.toolbar = document.createElement('div');
				this.toolbar.className = 'gu-reading-box-toolbar';

				// Create the toolbar-wrapper
				this.toolbarWrapper = document.createElement('div');
				this.toolbarWrapper.className = 'gu-reading-box-toolbar-wrapper';
				this.toolbar.appendChild(this.toolbarWrapper);

				// Create the close-icon
				this.close = document.createElement('a');
				this.close.className	= 'gu-reading-box-toolbar-close';
				this.close.innerHTML	= 'Luk';

				if (document.attachEvent) { this.close.attachEvent('onclick', function() { $ReadingBox.close(); }); }
				else { this.close.addEventListener('click', function() { $ReadingBox.close(); }, false); }

				this.toolbarWrapper.appendChild(this.close);

				// Create the font-size selector
				this.size = document.createElement('div');
				this.size.className = 'gu-reading-box-toolbar-size';

				this.sizeIcon1 = document.createElement('div');
				this.sizeIcon1.className = 'gu-reading-box-toolbar-size-icon-small';

				this.sizeIcon2 = document.createElement('div');
				this.sizeIcon2.className = 'gu-reading-box-toolbar-size-icon-large';

				this.sizeSlider = document.createElement('div');
				this.sizeSlider.className = 'gu-reading-box-toolbar-slider';

				this.sizeSliderActive = document.createElement('div');
				this.sizeSliderActive.className = 'gu-reading-box-toolbar-slider-active';

				this.sizeSliderIndicator = document.createElement('div');
				this.sizeSliderIndicator.className = 'gu-reading-box-toolbar-slider-indicator';

				if (!$ReadingBox.touch) {
					$(this.sizeSliderIndicator).draggable({
						axis		: 'x',
						containment	: 'parent',
						start		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox.paging.tmpOffset = $ReadingBox.paging.page / $ReadingBox.paging.pages; },
						drag		: function(events, ui) { $ReadingBox.settings.selectFontSize(ui.position.left); $ReadingBox.paging.goTo(Math.round($ReadingBox.paging.pages * $ReadingBox.paging.tmpOffset), true); },
						stop		: function() { $ReadingBox.paging.tmpOffset = null; clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
					});
				} else {
					$(this.sizeSliderIndicator).draggable({
						axis		: 'x',
						containment	: 'parent',
						start		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox.paging.tmpOffset = $ReadingBox.paging.page / $ReadingBox.paging.pages; },
						drag		: function(events, ui) { $ReadingBox.elements.sizeSliderIndicator.style.left = (ui.position.left) +'px'; $ReadingBox.elements.sizeSliderActive.style.width = (parseInt(ui.position.left, 10) + 10) +'px'; },
						stop		: function(events, ui) { $ReadingBox.settings.selectFontSize(ui.position.left); $ReadingBox.paging.goTo(Math.round($ReadingBox.paging.pages * $ReadingBox.paging.tmpOffset), true); clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
					}).addTouch();
				}

				this.sizeSlider.appendChild(this.sizeSliderActive);
				this.sizeSlider.appendChild(this.sizeSliderIndicator);
				this.size.appendChild(this.sizeIcon1);
				this.size.appendChild(this.sizeSlider);
				this.size.appendChild(this.sizeIcon2);
				this.toolbarWrapper.appendChild(this.size);

				// Create the column-width selector
				this.columnWidth = document.createElement('div');
				this.columnWidth.className = 'gu-reading-box-toolbar-column-width';

				this.columnWidthIcon1 = document.createElement('div');
				this.columnWidthIcon1.className = 'gu-reading-box-toolbar-column-width-icon-small';

				this.columnWidthIcon2 = document.createElement('div');
				this.columnWidthIcon2.className = 'gu-reading-box-toolbar-column-width-icon-large';

				this.columnWidthSlider = document.createElement('div');
				this.columnWidthSlider.className = 'gu-reading-box-toolbar-slider';

				this.columnWidthSliderActive = document.createElement('div');
				this.columnWidthSliderActive.className = 'gu-reading-box-toolbar-slider-active';

				this.columnWidthSliderIndicator = document.createElement('div');
				this.columnWidthSliderIndicator.className = 'gu-reading-box-toolbar-slider-indicator';

				if (!$ReadingBox.touch) {
					$(this.columnWidthSliderIndicator).draggable({
						axis		: 'x',
						containment	: 'parent',
						start		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox.paging.tmpOffset = $ReadingBox.paging.page / $ReadingBox.paging.pages; },
						drag		: function(events, ui) { $ReadingBox.settings.selectColumnWidth(ui.position.left); $ReadingBox.paging.goTo(Math.round($ReadingBox.paging.pages * $ReadingBox.paging.tmpOffset), true); },
						stop		: function() { $ReadingBox.paging.tmpOffset = null; clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
					});
				} else {
					$(this.columnWidthSliderIndicator).draggable({
						axis		: 'x',
						containment	: 'parent',
						start		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox.paging.tmpOffset = $ReadingBox.paging.page / $ReadingBox.paging.pages; },
						drag		: function(events, ui) { $ReadingBox.elements.columnWidthSliderIndicator.style.left = (ui.position.left) +'px'; $ReadingBox.elements.columnWidthSliderActive.style.width = (parseInt(ui.position.left, 10) + 10) +'px'; },
						stop		: function(events, ui) { $ReadingBox.settings.selectColumnWidth(ui.position.left); $ReadingBox.paging.goTo(Math.round($ReadingBox.paging.pages * $ReadingBox.paging.tmpOffset), true); clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
					}).addTouch();
				}

				this.columnWidthSlider.appendChild(this.columnWidthSliderActive);
				this.columnWidthSlider.appendChild(this.columnWidthSliderIndicator);
				this.columnWidth.appendChild(this.columnWidthIcon1);
				this.columnWidth.appendChild(this.columnWidthSlider);
				this.columnWidth.appendChild(this.columnWidthIcon2);
				this.toolbarWrapper.appendChild(this.columnWidth);

				// Create the font-selector
				this.font = document.createElement('div');
				this.font.className = 'gu-reading-box-toolbar-font';

				this.fontVerdana = document.createElement('a');
				this.fontVerdana.className	= 'gu-reading-box-toolbar-font-verdana';
				this.fontVerdana.innerHTML	= 'Verdana';

				this.fontGeorgia = document.createElement('a');
				this.fontGeorgia.className	= 'gu-reading-box-toolbar-font-georgia';
				this.fontGeorgia.innerHTML	= 'Georgia';

				if (document.attachEvent) {
					this.fontVerdana.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectFont('verdana'); });
					this.fontGeorgia.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectFont('georgia'); });
				} else {
					this.fontVerdana.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectFont('verdana'); }, false);
					this.fontGeorgia.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectFont('georgia'); }, false);
				}

				this.font.appendChild(this.fontVerdana);
				this.font.appendChild(this.fontGeorgia);
				this.toolbarWrapper.appendChild(this.font);

				// Create the background-selector
				this.background = document.createElement('div');
				this.background.className = 'gu-reading-box-toolbar-background';

				this.backgroundBlack = document.createElement('a');
				this.backgroundBlack.className	= 'gu-reading-box-toolbar-background-black';
				this.backgroundBlack.innerHTML	= 'Aa';

				this.backgroundYellow = document.createElement('a');
				this.backgroundYellow.className	= 'gu-reading-box-toolbar-background-yellow';
				this.backgroundYellow.innerHTML	= 'Aa';

				this.backgroundWhite = document.createElement('a');
				this.backgroundWhite.className	= 'gu-reading-box-toolbar-background-white';
				this.backgroundWhite.innerHTML	= 'Aa';

				if (document.attachEvent) {
					this.backgroundBlack.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectBackground('black'); });
					this.backgroundYellow.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectBackground('yellow'); });
					this.backgroundWhite.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.settings.selectBackground('white'); });
				} else {
					this.backgroundBlack.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectBackground('black'); }, false);
					this.backgroundYellow.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectBackground('yellow'); }, false);
					this.backgroundWhite.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.settings.selectBackground('white'); }, false);
				}

				this.background.appendChild(this.backgroundBlack);
				this.background.appendChild(this.backgroundYellow);
				this.background.appendChild(this.backgroundWhite);
				this.toolbarWrapper.appendChild(this.background);

				// Create the jPlayer-integration
				this.audioPlayer = document.createElement('div');
				this.audioPlayer.className = 'gu-reading-box-toolbar-jPlayer';

				this.audioPlayerAudio = document.createElement('div');
				this.audioPlayerAudio.className = 'gu-reading-box-toolbar-audioplayer-audio';
				this.audioPlayer.appendChild(this.audioPlayerAudio);

				this.audioPlayerToggle = document.createElement('a');
				this.audioPlayerToggle.className	= 'gu-reading-box-toolbar-audioplayer-toggle';
				this.audioPlayerToggle.innerHTML	= 'Play/pause';
				this.audioPlayerToggle.href		= 'javascript:$ReadingBox.jPlayer.toggle();';
				this.audioPlayer.appendChild(this.audioPlayerToggle);

				this.audioPlayerProgressBar = document.createElement('div');
				this.audioPlayerProgressBar.className = 'gu-reading-box-toolbar-audioplayer-progress-bar';

				this.audioPlayerProgressBarNow = document.createElement('div');
				this.audioPlayerProgressBarNow.className	= 'gu-reading-box-toolbar-audioplayer-progress-bar-now';
				this.audioPlayerProgressBarNow.innerHTML	= '0:00';

				this.audioPlayerProgressBarDuration = document.createElement('div');
				this.audioPlayerProgressBarDuration.className	= 'gu-reading-box-toolbar-audioplayer-progress-bar-duration';
				this.audioPlayerProgressBarDuration.innerHTML	= '0:00';

				this.audioPlayerProgressBarSlider = document.createElement('div');
				this.audioPlayerProgressBarSlider.className = 'gu-reading-box-toolbar-slider';

				this.audioPlayerProgressBarSliderActive = document.createElement('div');
				this.audioPlayerProgressBarSliderActive.className = 'gu-reading-box-toolbar-slider-active';

				this.audioPlayerProgressBarSliderIndicator = document.createElement('div');
				this.audioPlayerProgressBarSliderIndicator.className = 'gu-reading-box-toolbar-slider-indicator';

				$(this.audioPlayerProgressBarSliderIndicator).draggable({
					axis		: 'x',
					containment	: 'parent',
					start		: function() { clearTimeout($ReadingBox._hideTimer); },
					drag		: function(events, ui) { $ReadingBox.jPlayer.seek(ui.position.left); },
					stop		: function() { clearTimeout($ReadingBox._hideTimer); $ReadingBox._hideTimer = setTimeout(function() { $ReadingBox.toolbar.hide(); }, 10000); }
				}).addTouch();

				this.audioPlayerProgressBarSlider.appendChild(this.audioPlayerProgressBarSliderActive);
				this.audioPlayerProgressBarSlider.appendChild(this.audioPlayerProgressBarSliderIndicator);
				this.audioPlayerProgressBar.appendChild(this.audioPlayerProgressBarNow);
				this.audioPlayerProgressBar.appendChild(this.audioPlayerProgressBarSlider);
				this.audioPlayerProgressBar.appendChild(this.audioPlayerProgressBarDuration);
				this.audioPlayer.appendChild(this.audioPlayerProgressBar);

				this.audioPlayerVolume = document.createElement('div');
				this.audioPlayerVolume.className = 'gu-reading-box-toolbar-audioplayer-volume';
				if ($ReadingBox.touch) { this.audioPlayerVolume.style.display = 'none'; }

				this.audioPlayerVolumeActive = document.createElement('div');
				this.audioPlayerVolumeActive.className = 'gu-reading-box-toolbar-audioplayer-volume-active';

				if (document.attachEvent) {
					this.audioPlayerVolume.attachEvent('onmousedown', function(e) { $ReadingBox.jPlayer.setVolume(e); $ReadingBox.elements.audioPlayerVolume.isDown = true; });
					document.attachEvent('onmousemove', function(e) { if($ReadingBox.elements.audioPlayerVolume.isDown) { $ReadingBox.jPlayer.setVolume(e); } });
					document.attachEvent('onmouseup', function(e) { if($ReadingBox.elements.audioPlayerVolume.isDown) { $ReadingBox.jPlayer.setVolume(e); } $ReadingBox.elements.audioPlayerVolume.isDown = false; });
				} else {
					this.audioPlayerVolume.addEventListener('mousedown', function(e) { $ReadingBox.jPlayer.setVolume(e); $ReadingBox.elements.audioPlayerVolume.isDown = true; }, false);
					document.addEventListener('mousemove', function(e) { if($ReadingBox.elements.audioPlayerVolume.isDown) { $ReadingBox.jPlayer.setVolume(e); } }, false);
					document.addEventListener('mouseup', function(e) { if($ReadingBox.elements.audioPlayerVolume.isDown) { $ReadingBox.jPlayer.setVolume(e); } $ReadingBox.elements.audioPlayerVolume.isDown = false; }, false);
				}

				this.audioPlayerVolume.appendChild(this.audioPlayerVolumeActive);
				this.audioPlayer.appendChild(this.audioPlayerVolume);

				this.audioPlayerMute = document.createElement('a');
				this.audioPlayerMute.className	= 'gu-reading-box-toolbar-audioplayer-mute';
				this.audioPlayerMute.innerHTML	= 'Mute';
				this.audioPlayerMute.href		= 'javascript:$ReadingBox.jPlayer.mute();';
				if ($ReadingBox.touch) { this.audioPlayerMute.style.display = 'none'; }
				this.audioPlayer.appendChild(this.audioPlayerMute);

				this.toolbarWrapper.appendChild(this.audioPlayer);

				// Create the hide toolbar-button
				this.hideToolbar = document.createElement('a');
				this.hideToolbar.className	= 'gu-reading-box-toolbar-hide';
				this.hideToolbar.innerHTML	= 'Skjul vÃ¦rktÃ¸jslinje';

				if (document.attachEvent) { this.hideToolbar.attachEvent((!$ReadingBox.touch ? 'onclick' : 'ontouchend'), function() { $ReadingBox.toolbar.hide(); }); }
				else { this.hideToolbar.addEventListener((!$ReadingBox.touch ? 'click' : 'touchend'), function() { $ReadingBox.toolbar.hide(); }, false); }

				this.toolbar.appendChild(this.hideToolbar);

				// Create the show toolbar-button
				this.showToolbar = document.createElement('a');
				this.showToolbar.className	= 'gu-reading-box-toolbar-show';
				this.showToolbar.innerHTML	= 'Vis vÃ¦rktÃ¸jslinje';

				if (document.attachEvent) {
					this.showToolbar.attachEvent('onmouseover', function() { $ReadingBox.toolbar.show(); });
					this.showToolbar.attachEvent('ontouchend', function() { $ReadingBox.toolbar.show(); });
				} else {
					this.showToolbar.addEventListener('mouseover', function() { $ReadingBox.toolbar.show(); }, false);
					this.showToolbar.addEventListener('touchend', function() { $ReadingBox.toolbar.show(); }, false);
				}

				this.toolbar.appendChild(this.showToolbar);

				// Create the content-container
				this.contents = document.createElement('div');
				this.contents.className = 'gu-reading-box-contents';

				// Create the fade overlays
				this.contentsFadeTop = document.createElement('div');
				this.contentsFadeTop.className = 'gu-reading-box-contents-fade-top';

				this.contentsFadeBottom = document.createElement('div');
				this.contentsFadeBottom.className = 'gu-reading-box-contents-fade-bottom';

				this.contents.appendChild(this.contentsFadeTop);
				this.contents.appendChild(this.contentsFadeBottom);

				// Create the content-container
				this.contentsContainer = document.createElement('div');
				this.contentsContainer.className = 'gu-reading-box-contents-container';
				this.contents.appendChild(this.contentsContainer);

				// Create the paging container
				this.paging = document.createElement('div');
				this.paging.className = 'gu-reading-box-paging';

				// Create the page indicator container
				this.pagingIndicators = document.createElement('ul');
				this.pagingIndicators.className = 'gu-reading-box-paging-indicators';
				this.paging.appendChild(this.pagingIndicators);

				// Create the slider
				this.pagingSlider = document.createElement('div');
				this.pagingSlider.className = 'gu-reading-box-paging-slider';

				// Create the scale corners
				this.pagingSliderCornerLeft = document.createElement('div');
				this.pagingSliderCornerLeft.className = 'gu-reading-box-paging-slider-corner-left';

				this.pagingSliderCornerRight = document.createElement('div');
				this.pagingSliderCornerRight.className = 'gu-reading-box-paging-slider-corner-right';

				this.pagingSlider.appendChild(this.pagingSliderCornerLeft);
				this.pagingSlider.appendChild(this.pagingSliderCornerRight);

				// Create the slider bar
				this.pagingSliderBar = document.createElement('div');
				this.pagingSliderBar.className = 'gu-reading-box-paging-slider-bar';
				this.pagingSlider.appendChild(this.pagingSliderBar);

				// Create the active state for the slider bar
				this.pagingSliderBarActive = document.createElement('div');
				this.pagingSliderBarActive.className = 'gu-reading-box-paging-slider-bar-active';
				this.pagingSlider.appendChild(this.pagingSliderBarActive);

				// Create the pin
				this.pagingSliderPin = document.createElement('div');
				this.pagingSliderPin.className = 'gu-reading-box-paging-slider-pin';

				$(this.pagingSliderPin).draggable({
					axis		: 'x',
					drag		: function(events, ui) { $ReadingBox.paging.drag(ui.position.left); },
					stop		: function(events, ui) { $ReadingBox.paging.stopDrag(ui.position.left); }
				}).addTouch();

				this.paging.appendChild(this.pagingSlider);
				this.paging.appendChild(this.pagingSliderPin);

				this.pagingSliderPin.style.position = 'absolute';

				if (!$ReadingBox.touch) {
					// Create the previous page-button
					this.pagingPrevious = document.createElement('a');
					this.pagingPrevious.className	= 'gu-reading-box-paging-prev';
					this.pagingPrevious.innerHTML	= 'Forrige side';
					this.pagingPrevious.href		= 'javascript:$ReadingBox.paging.previous();';

					this.pagingPreviousOverlay = document.createElement('div');
					this.pagingPreviousOverlay.className = 'gu-reading-box-paging-prev-overlay';

					if (document.attachEvent) {
						this.pagingPreviousOverlay.attachEvent('onmouseover', function() { $ReadingBox.elements.pagingPrevious.style.display = 'block'; });
						this.pagingPreviousOverlay.attachEvent('onmouseout', function() { $ReadingBox.elements.pagingPrevious.style.display = 'none'; });
					} else {
						this.pagingPreviousOverlay.addEventListener('mouseover', function() { $ReadingBox.elements.pagingPrevious.style.display = 'block'; }, false);
						this.pagingPreviousOverlay.addEventListener('mouseout', function() { $ReadingBox.elements.pagingPrevious.style.display = 'none'; }, false);
					}

					this.pagingPreviousOverlay.appendChild(this.pagingPrevious);
					this.lightbox.appendChild(this.pagingPreviousOverlay);

					// Create the next page-button
					this.pagingNext = document.createElement('a');
					this.pagingNext.className	= 'gu-reading-box-paging-next';
					this.pagingNext.innerHTML	= 'NÃ¦ste side';
					this.pagingNext.href		= 'javascript:$ReadingBox.paging.next();';

					this.pagingNextOverlay = document.createElement('div');
					this.pagingNextOverlay.className = 'gu-reading-box-paging-next-overlay';

					if (document.attachEvent) {
						this.pagingNextOverlay.attachEvent('onmouseover', function() { $ReadingBox.elements.pagingNext.style.display = 'block'; });
						this.pagingNextOverlay.attachEvent('onmouseout', function() { $ReadingBox.elements.pagingNext.style.display = 'none'; });
					} else {
						this.pagingNextOverlay.addEventListener('mouseover', function() { $ReadingBox.elements.pagingNext.style.display = 'block'; }, false);
						this.pagingNextOverlay.addEventListener('mouseout', function() { $ReadingBox.elements.pagingNext.style.display = 'none'; }, false);
					}

					this.pagingNextOverlay.appendChild(this.pagingNext);
					this.lightbox.appendChild(this.pagingNextOverlay);
				}

				// Insert the toolbar and content-container into the lightbox
				this.lightbox.appendChild(this.toolbar);
				this.lightbox.appendChild(this.contents);
				this.lightbox.appendChild(this.paging);

				// Insert the lightbox into the DOM
				document.body.appendChild(this.lightbox);
			}

			// Adjust the size of the lightbox
			this.lightbox.style.width	= ($ReadingBox.viewport.getWidth() - 40) +'px';
			this.lightbox.style.height	= ($ReadingBox.viewport.getHeight() - 40) +'px';

			// Adjust the height of the content-area
			this.contents.style.height = ($ReadingBox.viewport.getHeight() - 200) +'px';

			// Return a reference to the lightbox
			return this.lightbox;
		}
	},

	/**
	 * The viewport-element contains functions used for calculating the current
	 * size and scrolling of the window/viewport.
	 */
	viewport : {
		/**
		 * This function returns the width of the viewport.
		 */
		getWidth : function() {
			return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
		},

		/**
		 * This function returns the height of the viewport.
		 */
		getHeight : function() {
			return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
		},

		/**
		 * This function returns the current scrolling offset on the viewport
		 * on the x-axis.
		 */
		getScrollX : function() {
			return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
		},

		/**
		 * This function returns the current scrolling offset of the viewport
		 * on the y-axis.
		 */
		getScrollY : function() {
			return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
		}
	},

	/**
	 * The cookies-element contains functions used for reading and storing
	 * settings in a cookie.
	 */
	cookies : {
		/**
		 * This function stores a setting in the cookie.
		 */
		set : function(name, value) {
			// Store cookies for 2 years (2 years * 365 days/year * 24 hours/day * 60 minutes/hours * 60 seconds/minute * 1000 ms/second = 63072000000)
			var date = new Date();
			date.setTime((+new Date) + 63072000000);

			// Store the cookie
			document.cookie = '$ReadingBox_'+ name +'='+ value +'; expires='+ date.toGMTString() +'; path=/';
		},

		/**
		 * This function reads a setting from the cookie.
		 */
		get : function(name) {
			// Append prefix to the name of the cookie
			name = '$ReadingBox_'+ name +'=';

			// Loop through the list of cookies and determine which one to
			// return
			var cookies = document.cookie.split(';'); var i = cookies.length;
			while (i--) {
				// Parse the name of the cookie
				var cookie = cookies[i];
				while (cookie.charAt(0) === ' ') { cookie = cookie.substr(1); }

				// Is this the correct cookie?
				if (cookie.indexOf(name) === 0) { return cookie.substring(name.length); }
			}

			// If we get here, no matching cookie was found - return null
			return null;
		}
	}
};

// Handle DOM-ready
$(document).ready(function() { $ReadingBox.initialize(); });

// Handle window resizing
if (document.attachEvent) { window.attachEvent('onresize', function() { $ReadingBox.resize(); }); }
else { window.addEventListener('resize', function() { $ReadingBox.resize(); }, false); }
window.onorientationchange = function() { setTimeout(function() { $ReadingBox.resize(); }, 1000); };
