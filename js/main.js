'use strict'
let cmEditor
let clust1_cm
let clust2_cm
let url_params

// ==================================================================================
let app = new Vue({
  el: '#app',
  data: {
    audio_begin: undefined,   // audio_begin != undefined <==> a sound file is available
    audio_end: undefined,
    audio_speaking_index: 0,
    audio_tokens: undefined,  // audio_tokens != undefined <==> time alignement is available
    audio_interval_id: undefined,

    grid_columns: [],
    grid_rows: [],
    grid_cells: [],
    grid_message: '',
    col_label: '',
    row_label: '',

    metadata_open: false,

    search_mode: true,

    multi_mode: false, // allow multi selection
    selected_corpora: [], // list of selected corpora

    corpora_filter: '',

    backend_server: undefined,

    view_left_pane: false, // true iff the left_pane is open

    top_project: undefined,

    current_group_id: undefined,
    current_corpus_id: undefined,
    current_uuid: '',
    current_view: 0,

    groups: [],

    meta_info: false,

    // contents of whether boxes in not handle by Vue because of codemirror
    // clust*_cm.setValue and clust*_cm.getValue are used instead
    clust1: 'no', // 3 possible values: no, key or whether
    clust1_key: '',
    clust2: 'no', // 3 possible values: no, key or whether
    clust2_key: '',

    sent_id: '',

    parallel: 'no',
    parallels: [],
    parallel_svg: undefined,
    parallel_message: '',

    wait: false,
    sort: true,
    raw_nb: true,

    grid_display: Grid_display.SIZE,

    // printing parameters
    display: {
      lemma: true,
      upos: true,
      xpos: false,
      features: true,
      tf_wf: false,
      order: 'init',
      context: false,
      pid: true,
    },

    svg_link: '',

    current_pivots: [],
    result_message: '',
    nb_solutions: 0,
    cluster_dim: 0, // 0 -> no cluster, 1 -> linear clustering, 2 -> grid clustering
    clusters: [],
    cluster_list: [],
    current_cluster_path: undefined,
    current_cluster: [],
    current_cluster_size: 0,
    current_time: 0,
    skip_history: false, // flag used to avoid history to be rewritten when loading a custom request
    current_custom: '',

    warning_level: 0,
    warning_message: '',
  }, // end data

  methods: {
    // ==================================================================================
    check_built (file) {
      let expanded_file = file.replace('__id__', this.current_corpus_id)
      return this.current_corpus.built_files && app.current_corpus.built_files.includes(expanded_file)
    },

    select_cluster_1d(index) {
      log('=== select_cluster_1d ===')
      if (app.search_mode && (app.current_cluster_path == undefined || app.current_cluster_path[0] != index)) {
        app.current_cluster_path = [index]
        app.current_view = 0
        if (app.clusters[index].length == 0) {
          more_results(true)
        } else {
          app.update_current_cluster()
          update_graph_view ()
        }
      }
    },

    select_item(index) {
      if (app.current_view != index) {
        app.current_view = index
        update_graph_view ()
      }
    },

    update_parallel_() {
      update_parallel()
    },

    search_corpus_(id) {
      search_corpus(id)
    },

    export_tsv_(pivot) {
      export_tsv(pivot)
    },

    select_group(group_id) {
      app.current_group_id = group_id
      this.view_left_pane = true // always make left pane visible when a new group is selected
      if ('default' in app.current_group) {
        app.current_corpus_id = app.current_group.default
      } else {
        app.current_corpus_id = app.current_group.corpora[0].id
      }
    },

    update_current_cluster() { // also update app.current_cluster_size
      log('=== update_current_cluster ===')
      if (this.current_cluster_path != undefined) {
        app.current_cluster = search_path(this.current_cluster_path, this.clusters)
        if (app.cluster_dim == 0) {
          app.current_cluster_size = app.nb_solutions
        } else if (app.cluster_dim == 1) {
          app.current_cluster_size = this.cluster_list[this.current_cluster_path[0]].size
        } else if (app.cluster_dim == 2) {
          app.current_cluster_size = this.grid_cells[this.current_cluster_path[0]][this.current_cluster_path[1]]
        }
      }
    }
  },  // end methods

  watch: {
    current_corpus_id: function () {
      log('current_corpus_id has changed')
      app.warning_level -= 1
      app.result_message = ''
      update_corpus()
    },

    clust1: function () { // close clust1 ==> close clust2
      log(`clust1 has changed to ${app.clust1}`)
      if (app.clust1 == 'no') {
        app.clust2 = 'no'
      }
    },
  }, // end watch

  computed: {
    local: function () {
      return location.hostname.includes('localhost')
    },
    cluster_list_sorted: function () {
      if (this.sort) {
        var data = this.cluster_list.slice() // copy the array before sorting
        data.sort (function (c1, c2) {
          return c2.size - c1.size
        })
        return data
      } else {
        return this.cluster_list
      }
    },

    result_nb: function () {
      log('=== computed: result_nb ===')
      return (this.current_cluster.length)
    },

    current_item: function () {
      log('=== computed: current_item ===')
      let item = this.current_cluster[this.current_view]
      return (item == undefined ? {} : item)
    },

    number_of_corpora: function () {
      if (this.current_group) {
        return this.current_group.corpora.length
      }
    },

    filtered_corpora_list: function () {
      let self = this
      if (this.current_group) {
        return this.current_group.corpora.filter(function (corpus) {
          return corpus.id.toLowerCase().indexOf(self.corpora_filter.toLowerCase()) >= 0
        })
      }
    },

    current_group: function () {
      for (let g = 0; g < this.groups.length; g++) {
        if (this.groups[g].id == this.current_group_id) {
          return this.groups[g]
        }
      }
    },

    current_corpus: function () {
      if (this.current_group) {
        let corpora = this.current_group.corpora
        for (let g = 0; g < corpora.length; g++) {
          if (corpora[g].id == this.current_corpus_id) {
            return corpora[g]
          }
        }
      }
      return {}
    },

    corpus_error: function () {
      if (this.current_corpus.error) {
        return this.current_corpus.error
      }
      if (this.current_corpus.built_files && !(this.current_corpus.built_files.includes('marshal'))) {
        return 'Corpus not compiled'
      }
    },

    mode: function () {
      return this.current_group ? this.current_group.mode : '';
    },

    left_pane: function () {
      if (this.current_group) {
        return (this.current_group.style == 'left_pane')
      }
    },

    disable_search: function () {
      return (this.clust1 === 'key' && this.clust1_key.trim() === '') || (this.clust2 === 'key' && this.clust2_key.trim() === '')
    }
  } // end computed
})

