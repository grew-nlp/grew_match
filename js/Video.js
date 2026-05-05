Vue.component("video-player", {
  template: "#video-template",

  props: {
    video_url: String
  },

  data: function () {
    return {
      x: 20,
      y: 100,
      dragging: false,
      offsetX: 0,
      offsetY: 0,
      cachedVideoUrl: '',
      videoSpeed: '1',
      showSpeedBtn: true,
      videoWidth: 25,
      isResizing: false,
      videoRef: null,
      boundResize: null ,
      boundStopResize: null ,
    }
  },

  mounted: function () {
    this.videoRef = this.$refs.video
    this.setVideoPosition()
    this.cachedVideoUrl = this.get_video_url()
    window.addEventListener('resize', this.setVideoPosition)
  },
  methods: {
    get_video_url() {
      return this.video_url || ""
    },

    setSpeed(speed) {
      this.videoSpeed = speed
      this.changePlaybackSpeed()
    },

    changePlaybackSpeed() {
      if (this.videoRef) {
        this.videoRef.playbackRate = Number(this.videoSpeed)
      }
    },
    moveDiv(e) {
      if (!this.dragging) return
      const box = this.$refs.videoDiv 
      // calcul screen limits
      const maxX = window.innerWidth - box.offsetWidth;
      const maxY = window.innerHeight - box.offsetHeight;

      const x = e.clientX - this.offsetX
      const y = e.clientY - this.offsetY
      // avoid div to go out of the screen
      this.x = Math.max(0, Math.min(x, maxX));
      this.y = Math.max(50, Math.min(y, maxY));
    },

    startDrag(e) {
      if (this.isResizing) return
      this.setVideoWidth()
      this.dragging = true
      this.offsetX = e.clientX - this.x
      this.offsetY = e.clientY - this.y
      window.addEventListener('mousemove', this.moveDiv)
    },

    stopDrag() {
      this.dragging = false
      window.removeEventListener('mousemove', this.moveDiv)
    },

    setVideoPosition() {
      this.x = window.innerWidth * 0.7
    },

    startResize(e) {
      this.setVideoWidth()
      this.isResizing = true;
      this.offsetX = e.clientX;
      this.offsetY = e.clientY;
      this.boundResize = this.resize.bind(this)
      this.boundStopResize = this.stopResize.bind(this)
      document.addEventListener('mousemove', this.boundResize);
      document.addEventListener('mouseup', this.boundStopResize);
    },
    resize(e) {
      if (!this.isResizing) return;
      // Calculate different of mouse position
      const widthChange = this.offsetX - e.clientX - 0.5;
      const prevWidth = this.videoWidth;
      // Update width based on mouse movement
      this.videoWidth = Math.max(10, this.videoWidth + (widthChange / window.innerWidth) * 100);
      //move video to the left
      const actualWidthChangePx = ((this.videoWidth - prevWidth) / 100) * window.innerWidth;
      this.x = this.x - actualWidthChangePx;

      // Update the mouse offset for next movement
      this.offsetX = e.clientX;
      this.offsetY = e.clientY;
    },
    stopResize() {
       this.isResizing = false;
      if (this.boundResize) document.removeEventListener('mousemove', this.boundResize);
      if (this.boundStopResize) document.removeEventListener('mouseup', this.boundStopResize);
      this.boundResize = null;
      this.boundStopResize = null;
    },
    speedBtnHandleClick(event) { 
      const value = event.target.children[0].id
      this.setSpeed(value)
    },
    setVideoWidth(){
      const container = this.$refs.videoDiv 
      
      //calcul actual height and convert px into %
      const widthInPx = container.offsetWidth;
      this.videoWidth = (widthInPx / window.innerWidth) * 100;
    }
  }
})