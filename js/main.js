var id = "";
var resultsNumber = 0;
var watcher = undefined;
var line = 0;

$(function(){
	$(".interactive").click(function(){
		var content = $(this).attr('snippet');
		$("#pattern-input").val(content);
	});

	$.get( "./corpora/list", function( data ) {
 		$( ".navbar-header" ).append( data );
	});
});

function request_pattern(){
	$('#results').show();
	//Reset de la liste 
	$('#submit-pattern').prop('disabled',true);
	$('#list-results').empty();
	$('#progress-txt').empty();
	$('#progress-num').empty();
	$("#next-results").prop('disabled',true);
	$('#result-pic').removeAttr('data');
	resultsNumber = 0;

	$.ajax({url:'ajaxGrew.php',
		dataType:'text',
		data: {pattern: $('#pattern-input').val(),corpus:$("#corpus-select").val()},
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
									$("#next-results").prop('disabled',true);
									$('#progress-txt').text('100% du corpus parcourus :');
								}else if (lines[i] == '<!>'){
									clearInterval(watcher);
									watcher = undefined;
									$.get('./data/' + id + '/error',function(errors){
										sweetAlert("Une erreur est survenue", errors, "error");
									});
									i= lines.length;
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',true);
								}else if (lines[i] == '<?>'){
									progression = 1;
								}else if (progression == 1){
									clearInterval(watcher);
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',false);
									$('#progress-txt').text(lines[i] + '% du corpus parcourus :');
									i = lines.length;
								}else{
									var pieces = lines[i].split("@");
									$("#list-results").append('<li id="list-' + i + '"><a href="#" >' +  pieces[1] + '</a></li>');
									url = './data/' + id + '/' + pieces[0];
									$('#list-' + i).click({url:url,i:i,coord:pieces[2]},display_picture);
									if (line == 1) {
										$('#result-pic').attr('data',url);
										$('#list-' + i).addClass('displayed');
										$("#display-results").animate({scrollLeft:pieces[2] - 150},"fast");
									};
								}
							};
							resultsNumber = line;
                			previous = ajax.responseText;
                			$("#progress-num").text($("#list-results li").size() + " results");
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
	$("#next-results").prop('disabled',true);

	$.ajax({url:'ajaxGrew.php',
		dataType:'text',
		data: {id: id,corpus:$("#corpus-select").val()},
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
									$("#next-results").prop('disabled',true);
									i= lines.length;
									$('#progress-txt').text('100% du corpus parcourus :');
								}else if (lines[i] == '<!>'){
									clearInterval(watcher);
									watcher = undefined;
									$.get('./data/' + id + '/error',function(errors){
										sweetAlert("Une erreur est survenue", errors, "error");
									});
									i= lines.length;
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',true);
								}else if (lines[i] == '<?>'){
									progression = 1;
								}else if (progression == 1){
									clearInterval(watcher);
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',false);
									$('#progress-txt').text(lines[i] + '% du corpus parcourus :');
									i = lines.length;
								}else{
									var pieces = lines[i].split("@");
									$("#list-results").append('<li id="list-' + i + '"><a href="#" >' +  pieces[1] + '</a></li>');
									url = './data/' + id + '/' + pieces[0];
									$('#list-' + i).click({url:url,i:i,coord:pieces[2]},display_picture);
								}
							};
							resultsNumber = line;
                			previous = ajax.responseText;
                			$("#progress-num").text($("#list-results li").size() + " results");
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
	$("#display-results").animate({scrollLeft:event.data.coord - 150},"fast");
}