// ==================================================================================
// this function is run after page loading
document.addEventListener('DOMContentLoaded', function() {
  url_params = new URLSearchParams(window.location.search)
  audio_init()
  init_tooltips()
  start()
})

// ==================================================================================
async function start() {
  try {
    await initialize_from_instance();
  } catch (error1) {
    try {
      await initialize_from_instances();
    } catch (error2) {
      direct_error(`${error1.message}\n\n${error2.message}`, 'Config error');
    }
  }
}

// ==================================================================================
async function initialize_from_instance() {
  const instance = await fetch_json('instance.json');
  app.backend_server = instance.backend;
  const param = { instance_desc: instance.desc };
  app.groups = await generic(app.backend_server, 'get_corpora_desc', param);
  init();
}

// ==================================================================================
async function initialize_from_instances() {
  const instances = await fetch_json('instances.json');
  const host = window.location.host;

  if (!(host in instances)) {
    direct_error(`No backend associated with '${host}' in file 'instances.json'`);
    return;
  }

  app.backend_server = instances[host].backend;
  app.top_project = instances[host].top_project;
  const instance = instances[host].instance;

  const param = {
    instance_desc: await fetch_json(`instances/${instance}`)
  };

  app.groups = await generic(app.backend_server, 'get_corpora_desc', param);
  init();
}

// ==================================================================================
function init() {

  // Initialise CodeMirror
  cmEditor = CodeMirror.fromTextArea(document.getElementById('pattern-input'), {
    lineNumbers: true,
  })

  // Initialise CodeMirror
  clust1_cm = CodeMirror.fromTextArea(document.getElementById('whether-input1'), {
    lineNumbers: true,
  })

  // Initialise CodeMirror
  clust2_cm = CodeMirror.fromTextArea(document.getElementById('whether-input2'), {
    lineNumbers: true,
  })

  deal_with_get_parameters() // force to interpret get parameters after the update of groups menus
}

