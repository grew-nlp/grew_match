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
var current_pivot;
var current_pivots;

var current_but_sel
var already_built_cluster_file = []

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
  $('#warning').hide();
  current_corpus = undefined;
  current_folder = undefined;
  current_group = undefined;
  best_ld = Number.MAX_SAFE_INTEGER;
  group_list = current_data["groups"];
  for (var g = 0; g < group_list.length; g++) {
    corpora = group_list[g]["corpora"];
    for (var c = 0; c < corpora.length; c++) {
      if (corpora[c]["id"] != undefined) {
        ld = levenshtein(requested_corpus, corpora[c]["id"]);
        if (ld == 0) {
          current_corpus = corpora[c]["id"];
          current_group = group_list[g]["id"];
          return;
        }
        if (ld < best_ld) {
          best_ld = ld;
          current_corpus = corpora[c]["id"];
          current_group = group_list[g]["id"];
        }
      }
      if (corpora[c]["folder"] != undefined) {
        subcorpora = corpora[c]["corpora"];
        for (var cc = 0; cc < subcorpora.length; cc++) {
          ld = levenshtein(requested_corpus, subcorpora[cc]["id"]);
          if (ld == 0) {
            current_corpus = subcorpora[cc]["id"];
            current_folder = corpora[c]["folder"];
            current_group = group_list[g]["id"];
            return;
          }
          if (ld < best_ld) {
            best_ld = ld;
            current_corpus = subcorpora[cc]["id"];
            current_folder = corpora[c]["folder"];
            current_group = group_list[g]["id"];
          }
        }
      }
    }
  }
  // no exact matching
  $('#warning-text').html("Warning: " + requested_corpus + " &rarr; " + current_corpus);
  $('#warning').show();
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
  $('#snd_feat-tooltip').tooltipster('content', $("#snd_feat-tip").html());
  $('#warning-tooltip').tooltipster('content', $("#warning-tip").html());


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

  // Initialise CodeMirror
  cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
    lineNumbers: true,
  });

  init_navbar();

  deal_with_get_parameters();

  // Binding on CodeMirror change
  cmEditor.on("change", function() {
    disable_save();
  });

  $('#cluster-key').bind('input', function() {
    disable_save();
  });

  $('#cluster-box').change(function() {
    disable_save();
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
function disable_save() {
  $('#save-button').prop('disabled', true);
  $('#export-button').prop('disabled', true);
  $('#custom-display').hide();
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
  search_corpus("UD_English-GUM@2.5");
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
    search_corpus(getParameterByName("corpus"));
  };

  // custom get parameter
  if (getParameterByName("custom").length > 0) {
    get_custom = getParameterByName("custom");
    get_cluster = getParameterByName("clustering");
    if (get_cluster.length > 0) {
      $('#cluster-box').prop('checked', true);
      $('#cluster-span').show();
      $('#cluster-key').val(get_cluster);
    }
    $.get('./data/shorten/' + get_custom, function(pattern) {
      cmEditor.setValue(pattern);
      search_pattern();
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
    search_pattern();
  }

  if (getParameterByName("eud").length > 0) {
    $('#eud-box').bootstrapToggle('on');
  } else {
    $('#eud-box').bootstrapToggle('off')
  }
}

// ==================================================================================
function set_cluster_key(key) {
  $('#cluster-box').prop('checked', true);
  $('#cluster-span').show();
  $('#cluster-key').val(key);
}

// ==================================================================================
function clean_cluster_key() {
  $('#cluster-box').prop('checked', false);
  $('#cluster-span').hide();
  $('#cluster-key').val("");
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

      clustering = $(this).attr('clustering');
      if (clustering) {
        set_cluster_key(clustering);
      } else {
        clean_cluster_key();
      }

      // Update of the textarea
      $.get(dir + "/" + file, function(pattern) {
        cmEditor.setValue(pattern);
      });
    });
  });
}

// ==================================================================================
function report_error(id) {
  $.get('./data/' + id + '/error', function(errors) {
    sweetAlert("An error occurred", errors, "error");
  });
}

// ==================================================================================
function next_results() {
  var data = {
    request: "NEXT",
    id: current_request_id,
    cluster: current_cluster
  };
  $.ajax({
    url: 'main.php',
    dataType: 'text',
    data: data,
    type: 'post',
    success: function(reply) {
      var fields = reply.split("@@");
      var id = fields[0];
      var msg = fields[1];

      if (msg == 'ERROR') {
        report_error(id);
      } else {
        load_cluster_file();
      }
    },
    error: function(x) {
      alert("Ajax error:" + JSON.stringify(x));
    }
  });
}

