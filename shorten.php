<?php
  $dir = "@DATADIR@/shorten/";

  if (isset($_POST['pattern'])) {
	  $alphabet = '23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ-_';
    $base = 51; // strlen(self::ALPHABET)
  	$str = '';

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