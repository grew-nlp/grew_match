<?php

$dir = "@DATADIR@";

if (isset($_POST['pattern'])) {
	// update the log file
	$hFile = "data/log";
	$historyFile = fopen($hFile,"a");
	fwrite($historyFile, date("d-m-Y H:i" ) . "|" . $_POST['corpus'] . "=>" . $_POST['pattern'] . "\n<+>\n");
	fclose($historyFile);

	// create a new folder and write the pattern file in it
	$id = uniqid();
	$old = umask(0);
	mkdir($dir . $id,0777);
	umask($old);
	$pattern = fopen($dir . $id . "/pattern","w");
	fwrite($pattern, $_POST['pattern']);
	fclose($pattern);

	$infos = fopen($dir . $id . "/infos","w");
	fwrite($infos, $_POST['corpus'] . "\n");
	fwrite($infos, $_POST['lemma'] . "\n");
	fwrite($infos, $_POST['upos'] . "\n");
	fwrite($infos, $_POST['xpos'] . "\n");
	fwrite($infos, $_POST['features'] . "\n");
	fwrite($infos, $_POST['conllu'] . "\n");
	fwrite($infos, $_POST['shuffle'] . "\n");
	fwrite($infos, $_POST['context'] . "\n");
	fclose($corpus);

	$msg = "#NEW";

}elseif (isset($_POST['id'])) {
// A previous session is available
	$id = $_POST['id'];
	$msg = "#NEXT";
}

$port=@PORT@;

// send request to the daemon
$addr = gethostbyname("localhost");
error_reporting(0);
$client = stream_socket_client("tcp://$addr:$port", $errno, $errorMessage);
if ($client === false) {
	$list = fopen($dir . $id . "/list","w");
	fwrite($list, "<!>");
	fclose($list);
	$error = fopen($dir . $id . "/error","w");
	fwrite($error, "Grew daemon is not running on the server at the moment.");
	fclose($error);
	demonDown($_POST['corpus'],$id);
}else{
	fwrite($client, $dir . $id . $msg);
	$result = stream_get_contents($client,1);
	fclose($client);
}
error_reporting(E_ALL & ~E_NOTICE);
echo $id;


// Send an email if the daemon in not running
function demonDown($corpus,$idReq){
	$mail = "bruno.guillaume@inria.fr";
    $subject = "Grew-daemon is not running";

    $header  = "From: \"Grew\"<grew@inria.fr>\n";
    $header .= "MIME-Version: 1.0\n";
    $header .= "Content-Type: multipart/alternative;\n";

    $message  = "Corpus: " . $corpus ."\n";
    $message .= "Id_req: " . $idReq ."\n";
    $message .= "Hostname: " . gethostname() ."\n";

    mail($mail,$subject,$message,$header);
}
?>