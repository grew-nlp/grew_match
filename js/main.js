var current_snippets;
var current_cluster;
var current_pivot;
var current_pivots;

var current_but_sel;
var already_built_cluster_file = [];

var hack_audio;

// ==================================================================================
var app = new Vue({
  el: '#app',
  data: {

    metadata_open: false,

    corpora_filter: "",

    config: undefined,
    backend_server: undefined,

    left_pane: false, // true iff interface use left_pane
    view_left_pane: false, // true iff the left_pane is open

    tuto_active: false,

    current_group_id: undefined,
    current_group: undefined,
    current_corpus: {},
    current_corpus_id: undefined,
    corpus_desc: "",
    current_request_id: "",
    current_view: 0,
    result_nb: 0,

    meta_info: false,
    meta_table: "", // URL to relation table or ""
    meta_sud_valid: "", // URL to SUD validation page or ""
    meta_ud_valid: "", // URL to UD validation page or ""
    meta_log: "", // URL to non-empty log page or ""

    clust1: "no", // 3 possible values: no, key or whether
    clust1_key: "",
    clust1_whether: "",

    clust2: "no", // 3 possible values: no, key or whether

    sent_metadata: {},

    code: "",

    mode: "",

    sent_id: "",

    parallel: "no",
    parallels: [],
    parallel_svg: undefined,
    parallel_message: "",

    wait: false,

    // printing parameters
    lemma: true,
    upos: true,
    xpos: false,
    features: true,
    tf_wf: false,
    context: false,

    audio: false,
    svg_link: "",
  },
  methods: {
    update_parallel_() {
      update_parallel();
    },
    set_corpus_(id) {
      set_corpus(id);
    },
    select_group_(group_id, corpus_id) {
      select_group(group_id, corpus_id);
    },
    select_corpus_event(event) {
      const corpus_id = event.target.id;
      if (corpus_id != app.current_corpus_id) {
        app.current_corpus_id = corpus_id;
        update_corpus();
      }
    },



  },
  computed: {
    top_project: function() {
      if (this.config != undefined) {
        return this.config["top_project"]
      }
    },
    tuto: function() {
      if (this.config != undefined) {
        return this.config["tuto"]
      }
    },
    groups: function() {
      if (this.config != undefined) {
        return this.config["groups"]
      }
    },
    number_of_corpora: function() {
      if (this.aaa_current_group) {
        console.log(this.aaa_current_group["corpora"].length);
        return this.aaa_current_group["corpora"].length;
      }
    },
    filtered_corpora_list: function() {
      var self = this;
      if (this.aaa_current_group) {
        return this.aaa_current_group["corpora"].filter(function(corpus) {
          return corpus.id.toLowerCase().indexOf(self.corpora_filter.toLowerCase()) >= 0;
        });
      }
    },
    aaa_current_group: function() {
      if (this.config) {
        groups = app.config["groups"];
        for (var g = 0; g < groups.length; g++) {
          if (groups[g]["id"] == app.current_group_id) {
            return groups[g];
          }
        }
      }
    }
  }
});

// ==================================================================================
function get_corpora_from_group(group_id) {
  group_list = app.config["groups"];
  for (var g = 0; g < group_list.length; g++) {
    if (group_list[g]["id"] == group_id) {
      return group_list[g]["corpora"];
    }
  }
}

// ==================================================================================
function update_current_group(group_id) {
  groups = app.config["groups"];
  for (var g = 0; g < groups.length; g++) {
    if (groups[g]["id"] == group_id) {
      app.current_group = groups[g];
    }
  }
}

