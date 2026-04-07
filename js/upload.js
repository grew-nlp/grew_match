"use strict";

let app = new Vue({
  el: '#app',
  data: {
    schemas: ["UD", "SUD", "Parseme"],
    current_schema: "UD",
    config: undefined,
    backend_server: "http://localhost:10024/",

    folder_id: undefined,

    nb_files:0,
    count_upload:0,

    file_list: [],

    sizes: {"nb_trees":0,"nb_tokens":0},
    url: "",
    log: [],

    uploading: false,
    upload_message: "",
  }
});

// ====================================================================================================
$("#corpus_input").change(function(event) {
  const files = event.target.files;
  app.file_list = files;
})

// ====================================================================================================
async function build_corpus() {
  const files = app.file_list;
  const data = { schema: app.current_schema };
  const session_id = await generic_files('http://localhost:10024', 'new_corpus', files, data);
  app.url = window.location.protocol + "//" + window.location.host + "?single=" + session_id
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
      alert(JSON.stringify(result.message));
      return null;
    } else {
      return result.data;
    }
  } catch (error) {
    const msg = `Service \`${service}\` unavailable.\n\n${error.message}`;
    alert(msg, "Network error");
  }
}
