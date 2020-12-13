var app = new Vue({
  el: '#app',
  data: {
    clust1: "no", // 3 possible values: no, key or whether
    clust2: "no", // 3 possible values: no, key or whether
    clust1_key: "",
    clust1_whether: "",
  },
});

$(document).ready(function() {
  var get_cluster = getParameterByName("clustering");
  if (get_cluster.length > 0) {
    app.clust1 = "key";
    app.clust1_key = get_cluster;
  }
  var whether = getParameterByName("whether");
  console.log(">>>"+whether+"<<<");
  if (whether.length > 0) {
    app.clust1 = "whether";
    app.clust1_whether = whether;
  }


})