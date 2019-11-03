<?php

$dir = "@DATADIR@";
$port = @PORT@;

$request = $_POST['request'];

if ($request == "NEW") {
	new_();
} elseif ($request == "NEXT") {
	next_();
} elseif ($request == "EXPORT") {
	export();
} elseif ($request == "SHORTEN") {
	shorten();
}

// ============================================================
// new request
function new_() {
	global $dir;

	log_request();

	// create a new folder and write the pattern file in it
	$id = uniqid();
	$old = umask(0);
	mkdir($dir . $id, 0777);
	umask($old);
	$pattern = fopen($dir . $id . "/pattern","w");
	fwrite($pattern, $_POST['pattern']);
	fclose($pattern);

	$infos = fopen($dir . $id . "/infos","w");
	fwrite($infos, json_encode ($_POST));
	fclose($infos);

	$msg = "#NEW";
	send($id, $msg);
}

// ============================================================
// next result or new cluster
function next_() {
	$id = $_POST['id'];
	$msg = "#NEXT#" . $_POST['cluster'];
	send($id, $msg);
}

// ============================================================
function export() {
	$id = $_POST['id'];
	$msg = "#EXPORT";
	send($id, $msg);
}

// ============================================================
function shorten() {
	global $dir;

	$shorten = fopen($dir . "/shorten/" .  $_POST['id'] ,"w");
	fwrite($shorten, $_POST['pattern']);
	fclose($shorten);

	echo $_POST['id'];
}


// ============================================================
// send the request to the daemon
function send($id, $msg) { // send request to the daemon
	global $port, $dir;
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
		$result = stream_get_contents($client,10);
		fclose($client);
	}
error_reporting(E_ALL & ~E_NOTICE);
echo ($id . "@@" . $result);
}

// ============================================================
// log new request
function log_request() {
	$log_file = fopen("data/log","a");
	fwrite($log_file, "---->" . $_POST['request']);
	if (isset($_POST['cluster'])) {
		fwrite($log_file, date("d-m-Y H:i" ) . "|" . $_POST['corpus'] . "=>" . $_POST['pattern'] . "\n<CLUSTER>".$_POST['cluster']."\n<+>\n");
	} else {
		fwrite($log_file, date("d-m-Y H:i" ) . "|" . $_POST['corpus'] . "=>" . $_POST['pattern'] . "\n<+>\n");
	}
	fclose($log_file);
}

// ============================================================
// Send an email if the daemon in not running
function demonDown($corpus,$idReq){
	$mail = "bruno.guillaume@inria.fr";
	$subject = "Grew-daemon is not running";

	$header = "From: \"Grew\"<grew@inria.fr>\n";
	$header .= "MIME-Version: 1.0\n";
	$header .= "Content-Type: multipart/alternative;\n";

	$message = "Corpus: " . $corpus ."\n";
	$message .= "Id_req: " . $idReq ."\n";
	$message .= "Hostname: " . gethostname() ."\n";

	mail($mail,$subject,$message,$header);
}
?>