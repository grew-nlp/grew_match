var cmEditor = undefined; // content of the textarea

var current_request_id = ""

var result_nb = 0; // number of given results
var current_view = 0; // number of the result currently displayed

var current_data;
var current_group;
var current_corpus;
var current_folder;
var current_snippets;
var current_cluster;

var already_exported = false

// ==================================================================================
function startsWith(text, word) {
	str = String(text);
	l = word.length;
	var res = str.substr(0, l);
	if (res == word) {
		return (text)
	}
}

// ==================================================================================
function get_corpora_from_group(group_id) {
	group_list = current_data["groups"];
	for (var g = 0; g < group_list.length; g++) {
		if (group_list[g]["id"] == group_id) {
			return group_list[g]["corpora"];
		}
	}
}

// ==================================================================================
// search for the requested field in the json object which contains the "id" corpus
function get_info(corpus, field) {
	function aux() {
		group_list = current_data["groups"];
		for (var g = 0; g < group_list.length; g++) {
			corpora = group_list[g]["corpora"];
			for (var c = 0; c < corpora.length; c++) {
				if (corpora[c]["id"] == corpus) {
					return corpora[c][field];
				}
				if (corpora[c]["folder"] != undefined) {
					subcorpora = corpora[c]["corpora"];
					for (var cc = 0; cc < subcorpora.length; cc++) {
						if (subcorpora[cc]["id"] == corpus) {
							return subcorpora[cc][field];
						}
					}
				}
			}
		}
	}
	snip_opt = aux();
	if (snip_opt != undefined) {
		return snip_opt
	} else {
		return ""
	}
}

// ==================================================================================
// return an array [real_corpus_name, folder, group]
function search_corpus(requested_corpus) {
	current_corpus = undefined;
	current_folder = undefined;
	current_group = undefined;
	group_list = current_data["groups"];
	for (var g = 0; g < group_list.length; g++) {
		corpora = group_list[g]["corpora"];
		for (var c = 0; c < corpora.length; c++) {
			if (startsWith(corpora[c]["id"], corpus)) {
				current_corpus = corpora[c]["id"];
				current_group = group_list[g]["id"];
				return;
			}
			if (corpora[c]["folder"] != undefined) {
				subcorpora = corpora[c]["corpora"];
				for (var cc = 0; cc < subcorpora.length; cc++) {
					if (startsWith(subcorpora[cc]["id"], corpus)) {
						current_corpus = subcorpora[cc]["id"];
						current_folder = corpora[c]["folder"];
						current_group = group_list[g]["id"];
						return;
					}
				}
			}
		}
	}
	// no matching corpus here found
	set_default();
}


// ==================================================================================
// this function is run atfer page loading
$(document).ready(function() {
	// load the "groups.json" file
	$.getJSON("corpora/groups.json").done(function(data) {
		current_data = data;
		init();
	});

	$('.tooltip-desc').tooltipster({
		contentAsHTML: true,
		theme: 'tooltipster-noir',
		interactive: true,
		position: 'bottom'
	});
	$('.tooltip-desc').tooltipster('content', $("#snd_feat-tip").html());


	$('#cluster-box').change(function() {
		if (this.checked) {
			$('#cluster-span').show();
		} else {
			$('#cluster-span').hide();
		}
	});


});

// ==================================================================================
function set_default() {
	first_group = current_data["groups"][0];
	current_group = first_group["id"];
	current_corpus = first_group["default"];
}

// ==================================================================================
function init() {
	console.log(current_data);
	set_default();
	current_snippets = get_info(current_corpus, "snippets");

	init_sidebar();
	init_table_button();
	init_log_button();

	$('#save-button').prop('disabled', true);
	$('#export-button').prop('disabled', true);
	already_exported = false;

	// Initialise CodeMirror
	cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
		lineNumbers: true,
	});

	init_navbar();

	deal_with_get_parameters();

	// Binding on CodeMirror change
	cmEditor.on("change", function() {
		$('#save-button').prop('disabled', true);
		$('#export-button').prop('disabled', true);
		already_exported = false;
		$('#custom-display').hide();
	});


	$('#select-tuto').click(function() {
		tuto()
	});

	if (current_group == "tuto") {
		tuto();
	} else {
		update_group();
	}
}

