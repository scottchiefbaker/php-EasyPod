<?php

class EasyPod {
	public $version = 0.1;

	function __construct() {

	}

	function get_data($file = "podcast.ini") {
		if (!is_readable($file)) {
			$this->error_out("Unable to read '$file'", 34812);
		}

		$lines = file($file);

		$ret     = [];
		$section = "_";

		// Poor mans parse_ini() cuz the PHP one really sucks
		// 1. Doesn't let you have an "=" in the payload
		// 2. Doesn't let you have a ' in the payload
		while ($line = array_shift($lines)) {
			if (preg_match("/^\[(.+?)\]/", $line, $m)) { // Section heading
				$section = $m[1];
			} elseif (preg_match('/^(\w.*?)\s*=\s*(.*?)\s*$/', $line, $m)) { // Key/Value pair
				$key = $m[1];
				$val = $m[2];
				$ret[$section][$key] = $val;
			}
		}

		$cs_days_global = $ret['global']['comingSoonDays'] ?? 0;

		if (!empty($_GET['debug'])) {
			//$ret['global']['pubDate'] = date("Y-m-d");
		}

		$pod_url = $ret['global']['podcast_url'] ?? "";
		$pod_url = preg_replace("/\/$/", "", $pod_url);
		$ret['global']['rss_url'] = $pod_url . "/index.php?rss=true";

		$cat_str = $ret['global']['categories'] ?? "";
		$grps    = preg_split("/;/", $cat_str);

		// List of categories
		// https://www.podcastinsights.com/itunes-podcast-categories/
		$cats = [];
		foreach ($grps as $x) {
			$parts  = preg_split("/\//", $x);
			$parent = $parts[0] ?? "";
			$child  = $parts[1] ?? "";

			$cats[] = ['parent' => $parent, 'child' => $child];
		}

		$ret['global']['categories'] = $cats;

		// Pull out the episodes and rebuild them in to their own array
		foreach ($ret as $key => $data) {
			if (preg_match("/^episode\.(.+)/", $key, $m)) {
				$num            = $m[1];
				$data['number'] = $num;

				$data['pubDate']     = $ret['global']['pubDate'] ?? $data['pubDate'];
				$data['pubUnixtime'] = strtotime($data['pubDate']);
				$coming_soon_days    = $data['comingSoonDays'] ?? $cs_days_global ?? 0;

				// Figure out when we should show the coming soon alert
				$cs_ut = $data['pubUnixtime'] - $coming_soon_days * 86400;
				// It is comming soon if there are:
				// days specified
				// The coming soon time is in the past
				// The publication date is in the future
				$is_cs = $coming_soon_days && ($cs_ut < time()) && ($data['pubUnixtime'] > time());

				if ($is_cs) {
					$data['isComingSoon'] = $cs_ut;
				} else {
					$data['isComingSoon'] = false;
				}

				// It's "new" if it's within the last X days
				$is_new         = ($data['pubUnixtime'] > time() - (86400 * 5));
				$data['is_new'] = $is_new;

				if (empty($data['image'])) {
					$data['image'] = $ret['global']['image'] ?? "";
				}

				if (empty($data['link'])) {
					$data['link'] = "listen.php?episode=$num";
				}

				// Future if it's greater than right now (allows pre-publishing episodes)
				if ($data['pubUnixtime'] > time()) {
					$data['is_future'] = true;
				} else {
					$data['is_future'] = false;
				}

				$ret['episodes'][$num] = $data;
				unset($ret[$key]);
			}
		}

		// Sort the episodes by number
		usort($ret['episodes'], function($a, $b){
			$sort_field = "number";
			$order      = "desc";

			// Ascending
			if ($order === "asc") {
				return $a[$sort_field] <=> $b[$sort_field];
			// Descending
			} else {
				return $b[$sort_field] <=> $a[$sort_field];
			}
		});

		return $ret;
	}

	function get_data2() {
		$eps = parse_ini_file("podcast.ini", true);

		foreach ($eps as $key => $data) {
			if (preg_match("/^episode\.(.+)/", $key, $m)) {
				$num = intval($m[1]);

				$data['number'] = $num;

				$eps['episodes'][$num] = $data;
				unset($eps[$key]);
			}
		}

		return $eps;
	}

	// Validate RSS at: https://validator.w3.org/feed/
	function get_rss_feed($info) {
		global $sluz;

		// We massage the episode list a little before we spit it out as RSS
		$base_url = $info['global']['podcast_url'] ?? "";
		$eps      = $info['episodes'] ?? [];

		foreach ($eps as $key => $x) {
			$file = $eps[$key]['audioFile'] ?? "";

			// The audioFile directive can be a relative link: "content/ep1.mp3"
			// if so, we make it a FULL URL for the RSS feed
			if (!preg_match("/^https?:/", $file)) {
				$eps[$key]['audioFile'] = $base_url . $file;
			}

			// We remove any hidden/future episodes from the RSS feed
			$is_hidden = !empty($eps[$key]['hidden']);
			$is_future = !empty($eps[$key]['is_future']);

			if ($is_hidden || $is_future) {
				unset($info['episodes'][$key]);
			}
		}

		$sluz->assign($info);

		$vars = [];
		$ret  = $sluz->fetch("tpls/rss.stpl");

		if (!empty($_GET['debug'])) {
			kd($info);
		}

		return $ret;
	}

	public function error_out($msg, int $err_num) {
		$out = "<style>
			.s_error {
				font-family: sans;
				border: 1px solid;
				padding: 6px;
				border-radius: 4px;
				margin-bottom: 8px;
			}

			.s_error_head { margin-top: 0; }
			.s_error_num { margin-top: 1em; }
			.s_error_file {
				margin-top: 1em;
				padding-top: 0.5em;
				font-size: .8em;
				border-top: 1px solid;
			}

			.s_error code {
				padding: .2rem .4rem;
				font-size: 1.1em;
				color: #fff;
				background-color: #212529;
				border-radius: .2rem;
			}
		</style>";

		$d    = debug_backtrace();
		$file = $d[1]['file'] ?? "";
		$line = $d[1]['line'] ?? 0;

		$out .= "<div class=\"s_error\">\n";
		$out .= "<h1 class=\"s_error_head\">EasyPod Fatal Error</h1>";
		$out .= "<div class=\"s_error_desc\"><b>Description:</b> $msg</div>";
		$out .= "<div class=\"s_error_num\"><b>Number</b> #$err_num</div>";
		if ($file && $line) {
			$out .= "<div class=\"s_error_file\">Source: <code>$file</code> #$line</div>";
		}
		$out .= "</div>\n";

		print $out;

		exit;
	}
}
