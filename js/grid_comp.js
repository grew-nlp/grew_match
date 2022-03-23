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
    row_label: String,
    col_label: String,
    columns: Array,
    rows: Array,
    cells: Array,
  },
  methods: {
     select_cell_ (c,r) {
       this.selected_col = c;
       this.selected_row = r;
       select_cell(c*10, r*10);
    }
  }
});
