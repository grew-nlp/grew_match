var id = "";
var resultsNumber = 0;
var watcher = undefined;

function request_pattern(){
	$('#results').show();
	//Reset de la liste 
	$('#submit-pattern').prop('disabled',true);
	$('#list-results').empty();
	resultsNumber = 0;

	$.ajax({url:'ajaxGrew.php',
		dataType:'text',
		data: {pattern: $('#pattern-input').val()},
		type: 'post',
		success: function(output){
			id = output;
			id = 1;
			var file = "./data/" + id + "/list";

			var previous = "";

			watcher = setInterval(function() {
    			var ajax = new XMLHttpRequest();
    			ajax.onreadystatechange = function() {
        			if (ajax.readyState == 4) {
            			if (ajax.responseText != previous) {
           					var lines = ajax.responseText.split("\n");
							for (var i = resultsNumber,len = lines.length; i < len;i++) {
								
								if (lines[i] == '<#>') {
									clearInterval(watcher);
									watcher = undefined;
									$('#submit-pattern').prop('disabled',false);
									i= lines.length;
								}else{
									$("#list-results").append('<li id="list-' + i + '"><a href="#" >' +  lines[i] + '</a></li>');
									url = './data/' + id + '/' + lines[i];
									$('#list-' + i).click({url:url,i:i},display_picture);
								}
							};
							resultsNumber = lines.length;
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
	$('#result-pic').attr('src',event.data.url);
	$('#list-results li').removeClass('displayed');
	$('#list-' + event.data.i).addClass('displayed');
}