// ==================================================================================
async function deal_with_get_parameters() {
  // corpus get parameter
  if (url_params.get('tutorial') == 'yes') {
    if (app.groups[0].id == 'Tutorial') {
      app.skip_history = true
      app.select_group('Tutorial')
      return // do not consider other GET parameters
    } else {
      direct_info('No tutorial in this instance')
    }
  }

  if (url_params.has('corpus')) {
    app.skip_history = true
    search_corpus(url_params.get('corpus'))
    app.view_left_pane = true
  }

  if (localStorage.param_for_duplicate) {
    let param = JSON.parse (localStorage.param_for_duplicate)
    localStorage.removeItem('param_for_duplicate')
    open_param(param)
    return // in case of duplicata, no need to go on with other parameters
  }

  if (url_params.get ('table') == 'yes') {
    if (app.check_built('table.html')) {
      open_build_file('table.html')
    } else {
      direct_warning (`No relation tables available for corpus: ${app.current_corpus_id}`)
    }
  }

  if (url_params.get ('valid_ud') == 'yes') {
    if (app.check_built('valid_ud.txt')) {
      open_build_file('valid_ud.txt')
    } else {
      direct_warning (`No valid_ud available for corpus: ${app.current_corpus_id}`)
    }
  }

  if (url_params.get ('valid_sud') == 'yes') {
    if (app.check_built('valid_sud.json')) {
      open_validation_page()
    } else {
      direct_warning (`No valid_sud available for corpus: ${app.current_corpus_id}`)
    }
  }

  // custom get parameter
  if (url_params.has('custom')) {
    const custom_param = url_params.get('custom')

    app.skip_history = true

    fetch_json(`${app.backend_server}shorten/${custom_param}.json`)
    .then(data => {
      let request = data.request ? data.request : data.pattern // backward compatibility
      cmEditor.setValue(request)

      // if corpus is given as GET parameter, it has priority
      if (app.current_corpus_id == undefined) {
        if ('corpus' in data) {
          search_corpus(data.corpus)
        }
      }
      if ('clust' in data) {
        set_clust_param(data.clust)
      } else {
        set_clust_param(data) // backward compatibility (clust* value at the top level)
      }
      if ('display' in data) {app.display = data.display}
      if (data.search_mode == false) {
        setTimeout(count, 150) // behind timeout, else clust*_cm value is not taken into account.
      } else {
        setTimeout(search, 150) // behind timeout, else clust*_cm value is not taken into account.
      }
    })
    .catch (function (_) {
      // backup on old custom saving
      if (app.current_corpus_id == undefined) {
        search_corpus() // if no corpus is specified, take the default
      }
      fetch(`${app.backend_server}shorten/${custom_param}`)
      .then (function (request) {
        cmEditor.setValue(request)
        setTimeout(search, 150) // hack: else clust*_cm value is not taken into account.
      })
      .catch(function (_) {
        direct_error(`Cannot find custom request \`${custom_param}\`\n\nCheck the URL.`)
      })
    })
    return
  }

  if (app.current_corpus_id == undefined) {
    search_corpus() // if no corpus is specified, take the default
    app.view_left_pane = true
  }

  // build a clust_param struct from url_params and use the generic code `set_clust_param`
  let clust_param = {}
  // backward compatibility with the old 'clustering' name
  if (url_params.has('clustering')) { clust_param.clust1_key = url_params.get('clustering') }
  if (url_params.has('clust1_key')) { clust_param.clust1_key = url_params.get('clust1_key') }
  // backward compatibility with the old 'whether' name
  if (url_params.has('whether')) { clust_param.clust1_whether = url_params.get('whether') }
  if (url_params.has('clust1_whether')) { clust_param.clust1_whether = url_params.get('clust1_whether') }

  if (url_params.has('clust2_key')) { clust_param.clust2_key = url_params.get('clust2_key') }
  if (url_params.has('clust2_whether')) { clust_param.clust2_whether = url_params.get('clust2_whether') }

  await set_clust_param (clust_param)
  .then(function (_) {
    get_param_stage2()
  })
} // deal_with_get_parameters

// ==================================================================================
function update_graph_view() {
  const audio_player = document.getElementById('audioPlayer')
  audio_player.pause()

  setTimeout(function () { // Delay running is needed for proper audio starting
    app.sent_id = app.current_item.sent_id.split(' ')[0] // n01005023 [1/2] --> n01005023
    $('#display-svg').animate({
      scrollLeft: app.current_item.shift - (document.getElementById('display-svg').offsetWidth / 2)
    }, 'fast')
    update_parallel()

    if (app.current_item.audio) {
      $('#audioPlayer').attr('src', app.current_item.audio)
      if (app.current_item.audio.includes('#t=')) {
        const start_stop = app.current_item.audio.split('#t=').pop().split(',')
        app.audio_begin = start_stop[0]
        app.audio_end = start_stop[1]

        const sentence = document.getElementById('sentence')
        app.audio_tokens = sentence.querySelectorAll('[data-begin]')

        app.audio_tokens.forEach(function (token) {
          token.addEventListener('click', function (_) {
            let init_pos = Number(token.dataset.begin)
            audio_player.currentTime = init_pos
          })
        })
        app.audio_tokens.forEach(function (token) {
          token.addEventListener('dblclick', function (_) {
            audio_player.play()
          })
        })
        app.audio_tokens[0].classList.add('speaking')
      }
      else { // Audio available without alignment
        app.audio_begin = 0
        app.audio_tokens = undefined
      }
    } else { // Audio not available
      app.audio_begin = undefined
    }
  }, 100)
}

// ==================================================================================
function search_path(path, data) {
  if (path.length === 0) {
    return data;
  }
  const [head, ...tail] = path
  return search_path(tail, data[head])
}


