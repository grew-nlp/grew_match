Vue.component("codmod", {
  template: "#codmod-template",

  props: {
    codmod: {required: true},
    show: {type: Boolean, required: true},
  },

  watch: {
    show(newVal) {
      if (newVal) {
        $('#codmod_id').modal('show');
      } else {
        $('#codmod_id').modal('hide');
      }
    }
  },
  methods: {
    copy () {
      navigator.clipboard.writeText(this.codmod.code)
    } 
  },
  // code below to handle closing with a click on the backdrop
  mounted() {
    $('#codmod_id').on('hidden.bs.modal', () => {
      this.$emit('close');
    });
  },
  beforeDestroy() {
    $('#codmod_id').off('hidden.bs.modal');
  }
})

