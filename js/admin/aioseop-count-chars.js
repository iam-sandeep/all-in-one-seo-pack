/**
 * Counts characters of the title and description fields.
 *
 * @since 2.9.2
 * @since 3.2.0 Moved to its own file.
 * @since 3.3.0 Full refactoring.
 */

$(function () { // eslint-disable-line max-statements

	"use strict";

	let isGutenberg;
	let autogenerateDescriptions;
	let extraTitleLength;
	let pluginDirName;
	let currentPage;
	let inputField;
	let counterField;
	let fieldSize;
	let timeout = 0;

	if ('undefined' !== typeof aioseopCharacterCounter) {
		isGutenberg              = aioseopCharacterCounter.isGutenberg;
		autogenerateDescriptions = aioseopCharacterCounter.autogenerateDescriptions;
		extraTitleLength         = +aioseopCharacterCounter.extraTitleLength;
		pluginDirName            = aioseopCharacterCounter.pluginDirName;
		currentPage              = aioseopCharacterCounter.currentPage;
	}
	else if ('undefined' !== typeof aioseopOGCharacterCounter) {
		pluginDirName = aioseopOGCharacterCounter.pluginDirName;
		currentPage   = aioseopOGCharacterCounter.currentPage;
	}
	aioseopAddEventListeners();
	// Fire once on page load.
	aioseopCountChars();

	/**
	 * Adds the relevant event listeners.
	 *
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopAddEventListeners() {
		aioseopAddGeneralListener();

		if (!aioseopIsEditPage()) {
			return;
		}

		if ('false' === isGutenberg) {
			aioseopAddClassicEditorListener();
		} else {
			aioseopAddGutenbergEditorListener();
		}
	}

	/**
	 * Adds the general/shared events listeners.
	 * 
	 * @since 3.3.0
	 *	
	 * @return void
	 */
	function aioseopAddGeneralListener() {
		$('.aioseop_count_chars').on('keyup', function () {
			aioseopCountChars();
		});
	}

	/**
	 * Adds the event listeners for the Classic Editor.
	 * 
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopAddClassicEditorListener() {
		setTimeout(function () {
			tinymce.editors[0].on('KeyUp', function () {
				aioseopCountChars();
			});
		}, 1000);

		$('#title, #excerpt').on('keyup', function () {
			aioseopCountChars();
		});
	}

	/**
	 * Adds the event listener for the Gutenberg Editor.
	 * 
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopAddGutenbergEditorListener() {
		window._wpLoadBlockEditor.then(function () {
			setTimeout(function () {
				// https://developer.wordpress.org/block-editor/packages/packages-data/
				wp.data.subscribe(function () {
					clearTimeout(timeout);
					timeout = setTimeout(function () {
						aioseopCountChars();
					}, 200);
				});
			});
		});
	}

	/**
	 * Get the character count for all fields on the Edit page.
	 * 
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopCountChars() {
		let countCharsFields;
		switch (currentPage) {
			case 'toplevel_page_all-in-one-seo-packp/aioseop_class':
			case 'aiosp_opengraph_description': {
				countCharsFields = [
					aioseopDefineTitleField,
					aioseopDefineDescriptionField
				];
				break;
			}
			default: {
				countCharsFields = [
					aioseopDefineTitleField,
					aioseopDefineDescriptionField,
					aioseopDefineOGTitleField,
					aioseopDefineOGDescriptionField
				];
				break;
			}
		}

		countCharsFields.forEach(function (defineField) {
			defineField();
			aioseopCountCharsHelper();
		});
	}

	/**
	 * Counts the characters of a certain field and shows this on the front-end.
	 * 
	 * @since 3.3.0
	 *
	 * @return void
	 */
	function aioseopCountCharsHelper() {
		let extra = 0;

		if ('undefined' !== typeof inputField.attr('size')) {
			fieldSize = +inputField.attr('size');
		} else {
			fieldSize = +inputField.attr('rows') * +inputField.attr('cols');
		}

		if (('aiosp_title' === inputField.attr('name')) && ('undefined' !== typeof extraTitleLength)) {
			extra = extraTitleLength;
		}

		if (0 === +inputField.length) {
			aioseopChangeCountBackground();
			return;
		}

		counterField.val(+inputField.val().length + extra);

		aioseopCheckIfAutogenerated();
		aioseopChangeCountBackground();
	}

	/**
	 * Checks if the title or description is autogenerated and, if so, counts the characters of the preview snippet.
	 * 
	 * @since 3.3.0
	 */
	function aioseopCheckIfAutogenerated() {
		if (
			(!aioseopIsEditPage()) ||
			(('on' !== autogenerateDescriptions) && ('aiosp_description' === inputField.attr('name'))) ||
			(('on' !== autogenerateDescriptions) && ('aioseop_opengraph_settings_desc' === inputField.attr('name'))) ||
			0 !== +inputField.val().length
		) {
			return;
		}

		let descriptionField;
		switch (inputField.attr('name')) {
			case 'aiosp_title':
			case 'aioseop_opengraph_settings_title':
				counterField.val(+$('#aiosp_snippet_title').parent()[0].innerText.length);
				break;
			default:
				descriptionField = $('[name=aiosp_description]')[0].placeholder;
				counterField.val(+descriptionField.length);
				if (' ...' === descriptionField.slice(descriptionField.length - 4)) {
					counterField.val(descriptionField.length - 4);
				}
				break;
		}
	}

	/**
	 * Changes the background colour of the character counter field based on the amount of characters.
	 * 
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopChangeCountBackground() {
		if (+counterField.val() > +fieldSize) {
			counterField.removeClass().addClass('aioseop_count_chars_past_treshold');
			return;
		}

		switch (inputField.attr('name')) {
			case 'aiosp_title':
			case 'aiosp_home_title':
				aioseopChangeCountBackgroundHelper(6);
				break;
			case 'aioseop_opengraph_settings_title':
			case 'aiosp_opengraph_hometitle':
				aioseopChangeCountBackgroundHelper(40);
				break;
			case 'aioseop_opengraph_settings_desc':
			case 'aiosp_opengraph_description':
				aioseopChangeCountBackgroundHelper(145);
				break;
			default:
				aioseopChangeCountBackgroundHelper(10);
				break;
		}
	}

	/**
	 * Helper function for aioseopChangeCountBackground().
	 * 
	 * @since 3.3.0
	 * 
	 * @param int characterTreshold The amount of characters that have to be deducted from the field size to set the treshold.
	 * @return void
	 */
	function aioseopChangeCountBackgroundHelper(characterTreshold) {
		if (+counterField.val() > (+fieldSize - +characterTreshold)) {
			counterField.removeClass().addClass('aioseop_count_chars_near_treshold');
		} else {
			counterField.removeClass().addClass('aioseop_count_chars_below_treshold');
		}
	}

	/**
	 * Sets the current input field and counter field based on the title field.
	 * 
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopDefineTitleField() {
		let titleField;
		switch (currentPage) {
			case 'toplevel_page_' + pluginDirName + '/aioseop_class': {
				titleField = 'aiosp_home_title';
				break;
			}
			case 'all-in-one-seo_page_aiosp_opengraph': {
				titleField = 'aiosp_opengraph_hometitle';
				break;
			}
			default: {
				titleField = 'aiosp_title';
				break;
			}
		}
		aioseopDefineFieldHelper(titleField);
	}

	/**
	 * Sets the current input field and counter field based on the Open Graph title field.
	 * 
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopDefineOGTitleField() {
		aioseopDefineFieldHelper('aioseop_opengraph_settings_title');
	}

	/**
	 * Sets the current input field and counter field based on the Open Graph description field.
	 * 
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopDefineOGDescriptionField() {
		let descriptionField;
		switch (currentPage) {
			case 'toplevel_page_' + pluginDirName + '/aioseop_class': {
				descriptionField = 'aiosp_home_description';
				break;
			}
			case 'all-in-one-seo_page_aiosp_opengraph': {
				descriptionField = 'aiosp_opengraph_description';
				break;
			}
			default: {
				descriptionField = 'aiosp_description';
				break;
			}
		}

		aioseopDefineFieldHelper(descriptionField);
	}

	/**
	 * Sets the current input field and counter field based on the description field.
	 * 
	 * @since 3.3.0
	 * 
	 * @return void
	 */
	function aioseopDefineDescriptionField() {
		aioseopDefineFieldHelper('aioseop_opengraph_settings_desc');
	}

	/**
	 * Helper function. Sets the current input field and counter field.
	 * 
	 * @since 3.3.0
	 * 
	 * @param string fieldName The name of the current field.
	 */
	function aioseopDefineFieldHelper(fieldName) {
		inputField = $('[name="' + fieldName + '"]');
		counterField = inputField.parent().find('[name="' + inputField.attr('data-length-field') + '"]');
	}

	/**
	 * Checks whether the current page is the Edit page.
	 * 
	 * @since 3.3.0
	 * 
	 * @return bool Whether the current page is the Edit page.
	 */
	function aioseopIsEditPage() {
		if (
			('post.php' !== currentPage) &&
			('post-new.php' !== currentPage) &&
			('term.php' !== currentPage)
		) {
			return false;
		}
		return true;
	}

});
