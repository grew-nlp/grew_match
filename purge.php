<?php
  $dir = "@DATADIR@";
  $folders = glob($dir ."*");
  $time = time();

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