// ==================================================================================
function search_corpus(requested_corpus) {
  log(`=== search_corpus === ${requested_corpus}`);

  if (requested_corpus === undefined) {
    set_default_corpus();
  } else {
    find_best_match_corpus(requested_corpus);
  }
}

// ==================================================================================
function set_default_corpus() {
  const first_group = app.groups[0]
  const group = first_group.id === 'Tutorial' ? app.groups[1] : first_group

  app.current_group_id = group.id
  app.current_corpus_id = group.default

  if (app.current_corpus_id === undefined) {
    const randomIndex = Math.floor(Math.random() * group.corpora.length);
    app.skip_history = true;
    app.current_corpus_id = group.corpora[randomIndex].id;
  }
}

// ==================================================================================
function find_best_match_corpus(requested_corpus) {
  let best_match = {
    corpus_id: undefined,
    group_id: undefined,
    cpl: 0,
    ld: Number.MAX_SAFE_INTEGER
  };

  for (const group of app.groups) {
    if (group.id === 'Tutorial' || !group.corpora) continue;

    for (const corpus of group.corpora) {
      if (!corpus.id) continue;

      if (requested_corpus === corpus.id) {
        app.current_corpus_id = corpus.id;
        app.current_group_id = group.id;
        return;
      }

      const cpl = common_prefix_length(requested_corpus, corpus.id);
      const ld = levenshtein(requested_corpus, corpus.id);

      if (cpl > best_match.cpl || (cpl === best_match.cpl && ld < best_match.ld)) {
        best_match = {
          corpus_id: corpus.id,
          group_id: group.id,
          cpl: cpl,
          ld: ld
        };
      }
    }
  }

  // No exact match found
  app.warning_level = 2; // Initialize at 2 because the watcher `current_corpus_id` decrements later
  app.warning_message = `⚠️  ${requested_corpus} &rarr; ${best_match.corpus_id}`;
  app.current_corpus_id = best_match.corpus_id;
  app.current_group_id = best_match.group_id;
}

// ==================================================================================
function audio_init() {
  let audio_player = document.getElementById('audioPlayer')
  function update () {
    if (audio_player.currentTime >= app.audio_end) {
      audio_player.pause()
    } else {
      let token_data = app.audio_tokens[app.audio_speaking_index].dataset
      let token_end = Number(token_data.begin) + Number(token_data.dur)
      if (audio_player.currentTime > token_end) {
        audio_speaking_token (app.audio_speaking_index + 1)
      }
    }
  }

  audio_player.addEventListener('play', function() {
    if (app.audio_tokens != undefined) {
      app.audio_interval_id = setInterval(update, 50)
    }
  })

  audio_player.addEventListener('pause', function() {
    if (app.audio_tokens != undefined) {
      if (app.audio_interval_id) {
        clearInterval(app.audio_interval_id)
        app.audio_interval_id = undefined
      }
      if (audio_player.currentTime >= app.audio_end) {
        audio_player.currentTime = app.audio_begin
      }
    }
  })

  audio_player.addEventListener('seeking', function() {
    if (app.audio_tokens != undefined) {
      let pos = 0
      app.audio_tokens.forEach (function (node,index) {
        node.classList.remove('speaking')
        let begin = Number(node.dataset.begin)
        let end = begin + Number(node.dataset.dur)
        if (audio_player.currentTime >= begin && audio_player.currentTime <= end) {
          pos = index
        }
      })
      audio_speaking_token(pos)
    }
  })

  function audio_speaking_token(position) {
    let prev_word = app.audio_tokens[app.audio_speaking_index]
    prev_word.classList.remove('speaking')
    let new_word = app.audio_tokens[position]
    app.audio_speaking_index = position
    new_word.classList.add('speaking')
  }
}

// ==================================================================================
function open_validation_page() {
  let param = {
    corpus: app.current_corpus_id,
    file: 'valid_sud.json'
  }

  generic(app.backend_server, 'get_build_file', param)
  .then(function (data) {
    if (data === null) { return }
    localStorage.setItem('valid_data', data)
    localStorage.setItem('top_url', window.location.origin)
    localStorage.setItem('corpus', app.current_corpus_id)
    window.open('validator.html')
  })
}

// ==================================================================================
function aggrid(base_name) {
  let params = new URLSearchParams()
  params.append('corpus', app.current_corpus_id)
  params.append('datafile', `${base_name}.json`)
  window.open(`aggrid.html?'${params.toString()}`)
}

