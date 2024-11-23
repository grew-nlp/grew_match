var md = new Remarkable();

var app = new Vue({
  el: '#app',
  data: {
    json: {
      display_modes: [],  // need to be initialized for proper html starting
      colmuns: [],
    },
    gridApi: null,
    filter_kind: "rows", // can be "rows" or "cols"
    filter_value: "",
    display_mode: 0,
    title: "",
    home: location.origin,
  },
  watch: {
    display_mode: function () {
      this.update_sorting();
      this.refresh_columns();
      this.gridApi.redrawRows();
    },
    filter_value: function() { this.refresh_columns() },
    filter_kind: function() { this.refresh_columns() }
  },
  methods: {
    set_display_mode (x) {
      this.display_mode = x;
    },
    update_sorting() {
      this.json.columns.forEach(c => {
        c.comparator= (function (v1,v2) {
          let n1 = v1 == undefined ? 0 : v1[app.display_mode];
          let n2 = v2 == undefined ? 0 : v2[app.display_mode];
          return n1 - n2
        });
      });
    },

    // method called both atfer filering changes and display mode change (sorting should be changed)
    refresh_columns(){
      if (app.filter_value == "") {
        this.gridApi.setRowData(this.json.cells) // all rows
        this.gridApi.setColumnDefs([col0,col1].concat(this.json.columns)) // all cols
      } else {
        if (app.filter_kind == "rows") {
          const re = new RegExp(this.filter_value, 'i');
          let filtered_rows = this.json.cells.filter(l => l.row_header.match(re));
          this.gridApi.setRowData(filtered_rows);
          const cols = new Set()
          filtered_rows.forEach((item, i) => {
            var keys = Object.keys(item);
            keys.forEach(cols.add, cols);
          });
          let filtered_cols = this.json.columns.filter(l => cols.has(l.field));
          this.gridApi.setColumnDefs([col0,col1].concat(filtered_cols));
        } else {
          const re = new RegExp(this.filter_value, 'i');
          let filtered_cols = this.json.columns.filter(function (l) { console.log (l); return l.field.match(re)});
          this.gridApi.setColumnDefs([col0,col1].concat(filtered_cols));
          const fields = new Set()
          filtered_cols.forEach((item, i) => {
            fields.add(item.field)
          });
          let filtered_rows = this.json.cells.filter(l => Object.keys(l).some(k => fields.has(k)));
          this.gridApi.setRowData(filtered_rows);
        }
      }
    },

    // cellRenderer sent to Ag-grid
    cell(params) {
      if (params.value != undefined) {

        // column 1 ==> just print the data
        if (params.colDef.field == "row_header") {
          return `<b>${params.value}</b>`;
        }

        // row 2
        else if (params.data.row_type == "TOTAL") {
          // test if full column is searchable
          if (app.json.kind == "TBR" || app.json.kind == "TBC") {
            return `<a class="btn btn-secondary disabled btn-sm">${params.value}</a>`;
          }
          else {
            return `<a class="btn btn-primary btn-sm" onclick='grew_match("col", "", "${params.colDef.field}")'>${params.value}</a>`;
          }
        }

        // column 2
        else if (params.colDef.field == "row_total" && params.data.row_total != undefined) {
          // test if the full row is searchable
          if (app.json.kind == "TBR") {
            return `<a class="btn btn-secondary disabled btn-sm">${params.value}</a>`;
          } else {
            return `<a class="btn btn-primary btn-sm" onclick='grew_match("row","${params.data.row_header}","")'>${params.data.row_total}</a>`;
          }
        }

        // regular cell: row > 2 && col > 2
        else {
          let style = this.json.display_modes[this.display_mode][1]
          if (style=="PERCENT") {
            v = (params.value[this.display_mode]* 100).toFixed(2) + "%"
          } else {
            v = params.value[this.display_mode]
          }
          return (`<a class="btn btn-success btn-sm" onclick='grew_match("cell", "${params.data.row_header}","${params.colDef.field}")'>${v}</a>`)
        }
      }
    }
  }
})

const col0 = {
  field: "row_header",
  headerName: "",
  sortingOrder: ['asc', 'desc', null],
  pinned: "left",
  lockPinned: true,
  width: 200,
}

let col1 = {
  field: "row_total",
  headerName: "", // Value is set in build_data
  sortingOrder: ['asc', 'desc', null],
  pinned: "left",
  lockPinned: true,
}

