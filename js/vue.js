var app = new Vue({
  el: '#app',
  data: {
    clust1: "no", // 3 possible values: no, key or whether
    clust1_key: "",
    clust1_whether: "",

    clust2: "no", // 3 possible values: no, key or whether
  },
});

$(document).ready(function() {
  const get_cluster = getParameterByName("clustering");
  if (get_cluster.length > 0) {
    app.clust1 = "key";
    app.clust1_key = get_cluster;
  }
  const whether = getParameterByName("whether");
  if (whether.length > 0) {
    app.clust1 = "whether";
    app.clust1_whether = whether;
  }


})