// ==================================================================================
function get_param_stage2 () { // in a second stage to be put behind a timeout.

  // If there is a get arg in the URL named 'relation' -> make the search directly
  if (url_params.has('relation')) {
    let source = ''
    if (url_params.has('source')) {
      source = `X [upos = "${url_params.get('source')}"]; `
    }
    let target = ''
    if (url_params.has('target')) {
      target = `Y [upos = "${url_params.get('target')}"]; `
    }
    cmEditor.setValue(`pattern {\n  ${source} ${target} X -[${url_params.get('relation')}]-> Y\n}`)
    search()
  }

  // read 'request' param (and backward compatibility with the old 'pattern' name)
  let request_param = url_params.has('request') ? url_params.get('request') : url_params.get('pattern')

  if (request_param) {
    app.skip_history = true
    app.view_left_pane = false
    cmEditor.setValue(request_param)
    setTimeout(function () {
      search()
    }, 50)
  }

  let count_param = url_params.get('count')
  if (count_param) {
    app.view_left_pane = false
    cmEditor.setValue(count_param)
    setTimeout(function () {
      count ()
    }, 50)
  }
}

// ==================================================================================
function get_clust_param () {
  let param = {}
  if (app.clust1 == 'key') { param.clust1_key = app.clust1_key; app.row_label = app.clust1_key }
  if (app.clust1 == 'whether') { param.clust1_whether = clust1_cm.getValue(); app.row_label = 'Whether_1' }
  if (app.clust2 == 'key') { param.clust2_key = app.clust2_key; app.col_label = app.clust2_key }
  if (app.clust2 == 'whether') { param.clust2_whether = clust2_cm.getValue(); app.col_label = 'Whether_2' }
  return param
}

// ==================================================================================
async function set_clust_param(param) {
  app.clust1 = 'no' // default
  if ('clust1_key' in param) {
    app.clust1 = 'key'
    app.clust1_key = param.clust1_key
  }
  if ('clust1_whether' in param) {
    app.clust1 = 'whether'
    setTimeout(function () {
      clust1_cm.setValue(param.clust1_whether)
    }, 0)
  }

  app.clust2 = 'no' // default
  if ('clust2_key' in param) {
    app.clust2 = 'key'
    app.clust2_key = param.clust2_key
  }
  if ('clust2_whether' in param) {
    app.clust2 = 'whether'
    setTimeout(function () {
      clust2_cm.setValue(param.clust2_whether)
    }, 0)
  }
}

// ==================================================================================
// Binding for interactive part in snippets part
function right_pane(base) {
  let file = `snippets/${base}.html`
  fetch(file)
  .then(response => {
    if (!response.ok) {
      direct_error(`${response.statusText}: \`${file}\``);
      return
    }
    return response.text()
  })
  .then(data => {
    if (data === null) { return }
    $('#right-pane').html(data)
    $('.inter').click(function () {
      let clust_param = {}
      if (this.getAttribute('clustering')) { clust_param.clust1_key = this.getAttribute('clustering') }
      if (this.getAttribute('whether')) { clust_param.clust1_whether = this.getAttribute('whether') }
      if (this.getAttribute('clustering2')) { clust_param.clust2_key = this.getAttribute('clustering2') }
      if (this.getAttribute('whether2')) { clust_param.clust2_whether = this.getAttribute('whether2') }
      set_clust_param (clust_param)

      // Update of the textarea
      const file = `snippets/${this.getAttribute('snippet-file')}`
      fetch(file)
      .then(response => {
        if (!response.ok) {
          direct_error(`${response.statusText}: \`${file}\``);
          return ''
        }
        return response.text()
      })
      .then(request => {
        cmEditor.setValue(request)
      })
    })
  })
}







// ==================================================================================
function named_cluster_path() {
  if (app.cluster_dim == 1) {
    return ([app.cluster_list[app.current_cluster_path[0]].value])
  }
  if (app.cluster_dim == 2) {
    return ([
      app.grid_rows[app.current_cluster_path[0]].value,
      app.grid_columns[app.current_cluster_path[1]].value
    ])
  }
  return ([])
}

// ==================================================================================
function more_results(post_update_graph_view=false) {
  let param = {
    uuid: app.current_uuid,
    cluster_path: app.current_cluster_path,
    named_cluster_path: named_cluster_path()
  }

  generic(app.backend_server, 'more_results', param)
  .then(data => {
    if (data === null) { return }
    const { cluster_dim, current_cluster_path } = app;

    if (cluster_dim === 0) {
      app.clusters = app.clusters.concat(data.items)
    } else if (cluster_dim === 1) {
      app.clusters[current_cluster_path[0]] = app.clusters[current_cluster_path[0]].concat(data.items)
    } else if (cluster_dim === 2) {
      app.clusters[current_cluster_path[0]][current_cluster_path[1]] = app.clusters[current_cluster_path[0]][current_cluster_path[1]].concat(data.items)
    }
    app.update_current_cluster()

    if (post_update_graph_view) {
      update_graph_view()
    }
  })
}

