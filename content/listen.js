// ID for the setInterval() of the UI updating
var update_interval = 0;
// If this is zero the UI won't update while the audio is playing
var auto_ui_updates = 1;
// Used to reset the hover bar after a mouseleave
var cur_width = 0;

function use_html5_audio() {
	// Hide the HTML5 audio
	$("#audio").addClass('d-none');
	// Show our new audio
	$("#new_audio").removeClass('d-none');

	update_ui();
	init_bar_hover();
}

function init_bar_hover() {
	// Touch devices don't get the mouse hover events
	if (!is_touch_enabled()) {
		$("#progress-bar").hover(
			// When mouse enters we don't update the UI while playing
			function() {
				auto_ui_updates = 0;
				cur_width = $("#duration-bar").css('width');
				//console.log("Saving %s" , cur_width);
			},
			// When mouse leaves we re-enables UI updates
			function() {
				auto_ui_updates = 1;
				//console.log("Resetting %s" , cur_width);
				cur_width = $("#duration-bar").css('width', cur_width);
			},
		);

		// As the move slides over the bar update the line
		$("#progress-bar").mousemove(
			function(event) {
				var offsetl = event.target.offsetLeft;
				var clickl  = event.clientX;

				var total = $('#progress-bar').get(0).clientWidth;
				var start = clickl - offsetl;

				var totald = $("#audio").get(0).duration;
				var seekp  = (start / total);

				// Set the progress bar to where the cursor is
				set_bar(seekp * 100);

				// Get the duration
				var x   = get_player_status();
				var tot = x[1];

				// The time in seconds is the percentage of the total duration
				var cursor_pos = (seekp * tot);
				set_text(time_format(cursor_pos) + " / " + time_format(tot));
			},
		);
	}
}

function pause() {
	$("#play-icon").removeClass('d-none');
	$("#pause-icon").addClass('d-none');

	$("#audio").get(0).pause();

	// Stop the UI updating while we're paused
	clearInterval(update_interval);
}

function play() {
	$("#play-icon").addClass('d-none');
	$("#pause-icon").removeClass('d-none');

	$("#audio").get(0).play();

	// Start the auto-refresh of the display
	if (!update_interval) {
		update_interval = setInterval(update_ui, 500);
	}

	auto_ui_updates = 1;
}

// This is used to format the output for the text display under the duration bar
function time_format(seconds) {
	var orig = seconds;

	var hours = parseInt(seconds / 3600);
	seconds -= hours * 3600;

	var mins = parseInt(seconds / 60);
	seconds -= mins * 60;

	seconds = parseInt(seconds);

	// Hours have three octets
	if (orig > 3600) {
		var ret = sprintf("%s:%02s:%02s", hours, mins, seconds);
	// Everything else is just two octets
	} else {
		var ret = sprintf("%s:%02s", mins, seconds);
	}

	// Just simplify it to minutes
	//var ret = sprintf("%dm", orig / 60);

	return ret;
}

function seek(event) {
	var offsetl = event.target.offsetLeft;
	var clickl  = event.clientX;

	var total = $('#progress-bar').get(0).clientWidth;
	var start = clickl - offsetl;

	var totald = $("#audio").get(0).duration;
	var seekp  = (start / total);

	set_bar(seekp * 100);
	cur_width = $("#duration-bar").css('width');

	// Set the time on the audio tag to the seconds we calculated
	$("#audio").get(0).currentTime = seekp * totald;

	update_ui();
	play();
}

function set_bar(percent) {
	//console.log("Setting bar to %s", percent);
	$('#duration-bar').css('width', percent + "%");
}

function set_text(mystr) {
	//console.log("Setting text to '%s'", mystr);
	$("#text-status").html(mystr);
}

function get_player_status() {
	elem = $("#audio").get(0);

	var cur = elem.currentTime;
	var tot = elem.duration ?? 0;
	var per = (cur / tot) * 100;

	if (isNaN(tot)) {
		tot = 0;
	}

	var ret = [cur, tot, per];

	return ret;
}

function update_ui(mystatus, mypercent) {
	// UI updates are temporarily disabled
	if (!auto_ui_updates) { return null; }

	var x = get_player_status();
	var cur = x[0];
	var tot = x[1];
	var per = x[2];

	// The progress percentage
	set_bar(per);
	// The text display
	set_text(time_format(cur) + " / " + time_format(tot));
}

function is_touch_enabled() {
    return ( 'ontouchstart' in window ) ||
           ( navigator.maxTouchPoints > 0 ) ||
           ( navigator.msMaxTouchPoints > 0 );
}

///////////////////////////////////////////////////////////////////////////////////////