// ==================================================================================
// search for the requested field in the json object which contains the "id" corpus
function get_info(corpus, field) {
  function aux() {
    group_list = app.config["groups"];
    for (var g = 0; g < group_list.length; g++) {
      let group = group_list[g];
      let group_value = group[field]; // the "field" value can be defined at the group level
      corpora = group_list[g]["corpora"];
      for (var c = 0; c < corpora.length; c++) {
        if (corpora[c]["id"] == corpus) {
          if (corpora[c][field] != undefined) {
            return (corpora[c][field]) // the "field" value can be defined at the corpus level
          } else {
            return (group_value);
          }
        }
      }
    }
  }
  snip_opt = aux();
  // replace undefined by ""
  if (snip_opt != undefined) {
    return snip_opt
  } else {
    return ""
  }
}

// ==================================================================================
// update the 4 global variables: app.current_corpus, app.current_corpus_id, app.current_group, app.current_group_id
function search_corpus(requested_corpus) {
  console.log(requested_corpus);
  $('#warning').hide();
  app.current_corpus = undefined;
  app.current_corpus_id = undefined;
  app.current_group_id = undefined;
  app.current_group = undefined;
  best_cpl = 0;
  best_ld = Number.MAX_SAFE_INTEGER;
  group_list = app.config["groups"];
  for (var g = 0; g < group_list.length; g++) {
    let group = group_list[g];
    corpora = group_list[g]["corpora"];
    for (var c = 0; c < corpora.length; c++) {
      if (corpora[c]["id"] != undefined) {
        if (requested_corpus == corpora[c]["id"]) {
          app.current_corpus = corpora[c];
          app.current_corpus_id = corpora[c]["id"];
          app.current_group = group_list[g];
          app.current_group_id = group_list[g]["id"];
          app.mode = app.current_group["mode"];
          return;
        }
        cpl = common_prefix_length(requested_corpus, corpora[c]["id"]);
        ld = levenshtein(requested_corpus, corpora[c]["id"]);
        if ((cpl > best_cpl) || (cpl == best_cpl && ld < best_ld)) {
          best_cpl = cpl;
          best_ld = ld;
          app.current_corpus = corpora[c];
          app.current_corpus_id = corpora[c]["id"];
          app.current_group = group_list[g];
          app.current_group_id = group_list[g]["id"];
          app.mode = app.current_group["mode"];
        }
      }
    }
  }
  // no exact matching
  $('#warning-text').html("⚠️ " + requested_corpus + " &rarr; " + app.current_corpus_id);
  $('#warning').show();
}


// ==================================================================================
// this function is run after page loading
$(document).ready(function() {
  $.getJSON("corpora/config.json")
    .done(function(data) {
      app.config = data;
      init();
    });

  $('.tooltip-desc').tooltipster({
    contentAsHTML: true,
    theme: 'tooltipster-noir',
    interactive: true,
    position: 'bottom'
  });

  // Long HTML tooltip are defined in run.html
  $('#tf-wf-tooltip').tooltipster('content', $("#tf-wf-tip").html());
  $('#warning-tooltip').tooltipster('content', $("#warning-tip").html());

  $('#export-button').tooltipster('content', "Export the sentence text of each occurrence like in a concordancer");
  $('#save-button').tooltipster('content', "Build a permanent URL with the current request");
  $('#conll-button').tooltipster('content', "Show the CoNLL code of the current dependency tree");

  $('#github-button').tooltipster('content', "GitHub repository");
  $('#link-button').tooltipster('content', "External link");
  $('#sud-valid-button').tooltipster('content', "SUD validation (new page)");
  $('#ud-valid-button').tooltipster('content', "UD validation (new page)");
  $('#table-button').tooltipster('content', "Relation tables (new page)");

  $('[data-toggle="collapse"]').click(function() {
    $(this).toggleClass("active");
    if ($(this).hasClass("active")) {
      $(this).html('Metadata <span id="md-icon" class="glyphicon glyphicon-chevron-down"></span>');
    } else {
      $(this).html('Metadata <span id="md-icon" class="glyphicon glyphicon-chevron-right"></span>');
    }
  });
});

