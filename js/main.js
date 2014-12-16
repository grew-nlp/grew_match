var id = "";
var resultsNumber = 0;
var watcher = undefined;
var line = 0;
function request_pattern(){
	$('#results').show();
	//Reset de la liste 
	$('#submit-pattern').prop('disabled',true);
	$('#list-results').empty();
	$('#progress-txt').empty();
	$("#next-results").hide();
	resultsNumber = 0;

	$.ajax({url:'ajaxGrew.php',
		dataType:'text',
		data: {pattern: $('#pattern-input').val()},
		type: 'post',
		success: function(output){
			id = output;
			var file = "./data/" + id + "/list";

			var previous = "";

			watcher = setInterval(function() {
    			var ajax = new XMLHttpRequest();
    			ajax.onreadystatechange = function() {
        			if (ajax.readyState == 4) {
            			if (ajax.responseText != previous) {
            				var progression = 0;
           					var lines = ajax.responseText.split("\n");
           					line = 0;
							for (var i = resultsNumber,len = lines.length; i < len;i++) {
								line++;
								if (lines[i] == '<#>') {
									clearInterval(watcher);
									watcher = undefined;
									$('#submit-pattern').prop('disabled',false);
									i= lines.length;
									$("#next-results").hide();
									$('#progress-txt').text('100% du corpus parcourus');
								}else if (lines[i] == '<!>'){
									clearInterval(watcher);
									watcher = undefined;
									$.get('./data/' + id + '/error',function(errors){
										sweetAlert("Une erreur est survenue", errors, "error");
									});
									i= lines.length;
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").hide();
								}else if (lines[i] == '<?>'){
									progression = 1;
								}else if (progression == 1){
									clearInterval(watcher);
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").show();
									$('#progress-txt').text(lines[i] + '% du corpus parcourus');
									i = lines.length;
								}else{
									$("#list-results").append('<li id="list-' + i + '"><a href="#" >' +  lines[i] + '</a></li>');
									url = './data/' + id + '/' + lines[i];
									$('#list-' + i).click({url:url,i:i},display_picture);
									if (line == 1) {
										// alert(lines[i]);
										$('#result-pic').attr('data',url);
										$('#list-' + i).addClass('displayed');
									};
								}
							};
							resultsNumber = line;
                			previous = ajax.responseText;
            			}
        			}
    			};
    			ajax.open("POST", "./data/" + id + "/list", true); //Use POST to avoid caching
    			ajax.send();
			}, 1000);
		}
	});
}

function next_results(){
	//Reset de la liste 
	$('#submit-pattern').prop('disabled',true);
	$("#next-results").hide();

	$.ajax({url:'ajaxGrew.php',
		dataType:'text',
		data: {id: id},
		type: 'post',
		success: function(output){
			var file = "./data/" + id + "/list";

			var previous = "";

			watcher = setInterval(function() {
    			var ajax = new XMLHttpRequest();
    			ajax.onreadystatechange = function() {
        			if (ajax.readyState == 4) {
            			if (ajax.responseText != previous) {
            				var progression = 0;
           					var lines = ajax.responseText.split("\n");
           					
							for (var i = resultsNumber,len = lines.length; i < len;i++) {
								line++;
								if (lines[i] == '<#>') {
									clearInterval(watcher);
									watcher = undefined;
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").hide();
									i= lines.length;
									$('#progress-txt').text('100% du corpus parcourus');
								}else if (lines[i] == '<!>'){
									clearInterval(watcher);
									watcher = undefined;
									$.get('./data/' + id + '/error',function(errors){
										sweetAlert("Une erreur est survenue", errors, "error");
									});
									i= lines.length;
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").hide();
								}else if (lines[i] == '<?>'){
									progression = 1;
								}else if (progression == 1){
									clearInterval(watcher);
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").show();
									$('#progress-txt').text(lines[i] + '% du corpus parcourus');
									i = lines.length;
								}else{
									$("#list-results").append('<li id="list-' + i + '"><a href="#" >' +  lines[i] + '</a></li>');
									url = './data/' + id + '/' + lines[i];
									$('#list-' + i).click({url:url,i:i},display_picture);
								}
							};
							resultsNumber = line;
                			previous = ajax.responseText;
            			}
        			}
    			};
    			ajax.open("POST", "./data/" + id + "/list", true); //Use POST to avoid caching
    			ajax.send();
			}, 1000);
		}
	});
}

function display_picture(event){
	$('#result-pic').attr('data',event.data.url);
	$('#list-results li').removeClass('displayed');
	$('#list-' + event.data.i).addClass('displayed');
}