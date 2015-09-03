<?php
  $dir = "@DATADIR@/shorten/";

  if (isset($_POST['pattern']) && isset($_POST['id']) ) {
    $shorten = fopen($dir . $_POST['id'] ,"w");
	  fwrite($shorten, $_POST['pattern']);
	  fclose($shorten);

    echo $_POST['id'];
  }
?>