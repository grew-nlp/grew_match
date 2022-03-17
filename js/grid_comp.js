// register the grid component
Vue.component("cluster-grid", {
  template: "#grid-template",
  props: {
    columns: Array,
    rows: Array,
    cells: Object,
  },
  methods: {
     xxx(c,r) {
       console.log(c,r);
    }
  }
});
