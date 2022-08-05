"use strict";
let hack_audio;
let cmEditor;
let clust1_cm;
let clust2_cm;

// ==================================================================================
let app = new Vue({
  el: '#app',
  data: {

    gridColumns: [],
    gridRows: [],
    gridCells: [],

    metadata_open: false,

    corpora_filter: "",

    config: undefined,
    backend_server: undefined,

    view_left_pane: false, // true iff the left_pane is open

    current_group_id: undefined,
    current_corpus_id: undefined,
    current_request_id: "",
    current_view: -1,  // ensure that select_item(0) works well

    meta_info: false,
    meta_table: "", // URL to relation table or ""
    meta_sud_valid: "", // URL to SUD validation page or ""
    meta_ud_valid: "", // URL to UD validation page or ""
    meta_log: "", // URL to non-empty log page or ""

    clust1: "no", // 3 possible values: no, key or whether
    clust1_key: "",
    clust1_whether: "",

    clust2: "no", // 3 possible values: no, key or whether
    clust2_key: "",
    clust2_whether: "",

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
    nb_solutions: 0,
    cluster_dim: 0, // 0 -> no cluster, 1 -> linear clustering, 2 -> grid clustering
    clusters: [],
    cluster_list: [],
    current_cluster_path: undefined,
    current_cluster: [],
    current_cluster_size: 0,
    current_time_request: 0,
    skip_history: false, // flag used to avoid history to be rewritten when loading a custom pattern

    warning_level: 0,
    warning_message: "",

  },
  methods: {
    select_cluster_1d(index) {
      log("=== select_cluster_1d ===");
      if (app.current_cluster_path == undefined || app.current_cluster_path[0] != index) {
        app.current_cluster_path = [index];
        if (app.clusters[index].length == 0) {
          more_results(true);
        } else {
          app.update_current_cluster();
        }
      }
    },

    select_item(index) {
      if (app.current_view != index) {
        app.current_view = index;
        setTimeout(function () {
          app.sent_id = app.current_item.sent_id.split(" ")[0]; // n01005023 [1/2] --> n01005023
          $("#display-svg").animate({
            scrollLeft: app.current_item.shift - (document.getElementById("display-svg").offsetWidth /
              2)
          }, "fast");
          update_parallel();
        }, 0);

        if (app.current_item.audio) {
          $("#source-audio").attr("src", app.current_item.audio);
          hack_audio = $("#passage-audio");
          // Next two lines: force reload (stackoverflow.com/questions/9421505)
          hack_audio[0].pause();
          hack_audio[0].load();
          setTimeout(function () {
            if (app.current_corpus["audio"]) {
              start_audio();
            } else {
              stop_audio();
            }
          }, 0)
        } else {
          stop_audio();
        }
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

    update_current_cluster() { // also update app.current_cluster_size
      log("=== update_current_cluster ===");
      if (this.current_cluster_path != undefined) {
        app.current_cluster = search_path(this.current_cluster_path, this.clusters);
        if (app.cluster_dim == 0) {
          app.current_cluster_size = app.nb_solutions
        } else if (app.cluster_dim == 1) {
          app.current_cluster_size = this.cluster_list[this.current_cluster_path[0]].size
        } else if (app.cluster_dim == 2) {
          app.current_cluster_size = this.gridCells[this.current_cluster_path[0]][this.current_cluster_path[1]]
        }
      }
    }
  },
  watch: {
    current_corpus_id: function () {
      log("current_corpus_id has changed");
      app.warning_level -= 1;
      app.result_message = "";
      update_corpus();
    },
    clust1: function () { // close clust1 ==> close clust2
      log("clust1 has changed to " + app.clust1);
      if (app.clust1 == "no") {
        app.clust2 = "no";
      }
    },

  },
  computed: {
    result_nb: function () {
      log("=== computed: result_nb ===");
      return (this.current_cluster.length);
    },
    current_item: function () {
      log("=== computed: current_item ===");
      let item = this.current_cluster[this.current_view];
      return (item == undefined ? {} : item)
    },
    top_project: function () {
      if (this.config != undefined) {
        return this.config["top_project"]
      }
    },
    groups: function () {
      if (this.config != undefined) {
        return this.config["groups"]
      }
    },
    number_of_corpora: function () {
      if (this.current_group) {
        return this.current_group["corpora"].length;
      }
    },
    filtered_corpora_list: function () {
      let self = this;
      if (this.current_group) {
        return this.current_group["corpora"].filter(function (corpus) {
          return corpus.id.toLowerCase().indexOf(self.corpora_filter.toLowerCase()) >= 0;
        });
      }
    },
    current_group: function () {
      if (this.config) {
        for (let g = 0; g < this.groups.length; g++) {
          if (this.groups[g]["id"] == this.current_group_id) {
            return this.groups[g];
          }
        }
      }
    },
    current_corpus: function () {
      if (this.current_group) {
        let corpora = this.current_group["corpora"];
        for (let g = 0; g < corpora.length; g++) {
          if (corpora[g]["id"] == this.current_corpus_id) {
            return corpora[g];
          }
        }
        return {};
      } else {
        return {};
      }
    },
    mode: function () {
      if (this.current_group) {
        return this.current_group["mode"]
      } else {
        return "";
      }
    },
    left_pane: function () {
      if (this.current_group) {
        this.view_left_pane = true; // always make left pane visible when the left_pane is recomputed
        return (this.current_group["style"] == "left_pane");
      }
    },
    col_label: function () {
      if (app.clust2 == "key") {
        return app.clust2_key
      } else {
        return "Whether_2"
      }
    },
    row_label: function () {
      if (app.clust1 == "key") {
        return app.clust1_key
      } else {
        return "Whether_1"
      }
    },
  }
});

function log(msg) {
  if (false) {  // false --> turn off logging // true --> true turn on logging
    console.log(msg)
  }
}

// ==================================================================================
function search_path(path, data) {
  if (path.length == 0) {
    return data
  } else {
    let head = path[0];
    let tail = path.slice(1);
    return (search_path(tail, data[head]));
  }
}

// ==================================================================================
// update the global variables app.current_corpus_id and app.current_group_id
function search_corpus(requested_corpus) {
  log("=== search_corpus === " + requested_corpus);

  app.current_corpus_id = undefined;
  app.current_group_id = undefined;
  let best_cpl = 0;
  let best_ld = Number.MAX_SAFE_INTEGER;
  let best_corpus_id = undefined;
  let best_group_id = undefined;
  let group_list = app.config["groups"];
  for (let g = 0; g < group_list.length; g++) {
    let group = group_list[g];
    let corpora = group_list[g]["corpora"];
    for (let c = 0; c < corpora.length; c++) {
      if (corpora[c]["id"] != undefined) {
        if (requested_corpus == corpora[c]["id"]) {
          app.current_corpus_id = corpora[c]["id"];
          app.current_group_id = group_list[g]["id"];
          return;
        }
        let cpl = common_prefix_length(requested_corpus, corpora[c]["id"]);
        let ld = levenshtein(requested_corpus, corpora[c]["id"]);
        if ((cpl > best_cpl) || (cpl == best_cpl && ld < best_ld)) {
          best_cpl = cpl;
          best_ld = ld;
          best_corpus_id = corpora[c]["id"];
          best_group_id = group_list[g]["id"];
        }
      }
    }
  }
  // no exact matching
  app.warning_level = 2;  // init at 2 because the watcher `current_corpus_id` decrement later
  app.warning_message = "⚠️ " + requested_corpus + " &rarr; " + best_corpus_id;
  app.current_corpus_id = best_corpus_id;
  app.current_group_id = best_group_id;
}


// ==================================================================================
// this function is run after page loading
$(document).ready(function () {
  $.getJSON("corpora/config.json")
    .done(function (data) {
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

  $('#clust1-key').bind('input', function () {
    disable_save();
  });

  $('input:radio[name="clust1"]').change(function () {
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

    app.skip_history = true;

    $.getJSON(app.backend_server + "/shorten/" + get_custom + ".json")
      .done(function (data) {
        cmEditor.setValue(data.pattern);

        // if corpus is given are GET parameter, it has priority
        if (app.current_corpus_id == undefined) {
          if ("corpus" in data) {
            search_corpus(data.corpus);
          } else {
            search_corpus(app.config["default"]);
          }
        }
        if ("clust1_key" in data) {
          app.clust1 = "key";
          app.clust1_key = data.clust1_key
        }
        if ("clust1_whether" in data) {
          app.clust1 = "whether";
          setTimeout(function () {
            clust1_cm.setValue(data.clust1_whether);
          }, 0)
        }
        if ("clust2_key" in data) {
          app.clust2 = "key";
          app.clust2_key = data.clust2_key
        }
        if ("clust2_whether" in data) {
          app.clust2 = "whether";
          setTimeout(function () {
            clust2_cm.setValue(data.clust2_whether);
          }, 0)
        }
        if ("eud" in data) {
          $('#eud-box').bootstrapToggle('on');
        } else {
          $('#eud-box').bootstrapToggle('off')
        }
        setTimeout(search, 150); // hack: else clust1_cm value is not taken into account.
      })
      .error(function () {
        // backup on old custom saving
        $.get(app.backend_server + "/shorten/" + get_custom, function (pattern) {
          cmEditor.setValue(pattern);
          setTimeout(search, 150); // hack: else clust1_cm value is not taken into account.
        })
          .error(function () {
            direct_error("Cannot find custom pattern `" + get_custom + "`\n\nCheck the URL.")
          });
      })
  } else {
    if (app.current_corpus_id == undefined) {
      search_corpus(app.config["default"]);
    }
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
    search();
  }

  if (getParameterByName("pattern").length > 0) {
    cmEditor.setValue(getParameterByName("pattern"));
    setTimeout(function () {
      search();
    }, 0)
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
    setTimeout(function () {
      clust1_cm.setValue(whether); // hack for correct init of clust1_cm
    }, 50)
  } else {
    app.clust1 = "no";
  }

}

// ==================================================================================
// Binding for interactive part in snippets part
function right_pane(base) {
  let dir = "corpora/" + base
  $.get(dir + "/right_pane.html", function (data) {
    $('#right-pane').html(data);
    $(".inter").click(function () {
      app.clust1 = "no"; // default value
      app.clust2 = "no"; // default value
      const clustering = $(this).attr('clustering');
      if (clustering) {
        app.clust1 = "key";
        app.clust1_key = clustering;
      }
      const whether = $(this).attr('whether');
      if (whether) {
        app.clust1 = "whether";
        // setValue is behind timeout to ensure proper cm update
        setTimeout(function () { // hack for correct update of clust1_cm
          clust1_cm.setValue(whether);
        }, 0)
      }
      const clustering2 = $(this).attr('clustering2');
      if (clustering2) {
        app.clust2 = "key";
        app.clust2_key = clustering2;
      }
      const whether2 = $(this).attr('whether2');
      if (whether2) {
        app.clust2 = "whether";
        // setValue is behind timeout to ensure proper cm update
        setTimeout(function () { // hack for correct update of clust1_cm
          clust2_cm.setValue(whether2);
        }, 0)
      }

      // Update of the textarea
      const file = dir + "/" + $(this).attr('snippet-file');
      $.get(file, function (pattern) {
        cmEditor.setValue(pattern);
      })
        .error(function () {
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
  let form = new FormData();
  let settings = {
    "url": url,
    "method": "HEAD",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function (_) {
      set_fct(true);
    })
    .fail(function () {
      set_fct(false);
    });
}


// ==================================================================================
function request(service, form, data_fct, error_fct) {
  let settings = {
    "url": app.backend_server + service,
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  $.ajax(settings)
    .done(function (response_string) {
      let response = JSON.parse(response_string);
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
        log("Success request to service: " + service + "-->");
        log(response.data);
        data_fct(response.data);
      }
    })
    .fail(function () {
      Swal.fire({
        icon: 'error',
        title: 'Connection fail',
        html: md.render("The `" + service + "` service is not available."),
      });
    });
}

// ==================================================================================
function more_results(flag) { // if [flag] then select the first item after the call
  let param = {
    uuid: app.current_request_id,
    cluster_path: app.current_cluster_path
  };

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  request("more_results", form, function (data) {
    if (app.cluster_dim == 0) {
      app.clusters = app.clusters.concat(data.items);
      app.update_current_cluster();
    } else if (app.cluster_dim == 1) {
      let old_items = app.clusters[app.current_cluster_path[0]];
      const new_items = old_items.concat(data.items);
      app.clusters[app.current_cluster_path[0]] = new_items;
      app.update_current_cluster();
    } else if (app.cluster_dim == 2) {
      let old_items = app.clusters[app.current_cluster_path[0]][app.current_cluster_path[1]];
      const new_items = old_items.concat(data.items);
      app.clusters[app.current_cluster_path[0]][app.current_cluster_path[1]] = new_items;
      app.update_current_cluster();
    }
    if (flag) {
      app.select_item(0);
    }
  })
}

// ==================================================================================
function count() {

  $('#results-block').hide();
  $('#cluster-block').hide();
  app.current_cluster_path = undefined;

  let param = {
    pattern: cmEditor.getValue(),
    corpus: app.current_corpus_id,
    eud2ud: (app.current_corpus["enhanced"]) && !($('#eud-box').prop('checked')),
    clust1: app.clust1,
    clust2: app.clust2,
  };

  if (app.clust1 == "key") {
    param.clust1_data = app.clust1_key;
  }
  if (app.clust1 == "whether") {
    param.clust1_data = clust1_cm.getValue();
  }

  if (app.clust2 == "key") {
    param.clust2_data = app.clust2_key;
  }
  if (app.clust2 == "whether") {
    param.clust2_data = clust2_cm.getValue();
  }

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  app.wait = true;
  request("count", form, function (data) {
    console.log(data);
    app.current_time_request = data.time;
    app.nb_solutions = data.nb_solutions;

    switch (data.status) {
      case "complete":
        if (data.nb_solutions == 0) {
          app.result_message = "No results"
        } else {
          app.result_message = data.nb_solutions + ' occurrence' + ((data.nb_solutions > 1) ? 's' : '')
        }
        break;
      case "timeout":
        app.result_message = 'Timeout. ' + data.nb_solutions + ' occurrences found in ' + (100 * data.ratio).toFixed(2) + '% of the corpus'
        break;
      default:
        direct_error("unknown status: " + data.status)
    }
    app.wait = false;
  })
}

// ==================================================================================
function search() {

  $('#results-block').hide();
  $('#cluster-block').hide();

  app.clusters = [];
  app.current_view = -1;  // ensure that select_item(0) works well
  app.current_cluster_path = undefined;
  app.result_message = "";

  let param = {
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
    clust2: app.clust2,
  };

  if (app.clust1 == "key") {
    param.clust1_data = app.clust1_key;
  }
  if (app.clust1 == "whether") {
    param.clust1_data = clust1_cm.getValue();
  }

  if (app.clust2 == "key") {
    param.clust2_data = app.clust2_key;
  }
  if (app.clust2 == "whether") {
    param.clust2_data = clust2_cm.getValue();
  }

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  app.wait = true;
  request("search", form, function (data) {
    app.current_request_id = data.uuid;
    app.current_pivots = data.pivots;
    app.current_time_request = data.time;
    app.nb_solutions = data.nb_solutions;

    switch (data.status) {
      case "complete":
        if (data.nb_solutions == 0) {
          app.result_message = "No results"
        } else {
          app.result_message = data.nb_solutions + ' occurrence' + ((data.nb_solutions > 1) ? 's' : '')
        }
        break;
      case "max_results":
        app.result_message = 'More than 1000 results found in ' + (100 * data.ratio).toFixed(2) + '% of the corpus'
        break;
      case "timeout":
        app.result_message = 'Timeout. ' + data.nb_solutions + ' occurrences found in ' + (100 * data.ratio).toFixed(2) + '% of the corpus'
        break;
      default:
        direct_error("unknown status: " + data.status)
    }

    if ("cluster_single" in data) {
      app.clusters = [];
      if (data.nb_solutions > 0) {
        app.current_cluster_path = [];
        more_results(true);
      }
      app.cluster_dim = 0;
    } else if ("cluster_array" in data) {
      app.cluster_list = data.cluster_array;
      app.clusters = Array(app.cluster_list.length).fill([]);
      app.cluster_dim = 1;
    } else if ("cluster_grid" in data) {
      app.gridColumns = data.cluster_grid[1];
      app.gridRows = data.cluster_grid[0];
      app.gridCells = data.cluster_grid[2];
      app.clusters = [...Array(app.gridRows.length)].map(x => Array(app.gridColumns.length).fill([]));
      app.cluster_dim = 2;
    }
  });
  app.wait = false;
}

// ==================================================================================
function show_export_modal() {
  let data_folder = app.backend_server + "/data/" + app.current_request_id;
  $.get(data_folder + "/export.tsv", function (data) {
    let lines = data.split("\n");

    let html
    let headers = lines[0].split("\t");

    if (headers.length == 2) {
      html = "<table class=\"export-table-2\">";
      html += "<colgroup><col width=\"10%\" /><col width=\"90%\" /></colgroup>";
    } else {
      html = "<table class=\"export-table-4\">";
      html += "<colgroup><col width=\"10%\" /><col width=\"40%\" align=\"right\" /><col width=\"10%\" /><col width=\"40%\" /></colgroup>";
    }

    // headers
    html += "<tr><th>" + lines[0].replace(/\t/g, "</th><th>") + "</th></tr>\n";

    lines.slice(1).forEach(line => {
      html += "<tr><td>" + line.replace(/\t/g, "</td><td>") + "</td></tr>\n";
    });
    html += "</table>";

    $("#exportResult").html(html);
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
  let param = {
    uuid: app.current_request_id,
    pivot: pivot,
  };

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  request("export", form, function (data) {
    show_export_modal();
  })
}

// ==================================================================================
function update_parallel() {
  if (app.parallel != "no") {
    let param = {
      uuid: app.current_request_id,
      corpus: app.parallel,
      sent_id: app.sent_id,
    };

    let form = new FormData();
    form.append("param", JSON.stringify(param));

    request(
      "parallel",
      form,
      function (data) {
        app.parallel_svg = app.backend_server + "/data/" + app.current_request_id + "/" + data;
      },
      function (message) {
        app.parallel_svg = undefined;
        app.parallel_message = ("No sentence with sent_id: " + message.sent_id);
      }
    )
  }
}

// ==================================================================================
function download() {
  let data_folder = app.backend_server + "/data/" + app.current_request_id;
  window.location = data_folder + '/export.tsv';
}

// ==================================================================================
function show_conll() {
  let param = {
    uuid: app.current_request_id,
    current_view: app.current_view,
    cluster_path: app.current_cluster_path
  };

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  request("conll", form, function (data) {
    $("#code_viewer").html(data);
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
  let param = {
    uuid: app.current_request_id,
    pattern: cmEditor.getValue(),
    corpus: app.current_corpus_id,
  };

  if (app.current_corpus["enhanced"] && $('#eud-box').prop('checked')) {
    param.eud = "yes"
  }

  if (app.clust1 == "key") {
    param.clust1_key = app.clust1_key;
  }
  if (app.clust1 == "whether") {
    param.clust1_whether = clust1_cm.getValue();
  }

  if (app.clust2 == "key") {
    param.clust2_key = app.clust2_key;
  }
  if (app.clust2 == "whether") {
    param.clust2_whether = clust2_cm.getValue();
  }

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  request("save", form, function (data) {
    let get = "?custom=" + app.current_request_id;

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
  let doc = document,
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
  let regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
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
  $.get(log_url, function (data) {
    if (data.length > 0) {
      app.meta_log = log_url;
    }
  });

  // Show the table button only if the file is available
  let url = "meta/" + app.current_corpus_id + "_table.html";
  ping(
    url,
    function (bool) {
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
    success: function (data) {
      app.meta_info = true;
      let html = "";
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
    error: function () {
      app.meta_info = false;
    },
    cache: false
  });

  // is the SUD validation button visible?
  let json_url = "meta/" + "valid_SUD/" + app.current_corpus_id + ".json";
  ping(
    json_url,
    function (bool) {
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
    function (bool) {
      if (bool) {
        app.meta_ud_valid = valid_url;
      } else {
        app.meta_ud_valid = "";
      }
    }
  );

  if (app.skip_history) {
    app.skip_history = false;
  } else {
    history.pushState({},
      "",
      "?corpus=" + app.current_corpus_id
    );
  }
}

// ==================================================================================
function select_cluster_2d(c, r) {
  log("=== select_cluster_2d ===");
  log(c, r);
  if (app.current_cluster_path == undefined || app.current_cluster_path[0] != r || app.current_cluster_path[1] != c) {
    app.current_cluster_path = [r, c];
    if (app.clusters[r][c].length == 0) {
      more_results(true);
    } else {
      app.update_current_cluster();
    }
  }

}


// ==================================================================================
function common_prefix_length(s1, s2) {
  let i = 0;
  while (s1[i] == s2[i] && s1[i] != undefined) {
    i++;
  }
  return (i);
}

// ==================================================================================
// taken from: https://rosettacode.org/wiki/Levenshtein_distance#JavaScript
function levenshtein(a, b) {
  let t = [],
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