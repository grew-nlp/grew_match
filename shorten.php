<?php
if (isset($_POST['pattern'])) {
	$alphabet = '23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ-_';
    $base = 51; // strlen(self::ALPHABET)
  	$str = '';
  	if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
			$dir = "/opt/lampp/htdocs/grew/data/shorten/";
		}else{
			$dir = "/data/semagramme/www/grew/data/shorten/";
		}
  	$num = count(scandir($dir)) - 1 ;
    while ($num > 0) {
        $str = substr($alphabet, ($num % $base), 1) . $str;
        $num = floor($num / $base);
    }
    $shorten = fopen($dir . $str ,"w");
	fwrite($shorten, $_POST['pattern']);
	fclose($shorten);

    echo $str;
}
?>