// ==================================================================================
function init_navbar() {
	$.each(current_data["groups"], function(index, value) {
		id = value["id"];
		name = value["name"];
		_default = value["default"];
		$('.groups').append(
			'<li class="group" id="top-' +
			id +
			'"><a class="navbar-brand" onclick="select_group(\'' +
			id +
			'\', \'' +
			_default +
			'\')" href="#">' +
			name +
			'</a></li>'
		);
	});
}

// ==================================================================================
function tuto() {
	set_ud();

	// Change background of selecte group
	$(".group").removeClass("active");
	$("#top-tuto").addClass("active");

	$('#sidebarCollapse').hide();
	search_corpus("UD_English-GUM@2.4");
	update_corpus();
	right_pane("tuto");

	$('#sidebar').removeClass('active');
	update_but_text();
}

// ==================================================================================
// force to interpret get parameters after the update of groups menus
function deal_with_get_parameters() {

	// corpus get parameter
	if (getParameterByName("tutorial") == "yes") {
		current_group = "tuto";
	} else

	if (getParameterByName("corpus").length > 0) {
		corpus = getParameterByName("corpus");

		// keep working hard link for old corpora names
		if (corpus == "UD_French-dev") {
			corpus = "UD_French@dev";
		}
		if (corpus == "seq-ud-trunk") {
			corpus = "UD_French-Sequoia@dev";
		}
		if (corpus == "UD_English-2.0") {
			corpus = "UD_English";
		}
		if (corpus == "UD_English-2.1") {
			corpus = "UD_English";
		}
		if (corpus == "sequoia.const-7.0") {
			corpus = "sequoia.const@7.0";
		}
		if (corpus == "sequoia.surf-7.0") {
			corpus = "sequoia.surf@7.0";
		}
		if (corpus == "UD_French-Sequoia-2.0") {
			corpus = "UD_French-Sequoia";
		}
		if (corpus == "sequoia.deep_and_surf") {
			corpus = "sequoia.deep_and_surf@master";
		}
		if (corpus == "sequoia.deep_and_surf@UD-2.1 ") {
			corpus = "sequoia.deep_and_surf@8.1";
		}

		search_corpus(corpus);
	};

	// custom get parameter
	if (getParameterByName("custom").length > 0) {
		get_custom = getParameterByName("custom");
		console.log("get_parameter corpus: " + get_custom);
		$.get('./data/shorten/' + get_custom, function(pattern) {
			cmEditor.setValue(pattern);
			request_pattern(false);
		});
	}

	// If there is a get arg in the URL named "relation" -> make the request directly
	if (getParameterByName("relation").length > 0) {
		console.log("get_parameter relation: " + getParameterByName("relation"));
		if (getParameterByName("source").length > 0) {
			source = "GOV [upos=\"" + (getParameterByName("source")) + "\"]; "
		} else {
			source = ""
		}
		if (getParameterByName("target").length > 0) {
			target = "DEP [upos=\"" + (getParameterByName("target")) + "\"]; "
		} else {
			target = ""
		}
		cmEditor.setValue("pattern {\n  " + source + target + "GOV -[" + getParameterByName("relation") + "]-> DEP\n}");
		request_pattern(false);
	}
}

// ==================================================================================
// Binding for interactive part in snippets part
function right_pane(base) {
	if (base == "tuto") {
		dir = "tuto";
	} else {
		dir = "corpora/" + base
	}
	$.get(dir + "/right_pane.html", function(data) {
		$('#right-pane').html(data);
		$(".inter").click(function() {
			var file = $(this).attr('snippet-file');
			// Update of the textarea
			$.get(dir + "/" + file, function(pattern) {
				cmEditor.setValue(pattern);
			});
		});
	});
}

