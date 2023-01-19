function draw_random_waveform(canvas_id, bg_color, active_color, percent_active, seed_str, opts = {}) {
	var verbose = opts.verbose ?? false;

	var start = Date.now();

	// Fetch the canvas and it's context
	var canvas    = document.getElementById(canvas_id);
	var my_parent = canvas.parentNode;
	var ctx       = canvas.getContext('2d');

	// Stretch the canvas to fill out the parent
	canvas.width  = my_parent.getBoundingClientRect().width;
	canvas.height = my_parent.getBoundingClientRect().height;

	// How wide are the graph lines, and what is the spacing
	var line_interval = opts.line_interval ?? 4;
	var line_width    = opts.line_width    ?? 2;

	// Scale the line widths a little if it's a narrow screen
	if (canvas.width < 700) {
		var line_interval = opts.narrow_line_interval ?? 3;
		var line_width    = opts.narrow_line_width    ?? 1;
	}

	// Clear any existing data on the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// The random wave form is unique to the width too (helps with resizing)
	seed_str += canvas.width.toString();

	// Setup the randomness so it's unique to each filename
	var seed = cyrb128(seed_str);
	var rand = mulberry32(seed[0]);

	var method = opts.method ?? "psuedo";

	// We init the "prev" as 50%
	var last = 0.5;
	for (i = 0; i < canvas.width / 1; i = i + line_interval) {

		// This is a TRULY random waveform
		if (method == "random") {
			var min  = 0.35;
			var max  = 0.85;
			var diff = max - min;

			// Get a random number between min and max
			level = rand() * diff + min;
			// This is the pseudo random looking waveform (default)
		} else {
			var rand_num  = rand();

			// Are we increasing or decreasing
			if (rand_num > 0.75) {
				multi = 1;
			} else {
				multi = -1;
			}
			var adjustment = multi * (rand_num / 18);
			var level      = last + adjustment;

			// If we get too high/low we reset
			if (level > 0.99) {
				level = 0.7;
			} else if (level < 0.01) {
				level = 0.3;
			}
		}

		// console.log("%d %d %d %d", i, last * 100, adjustment * 100, level * 100);

		var line_length    = level * canvas.height;
		var middle         = canvas.height / 2;
		var line_top_y     = middle + (line_length / 2);
		var line_bot_y     = middle - (line_length / 2);

		percent_active = parseFloat(percent_active) ?? 0;

		// Colorize the lines depending on how much is "complete"
		var percent_complete = (i / canvas.width) * 100;
		if (percent_complete >= percent_active) {
			line_color = bg_color;
		} else {
			line_color = active_color;
		}

		// Draw the vertical line for each X coordinate
		ctx.beginPath();
		ctx.moveTo(i, line_top_y);
		ctx.lineTo(i, line_bot_y);
		ctx.strokeStyle = line_color;
		ctx.lineWidth = line_width;
		ctx.stroke();

		// Store the "previous" level
		last = level;
	}

	if (verbose) {
		var total_ms = Date.now() - start;
		console.log("Drew fake waveform for %s in %d ms", seed_str, total_ms);
	}

	return total_ms;
}

// Borrowed from: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function cyrb128(str) {
	let h1 = 1779033703, h2 = 3144134277,
		h3 = 1013904242, h4 = 2773480762;
	for (let i = 0, k; i < str.length; i++) {
		k = str.charCodeAt(i);
		h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
		h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
		h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
		h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
	}
	h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
	h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
	h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
	h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
	return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

// Borrowed from: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function mulberry32(a) {
	return function() {
		var t = a += 0x6D2B79F5;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	}
}
