var app = new Vue({
  el: '#app',
  data: {
    // Init value on whether to ensure nice initialisation.
    clust1: "whether", // 3 possible values: no, key or whether
    clust1_key: "",
    clust1_whether: "",

    clust2: "no", // 3 possible values: no, key or whether
  },
});

$(document).ready(function() {
  setTimeout(start, 0); // hack for correct init of clust1_cm
})

function start() {
  const get_cluster = getParameterByName("clustering");
  const whether = getParameterByName("whether");
  if (get_cluster.length > 0) {
    app.clust1 = "key";
    app.clust1_key = get_cluster;
  } else if (whether.length > 0) {
    app.clust1 = "whether";
    setTimeout(function() {
      clust1_cm.setValue(whether); // hack for correct init of clust1_cm
    }, 0)
  } else {
    app.clust1 = "no";
  }


}