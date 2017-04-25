var id = "";//L'id de la requête
var cursor = 0;//Etat d'avancement global dans le fichier texte (nombre total de lignes parcourues )
var watcher = undefined;//Variable surveillant les modifications dans un fichier texte
var line = 0;//Etat d'avancement dans le fichier texte (nombre de lignes parcourues en une itération)
var cmEditor = undefined;//Contenu de la textarea

var incrementResult = 0;//Nombre de résultats affichés
var current_view = 0; //Numéro du résultat actuellement affiché

var collection = "ud";  // name of the subset of collection considered (selected from the navbar)
var corpus = "UD_English-2.0";   // name of the current corpus

// ========================================================================================================================
// this function is run atfer page loading
$(document).ready(function(){
	$('#corpus-fixed').hide();
	$('#save-pattern').prop('disabled',true);
	$('.tooltip-desc').tooltipster({contentAsHTML:true,theme:'tooltipster-noir',interactive:true,position:'bottom'});

	// Initialise CodeMirror
	cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
		lineNumbers: true,
	});

	// Hack to show FTB only with a hidden url
	var url = window.location.href;
	if (url.indexOf("2ksK5T") > 0) {
		$("#top-ftb").show();
		$("#top-tdm").show();
	}

	// Binding for changing corpus selection
	$('#corpus-select').change(function(){
		$('#vision').hide();
		corpus = $("#corpus-select").val()
		change_corpus ();
	});

	// Binding on CodeMirror change
	cmEditor.on ("change", function () {
		$('#save-pattern').prop('disabled',true);
		$('#custom-display').hide();
	});

	// Binding for collection selection
	$('#select-seq').click(function() { collection="seq"; change_collection () });
	$('#select-ud').click(function() { collection="ud"; change_collection () });
  $('#select-udm').click(function() { collection="udm"; change_collection () });
	$('#select-ftb').click(function() { collection="ftb"; change_collection () });
	$('#select-tdm').click(function() { collection="tdm"; change_collection () });
	$('#select-tuto').click(function() { collection="tuto"; change_collection () });

	// Check if some corpus is requested from the url
	if (getParameterByName("corpus").length > 0) {
		corpus = getParameterByName("corpus");

		// keep working hard link for old corpora names
		if (corpus == "miniref") { corpus = "UD_miniref-trunk"; }
		if (corpus == "seq-ud-trunk") { corpus = "UD_sequoia-trunk"; }
		if (corpus == "UD_French-dev") { corpus = "UD_French-trunk"; }

		collection = "udm"; // default value
		if (corpus.substring(0,3) == "UD_" && corpus.slice(4) = "-2.0") { collection="ud"};
		if (corpus.substring(0,7) == "sequoia") { collection="seq"; }
		if (corpus.substring(0,3) == "ftb") { collection="ftb"; }
		if (corpus.substring(0,3) == "tdm") { collection="tdm"; }
	};

	// Update page with corpus info
	change_collection(corpus);
	change_corpus();

	// Deal with custom argument
	if (getParameterByName("custom").length > 0) {
		$.get('./data/shorten/' + getParameterByName("custom"),function(pattern) {
			cmEditor.setValue(pattern);
			request_pattern(false);
		});
	};

	// If there is a get arg in the URL named "relation" -> make the request directly
	if (getParameterByName("relation").length > 0) {
		cmEditor.setValue("match {\n  GOV -["+getParameterByName("relation")+"]-> DEP\n}");
		// A click on the "Search" button is simulated to run the request
		$('#submit-pattern').trigger("click");
	};
});

// ========================================================================================================================
function change_collection(requested_corpus) {
	console.log("ENTER: change_collection");
	active_navbar(collection); // Change background in nav-bab
	$("#corpus-select").empty();

	$.get( "./"+collection+"/corpora_list", function( data ) {
		$("#corpus-select").append( data );

		var count = (data.match(/<\/option>/g) || []).length;

		if (count == 1) {
			$('#corpus-select').hide();
			$('#corpus-fixed').show();
			var name = data.replace(/<[^>]*>/g, "");
			$('#corpus-fixed').html(name);

		} else {
			$('#corpus-fixed').hide();
			$('#corpus-select').show();
		}
		if (requested_corpus === undefined) {
			// select the default corpus
			corpus = $("#corpus-select").val();
			change_corpus();
		} else {
			selectCorpus(requested_corpus)
		}
	});
};

// ========================================================================================================================
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

// ========================================================================================================================
function active_navbar(id){
	$("#top-ud").removeClass("active");
	$("#top-udm").removeClass("active");
	$("#top-seq").removeClass("active");
	$("#top-ftb").removeClass("active");
	$("#top-tdm").removeClass("active");
	$("#top-tuto").removeClass("active");

	$("#top-"+id).addClass("active");
}

// ========================================================================================================================
function change_corpus(){
	console.log("ENTER: change_corpus: "+ corpus);

	$('#custom-display').hide();
	corpus_dir = "./"+collection+"/"+corpus+"/";

	// Update of the short doc
	$.get(corpus_dir + "short.html", function(data) {
		$('#short-desc').html(data);
	});

	// Update of the long doc (tooltip)
	$.get(corpus_dir + "doc.html", function( data ) {
		if (data.length > 0) {
			$('#corpus-desc').show();
			$('.tooltip-desc').tooltipster('content',data);
			$('#a-corpus').attr("href", corpus_dir + "doc.html");
		} else {
			$('#corpus-desc').hide();
		}
	});

	// Update of right pane
	$.get(corpus_dir + "right_pane.html", function(data) {
		$('#right-pane').html(data);
		bind_inter();
	});
}

