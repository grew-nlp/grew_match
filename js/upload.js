"use strict";

let app = new Vue({
  el: '#app',
  data: {
    schemas: ["None", "UD", "SUD", "Parseme"],
    current_schema: "UD",
    config: undefined,
    backend_server: "http://localhost:10024/",

    folder_id: undefined,

    nb_files:0,
    count_upload:0,

    file_array: [],

    desc: {},
    url: "",
    log: [],

    uploading: false,

    name: "",

  },
  computed: {
    total_size: function () {
      return this.file_array.reduce((acc, file) => acc + file.size, 0);
    }
  },

  methods: {
    humanFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const units = ['B','KB','MB','GB','TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      const v = bytes / Math.pow(1024, i);
      return (v % 1 === 0 ? v : v.toFixed(2)) + ' ' + units[i];
    },

    remove_file(name) {
      console.log (name)
      app.file_array.splice(name, 1);
    }

  }

});

// ====================================================================================================
$("#corpus_input").change(function(event) {
  const files = event.target.files;
  app.file_array = Array.from(files);
})

// ====================================================================================================
async function build_corpus() {
  app.uploading = true
  const files = app.file_array;
  const data = { 
    schema: app.current_schema,
    name: app.name,
  };
  const response = await generic_files('http://localhost:10024', 'new_corpus', files, data);
  if (response.session_id) {
    app.url = window.location.protocol + "//" + window.location.host + "?single=" + response.session_id
    app.desc = response.desc
  } else {
    app.url = ''
  }
  app.uploading = false
}

// ------------------------------------------------------------
function read_desc () {
  const path = app.backend_server+"/upload/"+app.folder_id+"/"+app.folder_id+"_desc.json";
  fetch(path)
  .then(response => response.json())
  .then (function(desc){ app.sizes=desc })
}

// ------------------------------------------------------------
function read_log () {
  const path = app.backend_server+"/upload/"+app.folder_id+"/"+app.folder_id+".log";
  return fetch (path)
    .then (response => response.text())
    .catch((error) => {
      console.log(error)
    });
}

// ==================================================================================
async function generic_files(backend, service, files, data) {
  try {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }

    const response = await fetch(backend + "/" +  service, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.status === "ERROR") {
      direct_error(JSON.stringify(result.message));
      return null;
    } else {
      return result.data;
    }
  } catch (error) {
    const msg = `Service \`${service}\` unavailable.\n\n${error.message}`;
    direct_error(msg, "Network error");
    app.uploading = false
  }
}
