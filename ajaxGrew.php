<?php
	if (isset($_POST['pattern'])) {
		session_start();

		//Historique
		$hFile = "data/sessions/";
		$hFile .=  (string)session_id();
		$historyFile = fopen($hFile,"a");
		fwrite($historyFile, $_POST['pattern'] . "\n<+>\n");
		fclose($historyFile);

		//Création du dossier de données et écriture du pattern dans le dossier correspondant
		if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
			$dir = "/opt/lampp/htdocs/grew/data/";
		}else{
			$dir = "/data/semagramme/www/grew/data/";
		}
       
        
		$id = uniqid();
		$old = umask(0);
		mkdir($dir . $id,0777);
		umask($old);
		$pattern = fopen($dir . $id . "/pattern","w");
		fwrite($pattern, $_POST['pattern']);
		fclose($pattern);

		//Comunication avec l'application via le port 8080
		$addr = gethostbyname("localhost");
		$client = stream_socket_client("tcp://$addr:8181", $errno, $errorMessage);

		if ($client === false) {
    		throw new UnexpectedValueException("Failed to connect: $errorMessage");
		}

		fwrite($client, $dir . $id . "#NEW");
		$result = stream_get_contents($client);
		fclose($client);
		echo $id;
	}elseif (isset($_POST['id'])) {
        if (in_array($_SERVER["REMOTE_ADDR"],array("127.0.0.1","::1"))) {
			$dir = "/opt/lampp/htdocs/grew/data/";
		}else{
			$dir = "/data/semagramme/www/grew/data/";
		}
		$addr = gethostbyname("localhost");
		$client = stream_socket_client("tcp://$addr:8181", $errno, $errorMessage);

		if ($client === false) {
    		throw new UnexpectedValueException("Failed to connect: $errorMessage");
		}

		fwrite($client, $dir . $_POST['id'] . "#NEXT");
		$result = stream_get_contents($client);
		fclose($client);
		echo false;
	}
?>