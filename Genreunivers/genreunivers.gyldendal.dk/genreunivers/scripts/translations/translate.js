/**
 * I-bog translation utility.
 *
 * This utility is a lightweight translation utility, which is used along with
 * a locale-file containing the actual translations used in the app.
 *
 * Example of a locale-file:
 *
 * $IBOG_Translate.table = {
 *     'Hi, and welcome!' : 'Hej og velkommen!',
 *     'My name is {%name}' : 'Mit navn er {%name}'
 * };
 *
 * Once the locale-file has been loaded, a string can be translated using the
 * _() function. If a string is not found in the translation-table, the
 * original string is returned.
 *
 * Example of translations:
 *
 * alert(_('Hi, and welcome!')); -> Alerts "Hej og velkommen!"
 * alert(_('My name is {%name}', {name: 'Mads'})); -> Alerts "Mit navn er Mads"
 */

// Initialize an anonymous function in strict mode for better code validation
(function () {
	'use strict';

	// Create a JavaScript namespace
	window.$IBOG_Translate = {
		/**
		 * This variable will be used to contain translations of the words
		 * in question.
		 */
		table : {},

		/**
		 * Translates a string by looking it up in the translation-table, as
		 * specified in the locale-file. If the string is not found in the
		 * table, it is returned as is with no translation.
		 *
		 * After the string has been translated, the placeholders are replaced
		 * with the specified parameters.
		 */
		translate : function (str, params) {
			// Look up the string in the translation table
			if (window.$IBOG_Translate.table[str]) {
				str = window.$IBOG_Translate.table[str];
			}

			// Replace placeholders with the specified parameters
			if (params) {
				for (var key in params) { str = str.replace('{%' + key + '}', params[key]); }
			}

			// Remove any unspecified placeholders
			str = str.replace(/\{\%([^\}]*)\}/g, '');

			// Return the translated string
			return str;
		}
	};

	/**
	 * Add the _() function as a shortcut to the $IBOG_Translate.translate
	 * function.
	 */
	window._ = window.$IBOG_Translate.translate;

})();