// ==================================================================================
function count() {
  app.current_custom = ''
  app.current_cluster_path = undefined
  app.cluster_dim = 0
  app.wait = true
  app.search_mode = false

  generic(app.backend_server, app.multi_mode ? 'count_multi' :'count', search_param())
  .then(function (data) {
    if (data === null) { app.wait = false; return }
    var message = `Hi, it seems that you sent many times (20?) the same request on different treebanks
This usage makes the server crashes regularly

Can you try to use the **[Grew-count](https://grew.fr/usage/grew_count/)** service instead?

Feel free to contact **[Bruno.Guillaume@inria.fr](mailto:Bruno.Guillaume@inria.fr)** if you want to discuss on the best way to run your experiment

Thanks!`
    if (data.redundant !== undefined) {
      direct_info (message)
    }
    app.current_time = data.time
    app.nb_solutions = data.nb_solutions

    if (data.nb_solutions == 0) {
      app.result_message = 'No results'
    } else {
      app.result_message = `${data.nb_solutions} occurrence${(data.nb_solutions > 1) ? 's' : ''}`
    }
    if ('cluster_array' in data) {
      app.cluster_dim = 1
      app.cluster_list = data.cluster_array.map((elt, index) => {
        elt.index = index;
        elt.percent = ratio(elt.size, data.nb_solutions);
        return elt;
      });
    } else if ('cluster_grid' in data) {
      app.cluster_dim = 2
      app.grid_rows = data.cluster_grid.rows.map((elt, _) => {
        elt.percent = ratio(elt.size, data.nb_solutions);
        return elt;
      });
      app.grid_columns = data.cluster_grid.columns.map((elt, _) => {
        elt.percent = ratio(elt.size, data.nb_solutions);
        return elt;
      });
      app.grid_message = ''
      app.grid_cells = data.cluster_grid.cells.map((row,row_index) => {
        return row.map((cell,col_index) => {
          return {
            size: cell,
            percent: ratio(cell, data.nb_solutions),
            percent_col: ratio(cell, app.grid_columns[col_index].size),
            percent_row: ratio(cell, app.grid_rows[row_index].size),
          }
        })
      })
      update_grid_message(data)
    }
    app.wait = false
  })
} // count

// ==================================================================================
function open_param(param) {
  log (`open param: ${JSON.stringify(param)}`)

  cmEditor.setValue(param.request)
  if ('corpus' in param) {
    app.multi_mode = false
    app.current_corpus_id = param.corpus_id
  } else {
    app.multi_mode = true
    app.selected_corpora = param.corpus_id_list 
  }
  app.display = param.display
  set_clust_param (param.clust)
}

// ==================================================================================
function search_param() {
  let param = {
    request: cmEditor.getValue(),
    display: app.display,
    clust: get_clust_param(),
  }
  if (app.multi_mode) {
    param.corpus_list = app.selected_corpora
  } else {
    param.corpus = app.current_corpus_id
  }
  return param
}

// ==================================================================================
function duplicate() {
  let base_url = window.location.origin
  let param = search_param()
  localStorage.setItem('param_for_duplicate', JSON.stringify (param))
  let url = `${base_url}?corpus=${app.current_corpus_id}`
  window.open(url, '_blank').focus()
}

// ==================================================================================
function search() {
  app.current_custom = ''
  app.result_message = ''
  app.current_cluster_path = undefined
  app.current_view = 0
  app.wait = true
  app.search_mode = true

  generic(app.backend_server, app.multi_mode ? 'search_multi' :'search' , search_param())
  .then (data => {
    if (data === null) { app.wait = false; return }
    app.search_mode = true
    app.current_uuid = data.uuid
    app.current_pivots = data.pivots
    app.current_time = data.time
    app.nb_solutions = data.nb_solutions

    if (app.multi_mode) {
      app.result_message =  `${app.nb_solutions} occurrences in ${app.selected_corpora.length} corpora`;
      if (data.nb_partial > 0) {
        app.result_message += ` (partial results in ${data.nb_partial} corp${data.nb_partial > 1 ? "ora" : "us"})`
      }  
    } else {
      switch (data.status) {
        case 'complete':
          if (data.nb_solutions === 0) {
            app.result_message = 'No results'
          } else {
            app.result_message = `${data.nb_solutions} occurrence${(data.nb_solutions > 1) ? 's' : ''}`
          }
          break
          case 'max_results':
          app.result_message = `More than ${data.nb_solutions} results found in ${(100 * data.ratio).toFixed(2)}% of the corpus`
          break
          case 'timeout':
          app.result_message = `Timeout. ${data.nb_solutions} occurrences found in ${(100 * data.ratio).toFixed(2)}% of the corpus`
          break
          default:
          direct_error(`unknown status: ${data.status}`)
          }
    }







    if ('cluster_single' in data) {
      app.cluster_dim = 0
      app.clusters = []
      if (data.nb_solutions > 0) {
        app.current_cluster_path = []
        more_results(true)
      }
    } else if ('cluster_array' in data) {
      app.cluster_dim = 1
      app.cluster_list = data.cluster_array.map((elt, index) => {
        elt.index = index;
        elt.percent = ratio(elt.size, data.nb_solutions);
        return elt;
      });
      app.clusters = Array(app.cluster_list.length).fill([])
    } else if ('cluster_grid' in data) {
      app.cluster_dim = 2
      app.grid_rows = data.cluster_grid.rows.map((elt, _) => {
        elt.percent = ratio(elt.size, data.nb_solutions);
        return elt;
      });
      app.grid_columns = data.cluster_grid.columns.map((elt, _) => {
        elt.percent = ratio(elt.size, data.nb_solutions);
        return elt;
      });
      app.grid_cells = data.cluster_grid.cells.map((row,row_index) => {
        return row.map((cell,col_index) => {
          return {
            size: cell,
            percent: ratio(cell, data.nb_solutions),
            percent_col: ratio(cell, app.grid_columns[col_index].size),
            percent_row: ratio(cell, app.grid_rows[row_index].size),
          }
        })
      })

      app.clusters = Array.from({ length: app.grid_rows.length }, () => Array(app.grid_columns.length).fill([]))
      update_grid_message(data)
    }
    app.wait = false
  })
} // search

