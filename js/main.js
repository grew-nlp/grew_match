var id = "";//L'id de la requête
var cursor = 0;//Etat d'avancement global dans le fichier texte (nombre total de lignes parcourues )
var watcher = undefined;//Variable surveillant les modifications dans un fichier texte
var line = 0;//Etat d'avancement dans le fichier texte (nombre de lignes parcourues en une itération)
var cmEditor = undefined;//Contenu de la textarea
var lesson = 1;//Numéro de la lesson en cours
var incrementResult = 0;//Nombre de résultats affichés
var current_view = 0; //Numéro du résultat actuellement affiché

$(function(){
// exécuter une fois à la fin du chargement de la page

	//Récupération de la liste de corpus
	$.get( "./corpora/list", function( data ) {
 		$( "#corpus-select" ).append( data );

 		//On vérifie si on est sur une recherche sauvegardée via les paramètres get
 		if (getParameterByName("corpus").length > 0 && getParameterByName("custom").length > 0) {
			$("#corpus-select").prop('selectedIndex',getParameterByName("corpus"));
			$.get('./data/shorten/' + getParameterByName("custom"),function(pattern){
				//On affiche le contenu de la recherche
				cmEditor.setValue(pattern);
				//On simule un click pour lancer la recherche et afficher diréctement les résultats
				$('#submit-pattern').trigger("click");
			});
		};

		//On récupère les snippets de chaque corpus et les informations le concernant
		$.get( "./corpora/"+ $("#corpus-select").val() + "/doc.html", function( data ) {
			$('#corpus-select').after('<span href="" class="tooltip-desc" id="corpus-desc">(?)</span>');
			$.get( "./corpora/"+ $("#corpus-select").val() + "/short.html", function( data ) {
				$('#short-desc').append(data);
			});
			snippets_extract();
			$('.tooltip-desc').tooltipster({content:data,contentAsHTML:true,theme:'tooltipster-noir',interactive:true});
		});

	});

	//On charge la première leçon
    $("#scenario").load("lesson"+ lesson+".html");

    //On lie l'événement de changement de corpus à la liste déroulante
	$('#corpus-select').change(function(){
		$('#custom-display').hide();
		$('#vision').hide();
		$('#short-desc').empty();
		$.get( "./corpora/"+ $("#corpus-select").val() + "/doc.html", function( data ) {
			$('.tooltip-desc').tooltipster('content',data);
			$.get( "./corpora/"+ $("#corpus-select").val() + "/short.html", function( data ) {
				$('#short-desc').append(data);
			});
			snippets_extract();
		});

	});

	//On initialise CodeMirror
	cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
    	lineNumbers: true,
  	});
    
});

function request_pattern(next){
	if (!next) {
		$('.btn-results').show();
		$('#custom-display').hide();
		$('#vision').show();
		$('#result-pic').hide();
		$('#list-results').empty();
		$('#progress-txt').empty();
		$('#progress-num').empty();
		$('#result-pic').removeAttr('data');
		$('#result-ok').hide();
		cursor = 0;
		current_view = 0;
		var data= {pattern: cmEditor.getValue(),corpus:$("#corpus-select").val()};
	}else{
		var data= {id:id,corpus:$("#corpus-select").val()};
	}
	//Reset de la liste
	$('#submit-pattern').prop('disabled',true);
	$("#next-results").prop('disabled',true);
	
	$.ajax({url:'ajaxGrew.php',
		dataType:'text',
		data: data,
		type: 'post',
		success: function(output){
			if (!next) {
				id = output;
			}
			
			var file = "./data/" + id + "/list";

			var previous = "";

			watcher = setInterval(function() {
    			var ajax = new XMLHttpRequest();
    			ajax.onreadystatechange = function() {
        			if (ajax.readyState == 4) {
            			if (ajax.responseText != previous) {
            				if (!next) {
            					line = 0;
            					incrementResult = 0;
            				}
            				
            				var progression = 0;
           					var lines = ajax.responseText.split("\n");
           					
							for (var i = cursor,len = lines.length; i < len;i++) {
								line++;
								if (lines[i] == '<#>') {
									clearInterval(watcher);
									watcher = undefined;
									$('#submit-pattern').prop('disabled',false);
									i= lines.length;
									$("#next-results").prop('disabled',true);
									$('#progress-txt').text('100% scanned');
									if (incrementResult == 0) {
										$('#progress-txt').text('No results found');
										$('.btn-results').hide();
										$('#result-ok').hide();
										$('#display-results').hide();
									};
								}else if (lines[i] == '<!>'){
									clearInterval(watcher);
									watcher = undefined;
									$.get('./data/' + id + '/error',function(errors){
										sweetAlert("An error occured", errors, "error");
									});
									i= lines.length;
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',true);
									if (incrementResult == 0) {
										$('#progress-txt').text('No results found');
										$('.btn-results').hide();
										$('#result-ok').hide();
										$('#display-results').hide();
									};
								}else if (lines[i] == '<?>'){
									progression = 1;
								}else if (progression == 1){
									clearInterval(watcher);
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',false);
									$('#progress-txt').text(lines[i] + '% scanned');
									i = lines.length;
								}else{
									var pieces = lines[i].split("@");
									$("#list-results").append('<li class="item" id="list-' + incrementResult + '"><a>' +  pieces[1] + '</a></li>');
									
									url = './data/' + id + '/' + pieces[0];
									$('#list-' + incrementResult).click({url:url,i:incrementResult,coord:pieces[2]},display_picture);

									if (line == 1) {

										//$('#result-pic').attr('data',url);
										var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + url +"\" > </object>";
										document.getElementById('display-results').innerHTML = newHtml;

										$('#list-' + incrementResult).addClass('displayed');
										$("#display-results").animate({scrollLeft:pieces[2] - 150},"fast");
									};
									incrementResult++;
								}
							};
							cursor = line;
                			previous = ajax.responseText;
                			update_progress_num();
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
	current_view = event.data.i;
	update_progress_num();
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

function update_progress_num() {
	if (incrementResult != 0) {
		$('#result-ok').show();
		$('#display-results').show();
		$("#progress-num").text((current_view+1) + " / 	" + incrementResult);
	}
}

function update_view() {
	$('#list-' + current_view).trigger("click");
	update_progress_num();
}

function first_svg(){
	if (current_view > 0) {
		current_view = 0;
		update_view();
	}
}

function previous_svg(){
	if (current_view > 0) {
		current_view -= 1;
		update_view();
	}
}

function next_svg(){
	if (current_view < incrementResult - 1) {
		current_view += 1;
		update_view();
 	}
}

function last_svg(){
	if (current_view < incrementResult - 1) {
		current_view = incrementResult - 1;
		update_view();
 	}
}
