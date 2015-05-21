<?php

if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
	$dir = "/Users/guillaum/forge/semagramme/grew_web/data/";
}else{
	$dir =  "/data/semagramme/www/grew/data/";
}
if (isset($_POST['pattern'])) {
	session_start();

	$hFile = "data/log";
	$historyFile = fopen($hFile,"a");
	fwrite($historyFile, date("d-m-Y H:i" ) . "|" . $_POST['corpus'] . "=>" . $_POST['pattern'] . "\n<+>\n");
	fclose($historyFile);

	// Création du dossier de données et écriture du pattern dans le dossier correspondant
	$id = uniqid();
	$old = umask(0);
	mkdir($dir . $id,0777);
	umask($old);
	$pattern = fopen($dir . $id . "/pattern","w");
	fwrite($pattern, $_POST['pattern']);
	fclose($pattern);

	$portFile = $dir . "../corpora/" . $_POST['corpus'] . "/port";
	$handlePort = fopen($portFile, "r");
	$port = fread($handlePort, filesize($portFile));
	fclose($handlePort);


	// Communication avec l'application via le port $port
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
		fwrite($client, $dir . $id . "#NEW");
		$result = stream_get_contents($client);
		fclose($client);
	}

	error_reporting(E_ALL & ~E_NOTICE);
	echo $id;
}elseif (isset($_POST['id'])) {
	if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
	$dir = "/Users/guillaum/forge/semagramme/grew_web/data/";
	}else{
		$dir = "/data/semagramme/www/grew/data/";
	}
	$addr = gethostbyname("localhost");

	$portFile = $dir . "../corpora/" . $_POST['corpus'] . "/port";
	$handlePort = fopen($portFile, "r");
	$port = fread($handlePort, filesize($portFile));
	fclose($handlePort);

	error_reporting(0);
	$client = stream_socket_client("tcp://$addr:$port", $errno, $errorMessage);

	if ($client === false) {
		$list = fopen($dir . $id . "/list","w");
		fwrite($list, "<!>");
		fclose($list);

		$error = fopen($dir . $id . "/error","w");
		fwrite($error, "Grew daemon is not running on the server at the moment.");
		fclose($error);
		demonDown($_POST['corpus'],$_POST['id']);
	}else{
		fwrite($client, $dir . $_POST['id'] . "#NEXT");
		$result = stream_get_contents($client);
		fclose($client);
	}
	error_reporting(E_ALL & ~E_NOTICE);


	echo false;
}

function demonDown($corpus,$idReq){
	$mail = "bruno.guillaume@inria.fr";
    $sujet = $corpus . " not running";

    $boundary = "-----=".md5(rand());
    $passage_ligne = "\n";
    $header = "From: \"Grew\"<grew@inria.fr>".$passage_ligne;
    $header .= "Reply-to: \"Antoine Chemardin\"<antoine.chemardin@inria.fr>".$passage_ligne;
    $header .= "MIME-Version: 1.0".$passage_ligne;
    $header .= "Content-Type: multipart/alternative;".$passage_ligne." boundary=\"$boundary\"".$passage_ligne;

    $message_txt = "Bonjour Bruno," .$passage_ligne;
    $message_txt .= "Un utilisateur a essayé de faire une requête Grew sur le corpus " . $corpus . "." .$passage_ligne;
    $message_txt .= "Sa requête a l'ID suivante : " . $idReq . " ." .$passage_ligne;
    $message_txt .= "Le deamon correspondant à ce corpus n'est pas en train de tourner sur le serveur ." .$passage_ligne;
    //=====Création du message.
    $message = $passage_ligne."--".$boundary.$passage_ligne;
    //=====Ajout du message au format texte.
    $message.= "Content-Type: text/plain; charset=\"ISO-8859-1\"".$passage_ligne;
    $message.= "Content-Transfer-Encoding: 8bit".$passage_ligne;
    $message.= $passage_ligne.$message_txt.$passage_ligne;
	//==========
    $message.= $passage_ligne."--".$boundary."--".$passage_ligne;
    $message.= $passage_ligne."--".$boundary."--".$passage_ligne;
	//==========
 
	//=====Envoi de l'e-mail.
    mail($mail,$sujet,$message,$header);
}
?>