// ==================================================================================
function search_pattern() {
  $('#results-block').hide();
  $('#cluster-block').hide();
  $('#results-list').empty();
  current_line_num = 0;
  result_nb = 0;
  current_view = 0;
  var data = {
    request: "NEW",
    pattern: cmEditor.getValue(),
    corpus: current_corpus,
    lemma: $('#lemma-box').prop('checked'),
    upos: $('#upos-box').prop('checked'),
    xpos: $('#xpos-box').prop('checked'),
    features: $('#features-box').prop('checked'),
    add_feats: $('#add_feats-box').prop('checked'),
    order: $('#sentences-order').val(),
    context: $('#context-box').prop('checked'),
    eud2ud: !($('#eud-box').prop('checked')),
  };
  if ($('#cluster-box').prop('checked')) {
    data['cluster'] = $('#cluster-key').val();
  }
  $.ajax({
    url: 'main.php',
    dataType: 'text',
    data: data,
    type: 'post',
    success: function(reply) {
      var fields = reply.split("@@");
      var id = fields[0];
      var msg = fields[1];

      if (msg == 'ERROR') {
        report_error(id);
      } else {

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
            $("#cluster-buttons").empty();
            for (var i = current_line_num, len = lines.length; i < len; i++) {
              var fields = lines[i].split("@@");
              if (fields[0] == '<EMPTY>') {
                $("#next-results").prop('disabled', true);
                $('#results-navig').hide();
                $('#display-sentence').hide();
                $('#display-svg').hide();
                $('#progress-txt').text('No results found');
                $("#export-button").prop('disabled', true);
                $('#results-block').show();
                $('#cluster-block').show();
              } else if (fields[0] == '<TOTAL>') {
                $('#progress-txt').html(fields[1] + ' occurrence' + ((fields[1] > 1) ? 's' : '') + ' <span style="font-size: 60%">[' + fields[2] + 's]</span>');
              } else if (fields[0] == '<OVER>') {
                $('#progress-txt').html('More than 1000 results found in ' + fields[1] + '% of the corpus' + ' <span style="font-size: 60%">[' + fields[2] + 's]</span>');
              } else if (fields[0] == '<ONECLUSTER>') {
                current_cluster = 0;
                load_cluster_file();
                $('#results-block').show();
                $('#cluster-block').show();
              } else if (fields[0] == '<CLUSTERS>') {
                fill_cluster_buttons();
              } else if (fields[0] == '<PIVOTS>') {
                current_pivots = fields.slice(1).reverse();
                update_modal_pivot();
              }
            };
          }
        });
      }
    },
    error: function(x) {
      alert("Ajax error:" + JSON.stringify(x));
    }
  });
}

// ==================================================================================
function update_modal_pivot() {
  if (current_pivots.length > 1) {
    $("#pivot-list").html("");
    current_pivots.forEach(function(pivot) {
      var text = "<p><button type=\"button\" class=\"btn btn-primary\" onclick=\"javascript:chose_pivot('" + pivot + "')\">" + pivot + "</button></p>\n";
      $("#pivot-list").append(text);
    });
  }
}

// ==================================================================================
function fill_cluster_buttons() {
  $.get("./data/" + current_request_id + "/clusters", function(data) {
    current_but_sel = undefined;
    already_built_cluster_file = [];
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
            $('#cluster-block').show();
            current_line_num = 0;
            $("#results-list").empty();
            result_nb = 0;
            current_view = 0;

            current_cluster = fields[3]

            if (jQuery.inArray(current_cluster, already_built_cluster_file) == -1) {
              // new cluster, call the server
              next_results();
              already_built_cluster_file.push(current_cluster);
            } else {
              // previously seen cluster -> only reload the file
              load_cluster_file();
            }
          }
        })
      }
    });
  });
  $('#cluster-block').show();
}

