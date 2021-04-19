/**
 * Gyldendal GenreUnivers Galaxy Handler.
 *
 * This file handles all functionality associated with the galaxies in the
 * GenreUniverse, such as displaying info-boxes on hover.
 */

// Create a namespace for the plugin
$GenreUnivers_Galaxy = {
	/**
	 * This function is automatically executed, when the user moves the cursor
	 * over a galaxy-title, and displays the info-box associated with it.
	 */
	onMouseOver : function(trigger, galaxy_id) {
		// Make sure the system is ready!
		if (!$GenreUnivers.data) { return; }

		// Abort this function if another info-box is currently open
		if ($GenreUnivers_InfoBox.open || $GenreUnivers_Basket.open || $GenreUnivers_TextBox.open) { return; }

		// Read data about the galaxy
		var data = $GenreUnivers.data[galaxy_id];
		if (!data || !data.info || (!data.info.text && (!data.info.bullets || !data.info.bullets.length))) { return; }

		// Prepare the HTML-structure
		var html = '<div class="galaxy-info-top"></div>';

		// Display the header
		html += '<div class="galaxy-info-header">\
					'+ data.title +'\
				</div>';

		// Prepare the content-container
		html += '<div class="galaxy-info-contents">';

		// Output the teasers
		if (data.info.bullets && data.info.bullets.length) {
			html += '<ul class="galaxy-info-teasers">';

			for (var i = 0, j = data.info.bullets.length; i < j; i++) {
				html += '<li>'+ data.info.bullets[i] +'</li>';
			}

			html += '</ul>';
		}

		// Output text-description
		html += data.info.text;

		// Wrap up the HTML-structure
		html += '</div><img class="galaxy-info-arrow" src="layout/images/misc/blank.gif" alt=""/>';

		// Create the container and insert the HTML-structure
		var container = $('<div class="master-galaxy-info"/>').html(html).css({visibility: 'hidden'}).appendTo($('.master-container')); html = null;

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
			container.find('.galaxy-info-arrow').addClass('galaxy-info-arrow-left');

			// Position the info-box on the x-axis
			container.css({left : (x + trigger.offsetWidth + 10) +'px'});

		// ... Or to the left side?
		} else {
			// Add the CSS-class to the arrow
			container.find('.galaxy-info-arrow').addClass('galaxy-info-arrow-right');

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
			container.find('.galaxy-info-arrow').css({top: (y - (582 - container.height()) + Math.round((17 - 14) / 2)) +'px'});
		}

		// Display the info-box!
		container.css({visibility: 'visible'});

		// Clean up memory
		container = null;
	},

	/**
	 * This function is automatically executed, when the user moves the cursor
	 * away from a galaxy-title again, and hides the info-box associated with
	 * it.
	 */
	onMouseOut : function() {
		// Remove any currently displayed info-boxes from the DOM
		$('.master-galaxy-info').remove();
	}
};