// register the grid component
Vue.component("cluster-grid", {
  data: function () {
    return {
      selected_col: undefined,
      selected_row: undefined,
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
  },
  methods: {
     select_cluster_2d_ (c,r) {
       this.selected_col = c;
       this.selected_row = r;
       select_cluster_2d(c, r);
    }
  }
});