function build_grid(data) {
  app.json = data;
  app.title = md.render(app.json.title);
  if (app.json.home != undefined) {
    app.home = app.json.home
  }
  if (app.json.timestamp != undefined) {
    $('#update_ago').html('&nbsp;• Updated <time class="timeago" datetime="' + app.json.timestamp + '">update time</time>');
    $('#update_ago > time').timeago(); // make it dynamic
  }

  app.update_sorting(); // ensure that sorting is done on the right component

  col1.headerName = app.json.col_key;

  const gridOptions = {  
    columnDefs: [col0, col1].concat(app.json.columns),
    defaultColDef: {
      width: 150,
      sortable: true,
      sortingOrder: ['desc', 'asc'],
      resizable: true,
      cellRenderer: app.cell,
    },
    pinnedTopRowData: [app.json.columns_total],
  };
  
  const gridDiv = document.querySelector('#main_grid');
  console.log(111)
  new agGrid.Grid(gridDiv, gridOptions);
  console.log(222)
  
  gridOptions.api.setRowData(app.json.cells);
  app.gridApi = gridOptions.api;
}

function grew_match(kind, row_header, col_header) {
  if (app.json.kind == "TBR") {
    if (kind != "cell") {
      error ("grew_match", "only cell can be queried in *TBR* mode")
    } else {
      let request = app.json.requests[col_header];
      let treebank = row_header;
      let url = window.location.origin + "?corpus=" + treebank + "&request=" + request
      window.open(url, '_blank');
    }
  }

  if (app.json.kind == "TBC") {
    let request = ""
    if (kind == "row") {
      request = app.json.request;
    } else if (kind == "cell") {
      request = app.json.request + "%0Awith { "+ app.json.col_key + "=\""+ col_header +"\" }"
    }
    let treebank = row_header;
    let url = window.location.origin + "?corpus=" + treebank + "&request=" + request
    window.open(url, '_blank');
  }

  if (app.json.kind == "DC") {
    let request = app.json.request;
    if (kind == "row") {
      request += build_with(app.json.row_key, row_header)
    } else if (kind == "col") {
      request += build_with(app.json.col_key, col_header)
    } else if (kind == "cell") {
      request += build_with(app.json.col_key, col_header)
      request += build_with(app.json.row_key, row_header)
    }
    let treebank = app.json.treebank;
    let url = window.location.origin + "?corpus=" + treebank + "&request=" + request
    window.open(url, '_blank');
  }
}

function build_with(key,value) {
  let ks = key.split(/[./]/)
  console.log(ks)
  if (ks.length == 3) {  // if key = N.upos/ExtPos and value = ADP ----> N [ExtPos="ADP"/upos="ADP"]
    return "%0Awith { "+ ks[0] +" ["+ ks[1] + "=\""+ value +"\""+"/"+ ks[2] + "=\""+ value +"\""+"] }"
  } else if (ks.length == 2 && ks[1] == "__feature_name__") {
    return "%0Awith { "+ ks[0] + "["+ value +"] }"
  } else {
    return "%0Awith { "+ key + "=\""+ value +"\" }"
  } 
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
  var url_params = new URLSearchParams(window.location.search);
  $('[data-toggle="tooltip"]').tooltip()
  $.getJSON("instances.json")
  .done(function (data) {
    let host = window.location.host;
    if (!(host in data)) {
      direct_error("No backend associated to `"+host+"`, check `instances.json`");
      return
    }
    let backend_url = data[host]["backend"]

    let corpus = url_params.get('corpus');
    let datafile = url_params.get('datafile');
    if (corpus != null && datafile != null) {
      
      let param = {
        corpus_id: corpus,
        file: datafile
      };
      
      let form = new FormData();
      form.append("param", JSON.stringify(param));
      
      backend("get_build_file", form, function (data_string) {
        let data = JSON.parse(data_string)
        build_grid(data)
        // let col_filter = url_params.get('cols');
        // if (col_filter != null) {
        //   app.filter_kind = "cols";
        //   app.filter_value = col_filter;
        // }
        // let row_filter = url_params.get('rows');
        // if (row_filter != null) {
        //   app.filter_kind = "rows";
        //   app.filter_value = row_filter;
        // }
      }, null, backend_url)
      // if (get_param != undefined && get_value != undefined) {
      //     let params = new URLSearchParams(window.location.search)
      //     params.delete(get_param)
      //     params.append (get_param, get_value)
      //     let new_url = window.location.origin + "?" + params.toString()
      //     new_window.history.replaceState({}, "", new_url);
      //   } 
      // })
    } else {
      direct_error ('Wrong parameters (`corpus` and `datafile` expected)')
    }
  })
});

// ==================================================================================
function backend(service, form, data_fct, error_fct, backend_url) {
  let settings = {
    "url": backend_url + service,
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
          title: 'A BUG occurred, please report',
          html: JSON.stringify(response.exception),
        });
      } else {
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

