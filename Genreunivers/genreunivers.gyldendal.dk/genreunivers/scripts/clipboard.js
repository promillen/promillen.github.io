/**
 * Rocket JavaScript Framework Plugin - Clipboard Handling
 *
 * This plugins allows easily creating a copy-to-clipboard button utilizing the
 * ZeroClipboard-script (see external/zeroclipboard.js).
 *
 * Simply create a new instance of $GU_Clipboard and set the text to copy to the
 * clipboard upon click. For example:
 *
 * new $GU_Clipboard('id_of_button_container', 'id_of_button', 'textToCopy');
 *
 * The button-container must be relatively positioned in order for the Zero-
 * Clipboard-script to work as expexted.
 *
 * @version			1.0
 * @package			Rocket Framework
 * @subpackage		JavaScript Framework
 * @author			Kasper Neist Christjansen <kasper@solvationlab.dk>
 * @author			Mads Felskov Agersten <mads@solvationlab.dk>
 * @copyright		2010+ Solvation Lab <http://www.solvationlab.com/>
 */

$GU_Clipboard_timer = null;

/**
 * This function creates a new instance of the Clipboard Handler, allowing
 * copying to the clipboard. The handler is based either on clipboardData (if
 * supported) or the ZeroClipboard-Client, and is associated with an HTML
 * button-element that copies a static text to the clipboard on click.
 *
 * @param string container_id The ID of the container element. 
 * @param string button_id The ID of the actual button-element.
 * @param string text The text to copy to the clipboard (this can be altered
 * later by using the setText-method).
 *
 * @version		1.0
 * @author		Mads Felskov Agersten <mads@solvationlab.dk>
 * @access		public
 */
$GU_Clipboard = function(container_id, button_id, text) {
	// In Internet Explorer, we can rely safely on window.clipboardData
    if (window.clipboardData) {
		// Create a reference to the button
		var button = document.getElementById(button_id);

		// Create a reference to the clipboard-handler
		if (!button.Rocket) { button.Rocket = {}; }
		button.Rocket.Clipboard = this;

		// Attach an onclick-handler to the button
		if (document.attachEvent) { button.attachEvent('onclick', $GU_Clipboard.prototype.onClick); }
		else { button.addEventListener('click', $GU_Clipboard.prototype.onClick, false); }

		// Clean up memory
		button = null;

	// In other browsers
    } else {
		// Create a new clipboard-handler
		this.clip = new ZeroClipboard.Client();
		this.clip.lineback = this;

		// Insert the clipboard-handler in the DOM
		this.clip.glue(button_id, container_id);

		// Handle the onCopy-event
		this.clip.addEventListener('complete', function (client, text) {
			// Update button label
			clearTimeout($GU_Clipboard_timer);
			document.getElementById('copy_button').innerHTML = _('Teksten er nu kopieret');
			$GU_Clipboard_timer = setTimeout(function() { document.getElementById('copy_button').innerHTML = _('Kopier tekst'); }, 3500);

			// Execute callback
			client.lineback.onCopy && client.lineback.onCopy(text);
		});
	}

	// Set the text to copy
	this.setText(text);
}

/**
 * Registers that a process of a given type has ended, and removes it from
 * the list of currently running processes. This function must be executed
 * manually!
 *
 * @param string type A description of the process-type (fx animation or
 * tracking).
 *
 * @version		1.0
 * @author		Mads Felskov Agersten <mads@solvationlab.dk>
 * @access		public
 */
$GU_Clipboard.prototype.setText = function(value) {
	// Set ZeroClipboard text
	this.clip && this.clip.setText(value);

	// Set the text in clients that support the window.clipBoard-property (IE)
	this.text = value;
}

/**
 * This function is automatically executed, when the button is clicked in
 * browsers that support the window.clipboardData-property (IE), and adds the
 * text to the clipboard.
 *
 * @param object e Contains information about the users input.
 *
 * @version		1.0
 * @author		Mads Felskov Agersten <mads@solvationlab.dk>
 * @access		public
 */
$GU_Clipboard.prototype.onClick = function(e) {
	// Create a reference to the clicked button
	var e = e || window.event;
	var src = e.srcElement || e.target;

	// Line back to the client
	while (src && !src.Rocket && !src.Rocket.Clipboard) { src = src.parentNode; }
	if (!src) { return; }

	// Add the data to the clipboard
	var tmp = document.createElement('textarea');
	tmp.value = src.Rocket.Clipboard.text;
	textRange = tmp.createTextRange();
	textRange.execCommand("RemoveFormat");
	textRange.execCommand("Copy");

	// Execute the onCopy-event
	try { src.Rocket.Clipboard.onCopy && src.Rocket.Clipboard.onCopy(); } catch(e) {}

	// Update button label
	clearTimeout($GU_Clipboard_timer);
	document.getElementById('copy_button').innerHTML = _('Teksten er nu kopieret');
	$GU_Clipboard_timer = setTimeout(function() { document.getElementById('copy_button').innerHTML = _('Kopier tekst'); }, 3500);

	// Clean up memory
	src = null;
	e = null;
}