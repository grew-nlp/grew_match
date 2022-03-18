var hack_audio;

// ==================================================================================
var app = new Vue({
  el: '#app',
  data: {

    gridColumns: ["сила", "VERB"],
    gridRows: ["@@", "INTJ"],
    gridCells: {
      "@@": {
        "сила": 1,
        "VERB": 2
      },
      "INTJ": {
        "сила": 3,
        "VERB": 4
      },
    },

    metadata_open: false,

    corpora_filter: "",

    config: undefined,
    backend_server: undefined,

    view_left_pane: false, // true iff the left_pane is open

    current_group_id: undefined,
    current_corpus_id: undefined,
    current_request_id: "",
    current_view: 0,

    meta_info: false,
    meta_table: "", // URL to relation table or ""
    meta_sud_valid: "", // URL to SUD validation page or ""
    meta_ud_valid: "", // URL to UD validation page or ""
    meta_log: "", // URL to non-empty log page or ""

    clust1: "no", // 3 possible values: no, key or whether
    clust1_key: "",
    clust1_whether: "",

    clust2: "no", // 3 possible values: no, key or whether

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

    svg_link: "",

    current_pivots: [],
    result_message: "",
    show_clusters: false,
    clusters: [],
    current_cluster: undefined,
    current_time_request: 0,
  },
  methods: {
    select_cluster(data) {
      if (app.current_cluster != data) {
        app.current_cluster = data; // TODO: check string VS int
      }
      current_line_num = 0;
      next_results(true);
    },
    select_item(index) {
      console.log("=== select_item ===");
      app.current_view = index;
      app.sent_id = app.current_item.sent_id.split(" ")[0]; // n01005023 [1/2] --> n01005023
      setTimeout(function() {
        $("#display-svg").animate({
          scrollLeft: app.current_item.shift - (document.getElementById("display-svg").offsetWidth /
            2)
        }, "fast");
      }, 0);
      update_parallel();

      if (app.current_item.audio) {
        $("#source-audio").attr("src", app.current_item.audio);
        hack_audio = $("#passage-audio");
        // Next two lines: force reload (stackoverflow.com/questions/9421505)
        hack_audio[0].pause();
        hack_audio[0].load();
        setTimeout(function() {
          if (app.current_corpus["audio"]) {
            start_audio();
          } else {
            stop_audio();
          }
        }, 0)
      }
    },

    update_parallel_() {
      update_parallel();
    },
    export_tsv_(pivot) {
      export_tsv(pivot);
    },
    select_group(group_id) {
      app.current_group_id = group_id;
      app.current_corpus_id = app.current_group["default"];
    },
  },
  watch: {
    current_corpus_id: function() {
      console.log("current_corpus_id has changed");
      app.clusters = [];
      app.result_message = "";
      update_corpus();
    }
  },
  computed: {
    items: function() {
      console.log("=== computed: items ===");
      if (this.clusters[this.current_cluster]) {
        return this.clusters[this.current_cluster].items;
      } else {
        return []
      }
    },
    result_nb: function() {
      console.log("=== computed: result_nb ===");
      if (this.clusters[this.current_cluster]) {
        return this.clusters[this.current_cluster].items.length
      } else {
        return 0
      }
    },
    current_item: function() {
      console.log("=== computed: current_item ===");
      return (this.clusters[this.current_cluster].items[this.current_view]);
    },
    top_project: function() {
      if (this.config != undefined) {
        return this.config["top_project"]
      }
    },
    groups: function() {
      if (this.config != undefined) {
        return this.config["groups"]
      }
    },
    number_of_corpora: function() {
      if (this.current_group) {
        return this.current_group["corpora"].length;
      }
    },
    filtered_corpora_list: function() {
      var self = this;
      if (this.current_group) {
        return this.current_group["corpora"].filter(function(corpus) {
          return corpus.id.toLowerCase().indexOf(self.corpora_filter.toLowerCase()) >= 0;
        });
      }
    },
    current_group: function() {
      if (this.config) {
        groups = this.config["groups"];
        for (var g = 0; g < groups.length; g++) {
          if (groups[g]["id"] == this.current_group_id) {
            return groups[g];
          }
        }
      }
    },
    current_corpus: function() {
      if (this.current_group) {
        corpora = this.current_group["corpora"];
        for (var g = 0; g < corpora.length; g++) {
          if (corpora[g]["id"] == this.current_corpus_id) {
            return corpora[g];
          }
        }
        return {};
      } else {
        return {};
      }
    },
    mode: function() {
      if (this.current_group) {
        return this.current_group["mode"]
      } else {
        return "";
      }
    },
    left_pane: function() {
      if (this.current_group) {
        this.view_left_pane = true; // always make left pane visible when the left_pane is recomputed
        return (this.current_group["style"] == "left_pane");
      }
    }
  }
});


