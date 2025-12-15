// register the grid component
Vue.component("cluster-grid", {
  data: function () {
    return {
    }
  },
  template: "#grid-template",
  props: {
    grid_display: Number,
    row_label: String,
    col_label: String,
    columns: Array,
    rows: Array,
    cells: Array,
    selected_col: Number,
    selected_row: Number,
  },
  methods: {
    select_cluster_2d_ (c,r) {
      select_cluster_2d (c, r);
    }
  }
});