// ==================================================================================
  function update_grid_message(data) {
  if (data.cluster_grid.total_rows_nb > data.cluster_grid.rows.length) {
    app.grid_message = '<b>' + data.cluster_grid.total_rows_nb + '</b> lines (lines above rank '+ data.cluster_grid.rows.length +' are merged with key <code>__*__</code>); '
  } else {
    app.grid_message = data.cluster_grid.total_rows_nb + ' line' + (data.cluster_grid.total_rows_nb > 1 ? 's; ' : '; ')
  }
  if (data.cluster_grid.total_columns_nb > data.cluster_grid.columns.length) {
    app.grid_message += data.cluster_grid.total_columns_nb + ' columns (columns above rank '+ data.cluster_grid.columns.length +' are merged with key <code>__*__</code>)'
  } else {
    app.grid_message += data.cluster_grid.total_columns_nb + ' column' + (data.cluster_grid.total_columns_nb > 1 ? 's' : '')
  }
}

// ==================================================================================
function show_export_modal() {
  let data_folder = `${app.backend_server}data/${app.current_uuid}`
  $.get(`${data_folder}/export.tsv`, function (data) {
    const lines = data.split('\n')

    let html
    let headers = lines[0].split('\t')

    if (headers.length === 2) {
      html = '<table class="export-table-2">'
      html += '<colgroup><col width="10%" /><col width="90%" /></colgroup>'
    } else {
      html = '<table class="export-table-4">'
      html += '<colgroup><col width="10%" /><col width="40%" align="right" /><col width="10%" /><col width="40%" /></colgroup>'
    }

    // headers
    html += '<tr><th>' + lines[0].replace(/\t/g, '</th><th>') + '</th></tr>\n'

    lines.slice(1).forEach(line => {
      html += '<tr><td>' + line.replace(/\t/g, '</td><td>') + '</td></tr>\n'
    })
    html += '</table>'

    $('#exportResult').html(html)
  })
  $('#export-modal').modal('show')
}

// ==================================================================================
function run_export() {
  if (app.current_pivots.length > 1) {
    $('#pivot-modal').modal('show')
  } else if (app.current_pivots.length == 1) {
    export_tsv(app.current_pivots[0])
  } else {
    export_tsv('')
  }
}

// ==================================================================================
function clusters_export() {
  let tsv = ''
  if (app.clust1 == 'key') {
    tsv += app.clust1_key + '\tOccurrences\n'
  } else {
    tsv += 'whether\tOccurrences\n'
  }
  tsv += app.cluster_list_sorted.map(cl => cl.value + '\t' + cl.size).join('\n')
  download_text('clusters.tsv', tsv)
}

// ==================================================================================
function export_tsv(pivot) {
  $('#pivot-modal').modal('hide')
  let param = {
    uuid: app.current_uuid,
    pivot: pivot,
  }

  generic(app.backend_server, 'export', param)
  .then( _ => {
    show_export_modal()
  })
}

// ==================================================================================
function conll_export() {
  let param = {
    uuid: app.current_uuid,
  }

  generic(app.backend_server, 'conll_export', param)
  .then( () => {
    let data_folder = `${app.backend_server}data/${app.current_uuid}`
    window.location = `${data_folder}/export.conllu`
  })
}

