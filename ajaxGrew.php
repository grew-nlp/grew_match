<?php
	if (isset($_POST['pattern'])) {
		session_start();
		error_log(session_id());
		$historyFile = fopen("data/sessions/" + session_id(),"w");
		fwrite($historyFile, $_POST['pattern']); 
		fclose($historyFile);

		$dir = "data";
		$count = count(scandir($dir)) - 2;
		$id = $count + 1;


		mkdir("/tmp/777");
		$pattern = fopen("/tmp/777/pattern","w");
		fwrite($pattern, $_POST['pattern']); 
		fclose($pattern);
		//ligne d'execution
		$addr = gethostbyname("localhost");
		$client = stream_socket_client("tcp://$addr:8181", $errno, $errorMessage);

		if ($client === false) {
    		throw new UnexpectedValueException("Failed to connect: $errorMessage");
		}

		fwrite($client, "777#NEW");
		$result = stream_get_contents($client);
		fclose($client);
		echo $result;
	}
?>