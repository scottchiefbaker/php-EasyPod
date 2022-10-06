<?php

require('include/global.php');

////////////////////////////////////////////////////////////

$sluz = new sluz();
$ep   = new EasyPod();

$info = $ep->get_data();

if (!empty($_GET['rss'])) {
	header('Content-Type: text/xml; charset=utf-8');
	print $ep->get_rss_feed($info);
	exit;
}

$total = 0;

// Remove anything from the main index that is
// 1) In the future (not published yet)
// 2) Hidden
foreach ($info['episodes'] as $key => $val) {
	$hidden      = $val['hidden']       ?? 0;
	$future      = $val['is_future']    ?? 0;
	$coming_soon = $val['isComingSoon'] ?? 0;

	$remove = (!$coming_soon && ($hidden || $future));

	if ($remove) {
		unset($info['episodes'][$key]);
	}

	if (!$coming_soon && !$future) {
		$total++;
	}
}

$eps = $info['episodes'];
unset($info['episodes']);

$sluz->assign('eps', $eps);
$sluz->assign('info', $info['global']);
$sluz->assign('total', $total);

////////////////////////////////////////////////////////////

if (!empty($_GET['debug'])) {
	k($sluz->tpl_vars);
}

print $sluz->fetch();