// ==================================================================================
function next_results() {
	var data = {
		id: current_request_id
	};
	$.ajax({
		url: 'ajaxGrew.php',
		dataType: 'text',
		data: data,
		type: 'post',
		success: function(id) {
			load_cluster_file();
		}
	});
}

// ==================================================================================
function search_pattern() {
	$('#results-block').hide();
	$('#results-list').empty();
	current_line_num = 0;
	result_nb = 0;
	current_view = 0;
	var data = {
		pattern: cmEditor.getValue(),
		corpus: current_corpus,
		lemma: $('#lemma-box').prop('checked'),
		upos: $('#upos-box').prop('checked'),
		xpos: $('#xpos-box').prop('checked'),
		features: $('#features-box').prop('checked'),
		add_feats: $('#add_feats-box').prop('checked'),
		order: $('#sentences-order').val(),
		context: $('#context-box').prop('checked'),
	};
	if ($('#cluster-box').prop('checked')) {
		data['cluster'] = $('#cluster-key').val();
	}
	$.ajax({
		url: 'ajaxGrew.php',
		dataType: 'text',
		data: data,
		type: 'post',
		success: function(id) {
			// set the writting direction
			if (get_info(current_corpus, "rtl")) {
				$('#sentence-txt').attr("dir", "rtl");
			} else {
				$('#sentence-txt').removeAttr("dir");
			}

			current_request_id = id;
			$.get("./data/" + id + "/list", function(data) {
				$('#save-button').prop('disabled', false);
				$('#export-button').prop('disabled', false);
				lines = data.split("\n");
				if (lines[0] == '<!>') {
					sweetAlert('The daemon is not running\n\nTry again in a few minutes');
				} else {
					for (var i = current_line_num, len = lines.length; i < len; i++) {
						var pieces = lines[i].split("@@");
						if (pieces[0] == '<EMPTY>') {
							$("#next-results").prop('disabled', true);
							$('#results-navig').hide();
							$('#display-sentence').hide();
							$('#display-svg').hide();
							$('#progress-txt').text('No results found');
							$("#export-button").prop('disabled', true);
							$('#results-block').show();
						} else if (pieces[0] == '<ERROR>') {
							$.get('./data/' + id + '/error', function(errors) {
								sweetAlert("An error occurred", errors, "error");
							});
						} else if (pieces[0] == '<TOTAL>') {
							$('#progress-txt').html(pieces[1] + ' occurrence' + ((pieces[1] > 1) ? 's' : '') + ' <span style="font-size: 60%">[' + pieces[2] + 's]</span>');
						} else if (pieces[0] == '<OVER>') {
							$('#progress-txt').html('More than 1000 results found in ' + pieces[1] + '% of the corpus' + ' <span style="font-size: 60%">[' + pieces[2] + 's]</span>');
						} else if (pieces[0] == '<ONECLUSTER>') {
							$("#cluster-buttons").empty();
							current_cluster = 0;
							load_cluster_file();
							$('#results-block').show();
						} else if (pieces[0] == '<CLUSTERS>') {
							fill_cluster_buttons();
						}
					};
				}
			});
		}
	});
}

// ==================================================================================
var current_but_sel
var already_built_cluster_file = []