// ==================================================================================
function init() {
  console.log(app.config);
  search_corpus(app.config["default"]);

  $('#save-button').prop('disabled', true);
  $('#export-button').prop('disabled', true);

  if (app.config["backend_server"] == undefined) {
    direct_error("Undefined `backend_server` in config file")
  } else {
    app.backend_server = app.config["backend_server"]
  }

  // Initialise CodeMirror
  cmEditor = CodeMirror.fromTextArea(document.getElementById("pattern-input"), {
    lineNumbers: true,
  });

  // Initialise CodeMirror
  clust1_cm = CodeMirror.fromTextArea(document.getElementById("whether-input1"), {
    lineNumbers: true,
  });

  // Initialise CodeMirror
  clust2_cm = CodeMirror.fromTextArea(document.getElementById("whether-input2"), {
    lineNumbers: true,
  });

  deal_with_get_parameters();

  // Binding on CodeMirror change
  cmEditor.on("change", function() {
    disable_save();
    let current_pat = cmEditor.getValue();
    if (current_pat.includes("_MISC_") || current_pat.includes("_UD_")) {
      $('#submit-pattern').prop('disabled', true);
      $('#warning-misc').show();
    } else {
      $('#submit-pattern').prop('disabled', false);
      $('#warning-misc').hide();
    }
  });

  $('#clust1-key').bind('input', function() {
    disable_save();
  });

  $('input:radio[name="clust1"]').change(function() {
    disable_save();
  });

  if (!app.tuto_active && app.aaa_current_group["style"] != "dropdown") {
    app.left_pane = true;
    app.view_left_pane = true;
  } else {
    update_corpus();
  }
}

// ==================================================================================
function disable_save() {
  $('#save-button').prop('disabled', true);
  $('#export-button').prop('disabled', true);
  $('#custom-display').hide();
}

// ==================================================================================
function start_tuto() {
  app.tuto_active = true;
  search_corpus(app.tuto.corpus);

  history.pushState({},
    "Grew - " + app.current_corpus_id,
    "?tutorial=yes"
  );

  update_corpus();
  app.left_pane = false;
  app.view_left_pane = false;
}

