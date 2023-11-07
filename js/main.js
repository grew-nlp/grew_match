"use strict";
let hack_audio;
let cmEditor;
let clust1_cm;
let clust2_cm;
let url_params;

// ==================================================================================
let app = new Vue({
  el: '#app',
  data: {

    gridColumns: [],
    gridRows: [],
    gridCells: [],
    grid_message: "",

    metadata_open: false,

    search_mode: true,

    corpora_filter: "",

    config: undefined,
    backend_server: undefined,
    grew_web_backend: undefined,
    grew_web_frontend: undefined,

    view_left_pane: false, // true iff the left_pane is open

    top_project: undefined,

    current_group_id: undefined,
    current_corpus_id: undefined,
    current_uuid: "",
    current_view: 0,

    groups: [],

    meta_info: false,
    meta_table: "", // URL to relation table or ""
    meta_sud_valid: "", // URL to SUD validation page or ""
    meta_ud_valid: "", // URL to UD validation page or ""
    meta_log: "", // URL to non-empty log page or ""

    // contents of whether boxes in not handle by Vue because of codemirror
    // clust1_cm.setValue and clust1_cm.getValue are used instead
    clust1: "no", // 3 possible values: no, key or whether
    clust1_key: "",
    clust2: "no", // 3 possible values: no, key or whether
    clust2_key: "",

    sent_id: "",

    parallel: "no",
    parallels: [],
    parallel_svg: undefined,
    parallel_message: "",

    wait: false,
    sort: true,

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
    current_time: 0,
    skip_history: false, // flag used to avoid history to be rewritten when loading a custom pattern
    current_custom: "",

    warning_level: 0,
    warning_message: "",

  },
  methods: {
    select_cluster_1d(index) {
      log("=== select_cluster_1d ===");
      if (app.search_mode && (app.current_cluster_path == undefined || app.current_cluster_path[0] != index)) {
        app.current_cluster_path = [index];
        app.current_view = 0;
        if (app.clusters[index].length == 0) {
          more_results(true);
        } else {
          app.update_current_cluster();
          update_graph_view ();
        }
      }
    },

    select_item(index) {
      if (app.current_view != index) {
        app.current_view = index;
        update_graph_view ();
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
      this.view_left_pane = true; // always make left pane visible when a new group is selected
      if ("default" in app.current_group) {
        app.current_corpus_id = app.current_group["default"];
      } else {
        app.current_corpus_id = app.current_group["corpora"][0]["id"];
      }
       
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
    cluster_list_sorted: function () {
      if (this.sort) {
        var data = this.cluster_list.slice(0);
        data.sort (function (c1, c2) {
          return c2.size - c1.size
        });
        return data
      } else {
        return this.cluster_list
      }
    },
    result_nb: function () {
      log("=== computed: result_nb ===");
      return (this.current_cluster.length);
    },
    current_item: function () {
      log("=== computed: current_item ===");
      let item = this.current_cluster[this.current_view];
      return (item == undefined ? {} : item)
    },
    old_top_project: function () {
      if (this.config != undefined) {
        return this.config["top_project"]
      }
    },
    old_groups: function () {
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
      if (true) { // TODO remove
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
function grew_web() {
  let param = {
    corpus_id: app.current_corpus['src'],
    sent_id: app.sent_id,
  };

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  backend("conll", form, function (conll) {
    var form = new FormData();
    form.append("conll", conll);
    console.log(form);

    backend("from_data", form, function(data) {
      var url=app.grew_web_frontend;
      // var url="http://localhost:8888/grew_web";
      url += "?session_id="+data.session_id;
      url += "&grs="+ app.current_corpus['grs']
      window.open(url);
    },
    undefined,
    app.grew_web_backend)
    // "http://localhost:8080/")
  })
}

// ==================================================================================
function update_graph_view() {
  setTimeout(function () { // Delay running is needed for proper audio starting
    app.sent_id = app.current_item.sent_id.split(" ")[0]; // n01005023 [1/2] --> n01005023
    $("#display-svg").animate({
      scrollLeft: app.current_item.shift - (document.getElementById("display-svg").offsetWidth /
      2)
    }, "fast");
    update_parallel();
    
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
  }, 100)
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
  
  if (requested_corpus == undefined) { 
    let group = app.groups[0] // chose the first group 
    if (group.id == "Tutorial") {
      group = app.groups[1]  // or the second if first is a Tuto
    }
    app.current_group_id = group["id"];
    app.current_corpus_id = group["default"];
    if (app.current_corpus_id == undefined) {
      app.current_corpus_id = group["corpora"][0]["id"] // if no default in the group -> first corpus
    }
  } else {
    app.current_corpus_id = undefined;
    app.current_group_id = undefined;
    let best_cpl = 0;
    let best_ld = Number.MAX_SAFE_INTEGER;
    let best_corpus_id = undefined;
    let best_group_id = undefined;
    let group_list = app.groups;
    for (let g = 0; g < group_list.length; g++) {
      let corpora = group_list[g]["corpora"];
      if (corpora != undefined) { // it is undefined for "links" menus
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
    }
    // no exact matching
    app.warning_level = 2;  // init at 2 because the watcher `current_corpus_id` decrement later
    app.warning_message = "⚠️ " + requested_corpus + " &rarr; " + best_corpus_id;
    app.current_corpus_id = best_corpus_id;
    app.current_group_id = best_group_id;
  }
}


// ==================================================================================
// this function is run after page loading
$(document).ready(function () {
  url_params = new URL(window.location.toLocaleString()).searchParams;
  
  $.getJSON("instances.json")
  .done(function (data) {
    let host = window.location.host;
    if (host in data) {
      app.backend_server = data[host]["backend"]
      app.top_project = data[host]["top_project"]
    } else {
      direct_error("No backend associated to `"+host+"`, check `instances.json`")
    }
    //app.config = data;  

    let instance = data[host]["instance"]
    $.getJSON("instances/"+instance)
    .done(function (instance_desc) {
      
      
      let param = {
        instance_desc: instance_desc
      };
      
      let form = new FormData();
      form.append("param", JSON.stringify(param));
      
      backend("get_corpora_desc", form, function (data) {
        console.log ('------------+++-------------')
        console.log (JSON.stringify(data))
        
        app.groups = data;
        init ();
      }, undefined, app.backend_server
      )
    }
    )
    // init(); // ensure init is ran after config loading
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
  $('#save-button').tooltipster('content', "Build a permanent URL with the current session");
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

  $(function() {
    $('#sort-box').change(function() {
       app.sort = $(this).prop('checked')
    })
  })

  deal_with_get_parameters(); // force to interpret get parameters after the update of groups menus

}


// ==================================================================================
function deal_with_get_parameters() {
  // corpus get parameter
  if (url_params.get("tutorial") == "yes") {
    if (app.groups[0].id == "Tutorial") {
      app.select_group("Tutorial");
      return; // do not consider other GET parameters
    } else {
      direct_info("No tutorial in this instance");
    }
  }
  
  if (url_params.has("corpus")) {
    search_corpus(url_params.get("corpus"));
    app.view_left_pane = true;
  };
  
  // custom get parameter
  if (url_params.has("custom")) {
    const custom_param = url_params.get("custom");

    app.skip_history = true;

    $.getJSON(app.backend_server + "/shorten/" + custom_param + ".json")
    .done(function (data) {
      cmEditor.setValue(data.pattern);

      // if corpus is given as GET parameter, it has priority
      if (app.current_corpus_id == undefined) {
        if ("corpus" in data) {
          search_corpus(data.corpus);
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
      if (app.current_corpus_id == undefined) {
        search_corpus(); // if no corpus is specified, take the default
      }
      $.get(app.backend_server + "/shorten/" + custom_param, function (pattern) {
        cmEditor.setValue(pattern);
        setTimeout(search, 150); // hack: else clust1_cm value is not taken into account.
      })
      .error(function () {
        direct_error("Cannot find custom pattern `" + custom_param + "`\n\nCheck the URL.")
      });
    });
    return
  }

  if (app.current_corpus_id == undefined) {
    search_corpus(); // if no corpus is specified, take the default
    app.view_left_pane = true;
  }

  // ud by default eud if requested in the params
  $('#eud-box').bootstrapToggle(url_params.get("eud") ? 'on' : 'off')

  // backward compatibility with the old "clustering" name
  let clust1_key = url_params.has('clust1_key') ? url_params.get('clust1_key') : url_params.get('clustering');

  // backward compatibility with the old "whether" name
  let clust1_whether = url_params.has('clust1_whether') ? url_params.get('clust1_whether') : url_params.get('whether');

  let clust2_key = url_params.get("clust2_key");
  let clust2_whether = url_params.get("clust2_whether");

  // update app.clust1 and app.clust2
  app.clust1 = "no";   // default
  if (clust1_whether) { app.clust1 = "whether" }
  if (clust1_key) { app.clust1 = "key" }
  app.clust2 = "no";   // default
  if (clust2_whether) { app.clust2 = "whether" }
  if (clust2_key) { app.clust2 = "key" }

  app.clust1_key = clust1_key;
  app.clust2_key = clust2_key;

  if (clust1_whether || clust2_whether) {
    // if there at least one whether, timeout for proper CodeMirror behaviour
    setTimeout(function () {
      if (clust1_whether) { clust1_cm.setValue(clust1_whether) }
      if (clust2_whether) { clust2_cm.setValue(clust2_whether) }
      get_param_stage2 ();
    }, 0)
  } else {
    get_param_stage2 ();
  }
} // deal_with_get_parameters


// ==================================================================================
function get_param_stage2 () { // in a second stage to be put behind a timeout.

  // If there is a get arg in the URL named "relation" -> make the search directly
  if (url_params.has("relation")) {
    let source = ""
    if (url_params.has("source")) {
      source = "GOV [upos=\"" + (url_params.get("source")) + "\"]; "
    }
    let target = ""
    if (url_params.has("target").length > 0) {
      target = "DEP [upos=\"" + (url_params.get("target")) + "\"]; "
    }
    cmEditor.setValue("pattern {\n  " + source + target + "GOV -[" + url_params.get("relation") + "]-> DEP\n}");
    search();
  }

  // read "request" param (and backward compatibility with the old "pattern" name)
  let request_param = url_params.has('request') ? url_params.get('request') : url_params.get('pattern');

  if (request_param) {
    app.view_left_pane = false;
    cmEditor.setValue(request_param);
    setTimeout(function () {
      search();
    }, 50)
  }

  let count_param = url_params.get('count');
  if (count_param) {
    app.view_left_pane = false;
    cmEditor.setValue(count_param);
    setTimeout(function () {
      count ();
    }, 50)
  }
}


// ==================================================================================
// Binding for interactive part in snippets part
function right_pane(base) {
  let file = "snippets/" + base + ".html";
  $.get(file, function (data) {
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
      const file = "snippets/" + $(this).attr('snippet-file');
      $.get(file, function (pattern) {
        cmEditor.setValue(pattern);
      }, null, "text")
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
function backend(service, form, data_fct, error_fct, backend_url=app.backend_server) {
  let settings = {
    "url": backend_url + service,
    "method": "POST",
    "timeout": 0,
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
  };

  console.log ('-------------------------')
  console.log (settings)

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
        log("Success call to service: " + service + "-->");
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

function named_cluster_path() {
  if (app.cluster_dim == 1) {
    return ([app.cluster_list[app.current_cluster_path[0]].value])
  }
  if (app.cluster_dim == 2) {
    return ([
      app.gridRows[app.current_cluster_path[0]].value,
      app.gridColumns[app.current_cluster_path[1]].value
    ])
  }
  return ([]);
}

// ==================================================================================
function more_results(post_update_graph_view=false) {
  let param = {
    uuid: app.current_uuid,
    cluster_path: app.current_cluster_path,
    named_cluster_path: named_cluster_path()
  };

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  backend("more_results", form, function (data) {
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
    if (post_update_graph_view) {
      update_graph_view();
    }
  })
}

// ==================================================================================
function count() {
  app.current_custom = "";
  app.current_cluster_path = undefined;
  app.cluster_dim = 0;

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
  app.search_mode = false;
  backend("count", form, function (data) {
    console.log (data);
    var message = [
      "Hi, it seems that you sent many times (20?) the same request",
      "This usage makes the server crashes regularly",
      "Can you try to use the [Grew-count](https://grew.fr/usage/grew_count/) service instead?",
      "Feel free to contact [Bruno.Guillaume@inria.fr](mailto:Bruno.Guillaume@inria.fr) if you want to discuss on the best way to run your experiment",
      "Thanks!",
      "Bruno",
    ].join ("\n\n");
    if (data.redundant != undefined) {
      direct_info (message);
    }
    app.current_time = data.time;
    app.nb_solutions = data.nb_solutions;

    if (data.nb_solutions == 0) {
      app.result_message = "No results"
    } else {
      app.result_message = data.nb_solutions + ' occurrence' + ((data.nb_solutions > 1) ? 's' : '')
    }
    if ("cluster_array" in data) {
      app.cluster_list = data.cluster_array.map
        (function (elt, index) {
          elt["index"] = index;
          return elt}
        );
      app.cluster_dim = 1;
    } else if ("cluster_grid" in data) {
      app.cluster_dim = 2;
      app.gridRows = data.cluster_grid.rows;
      app.gridColumns = data.cluster_grid.columns;
      if (data.cluster_grid.rows.length * data.cluster_grid.columns.length > 1000) {
        app.grid_message = "Table is not shown (more than 1000 cells): "
        app.gridCells = [];
      } else {
        app.grid_message = "";
        app.gridCells = data.cluster_grid.cells;
      }
      app.grid_message += data.cluster_grid.rows.length + " line" + (data.cluster_grid.rows.length > 1 ? "s; " : ", ")
      app.grid_message += data.cluster_grid.columns.length + " column" + (data.cluster_grid.columns.length > 1 ? "s" : "")
    }

    app.wait = false;
  })
}

// ==================================================================================
function search() {
  app.current_custom = "";
  app.clusters = [];
  app.current_view = 0;
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
  backend("search", form, function (data) {
    app.search_mode = true;
    app.current_uuid = data.uuid;
    app.current_pivots = data.pivots;
    app.current_time = data.time;
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
        app.result_message = 'More than ' + data.nb_solutions + ' results found in ' + (100 * data.ratio).toFixed(2) + '% of the corpus'
        break;
      case "timeout":
        app.result_message = 'Timeout. ' + data.nb_solutions + ' occurrences found in ' + (100 * data.ratio).toFixed(2) + '% of the corpus'
        break;
      default:
        direct_error("unknown status: " + data.status)
    }

    if ("cluster_single" in data) {
      app.clusters = [];
      app.cluster_dim = 0;
      if (data.nb_solutions > 0) {
        app.current_cluster_path = [];
        more_results(true);
      }
    } else if ("cluster_array" in data) {
      app.cluster_list = data.cluster_array.map
        (function (elt, index) {
          elt["index"] = index;
          return elt}
        );
      app.clusters = Array(app.cluster_list.length).fill([]);
      app.cluster_dim = 1;
    } else if ("cluster_grid" in data) {
      app.gridRows = data.cluster_grid.rows;
      app.gridColumns = data.cluster_grid.columns;
      app.gridCells = data.cluster_grid.cells;
      app.clusters = [...Array(app.gridRows.length)].map(x => Array(app.gridColumns.length).fill([]));
      app.cluster_dim = 2;
      if (data.cluster_grid.total_rows_nb > data.cluster_grid.rows.length) {
        app.grid_message = "<b>" + data.cluster_grid.total_rows_nb + "</b> lines (lines above rank "+ data.cluster_grid.rows.length +" are merged with key <code>__*__</code>); ";
      } else {
        app.grid_message = data.cluster_grid.total_rows_nb + " line" + (data.cluster_grid.total_rows_nb > 1 ? "s; " : "; ")
      }
      if (data.cluster_grid.total_columns_nb > data.cluster_grid.columns.length) {
        app.grid_message += data.cluster_grid.total_columns_nb + " columns (columns above rank "+ data.cluster_grid.columns.length +" are merged with key <code>__*__</code>)";
      } else {
        app.grid_message += data.cluster_grid.total_columns_nb + " column" + (data.cluster_grid.total_columns_nb > 1 ? "s" : "")
      }
    }
  });
  app.wait = false;
}

// ==================================================================================
function show_export_modal() {
  let data_folder = app.backend_server + "/data/" + app.current_uuid;
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
    uuid: app.current_uuid,
    pivot: pivot,
  };

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  backend("export", form, function (data) {
    show_export_modal();
  })
}

// ==================================================================================
function conll_export() {
  let param = {
    uuid: app.current_uuid,
  };
  
  let form = new FormData();
  form.append("param", JSON.stringify(param));
  
  backend("conll_export", form, function () {
    let data_folder = app.backend_server + "/data/" + app.current_uuid;
    window.location = data_folder + '/export.conllu';
  })
}

// ==================================================================================
function update_parallel() {
  if (app.parallel != "no") {
    let param = {
      uuid: app.current_uuid,
      corpus: app.parallel,
      sent_id: app.sent_id,
    };

    let form = new FormData();
    form.append("param", JSON.stringify(param));

    backend(
      "parallel",
      form,
      function (data) {
        app.parallel_svg = app.backend_server + "/data/" + app.current_uuid + "/" + data;
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
  let data_folder = app.backend_server + "/data/" + app.current_uuid;
  window.location = data_folder + '/export.tsv';
}

// ==================================================================================
function show_conll() {
  let param = {
    uuid: app.current_uuid,
    current_view: app.current_view,
    cluster_path: app.current_cluster_path,
    named_cluster_path: named_cluster_path()
  };

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  backend("conll", form, function (data) {
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
function open_relation_tables() {
  let param = {
    corpus_id: app.current_corpus_id,
  };

  let form = new FormData();
  form.append("param", JSON.stringify(param));

  backend("relation_tables", form, function (data) {
    var table_window = window.open("");
    table_window.document.write(data);
  })
}

// ==================================================================================
function save_pattern() {
  let param = {
    uuid: app.current_uuid,
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

  backend("save", form, function (_) {
    history.pushState({ id: app.current_uuid }, "", "?custom=" + app.current_uuid);
    app.current_custom = window.location.href;
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
function update_corpus() {
  app.current_custom = "";
  if (app.current_corpus["desc"]) {
    $('#corpus-desc-label').tooltipster('enable');
    $('#corpus-desc-label').tooltipster('content', app.current_corpus["desc"]);
  } else {
    $('#corpus-desc-label').tooltipster('disable');
  }

  app.parallel = "no";
  app.parallels = app.current_corpus["parallels"] ? app.current_corpus["parallels"] : [];

  if (app.current_corpus["snippets"]) {
    right_pane(app.current_corpus["snippets"]);
  } else if (app.current_group["snippets"]) {
    right_pane(app.current_group["snippets"]);
  } else if (app.current_corpus["config"]) {
    right_pane(app.current_corpus["config"]);
  } else {
    right_pane("_default");
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
  if (app.search_mode && (app.current_cluster_path == undefined || app.current_cluster_path[0] != r || app.current_cluster_path[1] != c)) {
    app.current_cluster_path = [r, c];
    app.current_view = 0;
    if (app.clusters[r][c].length == 0) {
      more_results(true);
    } else {
      app.update_current_cluster();
      update_graph_view ();
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