function fill_cluster_buttons() {
	$.get("./data/" + current_request_id + "/clusters", function(data) {
		already_built_cluster_file = []
		$("#cluster-buttons").empty();
		lines = data.split("\n");
		lines.forEach(function(line) {
			console.log(line);
			var fields = line.split("@@");
			var but_sel = "#cb-" + fields[3];
			if (fields[0] == "<CLUSTER>") {
				$("#cluster-buttons").append('<button type="button" class="btn btn-default" id="cb-' + fields[3] + '"><span class="badge badge-pill badge-info">' + fields[2] + '</span>' + fields[1] + '</button>');
				$(but_sel).click(function() {
					if (current_but_sel != but_sel) {
						if (current_but_sel) {
							$(current_but_sel).removeClass("btn-success");
							$(current_but_sel).addClass("btn-default");
						}
						$(but_sel).removeClass("btn-default");
						$(but_sel).addClass("btn-success");
						current_but_sel = but_sel;

						$('#results-block').show();
						current_line_num = 0;
						$("#results-list").empty();
						result_nb = 0;
						current_view = 0;

						if (jQuery.inArray(fields[3], already_built_cluster_file) == -1) {
							// new cluster, call the server
							build_cluster_file(fields[3]);
							already_built_cluster_file.push(fields[3]);
						} else {
							// already printed cluster -> only reload the file
							cluster_file = fields[3];
							load_cluster_file();
						}
					}
				})
			}
		});
	});
}

// ==================================================================================
function build_cluster_file(index) {
	var data = {
		id: current_request_id,
		cluster: index
	};
	current_cluster = index;
	$.ajax({
		url: 'ajaxGrew.php',
		dataType: 'text',
		data: data,
		type: 'post',
		success: function(id) {
			load_cluster_file();
		}
	});
}





// ==================================================================================
function load_cluster_file() {
	$.get("./data/" + current_request_id + "/cluster_" + current_cluster, function(data) {
		lines = data.split("\n");
		for (var i = current_line_num, len = lines.length; i < len; i++) {
			var pieces = lines[i].split("@@");
			if (pieces[0] == '<END>') {
				$("#next-results").prop('disabled', true);
			} else if (pieces[0] == '<PAUSE>') {
				$("#next-results").prop('disabled', false);
			} else if (pieces[0] == '<ITEM>') {
				$("#results-list").append('<li class="item" id="list-' + result_nb + '"><a>' + pieces[2] + '</a></li>');
				url = './data/' + current_request_id + '/' + pieces[1];
				$('#list-' + result_nb).click({
					url: url,
					i: result_nb,
					coord: pieces[3],
					sentence: pieces[4]
				}, display_picture);
				result_nb++;
				update_progress_num();
			}
		}
		update_view();
		$("#display-sentence").show();
		current_line_num = lines.length - 1; // prepare position for next parsing
	});
}

// ==================================================================================
function display_picture(event) {
	var newHtml = "<object id=\"result-pic\" type=\"image/svg+xml\" class=\"logo\" data=\"" + event.data.url + "\" > </object>";
	document.getElementById('display-svg').innerHTML = newHtml;

	$('#results-list li').removeClass('displayed');
	$('#list-' + event.data.i).addClass('displayed');
	var w = $("#display-svg").width();
	$("#display-svg").animate({
		scrollLeft: event.data.coord - w / 2
	}, "fast");
	$("#sentence-txt").html(event.data.sentence);

	current_view = event.data.i;
	update_progress_num();
}

// ==================================================================================
function show_modal() {
	$.get('./data/' + current_request_id + '/export.tsv', function(data) {
		lines = data.split("\n");
		html = "<table class=\"export-table\">";

		html += "<colgroup>";
		html += "<col width=\"45%\" />";
		html += "<col width=\"10%\" />";
		html += "<col width=\"45%\" />";
		html += "</colgroup>";

		for (var i in lines) {
			html += "<tr><td>\n";
			html += lines[i].replace(/\t/g, "</td><td>");;
			html += "\n";
			html += "</td></tr>\n";
		}
		html += "</table>";

		$("#exportResult").html(html);
	});
	$('#exportModal').modal('show');
}


// ==================================================================================
function export_tsv() {
	if (current_request_id.length > 0) {
		if (already_exported) {
			show_modal();
		} else {
			$.ajax({
				url: 'export.php',
				dataType: 'text',
				data: {
					id: current_request_id
				},
				type: 'post',
				success: function(output) {
					already_exported = true;
					show_modal();
				},
				error: function(x) {
					alert(x);
				}
			});
		}
	} else {
		sweetAlert("An error occured", "You can't export before searching.", "error");
	}
}

