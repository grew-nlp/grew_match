"use strict";

const app = new Vue({
  el: '#app',
  data: {
    schemas: ["UD", "SUD", "Parseme"],
    current_schema: "UD",
    backend_server: undefined,  // set at starting time from config.json
    folder_id: undefined,
    file_array: [],
    desc: {},
    url: "",
    uploading: false,
    name: "",
  },
  computed: {
    total_size() {
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
      this.file_array.splice(name, 1);
    }
  }
});


// ==================================================================================
// Load config file and start application
document.addEventListener('DOMContentLoaded', start);

// ==================================================================================
async function start() {
  try {
    const config = await fetch_json('config.json');
    if ("instances" in config) {
      const instances = config.instances;
      const host = window.location.host;
      app.backend_server = instances[host].backend;
    } else if ("backend" in config) {
      app.backend_server = config.backend;
    } else {
      directError("Error in `config.json`");
    }
  } catch (error) {
    console.error(error);
  }
}

// ====================================================================================================
$("#corpus_input").change((event) => {
  app.file_array = Array.from(event.target.files);
})

// ====================================================================================================
async function build_corpus() {
  app.uploading = true
  app.url = ''
  const data = { 
    schema: app.current_schema,
    name: app.name,
  };
  const response = await generic_files(app.backend_server, 'new_corpus', app.file_array, data);
  if (response.session_id) {
    app.desc = response.desc
    if (app.desc.nb_tokens === 0) {
      direct_error ("Your corpus didn't contain any data\n\nCheck the files you send (format and files extensions)")
    } else {
      app.url = window.location.protocol + "//" + window.location.host + "?corpus=" + response.session_id
    }
  }
  app.uploading = false
}

