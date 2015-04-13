<?php

if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
      $dire = "/Users/guillaum/forge/semagramme/grew_web/data/";
    }else{
      $dire =  "/data/semagramme/www/grew/data/";
    }

if (isset($_POST['pattern'])) {
	$alphabet = '23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ-_';
    $base = 51; // strlen(self::ALPHABET)
  	$str = '';

  	$num = count(scandir($dire)) - 1 ;
    while ($num > 0) {
        $str = substr($alphabet, ($num % $base), 1) . $str;
        $num = floor($num / $base);
    }
    $shorten = fopen($dire . $str ,"w");
	fwrite($shorten, $_POST['pattern']);
	fclose($shorten);

    echo $str;
}
?>