// ==================================================================================
function download() {
	window.location = './data/' + current_request_id + '/export.tsv';
}
// ==================================================================================
function save_pattern() {
	if (cmEditor.getValue().length > 0 && current_request_id.length > 0) {
		$.ajax({
			url: 'shorten.php',
			dataType: 'text',
			data: {
				pattern: cmEditor.getValue(),
				id: current_request_id
			},
			type: 'post',
			success: function(output) {
				history.pushState({
					id: output
				}, "Grew - Custom saved pattern", "?corpus=" + current_corpus + "&custom=" + output);
				$('#custom-url').text(window.location.href);
				$('#custom-display').show();
				SelectText("custom-url");
			},
			error: function(x) {
				alert(x)
			}
		});
	} else {
		sweetAlert("An error occured", "You can't save pattern before searching for it.", "error");
	}
}

// ==================================================================================
function SelectText(element) {
	var doc = document,
		text = doc.getElementById(element),
		range, selection;
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
		$('#results-navig').show();
		$('#display-svg').show();
		$("#progress-num").text((current_view + 1) + " / 	" + result_nb);
	}
}

// ==================================================================================
function update_view() {
	$('#list-' + current_view).trigger("click");
	update_progress_num();
}

// ==================================================================================
function first_svg() {
	if (current_view > 0) {
		current_view = 0;
		update_view();
	}
}

// ==================================================================================
function previous_svg() {
	if (current_view > 0) {
		current_view -= 1;
		update_view();
	}
}

// ==================================================================================
function next_svg() {
	if (current_view < result_nb - 1) {
		current_view += 1;
		update_view();
	}
}

// ==================================================================================
function last_svg() {
	if (current_view < result_nb - 1) {
		current_view = result_nb - 1;
		update_view();
	}
}

// ==================================================================================
function init_sidebar() {
	$('#sidebarCollapse').on('click', function() {
		$('#sidebar').toggleClass('active');
		update_but_text();
	});
}

// ==================================================================================
function update_but_text() {
	if ($('#sidebar').hasClass('active')) {
		$('#but-text').html("Hide corpora list");
	} else {
		$('#but-text').html("Show corpora list");
	}
}


// ==================================================================================
function init_table_button() {
	$('#tables').on('click', function() {
		window.open('_tables/' + current_corpus + '.html');
	});
}

// ==================================================================================
function init_log_button() {
	$('#logs').on('click', function() {
		window.open('_logs/' + current_corpus + '.log');
	});
}


// ==================================================================================
function escape(s) {
	s1 = s.split('@').join('_AT_');
	s2 = s1.split('.').join('_DOT_');
	return s2;
}

// ==================================================================================
function set_corpus(corpus) {
	current_corpus = corpus;
	update_corpus()
}

// ==================================================================================
function update_corpus() {
	// set the corpus name
	$('#corpus-fixed').html(current_corpus);

	current_snippets = get_info(current_corpus, "snippets");
	if (current_snippets == "") {
		right_pane(current_group)
	} else {
		right_pane(current_group + "/" + current_snippets);
	}

	$(".selected_corpus").removeClass("selected_corpus");
	$('#' + escape(current_corpus)).addClass("selected_corpus");

	if (current_folder != undefined) {
		$("#" + current_folder).collapse('show');
	}

	$('#corpus-desc').html("");
	$.get("_descs/" + current_corpus + ".html", function(data) {
		$('#corpus-desc').html(data);
	});

	// Show the errors button only if there is a not empty log_file
	$.get("_logs/" + current_corpus + ".log", function(data) {
		if (data.length > 0) {
			$('#logs').show();
		} else {
			$('#logs').hide();
		}
	}).fail(function() {
		$('#logs').hide();
	});
}

// ==================================================================================
function select_group(group, corpus) {
	current_group = group;
	current_corpus = corpus;
	update_group();
}

