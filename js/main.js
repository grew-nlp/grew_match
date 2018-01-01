var save_id = ""           // id of the current request
var watcher = undefined;   // watcher for file moidification
var cmEditor = undefined;  // content of the textarea

var result_nb = 0;         // number of given results
var current_view = 0;      // number of the result currently displayed

var group_dir = undefined; // directory of the group of corpora considered
var corpus = undefined;    // name of the current corpus

var groups;

// this function is run atfer page loading
$(document).ready(function(){
	init_sidebar ();

	$('#corpus-fixed').hide();
	$('#save-pattern').prop('disabled',true);
	$('.tooltip-desc').tooltipster({contentAsHTML:true,theme:'tooltipster-noir',interactive:true,position:'bottom'});

	// Initialise CodeMirror
	cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
		lineNumbers: true,
	});


  fill_sidebar();



	$.getJSON("corpora/groups.json").done(function(data){
		groups=data;
		console.log(groups);

		$.each(groups["groups"], function( index, value ) {
			id = value["id"];
			name = value["name"];
			if (value["hidden"]) {
				style = ' style="display: none;"';
			} else {
				style = '';
			}
			$('.groups').append('<li class="group" id="top-'+id+'"'+style+'><a class="navbar-brand" onclick="change_collection(\''+id+'\')" href="#">' + name + '</a></li>');
		});
		show_if_needed();
		deal_with_get_parameters();
	});

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

	$('#select-tuto').click(function() { change_collection ("tuto") });
});

// Hack to show FTB + TDM only with a hidden url
function show_if_needed() {
	var url = window.location.href;
	if (url.indexOf("2ksK5T") > 0 || url.indexOf("localhost") > 0) {
		$(".group").show();
	}
}

// force to interpret get parameters after the update of groups menus
function deal_with_get_parameters() {
	// corpus get parameter
	if (getParameterByName("corpus").length == 0) {
		console.log("No corpus in get parameters");
		change_collection(groups["groups"][0]["id"]);
	} else {
		corpus = getParameterByName("corpus");
		console.log("in the get parameters, corpus="+corpus);
		// keep working hard link for old corpora names
		if (corpus == "miniref") { corpus = "UD_miniref-trunk"; }
		if (corpus == "seq-ud-trunk") { corpus = "UD_sequoia-trunk"; }
		if (corpus == "UD_French-dev") { corpus = "UD_French-trunk"; }

		group="udm"; // default value
		if (corpus.substring(0,3) == "UD_" && corpus.slice(-4) == "-2.1") { group="ud"};
		if (corpus.substring(0,7) == "sequoia") { group="seq"; }
		if (corpus.substring(0,3) == "FTB" || corpus == "UD_French-FTB") { group="ftb"; }
		if (corpus.substring(0,3) == "tdm") { group="tdm"; }

		change_collection(group, corpus);
		console.log("Computed group:"+group);
		console.log("Computed corpus:"+corpus);
	};



	// custom get parameter
	if (getParameterByName("custom").length > 0) {
		get_custom = getParameterByName("custom");
		console.log("get_parameter corpus: "+get_custom);
		$.get('./data/shorten/' + get_custom,function(pattern) {
			cmEditor.setValue(pattern);
			request_pattern(false);
		});
	}

	// If there is a get arg in the URL named "relation" -> make the request directly
	if (getParameterByName("relation").length > 0) {
		console.log("get_parameter relation: "+getParameterByName("relation"));
		cmEditor.setValue("pattern {\n  GOV -["+getParameterByName("relation")+"]-> DEP\n}");
		request_pattern(false);
	}
}

// ==================================================================================
function change_collection(group, requested_corpus) {

	if (group == "tuto") {
		group_dir = "tuto"
	} else {
		group_dir = "corpora/"+group
	}
	console.log("ENTER: change_collection: " + group);
	$(".group").removeClass("active");
	$("#top-"+group).addClass("active");
	$("#corpus-select").empty();

	$.get( group_dir+"/corpora_list", function( data ) {
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
			selectCorpus(requested_corpus);
			corpus = requested_corpus;
			change_corpus();
		}
	});
};

