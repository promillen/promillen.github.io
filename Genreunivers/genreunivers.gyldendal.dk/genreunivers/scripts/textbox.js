/**
 * Gyldendal GenreUnivers Textbox Handler.
 *
 * This file is used to render and display text-boxes based on the information
 * in the XML-feed.
 */

$GenreUnivers_TextBox = {
	/**
	 * This function opens an info-box and displays the data that has been
	 * sent to it.
	 */
	displayBox : function(type, galaxy_id, planet_id, orbit_id, sub_orbit_id) {
		// Make sure the system is ready!
		if (!$GenreUnivers.data) { return; }

		// Read data about the genre
		var data;
		if (type === 'planet') {
			// Grab data
			data = $GenreUnivers.data[galaxy_id].children[planet_id];

			// Assign path
			data.path = galaxy_id +', '+ planet_id;

		} else if (type === 'orbit') {
			// Grab data
			data = $GenreUnivers.data[galaxy_id].children[planet_id].children[orbit_id];

			// Assign path
			data.path = galaxy_id +', '+ planet_id +', '+ orbit_id;

		} else if (type === 'sub-orbit') {
			// Grab data
			data = $GenreUnivers.data[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id];

			// Assign path
			data.path = galaxy_id +', '+ planet_id +', '+ orbit_id +', '+ sub_orbit_id;
		}

		// If no data was found, abort this function
		if (!data) { return; }

		// Is this planet added to the basket?
			var in_basket = false;
		try {
			if (type === 'planet' && $GenreUnivers_Basket.items.ordered[galaxy_id].children[planet_id].data) { var in_basket = true; }
			else if (type === 'orbit' && $GenreUnivers_Basket.items.ordered[galaxy_id].children[planet_id].children[orbit_id].data) { var in_basket = true; }
			else if (type === 'sub-orbit' && $GenreUnivers_Basket.items.ordered[galaxy_id].children[planet_id].children[orbit_id].children[sub_orbit_id].data) { var in_basket = true; }
		} catch(e) {}	

		// Make sure no other text-boxes are open
		this.hideBox();

		// Remove planet titles!
		$('.planet-title').remove();

		// Register the current title
		this.title = data.title;

		// Prepare the HTML-structure
		var html = '<div class="text-top"></div>';

		// Display the header
		html += '<div class="text-header">\
					<h1 class="text-header-h1">'+ data.title +'</h1>\
					<a class="text-header-close" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.hideBox(event); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.hideBox(event); }">'+ _('Luk') +'</a>\
				</div>';

		// Prepare the content-container
		html += '<div class="text-contents"><div id="text-main-container">';

		// Insert general text
		html += data.info.text;

		// Insert "add to basket"-link
		html += '<div id="text-contents-add-to-basket" style="display:'+ (!in_basket ? 'block' : 'none') +';"><a class="text-contents-add-to-basket" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_Basket.addItem(\''+ type +'\', '+ data.path +'); document.getElementById(\'text-contents-add-to-basket\').style.display = \'none\'; document.getElementById(\'text-contents-remove-from-basket\').style.display = \'block\'; }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_Basket.addItem(\''+ type +'\', '+ data.path +'); document.getElementById(\'text-contents-add-to-basket\').style.display = \'none\'; document.getElementById(\'text-contents-remove-from-basket\').style.display = \'block\'; }">\
					<img src="layout/images/misc/blank.gif" alt=""/>\
					'+ _('Føj teksten til mappen') +'\
				 </a></div>';
		html += '<div id="text-contents-remove-from-basket" style="display:'+ (in_basket ? 'block' : 'none') +';"><a class="text-contents-add-to-basket" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_Basket.removeItem(\''+ type +'\', '+ data.path +'); document.getElementById(\'text-contents-remove-from-basket\').style.display = \'none\'; document.getElementById(\'text-contents-add-to-basket\').style.display = \'block\'; }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_Basket.removeItem(\''+ type +'\', '+ data.path +'); document.getElementById(\'text-contents-remove-from-basket\').style.display = \'none\'; document.getElementById(\'text-contents-add-to-basket\').style.display = \'block\'; }">\
					<img src="layout/images/misc/blank.gif" alt=""/>\
					' + _('Fjern teksten fra mappen') +'\
				 </a></div>';

		// Output the links
		if (data.info.links && data.info.links.length) {
			html += '<ul class="text-contents-links">';

			for (var i = 0, j = data.info.links.length; i < j; i++) {
				// External links
				if (data.info.links[i].type === 'external') {
					html += '<li class="text-contents-links-li"><a class="text-contents-links-a" href="javascript:;" style="background-image:url('+ data.info.links[i].icon +');" ontouchend="if ($GenreUnivers.supports.touch) { window.open(\''+ (data.info.links[i].mobile_url || data.info.links[i].url) +'\'); }" onclick="if (!$GenreUnivers.supports.touch) { window.open(\''+ data.info.links[i].url +'\'); }">'+ data.info.links[i].title +'</a></li>';

				// Raw-item links
				} else if (data.info.links[i].type === 'rawItem') {
					html += '<li class="text-contents-links-li"><a class="text-contents-links-a" href="javascript:;" style="background-image:url('+ data.info.links[i].icon +');" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayRawItem(\''+ data.info.links[i].url +'\', this, \'url('+ data.info.links[i].icon +') no-repeat left center\'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayRawItem(\''+ data.info.links[i].url +'\', this, \'url('+ data.info.links[i].icon +') no-repeat left center\'); }">'+ data.info.links[i].title +'</a></li>';

				// Download links
				} else if (data.info.links[i].type === 'download') {
					html += '<li class="text-contents-links-li"><a class="text-contents-links-a" href="javascript:;" style="background-image:url('+ data.info.links[i].icon +');" ontouchend="if ($GenreUnivers.supports.touch) { window.open(\''+ data.info.links[i].url +'\'); }" onclick="if (!$GenreUnivers.supports.touch) { window.open(\''+ data.info.links[i].url +'\'); }">'+ data.info.links[i].title +'</a></li>';

				// Photo links
				} else if (data.info.links[i].type === 'photo') {
					html += '<li class="text-contents-links-li"><a class="text-contents-links-a" href="javascript:;" style="background-image:url('+ data.info.links[i].icon +');" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayPhoto(\''+ data.info.links[i].title.replace(/\'/g, '&#39;') +'\', \''+ data.info.links[i].url +'\'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayPhoto(\''+ data.info.links[i].title.replace(/\'/g, '&#39;') +'\', \''+ data.info.links[i].url +'\'); }">'+ data.info.links[i].title +'</a></li>';

				// Video links
				} else if (data.info.links[i].type === 'video') {
					html += '<li class="text-contents-links-li"><a class="text-contents-links-a" href="javascript:;" style="background-image:url('%2b%20data.info.links%5bi%5d.html');" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayVideo(\''+ data.info.links[i].title.replace(/\'/g, '&#39;') +'\', \''+ data.info.links[i].url +'\'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayVideo(\''+ data.info.links[i].title.replace(/\'/g, '&#39;') +'\', \''+ data.info.links[i].url +'\'); }">'+ data.info.links[i].title +'</a></li>';

				// Text links
				} else if (data.info.links[i].type === 'text') {
					html += '<li class="text-contents-links-li"><a class="text-contents-links-a" href="javascript:;" style="background-image:url('%2b%20data.info.links%5bi%5d.html');" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayText(\''+ data.info.links[i].url +'\'); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.displayText(\''+ data.info.links[i].url +'\'); }">'+ data.info.links[i].title +'</a></li>';
				}
			}

			html += '</ul>';
		}

		// Wrap up the HTML-structure
		html += '</div><div id="text-secondary-container"></div></div>';

		// Create the container and insert the HTML-structure
		var container = $('<div class="master-text" '+ (!$GenreUnivers.supports.touch ? 'onclick' : 'ontouchend') +'="var e = event || window.event; e.stopPropagation && e.stopPropagation(); e.cancelBubble = true;"/>').html(html).css({visibility: 'hidden'}).appendTo($('.master-container')); html = null;

		// Center the container on the y-axis
		container.css({top : Math.round((610 - container.height()) / 2) +'px', visibility : 'visible'});

		// Clean up memory
		container = null;

		// Register that we opened a text-box
		this.open = true;

		// Insert the shadow into the DOM
		$('<div class="master-shadow" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.hideBox(event); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.hideBox(event); }" />').appendTo($('.master-container'));
	},

	/**
	 * This function closes the info-box again, when the user clicks anywhere
	 * on the document.
	 */
	hideBox : function(e) {
		// If no info-boxes are opened currently, abort this funciton
		if (!this.open) { return; }

		// Remove the info-box from the DOM
		$('.master-text').remove();
		$('.master-shadow').remove();

		// Register that the info-box is no longer open
		this.open = false;

		// Stop event-propagation
		var e = e || window.event;
		e.stopPropagation && e.stopPropagation();
		e.cancelBubble = true;
	},

	/**
	 * This function loads info about raw items from the SiteCore webservice,
	 * and displays them in the GenreUnivers.
	 */
	displayRawItem : function(url, trigger, bg) {
		// Display the load-throbber
		trigger.style.background = 'url(layout/images/misc/throbber2.gif) no-repeat 3px center';

		// Load the contents of the file using AJAX
		$.ajax('scripts/proxy.php?url='+ encodeURIComponent(url), {
			dataType: 'xml',
			success : function(data) {
				// Load type
				var type = data.getElementsByTagName('rawitem')[0].getAttribute('type');

				// Photos
				if (type === 'RaaStofBillede') {
					// Display the secondary container
					document.getElementById('text-main-container').style.display = 'none';
					document.getElementById('text-secondary-container').style.display = 'block';

					// Prepare the HTML-structure
					var html = '<div class="text-photo text-photo-left text-photo-preloader"><img class="text-photo-img" src="'+ data.getElementsByTagName('file')[0].childNodes[0].nodeValue +'" alt="" title="'+ _('Klik på billedet for at gå tilbage til {%title}', {title: $GenreUnivers_TextBox.title.replace(/\"/g, '&#34;')}) +'" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onload="this.parentNode.className = \'text-photo text-photo-left\'; this.style.display = \'block\'; $GenreUnivers_TextBox.reCenter();" /></div>';
					html += '<div class="text-photo-right">';
					html += '<p><b>'+ data.getElementsByTagName('title')[0].childNodes[0].nodeValue +'</b><br><i>'+ data.getElementsByTagName('author')[0].childNodes[0].nodeValue +', '+ data.getElementsByTagName('year')[0].childNodes[0].nodeValue +'</i></p>';
					html += '<p>'+ data.getElementsByTagName('description')[0].childNodes[0].nodeValue +'</p>';
					html += '<p><a class="text-back" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }">&laquo; '+ _('Gå tilbage til {%title}', {title: $GenreUnivers_TextBox.title}) +'</a></p>';
					html += '</div>';

					// Insert the photo into the secondary container
					document.getElementById('text-secondary-container').innerHTML = html;

					// Update the title
					$('.text-header-h1').html($GenreUnivers_TextBox.title +' &raquo; '+ data.getElementsByTagName('title')[0].childNodes[0].nodeValue);

					// Re-center!
					$GenreUnivers_TextBox.reCenter();

				// Videos
				} else if (type === 'RaaStofVideo') {
					// From SiteCore
					if (data.getElementsByTagName('file')[0].getAttribute('type') === 'mp4' || data.getElementsByTagName('file')[0].getAttribute('type') === 'flv') {
						// Prepare the HTML-structure
						var html = '<div class="text-video"><a class="text-video-container" id="text-video" href="'+ data.getElementsByTagName('file')[0].childNodes[0].nodeValue +'"></a></div>';
						html += '<p><b>'+ data.getElementsByTagName('title')[0].childNodes[0].nodeValue +'</b><br>'+ (data.getElementsByTagName('author')[0].childNodes[0].nodeValue ? data.getElementsByTagName('author')[0].childNodes[0].nodeValue +'<br>' : '') + (data.getElementsByTagName('anthology')[0].childNodes[0].nodeValue ? data.getElementsByTagName('anthology')[0].childNodes[0].nodeValue +'<br>' : '') + '<i>'+ data.getElementsByTagName('publisher')[0].childNodes[0].nodeValue +', '+ data.getElementsByTagName('year')[0].childNodes[0].nodeValue +'</i></p>';
						html += '<p>'+ data.getElementsByTagName('description')[0].childNodes[0].nodeValue +'</p>';
						html += '<p><a class="text-back" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }">&laquo; '+ _('Gå tilbage til {%title}', {title: $GenreUnivers_TextBox.title}) +'</a></p>';

						// Insert the photo into the secondary container
						document.getElementById('text-secondary-container').innerHTML = html;
						flowplayer('text-video', 'flowplayer/flowplayer-3.2.7.swf', {clip: {autoPlay: true}}).ipad();

					// From YouTube
					} else if (data.getElementsByTagName('file')[0].getAttribute('type') === 'youtube') {
						// Prepare the HTML-structure
						var html = '<div class="text-video"><iframe width="100%" height="395" src="http://www.youtube.com/embed/'+ data.getElementsByTagName('file')[0].childNodes[0].nodeValue +'?showinfo=0" frameborder="0" allowfullscreen></iframe></div>';
						html += '<p><b>'+ data.getElementsByTagName('title')[0].childNodes[0].nodeValue +'</b><br>'+ (data.getElementsByTagName('author')[0].childNodes[0].nodeValue ? data.getElementsByTagName('author')[0].childNodes[0].nodeValue +'<br>' : '') + (data.getElementsByTagName('anthology')[0].childNodes[0].nodeValue ? data.getElementsByTagName('anthology')[0].childNodes[0].nodeValue +'<br>' : '') +'<i>'+ data.getElementsByTagName('publisher')[0].childNodes[0].nodeValue +', '+ data.getElementsByTagName('year')[0].childNodes[0].nodeValue +'</i></p>';
						html += '<p>'+ data.getElementsByTagName('description')[0].childNodes[0].nodeValue +'</p>';
						html += '<p><a class="text-back" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }">&laquo; '+ _('Gå tilbage til {%title}', {title: $GenreUnivers_TextBox.title}) +'</a></p>';

						// Insert the photo into the secondary container
						document.getElementById('text-secondary-container').innerHTML = html;

					// From Vimeo
					} else if (data.getElementsByTagName('file')[0].getAttribute('type') === 'vimeo') {
						// Prepare the HTML-structure
						var html = '<div class="text-video"><iframe src="http://player.vimeo.com/video/'+ data.getElementsByTagName('file')[0].childNodes[0].nodeValue +'?title=0&amp;byline=0&amp;portrait=0" width="100%" height="395" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div>';
						html += '<p><b>'+ data.getElementsByTagName('title')[0].childNodes[0].nodeValue +'</b><br>'+ (data.getElementsByTagName('author')[0].childNodes[0].nodeValue ? data.getElementsByTagName('author')[0].childNodes[0].nodeValue +'<br>' : '') + (data.getElementsByTagName('anthology')[0].childNodes[0].nodeValue ? data.getElementsByTagName('anthology')[0].childNodes[0].nodeValue +'<br>' : '') +'<i>'+ data.getElementsByTagName('publisher')[0].childNodes[0].nodeValue +', '+ data.getElementsByTagName('year')[0].childNodes[0].nodeValue +'</i></p>';
						html += '<p>'+ data.getElementsByTagName('description')[0].childNodes[0].nodeValue +'</p>';
						html += '<p><a class="text-back" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }">&laquo; '+ _('Gå tilbage til {%title}', {title: $GenreUnivers_TextBox.title}) +'</a></p>';

						// Insert the photo into the secondary container
						document.getElementById('text-secondary-container').innerHTML = html;
					}

					// Display the secondary container
					document.getElementById('text-main-container').style.display = 'none';
					document.getElementById('text-secondary-container').style.display = 'block';

					// Update the title
					$('.text-header-h1').html($GenreUnivers_TextBox.title +' &raquo; '+ data.getElementsByTagName('title')[0].childNodes[0].nodeValue);

					// Re-center!
					$GenreUnivers_TextBox.reCenter();

				// Texts
				} else if (type === 'RaaStofTekst') {
					// Prepare the HTML-structure
					var html = '';

					// Load title and by-lines
					var title = data.getElementsByTagName('title')[0].childNodes[0].nodeValue;
					var byline1 = data.getElementsByTagName('byline1')[0].childNodes[0].nodeValue;
					var byline2 = data.getElementsByTagName('byline2')[0].childNodes[0].nodeValue;

					// Append to the HTML-structure
					if (title) { html += '<div style="font-size:2em; line-height:1.25em; font-weight:bold; margin-bottom:1.25em; text-align:left;">'+ title +'</div>'; }
					if (byline1) { html += '<div style="margin-top:-2.0em; margin-bottom:1.25em;">'+ byline1 +'</div>'; }
					if (byline2) { html += '<div style="margin-top:-1.25em; margin-bottom:1.25em;">'+ byline2 +'</div>'; }

					// Append text to the HTML structure
					html += data.getElementsByTagName('text')[0].childNodes[0].nodeValue;

					// Load footer
					var footer = data.getElementsByTagName('footer')[0].childNodes[0].nodeValue;

					// Append footer to the HTML-structure
					if (footer) { html += '<div style="margin-top:1.25em; font-style:italic;">'+ footer +'</div>'; }

					// Associate MP3-file with the reading-box?
					var file = (data.getElementsByTagName('file')[0] && data.getElementsByTagName('file')[0].childNodes[0].nodeValue) || null;

					// Insert text into the reading-box
					$ReadingBox.open(html, file);

					// Clean up memory
					html = null;

				// Download
				} else if (type === 'RaaStofDownload') {
					window.open(data.getElementsByTagName('file')[0].childNodes[0].nodeValue);
				}

				// Reset the load-throbber
				trigger.style.background = bg;
			},
			error : function() {
				// Alert the user
				alert(_('Der opstod en fejl, da systemet forsøgte at indlæse data. Vi beklager fejlen, prøv venligst igen.'));

				// Close the reading-box
				$ReadingBox.close();
			}
		});
	},

	/**
	 * This function displays a photo inside the text-box, if the user clicks a
	 * photo-link.
	 */
	displayPhoto : function(title, url) {
		// Display the secondary container
		document.getElementById('text-main-container').style.display = 'none';
		document.getElementById('text-secondary-container').style.display = 'block';

		// Insert the photo into the secondary container
		document.getElementById('text-secondary-container').innerHTML = '<div class="text-photo text-photo-preloader"><img class="text-photo-img" src="'+ url +'" alt="" title="'+ _('Klik på billedet for at gå tilbage til {%title}', {title: this.title.replace(/\"/g, '&#34;')}) +'" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onload="this.parentNode.className = \'text-photo\'; this.style.display = \'block\'; $GenreUnivers_TextBox.reCenter();" /></div><a class="text-back" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }">&laquo; '+ _('Gå tilbage til {%title}', {title: this.title}) +'</a>';

		// Update the title
		$('.text-header-h1').html(this.title +' &raquo; '+ title);

		// Re-center!
		this.reCenter();
	},

	/**
	 * This function displays a photo inside the text-box, if the user clicks a
	 * photo-link.
	 */
	displayVideo : function(title, url) {
		// Insert the photo into the secondary container
		document.getElementById('text-secondary-container').innerHTML = '<div class="text-video"><a class="text-video-container" id="text-video" href="'+ url +'"></a></div><a class="text-back" href="javascript:;" ontouchend="if ($GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }" onclick="if (!$GenreUnivers.supports.touch) { $GenreUnivers_TextBox.goBack(); }">&laquo; '+ _('Gå tilbage til {%title}', {title: this.title}) +'</a>';
		flowplayer('text-video', 'flowplayer/flowplayer-3.2.7.swf', {clip: {autoPlay: true}}).ipad();

		// Display the secondary container
		document.getElementById('text-main-container').style.display = 'none';
		document.getElementById('text-secondary-container').style.display = 'block';

		// Update the title
		$('.text-header-h1').html(this.title +' &raquo; '+ title);

		// Re-center!
		this.reCenter();
	},

	/**
	 * This function opens the reading-box and then loads the contents to
	 * display via AJAX, using a PHP-proxy.
	 */
	displayText : function(url) {
		// Display the reading box with a loading-message
		$ReadingBox.open('Indlæser tekst, vent venligst...');

		// Load the contents of the file using AJAX
		$.ajax('scripts/proxy.php?url='+ encodeURIComponent(url), {
			dataType: 'xml',
			success : function(data) {
				// Prepare the HTML-structure
				var html = '';

				// Load title and by-lines
				var title = data.getElementsByTagName('title')[0].childNodes[0].nodeValue;
				var byline1 = data.getElementsByTagName('byline1')[0].childNodes[0].nodeValue;
				var byline2 = data.getElementsByTagName('byline2')[0].childNodes[0].nodeValue;

				// Append to the HTML-structure
				if (title) { html += '<div style="font-size:2em; line-height:1.25em; font-weight:bold; margin-bottom:1.25em; text-align:left;">'+ title +'</div>'; }
				if (byline1) { html += '<div style="margin-top:-2em; margin-bottom:1.25em;">'+ byline1 +'</div>'; }
				if (byline2) { html += '<div style="margin-top:-1.25em; margin-bottom:1.25em;">'+ byline2 +'</div>'; }

				// Append text to the HTML structure
				html += data.getElementsByTagName('text')[0].childNodes[0].nodeValue;

				// Load footer
				var footer = data.getElementsByTagName('footer')[0].childNodes[0].nodeValue;

				// Append footer to the HTML-structure
				if (footer) { html += '<div style="margin-top:1.25em; font-style:italic;">'+ footer +'</div>'; }

				// Insert text into the reading-box
				$ReadingBox.open(html);

				// Clean up memory
				html = null;
			},
			error : function() {
				// Alert the user
				alert(_('Der opstod en fejl, da systemet forsøgte at indlæse teksten. Vi beklager fejlen, prøv venligst igen.'));

				// Close the reading-box
				$ReadingBox.close();
			}
		});
	},

	/**
	 * This function navigates back to the main text-container, when the user
	 * clicks the back-link.
	 */
	goBack : function() {
		// Display the main container
		document.getElementById('text-secondary-container').style.display = 'none';
		document.getElementById('text-main-container').style.display = 'block';

		// Update the title
		$('.text-header-h1').html(this.title);

		// Re-center!
		this.reCenter();
	},

	/**
	 * This function re-centers the lightbox on the y-axis, after the contents
	 * has changed.
	 */
	reCenter : function() {
		// Create a reference to the lightbox
		var container = $('.master-text');

		// Center the container on the y-axis
		container.css({top : Math.round((610 - container.height()) / 2) +'px'});

		// Clean up memory
		container = null;
	}
};