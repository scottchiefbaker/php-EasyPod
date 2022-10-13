function pause() {
	var playb  = qsa("#play-icon")[0];
	var pauseb = qsa("#pause-icon")[0];

	playb.classList.remove('d-none');
	pauseb.classList.add('d-none');

	qsa("#audio")[0].pause();

	clearInterval(update_interval);
}

var update_interval = 0;
function play() {
	var playb  = qsa("#play-icon")[0];
	var pauseb = qsa("#pause-icon")[0];

	pauseb.classList.remove('d-none');
	playb.classList.add('d-none');

	qsa("#audio")[0].play();

	if (!update_interval) {
		update_interval = setInterval(update_ui, 500);
	}
}

function seek(event) {
	var offsetl = event.target.offsetLeft;
	var clickl  = event.clientX;

	var total = qsa('#progress-bar')[0].clientWidth;
	var start = clickl - offsetl;

	var totald = qsa("#audio")[0].duration;
	var seekp  = (start / total);

	set_bar(seekp * 100);

	qsa("#audio")[0].currentTime = seekp * totald;

	update_ui();
	play();
}

function set_bar(percent) {
	//console.log("Setting bar to %s", percent);
	qsa('#duration-bar')[0].style.width = percent + "%";
}

function set_text(mystr) {
	//console.log("Setting text to '%s'", mystr);
	qsa('#text-status')[0].innerHTML = mystr;
}

function get_playing_info() {
	elem = qsa("#audio")[0];

	var cur = elem.currentTime;
	var tot = elem.duration ?? 0;
	var per = (cur / tot) * 100;

	var ret = [cur, tot, per];

	return ret;
}

function update_ui(mystatus, mypercent) {
	//console.log("UPDATE UI");

	var x = get_playing_info();
	var cur = parseInt(x[0] / 60);
	var tot = parseInt(x[1] / 60);
	var per = x[2];

	set_bar(per);
	set_text(cur + "m / " + tot + "m");
}

function qsa(sel) {
	var ret = document.querySelectorAll(sel);

	return ret;
}

function init_new_audio() {
	// Hide the HTML5 audio
	qsa("#audio")[0].classList.add('d-none');
	// Show our new audio
	qsa("#new_audio")[0].classList.remove('d-none');
}