// ==================================================================================
// update the global variables app.current_corpus_id and app.current_group_id
function search_corpus(requested_corpus) {
  $('#warning').hide();
  app.current_corpus_id = undefined;
  app.current_group_id = undefined;
  best_cpl = 0;
  best_ld = Number.MAX_SAFE_INTEGER;
  group_list = app.config["groups"];
  for (var g = 0; g < group_list.length; g++) {
    let group = group_list[g];
    corpora = group_list[g]["corpora"];
    for (var c = 0; c < corpora.length; c++) {
      if (corpora[c]["id"] != undefined) {
        if (requested_corpus == corpora[c]["id"]) {
          app.current_corpus_id = corpora[c]["id"];
          app.current_group_id = group_list[g]["id"];
          return;
        }
        cpl = common_prefix_length(requested_corpus, corpora[c]["id"]);
        ld = levenshtein(requested_corpus, corpora[c]["id"]);
        if ((cpl > best_cpl) || (cpl == best_cpl && ld < best_ld)) {
          best_cpl = cpl;
          best_ld = ld;
          app.current_corpus_id = corpora[c]["id"];
          app.current_group_id = group_list[g]["id"];
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
      init(); // ensure init is ran after config loading
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
  $('#guidelines-button').tooltipster('content', "Guidelines");
  $('#issue-button').tooltipster('content', "Report error");
  $('#link-button').tooltipster('content', "External link");
  $('#sud-valid-button').tooltipster('content', "SUD validation (new page)");
  $('#ud-valid-button').tooltipster('content', "UD validation (new page)");
  $('#table-button').tooltipster('content', "Relation tables (new page)");

});

// ==================================================================================
function init() {
  search_corpus(app.config["default"]);


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
}

// ==================================================================================
function disable_save() {
  $('#custom-display').hide();
}

// ==================================================================================
// force to interpret get parameters after the update of groups menus
function deal_with_get_parameters() {

  // corpus get parameter
  if (getParameterByName("tutorial") == "yes") {
    if (app.config["tutorial"]) {
      search_corpus(app.config["tutorial"]);
    } else {
      direct_info("No tutorial in this instance");
    }
  } else

  if (getParameterByName("corpus").length > 0) {
    search_corpus(getParameterByName("corpus"));
  };

  // custom get parameter
  if (getParameterByName("custom").length > 0) {
    const get_custom = getParameterByName("custom");

    $.get(app.backend_server + "/shorten/" + get_custom, function(pattern) {
        cmEditor.setValue(pattern);
        setTimeout(search_pattern, 150); // hack: else clust1_cm value is not taken into account.
      })
      .error(function() {
        direct_error("Cannot find custom pattern `" + get_custom + "`\n\nCheck the URL.")
      });
  }

  // If there is a get arg in the URL named "relation" -> make the request directly
  if (getParameterByName("relation").length > 0) {
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


  const clustering = getParameterByName("clustering");
  const whether = getParameterByName("whether");
  if (clustering.length > 0) {
    app.clust1 = "key";
    app.clust1_key = clustering;
  } else if (whether.length > 0) {
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
  dir = "corpora/" + base
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
function direct_info(msg) {
  let html = md.render(msg)
  Swal.fire({
    icon: 'info',
    title: 'Info',
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
      set_fct(true);
    })
    .fail(function() {
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
function next_results(flag) { // if [flag] then select the first item after the call
  var param = {
    uuid: app.current_request_id,
    cluster_index: app.current_cluster
  };

  var form = new FormData();
  form.append("param", JSON.stringify(param));

  request("next", form, function(data) {
    app.clusters[app.current_cluster].items.push(...data.items);
    if (flag) {
      app.select_item(0);
    }
  })
}

// ==================================================================================
function search_pattern() {

  $('#results-block').hide();
  $('#cluster-block').hide();

  current_line_num = 0;
  app.current_view = 0;
  app.current_cluster = undefined;
  app.result_message = "";

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
    eud2ud: (app.current_corpus["enhanced"]) && !($('#eud-box').prop('checked')),
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
    app.current_request_id = response.data.uuid;
    app.current_pivots = response.data.pivots;
    app.current_time_request = response.data.time;

    switch (response.data.status) {
      case "complete":
        if (response.data.solutions == 0) {
          app.result_message = "No results"
        } else {
          app.result_message = response.data.solutions + ' occurrence' + ((response.data.solutions > 1) ? 's' : '')
        }
        break;
      case "max_results":
        app.result_message = 'More than 1000 results found in ' + (100 * response.data.ratio).toFixed(2) + '% of the corpus'
        break;
      case "timeout":
        app.result_message = 'Timeout; ' + response.data.solutions + ' occurrences found in ' + (100 * response.data.ratio).toFixed(2) + '% of the corpus'
        break;
      default:
        direct_error("unknown status: " + response.data.status)
    }

    if (response.data.clusters.length == 0) {
      app.show_clusters = false; // No clustering
      app.clusters = [{
        items: [],
        size: response.data.solutions
      }];
      if (response.data.solutions > 0) {
        app.current_cluster = 0;
        next_results(true);
      }
    } else {
      app.show_clusters = true;
      app.clusters = response.data.clusters;
    }
  });
  app.wait = false;
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
  if (app.current_pivots.length > 1) {
    $('#pivot-modal').modal('show');
  } else if (app.current_pivots.length == 1) {
    export_tsv(app.current_pivots[0]);
  } else {
    export_tsv("");
  }
}

// ==================================================================================
function export_tsv(pivot) {
  $('#pivot-modal').modal('hide');
  var param = {
    uuid: app.current_request_id,
    pivot: pivot,
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
    cluster: app.current_cluster
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
  $("#code_viewer").html(app.current_item.code);
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
    if (app.current_corpus["enhanced"] && $('#eud-box').prop('checked')) {
      get += "&eud=yes"
    }

    history.pushState({
        id: app.current_request_id
      },
      "",
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
function update_corpus() {
  if (app.current_corpus["desc"]) {
    $('#corpus-desc-label').tooltipster('enable');
    $('#corpus-desc-label').tooltipster('content', app.current_corpus["desc"]);
  } else {
    $('#corpus-desc-label').tooltipster('disable');
  }

  app.parallel = "no";
  app.parallels = app.current_corpus["parallels"] ? app.current_corpus["parallels"] : [];

  disable_save();

  if (app.current_corpus["snippets"]) {
    right_pane(app.current_corpus["snippets"]);
  } else if (app.current_group["snippets"]) {
    right_pane(app.current_group["snippets"]);
  } else {
    right_pane(app.current_group_id);
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
        app.meta_table = url;
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
      $('#info-button').tooltipster('content', html);

    },
    error: function() {
      app.meta_info = false;
    },
    cache: false
  });

  // is the SUD validation button visible?
  let json_url = "meta/" + "valid_SUD/" + app.current_corpus_id + ".json";
  ping(
    json_url,
    function(bool) {
      if (bool) {
        app.meta_sud_valid = "validator.html?corpus=" + json_url + '&top=' + window.location.origin + window.location.pathname;
      } else {
        app.meta_sud_valid = "";
      }
    }
  );

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
  );

  history.pushState({},
    "",
    "?corpus=" + app.current_corpus_id
  );

}

// ==================================================================================
function select_cell(c, r) {
  console.log(c, r);
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