<?php
  	if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
			$dir = "/opt/lampp/htdocs/grew/data/";
		}else{
			$dir = "/data/semagramme/www/grew/data/";
		}

  	$folders = glob($dir ."*");
    $time  = time();

  foreach ($folders as $folder){
    if (is_dir($folder)){
      if ($time - filemtime($folder) >= 60*60*24*7){ 
        $name = explode('/',$folder);
        echo $name[count($name) - 1];
        if ($name[count($name) - 1] != "sessions" && $name[count($name) -1 ] != "shorten") {
          foreach (scandir($folder) as $item) {
            if ($item == "." || $item == "..") {
              continue;
            }else{
              unlink($folder. "/" . $item);
            }
          }
          rmdir($folder); 
        }
      }  
    }
  }

?>