// ==================================================================================
// force to interpret get parameters after the update of groups menus
function deal_with_get_parameters() {

  // corpus get parameter
  if (getParameterByName("tutorial") == "yes") {
    start_tuto();
  } else

  if (getParameterByName("corpus").length > 0) {
    search_corpus(getParameterByName("corpus"));
  };

  // custom get parameter
  if (getParameterByName("custom").length > 0) {
    get_custom = getParameterByName("custom");

    $.get(app.backend_server + "/shorten/" + get_custom, function(pattern) {
      cmEditor.setValue(pattern);
      setTimeout(search_pattern, 150); // hack: else clust1_cm value is not taken into account.
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

  if (getParameterByName("pattern").length > 0) {
    cmEditor.setValue(getParameterByName("pattern"));
    search_pattern();
  }

  // NB: this is run only if no custom, relation or pattern (select UD by default)
  if (getParameterByName("eud").length > 0) {
    $('#eud-box').bootstrapToggle('on');
  } else {
    $('#eud-box').bootstrapToggle('off')
  }


  const get_cluster = getParameterByName("clustering");
  const whether = getParameterByName("whether");
  if (get_cluster.length > 0) {
    app.clust1 = "key";
    app.clust1_key = get_cluster;
  } else if (whether.length > 50) { // TODO check 50?
    app.clust1 = "whether";
    setTimeout(function() {
      clust1_cm.setValue(whether); // hack for correct init of clust1_cm
    }, 50)
  } else {
    app.clust1 = "no";
  }

}

// ==================================================================================
// Binding for interactive part in snippets part
function right_pane(base) {
  if (app.tuto_active) {
    dir = "corpora/tuto";
  } else {
    dir = "corpora/" + base
  }
  $.get(dir + "/right_pane.html", function(data) {
    $('#right-pane').html(data);
    $(".inter").click(function() {
      app.clust1 = "no"; // default value
      const clustering = $(this).attr('clustering');
      if (clustering) {
        app.clust1 = "key";
        app.clust1_key = clustering;
      }
      const whether = $(this).attr('whether');
      if (whether) {
        app.clust1 = "whether";
        // setValue is behind timeout to ensure proper cm update
        setTimeout(function() { // hack for correct update of clust1_cm
          clust1_cm.setValue(whether);
        }, 0)
      }
      // Update of the textarea
      const file = dir + "/" + $(this).attr('snippet-file');
      $.get(file, function(pattern) {
          cmEditor.setValue(pattern);
        })
        .error(function() {
          direct_error("Cannot find file `" + file + "`")
        });
    });
  });
}

// ==================================================================================
function direct_error(msg) {
  let html = md.render(msg)
  Swal.fire({
    icon: 'error',
    title: 'An error occurred',
    html: html
  })
}


// ==================================================================================
function ping(url, set_fct) {
  var form = new FormData();
  var settings = {
    "url": url,
    "method": "HEAD",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response) {
      console.log(url + "--> YES");
      set_fct(true);
    })
    .fail(function() {
      console.log(url + "--> NO");
      set_fct(false);
    });
}


// ==================================================================================
function request(service, form, data_fct, error_fct) {
  var settings = {
    "url": app.backend_server + service,
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function(response_string) {
      response = JSON.parse(response_string);
      if (response.status === "ERROR") {
        if (error_fct === undefined) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            html: JSON.stringify(response.message),
          });
        } else {
          error_fct(response.message);
        }
      } else if (response.status === "BUG") {
        Swal.fire({
          icon: 'error',
          title: 'An BUG occurred, please report',
          html: JSON.stringify(response.exception),
        });
      } else {
        console.log("Success request to service: " + service + "-->" + response.data);
        data_fct(response.data);
      }
    })
    .fail(function() {
      Swal.fire({
        icon: 'error',
        title: 'Connection fail',
        html: md.render("The `" + service + "` service is not available."),
      });
    });
}

// ==================================================================================
function next_results() {
  var param = {
    uuid: app.current_request_id,
    cluster_index: current_cluster
  };

  var form = new FormData();
  form.append("param", JSON.stringify(param));

  request("next", form, function(data) {
    load_cluster_file();
  })
}

