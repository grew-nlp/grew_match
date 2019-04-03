<?php
  $dir = "@DATADIR@";
  $port = @PORT@;

  if (isset($_POST['id']) ) {
		$id = $_POST['id'];
    $addr = gethostbyname("localhost");
	  error_reporting(0);
	  $client = stream_socket_client("tcp://$addr:$port", $errno, $errorMessage);
	  if ($client === false) {
	    demonDown($id);
	  }else{
	    fwrite($client, $dir . $id . "#EXPORT");
	    $result = stream_get_contents($client,1);
	    fclose($client);
	  }
	  error_reporting(E_ALL & ~E_NOTICE);
	  echo $id;
  }

// Send an email if the daemon in not running
function demonDown($idReq){
  $mail = "bruno.guillaume@inria.fr";
  $subject = "Grew-daemon is not running";

  $header  = "From: \"Grew\"<grew@inria.fr>\n";
  $header .= "MIME-Version: 1.0\n";
  $header .= "Content-Type: multipart/alternative;\n";

  $message .= "Id_req: " . $idReq ."\n";
  $message .= "Hostname: " . gethostname() ."\n";

  mail($mail,$subject,$message,$header);
}

?>