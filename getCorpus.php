<?php
 if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
			$root = "/opt/lampp/htdocs/grew/";
		}else{
			$root = "/data/semagramme/www/grew/";
		}

	$dir = $root . "corpora/";
	
	$corpora = array_diff(scandir($dir),array("..",".","list",".svn"));

	$html = '<select id="corpus-select">';
	$i = true;
	foreach ($corpora as $corpus) {
		if ($i) {
			$html .= '<option value ="' . $corpus . '" selected>' . $corpus . '</option>';
			$i = false;
		}else{
			$html .= '<option value ="' . $corpus . '">' . $corpus . '</option>'; 
		}
		

	}
	$html .= '</select>';

	$listCorpus = $dir . 'list';
	$corpusFile = fopen($listCorpus,"w");
	fwrite($corpusFile, $html);
	fclose($corpusFile);
?>