// ==================================================================================
function search_pattern() {

  $('#results-block').hide();
  $('#cluster-block').hide();
  $('#results-list').empty();

  current_line_num = 0;
  app.result_nb = 0;
  app.current_view = 0;

  var param = {
    pattern: cmEditor.getValue(),
    corpus: app.current_corpus_id,
    lemma: app.lemma,
    upos: app.upos,
    xpos: app.xpos,
    features: app.features,
    tf_wf: app.tf_wf,
    order: $('#sentences-order').val(),
    context: app.context,
    eud2ud: (
      (get_info(app.current_corpus_id, "enhanced") != "") &&
      !($('#eud-box').prop('checked'))
    ),
    clust1: app.clust1,
  };

  if (app.clust1 == "key") {
    param.clust1_data = app.clust1_key;
  }
  if (app.clust1 == "whether") {
    param.clust1_data = "{\n" + clust1_cm.getValue() + "\n}";
  }

  var form = new FormData();
  form.append("param", JSON.stringify(param));

  app.wait = true;
  request("new", form, function(data) {

    app.current_request_id = response.data

    // set the writting direction
    if (get_info(app.current_corpus_id, "rtl")) {
      $('#sentence-txt').attr("dir", "rtl");
    } else {
      $('#sentence-txt').removeAttr("dir");
    }
    var data_folder = app.backend_server + "/data/" + app.current_request_id;

    $.get(data_folder + "/list", function(data) {
      $('#save-button').prop('disabled', false);
      $('#export-button').prop('disabled', false);
      lines = data.split("\n");
      if (lines[0] == '<!>') {
        direct_error('The daemon is not running\n\nTry again in a few minutes');
      } else {
        $("#cluster-buttons").empty();
        for (var i = current_line_num, len = lines.length; i < len; i++) {
          var fields = lines[i].split("@@");
          if (fields[0] == '<EMPTY>') {
            $("#next-results").prop('disabled', true);
            $('#display-sentence').hide();
            $('#display-svg').hide();
            $('#progress-txt').html('No results found <span style="font-size: 60%">[' + fields[1] + 's]</span>');
            $("#export-button").prop('disabled', true);
            $('#results-block').hide();
            $('#cluster-block').show();
          } else if (fields[0] == '<TOTAL>') {
            $('#progress-txt').html(fields[1] + ' occurrence' + ((fields[1] > 1) ? 's' : '') + ' <span style="font-size: 60%">[' + fields[2] + 's]</span>');
          } else if (fields[0] == '<OVER>') {
            $('#progress-txt').html('More than 1000 results found in ' + (100 * fields[1]).toFixed(2) + '% of the corpus' + ' <span style="font-size: 60%">[' + fields[2] + 's]</span>');
          } else if (fields[0] == '<TIME>') {
            $('#progress-txt').html('Timeout after 10s. ' + fields[1] + ' occurrences found in ' + (100 * fields[2]).toFixed(2) + '% of the corpus');
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
  });
  app.wait = false;
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
  var data_folder = app.backend_server + "/data/" + app.current_request_id;
  $.get(data_folder + "/clusters", function(data) {
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
            app.result_nb = 0;
            app.current_view = 0;

            current_cluster = parseInt(fields[3])

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
  var data_folder = app.backend_server + "/data/" + app.current_request_id;
  $.get(data_folder + "/cluster_" + current_cluster, function(data) {
    lines = data.split("\n");
    for (var i = current_line_num, len = lines.length; i < len; i++) {
      try {
        var obj = JSON.parse(lines[i]);
        if (obj.kind == "END") {
          $("#next-results").prop('disabled', true);
        } else if (obj.kind == "PAUSE") {
          $("#next-results").prop('disabled', false);
        } else {
          $("#results-list").append('<li class="item" id="list-' + app.result_nb + '"><a>' + obj.sent_id + '</a></li>');
          url = data_folder + '/' + obj.filename;
          $('#list-' + app.result_nb).click({
            url: url,
            i: app.result_nb,
            coord: obj.shift,
            sentence: obj.sentence,
            audio: obj.audio,
            meta: obj.meta,
            code: obj.code,
            sent_id: obj.sent_id,
          }, display_picture);
          app.result_nb++;
          update_progress_num();
        }
      } catch (err) {
        console.log("Ignore line: " + i);
      }
    }
    update_view();
    $("#display-sentence").show();
    current_line_num = lines.length - 1; // prepare position for next parsing
  });
}

// ==================================================================================
function display_picture(event) {
  app.sent_id = event.data.sent_id.split(" ")[0]; // n01005023 [1/2] --> n01005023
  $("#sentence-txt").html(event.data.sentence);

  if (event.data.audio != undefined) {
    hack_audio = $("#passage-audio");
    $("#source-audio").attr("src", event.data.audio);
    // Next two line: force reload (stackoverflow.com/questions/9421505)
    hack_audio[0].pause();
    hack_audio[0].load();
  }

  if (app.audio) {
    start_audio();
  } else {
    stop_audio();
  }

  var newHtml = "<img id=\"result-pic\" src=\"" + event.data.url + "\" > </img>";
  document.getElementById('display-svg').innerHTML = newHtml;

  $('#results-list li').removeClass('displayed');
  $('#list-' + event.data.i).addClass('displayed');
  var w = $("#display-svg").width();
  $("#display-svg").animate({
    scrollLeft: event.data.coord - w / 2
  }, "fast");
  app.current_view = event.data.i;

  app.sent_metadata = event.data.meta;

  app.code = event.data.code;

  app.svg_link = event.data.url

  update_progress_num();
  update_parallel();
}

// ==================================================================================
function show_export_modal() {
  var data_folder = app.backend_server + "/data/" + app.current_request_id;
  $.get(data_folder + "/export.tsv", function(data) {
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
    current_pivot = "";
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
  var param = {
    uuid: app.current_request_id,
    pivot: current_pivot,
  };

  var form = new FormData();
  form.append("param", JSON.stringify(param));

  request("export", form, function(data) {
    show_export_modal();
  })
}

// ==================================================================================
function update_parallel() {
  if (app.parallel != "no") {
    var param = {
      uuid: app.current_request_id,
      corpus: app.parallel,
      sent_id: app.sent_id,
    };

    var form = new FormData();
    form.append("param", JSON.stringify(param));

    request(
      "parallel",
      form,
      function(data) {
        app.parallel_svg = app.backend_server + "/data/" + app.current_request_id + "/" + data;
      },
      function(message) {
        app.parallel_svg = undefined;
        app.parallel_message = ("No sentence with sent_id: " + message.sent_id);
      }
    )
  }
}

// ==================================================================================
function download() {
  var data_folder = app.backend_server + "/data/" + app.current_request_id;
  window.location = data_folder + '/export.tsv';
}

// ==================================================================================
function show_conll() {
  var param = {
    uuid: app.current_request_id,
    current_view: app.current_view,
    cluster: current_cluster
  };

  var form = new FormData();
  form.append("param", JSON.stringify(param));

  request("conll", form, function(data) {
    $("#code_viewer").html(response.data);
    $('#code_modal').modal('show');
  })
}

// ==================================================================================
function show_code() {
  $("#code_viewer").html(app.code);
  $('#code_modal').modal('show');
}
// ==================================================================================
function code_copy() {
  $("#code_viewer").select()
  document.execCommand('copy');
}

// ==================================================================================
function save_pattern() {
  var param = {
    uuid: app.current_request_id,
    pattern: cmEditor.getValue(),
  };

  var form = new FormData();
  form.append("param", JSON.stringify(param));

  request("save", form, function(data) {
    let get = "?corpus=" + app.current_corpus_id + "&custom=" + app.current_request_id;
    if (app.clust1 == 'key') {
      get += "&clustering=" + app.clust1_key;
    }
    if (app.clust1 == 'whether') {
      get += "&whether=" + clust1_cm.getValue();
    }
    if (get_info(app.current_corpus_id, "enhanced") && $('#eud-box').prop('checked')) {
      get += "&eud=yes"
    }

    history.pushState({
        id: app.current_request_id
      },
      "Grew - Custom saved pattern",
      get
    );
    $('#custom-url').text(window.location.href);
    $('#custom-display').show();
    SelectText("custom-url");
  })
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
  if (app.result_nb != 0) {
    $('#display-svg').show();
  }
}

// ==================================================================================
function update_view() {
  $('#list-' + app.current_view).trigger("click");
  update_progress_num();
}

// ==================================================================================
function first_svg() {
  if (app.current_view > 0) {
    app.current_view = 0;
    update_view();
  }
}

// ==================================================================================
function previous_svg() {
  if (app.current_view > 0) {
    app.current_view -= 1;
    update_view();
  }
}

// ==================================================================================
function next_svg() {
  if (app.current_view < app.result_nb - 1) {
    app.current_view += 1;
    update_view();
  }
}

// ==================================================================================
function last_svg() {
  if (app.current_view < app.result_nb - 1) {
    app.current_view = app.result_nb - 1;
    update_view();
  }
}

// ==================================================================================
function logs_page() {
  window.open("meta/" + app.current_corpus_id + '.log');
}

// ==================================================================================
function escape(s) {
  s1 = s.split('@').join('_AT_');
  s2 = s1.split('.').join('_DOT_');
  return s2;
}

// ==================================================================================
function set_corpus(corpus) {
  search_corpus(corpus);
  $("#warning").hide();
  history.pushState({},
    "Grew - " + app.current_corpus_id,
    "?corpus=" + app.current_corpus_id
  );
  update_corpus()
}

// ==================================================================================
function update_corpus() {
  app.corpus_desc = app.current_corpus["desc"] ? app.current_corpus["desc"] : "";

  if (app.corpus_desc == "") {
    $('#corpus-desc-label').tooltipster('disable');
  } else {
    $('#corpus-desc-label').tooltipster('enable');
    $('#corpus-desc-label').tooltipster('content', app.corpus_desc);
  }

  if (get_info(app.current_corpus_id, "enhanced")) {
    $("#eud-span").show();
  } else {
    $("#eud-span").hide();
    $('#eud-box').bootstrapToggle('on');
  }

  app.parallel = "no";
  let parallels = get_info(app.current_corpus_id, "parallels");
  if (parallels) {
    app.parallels = parallels;
  } else {
    app.parallels = [];
  }

  app.audio = (get_info(app.current_corpus_id, "audio") == true);

  disable_save();

  current_snippets = get_info(app.current_corpus_id, "snippets");
  if (current_snippets == "") {
    right_pane(app.current_group_id)
  } else {
    right_pane(current_snippets);
  }

  // Show the errors button only if there is a not empty log_file
  app.meta_log = "";
  let log_url = "meta/" + app.current_corpus_id + ".log"
  $.get(log_url, function(data) {
    if (data.length > 0) {
      app.meta_log = log_url;
    }
  });

  // Show the table button only if the file is available
  let url = "meta/" + app.current_corpus_id + "_table.html";
  ping(
    url,
    function(bool) {
      if (bool) {
        app.meta_table = url + '?top=' + window.location.origin + window.location.pathname;
      } else {
        app.meta_table = "";
      }
    }
  )

  // update info button + update timestamp if needed
  $('.timeago').remove();
  $.ajax({
    url: "meta/" + app.current_corpus_id + "_desc.json",
    success: function(data) {
      app.meta_info = true;
      var html = "";
      for (let key in data) {
        if (key == "update") {
          const event = new Date(data[key]);
          $('#update_ago').html("<time class=\"timeago\" datetime=\"" + event.toISOString() + "\">update time</time>");
          $('#update_ago > time').timeago(); // make it dynamic
        } else {
          html += "<p>" + key + ": " + data[key] + "</p>";
        }
      }
      console.log(html);
      $('#info-button').tooltipster('content', html);

    },
    error: function() {
      app.meta_info = false;
    },
    cache: false
  });

  // is the SUD validation button visible?
  let json_url = "meta/" + "validator/" + app.current_corpus_id + ".json";
  ping(
    json_url,
    function(bool) {
      if (bool) {
        app.meta_sud_valid = "validator.html?corpus=" + json_url + '&top=' + window.location.origin + window.location.pathname;
      } else {
        app.meta_sud_valid = "";
      }
    }
  )

  // is the UD validation button visible?
  let valid_url = "meta/" + "valid_ud/" + app.current_corpus_id + ".valid";
  ping(
    valid_url,
    function(bool) {
      if (bool) {
        app.meta_ud_valid = valid_url;
      } else {
        app.meta_ud_valid = "";
      }
    }
  )
}

// ==================================================================================
function select_group(group_id, corpus_id) {
  app.current_group_id = group_id;
  update_current_group(group_id);
  app.current_corpus_id = corpus_id;
  if (!app.tuto_active && app.aaa_current_group["style"] != "dropdown") {
    app.left_pane = true;
    app.view_left_pane = true;
  }
  update_corpus();
}

// ==================================================================================
function common_prefix_length(s1, s2) {
  var i = 0;
  while (s1[i] == s2[i] && s1[i] != undefined) {
    i++;
  }
  return (i);
}

// ==================================================================================
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