// ==================================================================================
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

// ==================================================================================
function change_corpus(){
	console.log("ENTER: change_corpus: "+ corpus);

	$('#custom-display').hide();
	corpus_dir = group_dir+"/"+corpus+"/";

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

// ==================================================================================
// Binding for interactive part in snippets part
function bind_inter () {
	$(".inter").click(function(){
		var file = $(this).attr('snippet-file');
		// Update of the textarea
		$.get(group_dir+"/"+corpus+"/"+file, function(pattern) {
			cmEditor.setValue(pattern);
		});
	});
}

// ==============================
function request_pattern(next) {
	if (!next) {
		if (cmEditor.getValue().length == 0) {
			sweetAlert("An error occurred", "You can't search for an empty pattern.", "error");
			return false;
		}
		current_line_num = 0;
		result_nb = 0;
		current_view = 0;
		var data= {
			pattern: cmEditor.getValue(),
			corpus:corpus,
			shuffle:$('#shuffle-box').prop('checked'),
			context:$('#context-box').prop('checked'),
		}
		$('#list-results').empty();
	}else{
		var data= {id:save_id,corpus:corpus};
	}
	$.ajax({
		url: 'ajaxGrew.php',
		dataType:'text',
		data: data,
		type: 'post',
		success: function(id){
			save_id=id;
			$.get("./data/" + id + "/list", function(data) {
				$('#save-pattern').prop('disabled',false);
				lines = data.split("\n");
				if (lines[0] == '<!>') {
					sweetAlert('The daemon is not running\n\nTry again in a few minutes');
				}
				else {
					for (var i = current_line_num,len = lines.length; i < len; i++) {
						if (lines[i] == '<END>') {
							$("#next-results").prop('disabled',true);
							if (result_nb == 0) {
								$('#vision').show();
								$('#result-ok').hide();
								$('#display-sentence').hide();
								$('#display-results').hide();
								$('#progress-txt').text('No results found');
								$("#next-results").prop('disabled',true);
							}
						} else if (lines[i] == '<ERROR>') {
							$.get('./data/' + id + '/error',function(errors){
								sweetAlert("An error occurred", errors, "error");
							});
						} else if (lines[i] == '<PAUSE>') {
							$("#next-results").prop('disabled',false);
						} else if (lines[i] == '<TOTAL>') {
							$('#progress-txt').html(lines[i+1] + ' occurence' + ((lines[i+1]>1)? 's' : '') + ' <span style="font-size: 60%">['+ lines[i+2] +'s]</span>');
							i += 2; // Skip the two next lines (nb of occ, time)
						} else if (lines[i] == '<OVER>') {
							$('#progress-txt').html('More than 1000 results found in ' + lines[i+1] + '% of the corpus' + ' <span style="font-size: 60%">['+ lines[i+2] +'s]</span>');
							i += 2; // Skip the two next lines (ratio, time)
						} else {
							var pieces = lines[i].split("@");
							if (typeof pieces[1] !== "undefined" ) {
								$("#list-results").append('<li class="item" id="list-' + result_nb + '"><a>' +  pieces[1] + '</a></li>');
								url = './data/' + id + '/' + pieces[0];
								$('#list-' + result_nb).click({url:url,i:result_nb,coord:pieces[2],sentence:pieces[3]},display_picture);
								if (i == 3) { // i=2 always corresponds the first response -> fill display-result with it
									$('#vision').show();
									var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + url +"\" > </object>";
									document.getElementById('display-results').innerHTML = newHtml;
									$('#list-' + result_nb).addClass('displayed');
									var w = $("#display-results").width();
									$("#display-results").animate({scrollLeft:pieces[2] - w/2},"fast");
									$("#sentence-txt").html(pieces[3]);
									$("#display-sentence").show();
								};
								result_nb++;
								update_progress_num();
							}
						}
					};
				}
				current_line_num = lines.length - 1;
			});

		}
	});

}

// ==================================================================================
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

// ==================================================================================
function save_pattern(num){
	if (cmEditor.getValue().length > 0 && id.length > 0) {
		corpus = $("#corpus-select").val();
		$.ajax({url:'shorten.php',
			dataType:'text',
			data: {pattern: cmEditor.getValue(), id:save_id},
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

// ==================================================================================
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
// ==================================================================================
function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// ==================================================================================
function update_progress_num() {
	if (result_nb != 0) {
		$('#result-ok').show();
		$('#display-results').show();
		$("#progress-num").text((current_view+1) + " / 	" + result_nb);
	}
}

// ==================================================================================
function update_view() {
	$('#list-' + current_view).trigger("click");
	update_progress_num();
}

// ==================================================================================
function first_svg(){
	if (current_view > 0) {
		current_view = 0;
		update_view();
	}
}

// ==================================================================================
function previous_svg(){
	if (current_view > 0) {
		current_view -= 1;
		update_view();
	}
}

// ==================================================================================
function next_svg(){
	if (current_view < result_nb - 1) {
		current_view += 1;
		update_view();
 	}
}

// ==================================================================================
function last_svg(){
	if (current_view < result_nb - 1) {
		current_view = result_nb - 1;
		update_view();
 	}
}

// ==================================================================================
function init_sidebar() {
  open=true;
  $('#sidebarCollapse').on('click', function () {
    $('#sidebar').toggleClass('active');
    if (open) {
      open=false;
      $('#but-text').html("Show corpora list");
    } else {
      open=true;
      $('#but-text').html("Hide corpora list");
    }
  });
}

function set_corpus (c) {
	alert (c);
	$('#corpus-select').hide();
	$('#corpus-fixed').show();
	$('#corpus-fixed').html(c);
	corpus = c;
	change_corpus();
}

function fill_sidebar () {
	$.getJSON("UD-2.1.json").done(function(data){
		corpora = data["corpora"];
		html = "";
		$.each(corpora, function(index, value ) {
			if ("id" in value) {
				html += '<div class="panel-body">\n';
				html += '<table class="table">\n';
				html += '<tr><td class="alone">\n';
				html += '<a nohref onclick="set_corpus(\'' + value["id"] + '\');return false;">\n';
				html += '<span class="glyphicon glyphicon-align-justify"></span>\n';
				html += value["id"];
				html += '</a>\n';
				html += '</td></tr>\n';
				html += '</table>\n';
				html += '</div>\n';
				//alert(html)
			} else {
				var id_acc = value["group"].replace(/ /g, "_");
        html += '<div class="panel panel-default">\n';
        html += '<div class="panel-heading">\n';
        html += '<h4 class="panel-title">\n';
        html += '<a data-toggle="collapse" href="#'+id_acc+'">\n';
        html += '<span class="glyphicon glyphicon-folder-open"></span>\n';
        html += value["group"]+'\n';
        html += '</a>\n';
        html += '</h4>\n';
        html += '</div>\n';
        html += '<div id="'+id_acc+'" class="panel-collapse collapse">\n';
        html += '<div class="panel-body">\n';
        html += '<table class="table">\n';
				$.each(value["corpora"], function(index, value ) {
					html += '<tr><td>\n';
					html += '<a>\n';
					html += '<span class="glyphicon glyphicon-align-justify"></span>\n';
					html += value["id"]+'\n';
					html += '</a>\n';
					html += '</td></tr>\n';
				});
        html += '</table>\n';
        html += '</div>\n';
        html += '</div>\n';
        html += '</div>\n';
				//alert("group: "+value["group"])
			}
		});
		$('#accordion').html(html);
	});
}