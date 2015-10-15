var id = "";//L'id de la requête
var cursor = 0;//Etat d'avancement global dans le fichier texte (nombre total de lignes parcourues )
var watcher = undefined;//Variable surveillant les modifications dans un fichier texte
var line = 0;//Etat d'avancement dans le fichier texte (nombre de lignes parcourues en une itération)
var cmEditor = undefined;//Contenu de la textarea

var scenario_basename = "undefined"
var scenario = 1; //Numéro do scenario actuel
var max_scenario = 0; // nombre max de scenario

var incrementResult = 0;//Nombre de résultats affichés
var current_view = 0; //Numéro du résultat actuellement affiché

var corpus_dir = "undefined"

$(function(){
// exécuter une fois à la fin du chargement de la page
	$('#scenario').hide();

	$('#corpus-fixed').hide();		

	$('#save-pattern').prop('disabled',true);

	$('.tooltip-desc').tooltipster({contentAsHTML:true,theme:'tooltipster-noir',interactive:true,position:'bottom'});

	//Récupération de la liste de corpus
	$.get( "./corpora/corpora_list", function( data ) {
 		$( "#corpus-select" ).append( data );

 		//On vérifie si on est sur une recherche sauvegardée via les paramètres get
 		if (getParameterByName("corpus").length > 0 && getParameterByName("custom").length > 0) {
			selectCorpus(getParameterByName("corpus"));
			$.get('./data/shorten/' + getParameterByName("custom"),function(pattern){
				//On affiche le contenu de la recherche
				cmEditor.setValue(pattern);
				//On simule un click pour lancer la recherche et afficher directement les résultats
				$('#submit-pattern').trigger("click");
			});
		};

 		//On vérifie si on est sur une recherche directe de relation via les paramètres get
 		if (getParameterByName("corpus").length > 0 && getParameterByName("relation").length > 0) {
			selectCorpus(getParameterByName("corpus"));
			//On affiche le contenu de la recherche
			cmEditor.setValue("match {\n  GOV[];\n  DEP[];\n  GOV -["+getParameterByName("relation")+"]-> DEP\n}");
			//On simule un click pour lancer la recherche et afficher directement les résultats
			$('#submit-pattern').trigger("click");
		};

 		//On vérifie si un corpus est préselectionné
 		if (getParameterByName("corpus").length > 0) {
			selectCorpus(getParameterByName("corpus"));
		};

	change_corpus();

	});

    //On lie l'événement de changement de corpus à la liste déroulante
	$('#corpus-select').change(function(){
		$('#vision').hide();
		change_corpus ();
	});

	//On initialise CodeMirror
	cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
    	lineNumbers: true,
  	});

	cmEditor.on ("change", function () {
		$('#save-pattern').prop('disabled',true);
		$('#custom-display').hide();		
	});

	$('#tutorial').click(function(){
		$('#scenario').show();		
		$('#snippets').hide();

		$('#corpus-fixed').show();
		$('#corpus-select').hide();

		active_navbar("tutorial");

		scenario_basename = "tutorial";
		scenario = 1;
		max_scenario = 3;
		$("#scenario").load(scenario_basename+ scenario +".html");

		$('#corpus-select').val("sequoia-7.0");
		change_corpus();
	});

	$('#ex-seq').click(function(){
		$('#scenario').show();		
		$('#snippets').hide();

		$('#corpus-fixed').show();
		$('#corpus-select').hide();

		active_navbar("ex-seq");

		scenario_basename = "ex-seq";
		scenario = 1;
		max_scenario = 1;
		$("#scenario").load(scenario_basename+ scenario +".html");

		$('#corpus-select').val("sequoia-7.0");
		change_corpus();
	});

	$('#ex-deep').click(function(){
		$('#scenario').show();		
		$('#snippets').hide();

		$('#corpus-fixed').show();
		$('#corpus-select').hide();

		active_navbar("ex-deep");

		scenario_basename = "ex-deep";
		scenario = 1;
		max_scenario = 2;
		$("#scenario").load(scenario_basename+ scenario +".html");

		$('#corpus-select').val("deep-sequoia-7.0");
		change_corpus();
	});

	$('#search').click(function(){
		$('#snippets').show();
		$('#scenario').hide();

		$('#corpus-fixed').hide();
		$('#corpus-select').show();

		active_navbar("search");

	});
});