// ==================================================================================
function update_parallel() {
  if (app.parallel != 'no') {
    let param = {
      uuid: app.current_uuid,
      corpus: app.parallel,
      sent_id: app.sent_id,
    }

    generic(app.backend_server, 'parallel', param)
    .then( data => {
      if (data === null) { return }
      app.parallel_svg = `${app.backend_server}data/${app.current_uuid}/${data}`
    })
  }
}

// ==================================================================================
function download() {
  let data_folder = `${app.backend_server}data/${app.current_uuid}`
  window.location = data_folder + '/export.tsv'
}

// ==================================================================================
function show_conll() {
  let param = {
    uuid: app.current_uuid,
    current_view: app.current_view,
    cluster_path: app.current_cluster_path,
    named_cluster_path: named_cluster_path()
  }

  generic(app.backend_server, 'conll', param)
  .then( data => {
    $('#code_viewer').html(data)
    $('#code_modal').modal('show')
  })
}

// ==================================================================================
function show_code() {
  $('#code_viewer').html(app.current_item.code)
  $('#code_modal').modal('show')
}

// ==================================================================================
function code_copy() {
  navigator.clipboard.writeText($('#code_viewer').html())
}

// ==================================================================================
function dowload_tgz() {
  let param = {
    corpus: app.current_corpus_id,
  }

  generic(app.backend_server, 'dowload_tgz', param)
  .then( data => {
    window.open(app.backend_server + data)
  })
}


// ==================================================================================
function open_build_file(file,get_param,get_value) {
  let expanded_file = file.replace('__id__', app.current_corpus_id)
  let param = {
    corpus: app.current_corpus_id,
    file: expanded_file
  }

  generic(app.backend_server, 'get_build_file', param)
  .then( data => {
    var new_window = window.open('')
    var html = ''
    if (file.endsWith('.txt')) {
      html = `<pre>+${data}</pre>`
    } else {
      html = data
    }
    new_window.document.write(html)

    if (get_param != undefined && get_value != undefined) {
      let params = new URLSearchParams()
      params.append ('corpus', app.current_corpus_id)
      params.append (get_param, get_value)
      let new_url = `${window.location.origin}?${params.toString()}`
      new_window.history.replaceState({}, '', new_url)
    }
  })
}

// ==================================================================================
function save_request() {
  let param = search_param()
  param.uuid = app.current_uuid
  param.search_mode = app.search_mode
  generic(app.backend_server, 'save', param)
  .then( _ => {
    history.pushState({ id: app.current_uuid }, '', '?custom=' + app.current_uuid)
    app.current_custom = window.location.href
    SelectText('custom-url')
  })
}


// ==================================================================================
function update_corpus() {
  app.current_custom = ''
  $('.timeago').remove()
  app.meta_info = false

  let audio_player = document.getElementById('audioPlayer')
  audio_player.pause()

  if (app.current_corpus.desc) {
    $('#corpus-desc-label').tooltipster('enable')
    $('#corpus-desc-label').tooltipster('content', app.current_corpus.desc)
  } else {
    $('#corpus-desc-label').tooltipster('disable')
  }

  app.parallel = 'no'
  app.parallels = app.current_corpus.parallels ? app.current_corpus.parallels : []

  if (app.current_corpus.snippets) {
    right_pane(app.current_corpus.snippets)
  } else if (app.current_group.snippets) {
    right_pane(app.current_group.snippets)
  } else if (app.current_corpus.config) {
    right_pane(app.current_corpus.config)
  } else {
    right_pane('_default')
  }

  // update info button and update timestamp if needed
  if (app.check_built('desc.json')) {
    let param = {
      corpus: app.current_corpus_id,
      file: 'desc.json'
    }

    generic(app.backend_server, 'get_build_file', param)
    .then( data => {
      let json = JSON.parse(data)
      app.meta_info = true
      let html = ''
      for (let key in json) {
        if (key == 'update') {
          const event = new Date(json[key])
          $('#update_ago').html(`<time class="timeago" datetime="${event.toISOString()}">update time</time>`)
          $('#update_ago > time').timeago() // make it dynamic
        } else {
          html += `<p>${key}: ${json[key]}`
        }
      }
      $('#info-button').tooltipster('content', html)
    })
  }




  if (app.skip_history) {
    app.skip_history = false
  } else {
    setTimeout(function () {
      history.pushState({},
        '',
        `?corpus=${app.current_corpus_id}`
      )
    }, 100)
  }
}

// ==================================================================================
function select_cluster_2d(c, r) {
  log('=== select_cluster_2d ===')
  log(c, r)
  if (app.search_mode && (app.current_cluster_path == undefined || app.current_cluster_path[0] != r || app.current_cluster_path[1] != c)) {
    app.current_cluster_path = [r, c]
    app.current_view = 0
    if (app.clusters[r][c].length == 0) {
      more_results(true)
    } else {
      app.update_current_cluster()
      update_graph_view ()
    }
  }
}
