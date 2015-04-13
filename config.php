<?php
		if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
			define("DIR", "/Users/guillaum/forge/semagramme/grew_web/data/");
		}else{
			define("DIR", "/data/semagramme/www/grew/data/");
		}
?>