function selectCorpus(corpus){
	//On crée un tableau regroupant toutes les options présentes dans le selecteur de corpus
    options = [];
	$("#corpus-select option").each(function(){
    	options.push($(this).val());
	});
	
	//On crée un regexp qui cherchera le nom de corpus commençant à la première posistion (^) et ignorant la casse (mode i)
	var regexp = new RegExp('^' + corpus, "i"); 

	//On boucle sur le tableau d'options pour tester s'il y a un match avec le regexp
    for (i = 0; i < options.length; i++) {
        if (options[i].match(regexp)) {
        	//On a trouvé un correspondance, on change l'index et on stoppe la fonction
            $("#corpus-select")[0].selectedIndex = i;
            return;
        }
    }

    //On a pas trouvé de match donc on selectionne par défaut le premier choix et on stoppe la fonction
    $("#corpus-select")[0].selectedIndex = 0;	
	return;
}

function active_navbar(id){
	$("#li-search").removeClass("active");
	$("#li-tutorial").removeClass("active");
	$("#li-examples").removeClass("active");
	$("#li-ex").removeClass("active");
	$("#li-ex-seq").removeClass("active");
	$("#li-ex-deep").removeClass("active");
	$("#li-"+id).addClass("active");
	if (id == "ex-deep" || id == "ex-seq") {
		$("#li-ex").addClass("active");
	}
}

function change_corpus(){
	$('#custom-display').hide();
	$('#short-desc').empty();

	corpus_dir = "./corpora/"+ $("#corpus-select").val() + "/";

	// On met à jour la short doc
	$.get(corpus_dir + "short.html", function(data) {
		$('#short-desc').append(data);
	});

	// On met à jour la long doc (tooltip)
	$.get(corpus_dir + "doc.html", function( data ) {
        $('.tooltip-desc').tooltipster('content',data);
	});

	// Mise à jour du lien (?)
	$('#a-corpus').attr("href", corpus_dir + "doc.html");

	// Mise à jour snippets
	snippets_extract();

	$('#corpus-fixed').html($("#corpus-select").val());
}

function request_pattern(next){
	if (cmEditor.getValue().length == 0) {
		sweetAlert("An error occured", "You can't search for an empty pattern.", "error");
		return false;
	}

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

			$('#save-pattern').prop('disabled',false);
			
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
										var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + url +"\" > </object>";
										document.getElementById('display-results').innerHTML = newHtml;

										$('#list-' + incrementResult).addClass('displayed');
										var w = $("#display-results").width();
										$("#display-results").animate({scrollLeft:pieces[2] - w/2},"fast");
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
	var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + event.data.url +"\" > </object>";
	document.getElementById('display-results').innerHTML = newHtml;

	$('#list-results li').removeClass('displayed');
	$('#list-' + event.data.i).addClass('displayed');
	var w = $("#display-results").width();
	$("#display-results").animate({scrollLeft:event.data.coord - w/2},"fast");
	current_view = event.data.i;
	update_progress_num();
}

function save_pattern(num){
	if (cmEditor.getValue().length > 0 && id.length > 0) {
		corpus = $("#corpus-select").val();
		$.ajax({url:'shorten.php',
			dataType:'text',
			data: {pattern: cmEditor.getValue(), id:id},
			type: 'post',
			success: function(output){
				history.pushState({id:output},"Grew - Custom saved pattern", "?custom=" + output + "&corpus=" + corpus);
				$('#custom-url').text(window.location.href);
				$('#custom-display').show();
				SelectText("custom-url");
			}
		});
	} else {
		sweetAlert("An error occured", "You can't save pattern before searching for it.", "error");
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

function next_scenario(){
	scenario = scenario + 1 ;
	if (scenario > max_scenario ) {scenario = max_scenario};
	$("#scenario").load(scenario_basename+ scenario +".html");
}

function previous_scenario(){
	scenario = scenario - 1 ;
	if (scenario < 1 ) {scenario = 1};
	$("#scenario").load(scenario_basename+ scenario +".html");
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