// From: https://locutus.io/php/strings/sprintf/
function sprintf () {
	const regex = /%%|%(?:(\d+)\$)?((?:[-+#0 ]|'[\s\S])*)(\d+)?(?:\.(\d*))?([\s\S])/g
	const args = arguments
	let i = 0
	const format = args[i++]
	const _pad = function (str, len, chr, leftJustify) {
		if (!chr) {
			chr = ' '
		}
		const padding = (str.length >= len) ? '' : new Array(1 + len - str.length >>> 0).join(chr)
		return leftJustify ? str + padding : padding + str
	}
	const justify = function (value, prefix, leftJustify, minWidth, padChar) {
		const diff = minWidth - value.length
		if (diff > 0) {
			// when padding with zeros
			// on the left side
			// keep sign (+ or -) in front
			if (!leftJustify && padChar === '0') {
				value = [
					value.slice(0, prefix.length),
					_pad('', diff, '0', true),
					value.slice(prefix.length)
				].join('')
			} else {
				value = _pad(value, minWidth, padChar, leftJustify)
			}
		}
		return value
	}
	const _formatBaseX = function (value, base, leftJustify, minWidth, precision, padChar) {
		// Note: casts negative numbers to positive ones
		const number = value >>> 0
		value = _pad(number.toString(base), precision || 0, '0', false)
		return justify(value, '', leftJustify, minWidth, padChar)
	}
	// _formatString()
	const _formatString = function (value, leftJustify, minWidth, precision, customPadChar) {
		if (precision !== null && precision !== undefined) {
			value = value.slice(0, precision)
		}
		return justify(value, '', leftJustify, minWidth, customPadChar)
	}
	// doFormat()
	const doFormat = function (substring, argIndex, modifiers, minWidth, precision, specifier) {
		let number, prefix, method, textTransform, value
		if (substring === '%%') {
			return '%'
		}
		// parse modifiers
		let padChar = ' ' // pad with spaces by default
		let leftJustify = false
		let positiveNumberPrefix = ''
		let j, l
		for (j = 0, l = modifiers.length; j < l; j++) {
			switch (modifiers.charAt(j)) {
				case ' ':
				case '0':
					padChar = modifiers.charAt(j)
					break
				case '+':
					positiveNumberPrefix = '+'
					break
				case '-':
					leftJustify = true
					break
				case "'":
					if (j + 1 < l) {
						padChar = modifiers.charAt(j + 1)
						j++
					}
					break
			}
		}
		if (!minWidth) {
			minWidth = 0
		} else {
			minWidth = +minWidth
		}
		if (!isFinite(minWidth)) {
			throw new Error('Width must be finite')
		}
		if (!precision) {
			precision = (specifier === 'd') ? 0 : 'fFeE'.indexOf(specifier) > -1 ? 6 : undefined
		} else {
			precision = +precision
		}
		if (argIndex && +argIndex === 0) {
			throw new Error('Argument number must be greater than zero')
		}
		if (argIndex && +argIndex >= args.length) {
			throw new Error('Too few arguments')
		}
		value = argIndex ? args[+argIndex] : args[i++]
		switch (specifier) {
			case '%':
				return '%'
			case 's':
				return _formatString(value + '', leftJustify, minWidth, precision, padChar)
			case 'c':
				return _formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, padChar)
			case 'b':
				return _formatBaseX(value, 2, leftJustify, minWidth, precision, padChar)
			case 'o':
				return _formatBaseX(value, 8, leftJustify, minWidth, precision, padChar)
			case 'x':
				return _formatBaseX(value, 16, leftJustify, minWidth, precision, padChar)
			case 'X':
				return _formatBaseX(value, 16, leftJustify, minWidth, precision, padChar)
					.toUpperCase()
			case 'u':
				return _formatBaseX(value, 10, leftJustify, minWidth, precision, padChar)
			case 'i':
			case 'd':
				number = +value || 0
				// Plain Math.round doesn't just truncate
				number = Math.round(number - number % 1)
				prefix = number < 0 ? '-' : positiveNumberPrefix
				value = prefix + _pad(String(Math.abs(number)), precision, '0', false)
				if (leftJustify && padChar === '0') {
					// can't right-pad 0s on integers
					padChar = ' '
				}
				return justify(value, prefix, leftJustify, minWidth, padChar)
			case 'e':
			case 'E':
			case 'f': // @todo: Should handle locales (as per setlocale)
			case 'F':
			case 'g':
			case 'G':
				number = +value
				prefix = number < 0 ? '-' : positiveNumberPrefix
				method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(specifier.toLowerCase())]
				textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(specifier) % 2]
				value = prefix + Math.abs(number)[method](precision)
				return justify(value, prefix, leftJustify, minWidth, padChar)[textTransform]()
			default:
				// unknown specifier, consume that char and return empty
				return ''
		}
	}
	try {
		return format.replace(regex, doFormat)
	} catch (err) {
		return false
	}
}