// ========================================================================================================================
// Binding for interactive part in snippets part
function bind_inter () {
	$(".inter").click(function(){
		var file = $(this).attr('snippet-file');
		// Update of the textarea
		$.get("./"+collection+"/"+corpus+"/"+file, function(pattern) {
			cmEditor.setValue(pattern);
		});
	});
}

// ========================================================================================================================
function request_pattern(next){
	console.log("shuffle-box: ===>" + $('#shuffle-box').prop('checked') + "<====");
	console.log("context-box: ===>" + $('#context-box').prop('checked') + "<====");
	if (cmEditor.getValue().length == 0) {
		sweetAlert("An error occurred", "You can't search for an empty pattern.", "error");
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
		$("#display-sentence").hide();
		cursor = 0;
		current_view = 0;
		var data= {
			pattern: cmEditor.getValue(),
			corpus:corpus,
			shuffle:$('#shuffle-box').prop('checked'),
			context:$('#context-box').prop('checked'),
		};
	}else{
		var data= {id:id,corpus:corpus};
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

							var lines = ajax.responseText.split("\n");

							for (var i = cursor,len = lines.length; i < len; i++) {
								if (lines[i] == '<END>') {
									clearInterval(watcher);
									watcher = undefined;
									$('#submit-pattern').prop('disabled',false);
									i= lines.length;
									$("#next-results").prop('disabled',true);
									if (incrementResult == 0) {
										$('#progress-txt').text('No results found');
										$('.btn-results').hide();
										$('#result-ok').hide();
										$('#display-results').hide();
									};
								}else if (lines[i] == '<ERROR>'){
									clearInterval(watcher);
									watcher = undefined;
									$.get('./data/' + id + '/error',function(errors){
										sweetAlert("An error occurred", errors, "error");
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
								}else if (lines[i] == '<PAUSE>'){
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',false);
									clearInterval(watcher);
									i = lines.length;
								}else if (lines[i] == '<TOTAL>'){
									clearInterval(watcher);
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',false);
									$('#progress-txt').html(lines[i+1] + ' occurence' + ((lines[i+1]>1)? 's' : '') + ' <span style="font-size: 60%">['+ lines[i+2] +'s]</span>');
									i += 2; // Skip the two next lines (nb of occ, time)
								}else if (lines[i] == '<OVER>'){
									clearInterval(watcher);
									$('#submit-pattern').prop('disabled',false);
									$("#next-results").prop('disabled',false);
									$('#progress-txt').html('More than 1000 results found in ' + lines[i+1] + '% of the corpus' + ' <span style="font-size: 60%">['+ lines[i+2] +'s]</span>');
									i += 2; // Skip the two next lines (ratio, time)
								}else{
									var pieces = lines[i].split("@");
									if (typeof pieces[1] !== "undefined" ) {
										$("#list-results").append('<li class="item" id="list-' + incrementResult + '"><a>' +  pieces[1] + '</a></li>');

										url = './data/' + id + '/' + pieces[0];
										$('#list-' + incrementResult).click({url:url,i:incrementResult,coord:pieces[2],sentence:pieces[3]},display_picture);

										if (i == 3) { // i=2 always corresponds the first response -> fill display-result with it
											var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + url +"\" > </object>";
											document.getElementById('display-results').innerHTML = newHtml;

											$('#list-' + incrementResult).addClass('displayed');
											var w = $("#display-results").width();
											$("#display-results").animate({scrollLeft:pieces[2] - w/2},"fast");
											$("#sentence-txt").html(pieces[3]);
											$("#display-sentence").show();
										};
										incrementResult++;
									}
								}
							};
							cursor = lines.length - 1;
							previous = ajax.responseText;
							update_progress_num();
						}
					}
				};
				ajax.open("POST", "./data/" + id + "/list", true); // Use POST to avoid caching
				ajax.send();
			}, 300);
		}
	});
}


// ========================================================================================================================
function display_picture(event){
	var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + event.data.url +"\" > </object>";
	document.getElementById('display-results').innerHTML = newHtml;

	$('#list-results li').removeClass('displayed');
	$('#list-' + event.data.i).addClass('displayed');
	var w = $("#display-results").width();
	$("#display-results").animate({scrollLeft:event.data.coord - w/2},"fast");
	$("#sentence-txt").html(event.data.sentence);

	current_view = event.data.i;
	update_progress_num();
}

// ========================================================================================================================
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

// ========================================================================================================================
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
// ========================================================================================================================
function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// ========================================================================================================================
function update_progress_num() {
	if (incrementResult != 0) {
		$('#result-ok').show();
		$('#display-results').show();
		$("#progress-num").text((current_view+1) + " / 	" + incrementResult);
	}
}

// ========================================================================================================================
function update_view() {
	$('#list-' + current_view).trigger("click");
	update_progress_num();
}

// ========================================================================================================================
function first_svg(){
	if (current_view > 0) {
		current_view = 0;
		update_view();
	}
}

// ========================================================================================================================
function previous_svg(){
	if (current_view > 0) {
		current_view -= 1;
		update_view();
	}
}

// ========================================================================================================================
function next_svg(){
	if (current_view < incrementResult - 1) {
		current_view += 1;
		update_view();
 	}
}

// ========================================================================================================================
function last_svg(){
	if (current_view < incrementResult - 1) {
		current_view = incrementResult - 1;
		update_view();
 	}
}
