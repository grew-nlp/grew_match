var id = "";
var resultsNumber = 0;
var watcher = undefined;
var line = 0;
var cmEditor = undefined;
var lesson = 1;

$(function(){

	$.get( "./corpora/list", function( data ) {
 		$( "#corpus-select" ).append( data );
 		if (getParameterByName("corpus").length > 0 && getParameterByName("custom").length > 0) {
			$("#corpus-select").prop('selectedIndex',getParameterByName("corpus"));
			$.get('./data/shorten/' + getParameterByName("custom"),function(pattern){
				cmEditor.setValue(pattern);

			});
		};
		$.get( "./corpora/"+ $("#corpus-select").val() + "/doc.html", function( data ) {
			$('#corpus-select').after('<span href="" class="tooltip-desc" id="corpus-desc">?</span>');
			snippets_extract();
			$('.tooltip-desc').tooltipster({content:data,contentAsHTML:true,theme:'tooltipster-noir'});
		});

	});


      $("#scenario").load("lesson"+ lesson+".html");


	$('#corpus-select').change(function(){
		$('#custom-display').hide();
		$('#vision').hide();
		$.get( "./corpora/"+ $("#corpus-select").val() + "/doc.html", function( data ) {
			$('.tooltip-desc').tooltipster('content',data);
			snippets_extract();
		});

	});

	cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
    	lineNumbers: true,
  	});
    
});

function request_pattern(){
	$('#custom-display').hide();
	$('#vision').show();
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
		data: {pattern: cmEditor.getValue(),corpus:$("#corpus-select").val()},
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
									$('#progress-txt').text('100% of corpus browsed :');
								}else if (lines[i] == '<!>'){
									clearInterval(watcher);
									watcher = undefined;
									$.get('./data/' + id + '/error',function(errors){
										sweetAlert("An error occured", errors, "error");
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
									$('#progress-txt').text(lines[i] + '% of corpus browsed :');
									i = lines.length;
								}else{
									var pieces = lines[i].split("@");
									$("#list-results").append('<li id="list-' + i + '"><a href="#" >' +  pieces[1] + '</a></li>');
									url = './data/' + id + '/' + pieces[0];
									$('#list-' + i).click({url:url,i:i,coord:pieces[2]},display_picture);
									if (line == 1) {

										//$('#result-pic').attr('data',url);
										var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + url +"\" > </object>";
										document.getElementById('display-results').innerHTML = newHtml;

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
			}, 300);
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
									$('#progress-txt').text('100% of corpus browsed :');
								}else if (lines[i] == '<!>'){
									clearInterval(watcher);
									watcher = undefined;
									$.get('./data/' + id + '/error',function(errors){
										sweetAlert("An error occured", errors, "error");
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
									$('#progress-txt').text(lines[i] + '% of corpus browsed :');
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
			}, 300);
		}
	});
}

function display_picture(event){
//	$('#result-pic').attr('data',event.data.url);
	var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + event.data.url +"\" > </object>";
	document.getElementById('display-results').innerHTML = newHtml;

	$('#list-results li').removeClass('displayed');
	$('#list-' + event.data.i).addClass('displayed');
	$("#display-results").animate({scrollLeft:event.data.coord - 150},"fast");
}

function save_pattern(num){
	if (cmEditor.getValue().length > 0) {
		corpus = $("#corpus-select").prop('selectedIndex');
		$.ajax({url:'shorten.php',
			dataType:'text',
			data: {pattern: cmEditor.getValue()},
			type: 'post',
			success: function(output){
				history.pushState({id:output},"Grew - Custom saved pattern", "?custom=" + output + "&corpus=" + corpus);
				$('#custom-url').text(window.location.href);
				$('#custom-display').show();
				SelectText("custom-url");
			}
		});
	} else {
		sweetAlert("An error occured", "You can't save an empty pattern", "error");
	}
}

function SelectText(element) {
    var doc = document
        , text = doc.getElementById(element)
        , range, selection
    ;
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function snippets_extract(){
	$("#snippets ul").empty();
	$.get( './corpora/'+ $("#corpus-select").val() + '/snippets.json', function( data ) {

  		jsonSnippet = data;

  		$.each( jsonSnippet, function( key, val ) {
    		$("#snippets ul").append("<li><a class='interactive' snippet='"+ val.content +"' href='#'>"+ val.name +"</a></li>");
  		});

 		$(".interactive").click(function(){
			var content = $(this).attr('snippet');
			cmEditor.setValue(content);
		});
});
}

function next_lesson(){
	lesson = lesson + 1 ;
	if (lesson > 2 ) {lesson = 2};
	$("#scenario").load("lesson"+ lesson +".html");
}

function previous_lesson(){
	lesson = lesson - 1 ;
	if (lesson < 1 ) {lesson = 1};
	$("#scenario").load("lesson"+ lesson +".html");
}

function previous_svg(){
	tabId = $('#list-results .displayed').attr('id').split("-");
	id = tabId[1];
	id = id - 1;
	if (id < 0) {id = 0};
	$('#list-' + id).trigger("click");
}

function next_svg(){
	tabId = $('#list-results .displayed').attr('id').split("-");
	id = tabId[1];
	id = parseInt(id) + 1;
	if (id > $('ul#list-results li').length - 1) {id = $('ul#list-results li').length - 1};
	$('#list-' + id).trigger("click");
}