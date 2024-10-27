"use strict";
let cmEditor;
let clust1_cm;
let clust2_cm;
let url_params;

// ==================================================================================
let app = new Vue({
  el: '#app',
  data: {
    audio_begin: undefined,   // audio_begin != undefined <==> a sound file is available
    audio_end: undefined,
    audio_speaking_index: 0,
    audio_tokens: undefined,  // audio_tokens != undefined <==> time alignement is available
    audio_interval_id: undefined,

    gridColumns: [],
    gridRows: [],
    gridCells: [],
    grid_message: "",

    metadata_open: false,

    search_mode: true,

    corpora_filter: "",

    backend_server: undefined,

    view_left_pane: false, // true iff the left_pane is open

    top_project: undefined,

    current_group_id: undefined,
    current_corpus_id: undefined,
    current_uuid: "",
    current_view: 0,

    groups: [],

    meta_info: false,

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
    pid: true,

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

  }, // end data

  methods: {
    // ==================================================================================
    check_built (file) {
      let expanded_file = file.replace("__id__", this.current_corpus_id)
      return this.current_corpus["built_files"] && app.current_corpus["built_files"].includes(expanded_file)
    },

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

    search_corpus_(id) {
      search_corpus(id);
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
  },  // end methods

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
  }, // end watch

  computed: {
    local: function () {
      return location.hostname.includes("localhost")
    },
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
      for (let g = 0; g < this.groups.length; g++) {
        if (this.groups[g]["id"] == this.current_group_id) {
          return this.groups[g];
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
      }
      return {};
    },

    corpus_error: function () {
      if (this.current_corpus.error) {
        return this.current_corpus.error
      }
      if (this.current_corpus.built_files && !(this.current_corpus.built_files.includes("marshal"))) {
        return "Corpus not compiled"
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
    }

  } // end computed
});

// ==================================================================================
async function generic(service, data) {
  const response = await fetch(app.backend_server+service, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result["status"] == "ERROR") {
    throw new Error(JSON.stringify(result["message"]));
  } else {
    return (result["data"])
  }
}

// ==================================================================================
// this function is run after page loading
$(document).ready(function () {
  url_params = new URLSearchParams(window.location.search)
  audio_init()
  start()
});

// ==================================================================================
async function start() {
  const res = await fetch("instances.json")
  const data = await res.json()
  let host = window.location.host;
  if (!(host in data)) {
    direct_error("No backend associated to `"+host+"`, check `instances.json`")
  } else {
    app.backend_server = data[host]["backend"]
    app.top_project = data[host]["top_project"]
    let instance = data[host]["instance"]
    
    const res2 = await fetch("instances/"+instance)
    const instance_desc = await res2.json()
    let param = {
      instance_desc: instance_desc
    };
    generic ("get_corpora_desc", param)
    .then(function (data) {
      app.groups = data;
      init ();
    })
  }
  
  $('.tooltip-desc').tooltipster({
    contentAsHTML: true,
    theme: 'tooltipster-noir',
    interactive: true,
    position: 'bottom'
  });
  
  // Long HTML tooltip are defined in run.html
  $('#tf-wf-tooltip').tooltipster('content', $("#tf-wf-tip").html());
  $('#pid-tooltip').tooltipster('content', "Show names of matched nodes in the graph");
  $('#warning-tooltip').tooltipster('content', $("#warning-tip").html());
  
  $('#export-button').tooltipster('content', "Export the sentence text of each occurrence like in a concordancer");
  $('#save-button').tooltipster('content', "Build a permanent URL with the current session");
  $('#download-conll-button').tooltipster('content', "Download a CoNLL file with the sentences<br/>Each sentence is given only once, <br/>even if there are multiple occurrences on the request in it.");
  
  $('#conll-button').tooltipster('content', "Show the CoNLL code of the current dependency tree");
  
  $('#github-button').tooltipster('content', "GitHub repository");
  $('#guidelines-button').tooltipster('content', "Guidelines");
  $('#issue-button').tooltipster('content', "Report error");
  $('#link-button').tooltipster('content', "External link");
  $('#sud-valid-button').tooltipster('content', "SUD validation (new page)");
  $('#ud-valid-button').tooltipster('content', "UD validation (new page)");
  $('#table-button').tooltipster('content', "Relation tables (new page)");
  $('#para-tooltip').tooltipster('content', "Select a treebank in the list to show the same sentence in this parallel corpus; use <i aria-hidden='true' class='fa fa fa-link'></i> to select the corpus for querying");
  $('#para-close-tooltip').tooltipster('content', "Unselect the current parallel treebank");
}

// ==================================================================================
function update_graph_view() {
  let audio_player = document.getElementById("audioPlayer");
  audio_player.pause();

  setTimeout(function () { // Delay running is needed for proper audio starting
    app.sent_id = app.current_item.sent_id.split(" ")[0]; // n01005023 [1/2] --> n01005023
    $("#display-svg").animate({
      scrollLeft: app.current_item.shift - (document.getElementById("display-svg").offsetWidth /
      2)
    }, "fast");
    update_parallel();

    if (app.current_item.audio) {
      $("#audioPlayer").attr("src", app.current_item.audio);
      if (app.current_item.audio.includes("#t=")) {
        let start_stop=app.current_item.audio.split("#t=").pop().split(",");
        app.audio_begin = start_stop[0];
        app.audio_end = start_stop[1];

        let sentence = document.getElementById("sentence")
        app.audio_tokens = sentence.querySelectorAll('[data-begin]');
        app.audio_tokens.forEach(function (token) {
          token.addEventListener('click', function (_) {
            let init_pos = Number(token["dataset"]["begin"])
            audio_player.currentTime = init_pos
          })
        });
        app.audio_tokens.forEach(function (token) {
          token.addEventListener('dblclick', function (_) {
            audio_player.play()
          })
        });
        app.audio_tokens[0].classList.add("speaking");
      }
      else { // Audio available without alignment
        app.audio_begin = 0
        app.audio_tokens = undefined
      }
    } else { // Audio not available
      app.audio_begin = undefined;
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
function search_corpus(requested_corpus) {
  // update the global variables app.current_corpus_id and app.current_group_id
  log("=== search_corpus === " + requested_corpus);

  if (requested_corpus == undefined) {
    let group = app.groups[0] // chose the first group
    if (group.id == "Tutorial") {
      group = app.groups[1]  // or the second if first is a Tuto
    }
    app.current_group_id = group["id"];
    app.current_corpus_id = group["default"];
    if (app.current_corpus_id == undefined) {
      let pos = Math.floor(Math.random() * group["corpora"].length);
      app.skip_history = true;
      app.current_corpus_id = group["corpora"][pos]["id"] // if no default in the group -> random corpus
    }
  } else {
    app.current_corpus_id = undefined;
    app.current_group_id = undefined;
    let best_cpl = 0;
    let best_ld = Number.MAX_SAFE_INTEGER;
    let best_corpus_id = undefined;
    let best_group_id = undefined;
    for (let g = 0; g < app.groups.length; g++) {
      let group = app.groups[g];
      let corpora = group["corpora"];
      if (corpora != undefined && group.id != "Tutorial") { // it is undefined for "links" menus
        for (let c = 0; c < corpora.length; c++) {
          if (corpora[c]["id"] != undefined) {
            if (requested_corpus == corpora[c]["id"]) {
              app.current_corpus_id = corpora[c]["id"];
              app.current_group_id = group["id"];
              return;
            }
            let cpl = common_prefix_length(requested_corpus, corpora[c]["id"]);
            let ld = levenshtein(requested_corpus, corpora[c]["id"]);
            if ((cpl > best_cpl) || (cpl == best_cpl && ld < best_ld)) {
              best_cpl = cpl;
              best_ld = ld;
              best_corpus_id = corpora[c]["id"];
              best_group_id = group["id"];
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
function audio_init() {
  let audio_player = document.getElementById("audioPlayer");
  function update () {
    if (audio_player.currentTime >= app.audio_end) {
      audio_player.pause()
    } else {
      let token_data = app.audio_tokens[app.audio_speaking_index]["dataset"];
      let token_end = Number(token_data["begin"]) + Number(token_data["dur"]);
      if (audio_player.currentTime > token_end) {
        audio_speaking_token (app.audio_speaking_index + 1)
      }
    }
  }

  audio_player.addEventListener("play", function() {
    if (app.audio_tokens != undefined) {
      app.audio_interval_id = setInterval(update, 50);
    }
  });

  audio_player.addEventListener("pause", function() {
    if (app.audio_tokens != undefined) {
      if (app.audio_interval_id) {
        clearInterval(app.audio_interval_id);
        app.audio_interval_id = undefined
      }
      if (audio_player.currentTime >= app.audio_end) {
        audio_player.currentTime = app.audio_begin;
      }
    }
  });

  audio_player.addEventListener("seeking", function() {
    if (app.audio_tokens != undefined) {
      let pos = 0
      app.audio_tokens.forEach (function (node,index) {
        node.classList.remove("speaking");
        let begin = Number(node["dataset"]["begin"])
        let end = begin + Number(node["dataset"]["dur"])
        if (audio_player.currentTime >= begin && audio_player.currentTime <= end) {
          pos = index
        }
      })
      audio_speaking_token(pos)
    }
  });

  function audio_speaking_token(position) {
    let prev_word = app.audio_tokens[app.audio_speaking_index];
    prev_word.classList.remove("speaking");
    let new_word = app.audio_tokens[position];
    app.audio_speaking_index = position;
    new_word.classList.add("speaking");
  }

}

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
      app.skip_history = true;
      app.select_group("Tutorial");
      return; // do not consider other GET parameters
    } else {
      direct_info("No tutorial in this instance");
    }
  }

  if (url_params.has("corpus")) {
    app.skip_history = true;
    search_corpus(url_params.get("corpus"));
    app.view_left_pane = true;
  };

  if (url_params.get ("table") == "yes") {
    if (app.check_built("table.html")) {
      open_build_file('table.html')
    } else {
      direct_warning ("No relation tables available for corpus: `"+app.current_corpus_id+"`")
    }
  };

  if (url_params.get ("valid_ud") == "yes") {
    if (app.check_built("valid_ud.txt")) {
      open_build_file('valid_ud.txt')
    } else {
      direct_warning ("No valid_ud available for corpus: `"+app.current_corpus_id+"`")
    }
  };

  if (url_params.get ("valid_sud") == "yes") {
    if (app.check_built("valid_sud.json")) {
      open_validation_page()
    } else {
      direct_warning ("No valid_sud available for corpus: `"+app.current_corpus_id+"`")
    }
  };

  // custom get parameter
  if (url_params.has("custom")) {
    const custom_param = url_params.get("custom");

    app.skip_history = true;

    $.getJSON(app.backend_server + "shorten/" + custom_param + ".json")
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
      setTimeout(search, 150); // hack: else clust1_cm value is not taken into account.
    })
    .error(function () {
      // backup on old custom saving
      if (app.current_corpus_id == undefined) {
        search_corpus(); // if no corpus is specified, take the default
      }
      $.get(app.backend_server + "shorten/" + custom_param, function (pattern) {
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
function open_validation_page() {
  let param = {
    corpus_id: app.current_corpus_id,
    file: "valid_sud.json"
  };

  generic("get_build_file", param)
  .then(function (data) {
    localStorage.setItem('valid_data', data);
    localStorage.setItem('top_url', window.location.origin);
    localStorage.setItem('corpus', app.current_corpus_id);
    window.open("validator.html");
  })
}

// ==================================================================================
function aggrid(base_name) {
  let params = new URLSearchParams()
  params.append("corpus", app.current_corpus_id)
  params.append("datafile", base_name+".json")
  window.open("aggrid.html?"+params.toString())
}

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
    app.skip_history = true;
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

  generic ("more_results", param)
  .then (
    function (data) {
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
    }
  )
}

// ==================================================================================
function count() {
  app.current_custom = "";
  app.current_cluster_path = undefined;
  app.cluster_dim = 0;
  app.wait = true;
  app.search_mode = false;

  generic ("count", search_param())
  .then(function (data) {
    var message = [
      "Hi, it seems that you sent many times (20?) the same request on different treebanks",
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
function search_param() {
  let param = {
    request: cmEditor.getValue(),
    corpus_id: app.current_corpus_id,
    lemma: app.lemma,
    upos: app.upos,
    xpos: app.xpos,
    features: app.features,
    tf_wf: app.tf_wf,
    order: $('#sentences-order').val(),
    context: app.context,
    pid: app.pid,
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
  return param
}

// ==================================================================================
function search() {
  app.current_custom = "";
  app.current_cluster_path = undefined;
  app.current_view = 0;

  generic ("search", search_param())
  .then (function (data) {
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
        return elt
      });
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
  })
  app.wait = false;
}

// ==================================================================================
function show_export_modal() {
  let data_folder = app.backend_server + "data/" + app.current_uuid;
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
function clusters_export() {
  let tsv = ""
  if (app.clust1 == "key") {
    tsv += app.clust1_key + "\tOccurrences\n"
  } else {
    tsv += "whether\tOccurrences\n"
  }
  tsv += app.cluster_list_sorted.map(cl => cl.value + "\t" + cl.size).join("\n")
  download_text("clusters.tsv", tsv)
}

// ==================================================================================
function export_tsv(pivot) {
  $('#pivot-modal').modal('hide');
  let param = {
    uuid: app.current_uuid,
    pivot: pivot,
  };

  generic("export", param)
  .then(function (_) {
    show_export_modal();
  })
}

// ==================================================================================
function conll_export() {
  let param = {
    uuid: app.current_uuid,
  };

  generic("conll_export", param)
  .then(function () {
    let data_folder = app.backend_server + "data/" + app.current_uuid;
    window.location = data_folder + '/export.conllu';
  })
}

// ==================================================================================
function update_parallel() {
  if (app.parallel != "no") {
    let param = {
      uuid: app.current_uuid,
      corpus_id: app.parallel,
      sent_id: app.sent_id,
    };

    generic("parallel", param)
    .then(
      function (data) {
        app.parallel_svg = app.backend_server + "data/" + app.current_uuid + "/" + data;
      }
    )
    .catch(function(err) {
      direct_error (JSON.stringify(err.message)) }
    )
  }
}

// ==================================================================================
function download() {
  let data_folder = app.backend_server + "data/" + app.current_uuid;
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

  generic ("conll", param)
  .then(function (data) {
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
  navigator.clipboard.writeText($("#code_viewer").html())
}

// ==================================================================================
function dowload_tgz() {
  let param = {
    corpus_id: app.current_corpus_id,
  };

  generic("dowload_tgz", param)
  .then(function (data) {
    window.open(app.backend_server + data)
  })
}


// ==================================================================================
function open_build_file(file,get_param,get_value) {
  let expanded_file = file.replace("__id__", app.current_corpus_id)
  let param = {
    corpus_id: app.current_corpus_id,
    file: expanded_file
  };

  generic("get_build_file", param)
  .then(function (data) {
    var new_window = window.open("");
    var html = ""
    if (file.endsWith(".txt")) {
      html = "<pre>"+data+"</pre>"
    } else {
      html = data
    }
    new_window.document.write(html);

    if (get_param != undefined && get_value != undefined) {
      let params = new URLSearchParams(window.location.search)
      params.delete(get_param)
      params.append (get_param, get_value)
      let new_url = window.location.origin + "?" + params.toString()
      new_window.history.replaceState({}, "", new_url);
    }
  })
}

// ==================================================================================
function save_pattern() {
  let param = {
    uuid: app.current_uuid,
    pattern: cmEditor.getValue(),
    corpus: app.current_corpus_id,
  };

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

  generic("save", param)
  .then(function (_) {
    history.pushState({ id: app.current_uuid }, "", "?custom=" + app.current_uuid);
    app.current_custom = window.location.href;
    SelectText("custom-url");
  })
}


// ==================================================================================
function update_corpus() {
  app.current_custom = "";
  $('.timeago').remove();
  app.meta_info = false;

  let audio_player = document.getElementById("audioPlayer");
  audio_player.pause();

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

  // update info button + update timestamp if needed
  if (app.check_built("desc.json")) {
    let param = {
      corpus_id: app.current_corpus_id,
      file: "desc.json"
    };

    generic("get_build_file", param)
    .then(function (data) {
      let json = JSON.parse(data)
      app.meta_info = true;
      let html = ""
      for (let key in json) {
        if (key == "update") {
          const event = new Date(json[key]);
          $('#update_ago').html("<time class=\"timeago\" datetime=\"" + event.toISOString() + "\">update time</time>");
          $('#update_ago > time').timeago(); // make it dynamic
        } else {
          html += "<p>" + key + ": " + json[key] + "</p>";
        }
      }
      $('#info-button').tooltipster('content', html);
    })
  }




  if (app.skip_history) {
    app.skip_history = false;
  } else {
    setTimeout(function () {
      history.pushState({},
        "",
        "?corpus=" + app.current_corpus_id
      );
    }, 100)
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

