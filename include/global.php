<?php

require('include/sluz/sluz.class.php');
require('include/easy_pod/easy_pod.class.php');
require('include/krumo/class.krumo.php');
require('include/parsedown/Parsedown.php');

$parsedown = new Parsedown();

function format_date(int $ut) {
	$format = "F jS Y";

	$ret = date($format, $ut);

	return $ret;
}

function string_sanitize(string $str) {
	$str = strtolower($str);

	// Replace any non-word chars with underscores
	$str = preg_replace("/[\W_]+/", "_", $str);
	// Remove any leading/trailing underscores that are leftover
	$str = trim($str, "_");

	return $str;
}

function parsedown(string $str) {
	global $parsedown;

	$ret = $parsedown->text($str);

	return $ret;
}

function parsedown_line(string $str) {
	global $parsedown;

	$ret = $parsedown->line($str);

	return $ret;
}

function rfc_822_date($time_str) {
	$epoch = strtotime($time_str);
	$ret = date("D, d M Y g:i:s T", $epoch);

	return $ret;
}
