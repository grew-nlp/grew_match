var app = new Vue({
  el: '#app',
  data: {
    clust1: "no", // 3 possible values: no, key or whether
    clust1_key: "",
    clust1_whether: "",

    clust2: "no", // 3 possible values: no, key or whether

    doc_url: "",
    meta: {},

    code: "",

    mode: "",

    sent_id: "",

    parallel: "no",
    parallels: [],
    parallel_svg: undefined,
    
    // printing parameters
    lemma: true,
    upos: true,
    xpos: false,
    features: true,
    tf_wf: false,
    context: false,
  },
  methods: {
    update_parallel_() {
      update_parallel();
    }
  }
});