// ==================================================================================
function load_cluster_file() {
  $.get("./data/" + current_request_id + "/cluster_" + current_cluster, function(data) {
    lines = data.split("\n");
    for (var i = current_line_num, len = lines.length; i < len; i++) {
      var fields = lines[i].split("@@");
      if (fields[0] == '<END>') {
        $("#next-results").prop('disabled', true);
      } else if (fields[0] == '<PAUSE>') {
        $("#next-results").prop('disabled', false);
      } else if (fields[0] == '<ITEM>') {
        $("#results-list").append('<li class="item" id="list-' + result_nb + '"><a>' + fields[2] + '</a></li>');
        url = './data/' + current_request_id + '/' + fields[1];
        $('#list-' + result_nb).click({
          url: url,
          i: result_nb,
          coord: fields[3],
          sentence: fields[4]
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
function show_export_modal() {
  $.get('./data/' + current_request_id + '/export.tsv', function(data) {
    lines = data.split("\n");

    var data
    var headers = lines[0].split("\t");

    if (headers.length == 2) {
      data = "<table class=\"export-table-2\">";
      data += "<colgroup><col width=\"10%\" /><col width=\"90%\" /></colgroup>";
    } else {
      data = "<table class=\"export-table-4\">";
      data += "<colgroup><col width=\"10%\" /><col width=\"40%\" align=\"right\" /><col width=\"10%\" /><col width=\"40%\" /></colgroup>";
    }

    // headers
    data += "<tr><th>" + lines[0].replace(/\t/g, "</th><th>") + "</th></tr>\n";

    lines.slice(1).forEach(line => {
      data += "<tr><td>" + line.replace(/\t/g, "</td><td>") + "</td></tr>\n";
    });
    data += "</table>";

    $("#exportResult").html(data);
  });
  $('#export-modal').modal('show');
}

// ==================================================================================
function run_export() {
  if (current_pivots.length > 1) {
    $('#pivot-modal').modal('show');
  } else if (current_pivots.length == 1) {
    current_pivot = current_pivots[0];
    export_tsv();
  } else {
    current_pivot = undefined;
    export_tsv();
  }
}

// ==================================================================================
function chose_pivot(pivot) {
  $('#pivot-modal').modal('hide');
  current_pivot = pivot;
  export_tsv();
}

// ==================================================================================
function export_tsv() {
  var data = {
    request: "EXPORT",
    id: current_request_id,
    pivot: current_pivot,
  };
  $.ajax({
    url: 'main.php',
    dataType: 'text',
    data: data,
    type: 'post',
    success: function(reply) {
      var fields = reply.split("@@");
      var id = fields[0];
      var msg = fields[1];

      if (msg == 'ERROR') {
        report_error(id);
      } else {
        show_export_modal();
      }
    },
    error: function(x) {
      alert("Ajax error:" + JSON.stringify(x));
    }
  });
}

// ==================================================================================
function download() {
  window.location = './data/' + current_request_id + '/export.tsv';
}

// ==================================================================================
function save_pattern() {
  let clustering = "";
  if ($('#cluster-box').prop('checked')) {
    clustering = "&clustering=" + $('#cluster-key').val();
  }

  var eud = "";
  if (get_info(current_corpus, "enhanced") && $('#eud-box').prop('checked')) {
    eud = "&eud=yes"
  }

  if (current_request_id.length > 0) {
    var data = {
      request: "SHORTEN",
      pattern: cmEditor.getValue(),
      id: current_request_id
    };
    $.ajax({
      url: 'main.php',
      dataType: 'text',
      data: data,
      type: 'post',
      success: function(output) {
        history.pushState({
            id: output
          },
          "Grew - Custom saved pattern",
          "?corpus=" + current_corpus + "&custom=" + output + clustering + eud
        );
        $('#custom-url').text(window.location.href);
        $('#custom-display').show();
        SelectText("custom-url");
      },
      error: function(x) {
        alert("Ajax error:" + JSON.stringify(x));
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
    $("#progress-num").text((current_view + 1) + " / " + result_nb);
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
  $("#warning").hide();
  history.pushState({},
    "Grew - " + current_corpus,
    "?corpus=" + current_corpus
  );
  update_corpus()
}

// ==================================================================================
function update_corpus() {
  // set the corpus name
  $('#corpus-fixed').html(current_corpus);

  if (get_info(current_corpus, "enhanced")) {
    $("#eud-span").show();
  } else {
    $("#eud-span").hide();
  }

  disable_save();

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

// taken from: https://rosettacode.org/wiki/Levenshtein_distance#JavaScript
function levenshtein(a, b) {
  var t = [],
    u, i, j, m = a.length,
    n = b.length;
  if (!m) {
    return n;
  }
  if (!n) {
    return m;
  }
  for (j = 0; j <= n; j++) {
    t[j] = j;
  }
  for (i = 1; i <= m; i++) {
    for (u = [i], j = 1; j <= n; j++) {
      u[j] = a[i - 1] === b[j - 1] ? t[j - 1] : Math.min(t[j - 1], t[j], u[j - 1]) + 1;
    }
    t = u;
  }
  return u[n];
}