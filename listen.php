<?php

require('include/global.php');

////////////////////////////////////////////////////////////

$sluz = new sluz();
$ep   = new EasyPod();
$eps  = $ep->get_data();

$num   = $_GET['episode'] ?? 0;
$info  = $eps['episodes'][$num] ?? [];

$info = [];
foreach ($eps['episodes'] as $x) {
	$num_a = $x['number'];

	if ($num_a === $num) {
		$info = $x;
		break;
	}
}

if (!$info || ($x['is_future'] && empty($x['isComingSoon']))) {
	$ep->error_out("Unable to find episode $num", 19241);
}

$ut = strtotime($info['pubDate']);
$info['pubUnixtime'] = $ut;

unset($info['episodes']);

//kd($eps['global']);

$sluz->assign('ep', $info);
$sluz->assign('info', $eps['global']);

////////////////////////////////////////////////////////////

if (!empty($_GET['debug'])) {
	k($sluz->tpl_vars);
}
print $sluz->fetch();

////////////////////////////////////////////////////////

function get_data() {
	$eps = parse_ini_file("podcast.ini", true);

	foreach ($eps as $key => $data) {
		if (preg_match("/episode_(\d+)/", $key, $m)) {
			$num = intval($m[1]);

			$data['number'] = $num;

			$eps['episodes'][$num] = $data;
			unset($eps[$key]);
		}
	}

	return $eps;
}