// ==================================================================================
function update_group() {

	// update labels of checkboxes
	if (current_group == "amr") {
		set_amr();
	} else {
		set_ud();
	}

	// sidebar open and button visible
	$('#sidebar').addClass('active');
	update_but_text();
	$('#sidebarCollapse').show();

	// Change background of selecte group
	$(".group").removeClass("active");
	$("#top-" + current_group).addClass("active");
	// sidebar

	corpora = get_corpora_from_group(current_group);

	html = "";
	$.each(corpora, function(index, value) {
		if ("section" in value) {
			html += '<div class="sidebar-header">\n';
			html += '  <h3>' + value["section"] + '</h3>\n';
			html += '</div>\n';
		} else if ("id" in value) {
			id = value["id"];
			esc_id = escape(id);
			if ("name" in value) {
				name = value["name"];
			} else {
				name = id;
			}
			html += '<div class="corpus">\n';
			html += '<table id="' + esc_id + '" class="table" onclick="set_corpus(\'' + id + '\');return false;" href="#">\n';
			html += '<tr><td class="alone">\n';
			html += '<span class="glyphicon glyphicon-align-justify"></span>\n';
			html += name + '\n';
			if (value["no_word"]) {
				html += '<object type="image/svg+xml" data="icon/no_word.svg" width="20" height="20" style="float: right;"></object>'
			}
			if (value["enhanced"]) {
				html += '<object type="image/svg+xml" data="icon/enhanced.svg" width="20" height="20" style="float: right;"></object>'
			}
			html += '</td></tr>\n';
			html += '</table>\n';
			html += '</div>\n';
		} else {
			var href = "none"
			if (value["href"]) {
				href = value["href"];
			} else {
				href = value["folder"].replace(" ", "_");
			}
			html += '<div class="panel panel-default">\n';
			html += '<div class="panel-heading">\n';
			html += '<h4 class="panel-title">\n';
			html += '<a data-toggle="collapse" href="#' + href + '" id="folder_' + href + '">\n';
			html += '<span class="glyphicon glyphicon-folder-open"></span>\n';
			html += value["folder"] + '\n';
			html += '</a>\n';
			html += '</h4>\n';
			html += '</div>\n';
			html += '<div id="' + href + '" class="panel-collapse collapse">\n';
			html += '<div class="panel-body">\n';
			html += '<table class="table">\n';
			$.each(value["corpora"], function(index, value) {
				id = value["id"];
				esc_id = escape(id);
				html += '<tr id="' + esc_id + '" class="corpus" onclick="set_corpus(\'' + id + '\');return false;"><td>\n';
				html += '<a href="#" >\n';
				html += '<span class="glyphicon glyphicon-align-justify"></span>\n';
				html += id + '\n';
				html += '</a>\n';
				if (value["no_word"]) {
					html += '<object type="image/svg+xml" data="icon/no_word.svg" width="20" height="20" style="float: right;"></object>'
				}
				if (value["enhanced"]) {
					html += '<object type="image/svg+xml" data="icon/enhanced.svg" width="20" height="20" style="float: right;"></object>'
				}
				html += '</td></tr>\n';
			});
			html += '</table>\n';
			html += '</div>\n';
			html += '</div>\n';
			html += '</div>\n';
		}
	});
	$('#accordion').html(html);
	update_corpus();
}

// ==================================================================================
function set_ud() {
	$("#tables").show();
	$("#xpos-option").show();
	$("#upos-option").show();
	$("#lemma-option").show();
	$("#add_feats-option").show();
	$("#add_feats-label").show();
	$("#export-button").show();
}

// ==================================================================================
function set_amr() {
	$("#tables").hide();
	$("#xpos-option").hide();
	$("#upos-option").hide();
	$("#lemma-option").hide();
	$("#add_feats-option").hide();
	$("#add_feats-label").hide();
	$("#export-button").hide();
}