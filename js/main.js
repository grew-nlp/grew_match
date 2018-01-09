var save_id = ""           // id of the current request
var cmEditor = undefined;  // content of the textarea

var result_nb = 0;         // number of given results
var current_view = 0;      // number of the result currently displayed

var group_dir = undefined; // directory of the group of corpora considered
var corpus = undefined;    // name of the current corpus

var groups;

var corpus;

// this function is run atfer page loading
$(document).ready(function(){
	init_sidebar ();

	$('#save-pattern').prop('disabled',true);
	$('.tooltip-desc').tooltipster({contentAsHTML:true,theme:'tooltipster-noir',interactive:true,position:'bottom'});

	// Initialise CodeMirror
	cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
		lineNumbers: true,
	});

	$.getJSON("corpora/groups.json").done(function(data){
		groups=data;
		console.log(groups);

		$.each(groups["groups"], function( index, value ) {
			id = value["id"];
			name = value["name"];
			desc = value["desc"];
			$('.groups').append('<li class="group" id="top-'+desc+'"><a class="navbar-brand" onclick="select_group(\''+desc+'\')" href="#">' + name + '</a></li>');
		});
		show_if_needed();
		deal_with_get_parameters();
	});

	// Binding on CodeMirror change
	cmEditor.on ("change", function () {
		$('#save-pattern').prop('disabled',true);
		$('#custom-display').hide();
	});

	$('#select-tuto').click(function() { tuto () });
});

function tuto () {
	// Change background of selecte group
	$(".group").removeClass("active");
	$("#top-tuto").addClass("active");

	$('#sidebar').removeClass('active');
	update_but_text();

	$('#sidebarCollapse').hide();
	set_corpus ("UD_English");

	right_pane ("tuto");
}

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
		//change_collection(groups["groups"][0]["id"]);
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

		//change_collection(group, corpus);
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

// ==================================================================================
// Binding for interactive part in snippets part
function right_pane (base) {
	$.get("corpora/" + base + "/right_pane.html", function(data) {
		$('#right-pane').html(data);
		$(".inter").click(function(){
			var file = $(this).attr('snippet-file');
			// Update of the textarea
			$.get("corpora/" + base + "/" + file, function(pattern) {
				cmEditor.setValue(pattern);
			});
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
							var pieces = lines[i].split("@@");
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
  $('#sidebarCollapse').on('click', function () {
    $('#sidebar').toggleClass('active');
		update_but_text ();
  });
}

// ==================================================================================
function update_but_text () {
	if ($('#sidebar').hasClass('active')) {
		$('#but-text').html("Hide corpora list");
	} else {
		$('#but-text').html("Show corpora list");
	}
}

// ==================================================================================
function set_corpus (c) {
	$('#corpus-fixed').html(c);
	corpus = c;
	change_corpus();
}

function select_group (desc) {
	console.log("-----------------> desc="+desc);
	// sidebar open and button visible
	$('#sidebar').addClass('active');
	update_but_text();
	$('#sidebarCollapse').show();

	// Change background of selecte group
	$(".group").removeClass("active");
	$("#top-"+desc).addClass("active");
	// sidebar
	$.getJSON("corpora/"+desc+".json").done(function(data){
		corpora = data["corpora"];
		html = "";
		$.each(corpora, function(index, value ) {
			if ("section" in value) {
				html += '<div class="sidebar-header">\n';
				html += '  <h3>' + value["section"] + '</h3>\n';
				html += '</div>\n';
			}
			else if ("id" in value) {
				html += '<div class="corpus">\n';
				html += '<table class="table" onclick="set_corpus(\'' + value["id"] + '\');return false;" href="#">\n';
				html += '<tr><td class="alone">\n';
				html += '<span class="glyphicon glyphicon-align-justify"></span>\n';
				html += value["id"];
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
					html += '<tr class="corpus" onclick="set_corpus(\'' + value["id"] + '\');return false;"><td>\n';
					html += '<a href="#" >\n';
					html += '<span class="glyphicon glyphicon-align-justify"></span>\n';
					html += value["id"]+'\n';
					html += '</a>\n';
					html += '</td></tr>\n';
				});
        html += '</table>\n';
        html += '</div>\n';
        html += '</div>\n';
        html += '</div>\n';
			}
		});
		$('#accordion').html(html);
	});
	right_pane(desc);
}