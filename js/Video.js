Vue.component("video-player", {
  template: "#video-template",

  props: {
    videoUrl: String
  },

  data: function () {
    return {
      hideText: 'Hide video',
      isVideoHidden: false,
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
    }
  },

  mounted: function () {
    this.videoRef = this.$refs.video
    this.setVideoPosition()
    this.cachedVideoUrl = this.getVideoUrl()
  },

  methods: {
    toggleVideo() {
      this.isVideoHidden = !this.isVideoHidden
      this.hideText = this.isVideoHidden ? "Show video" : "Hide video"
    },

    getVideoUrl() {
      return this.videoUrl || ""
    },

    setSpeed(speed) {
      this.videoSpeed = speed
      this.changeVideoSpeed()
    },

    changeVideoSpeed() {
      if (this.videoRef) {
        this.videoRef.playbackRate = Number(this.videoSpeed)
      }
    },
    moveDiv(e) {
      if (!this.dragging) return
      this.x = e.clientX - this.offsetX
      this.y = e.clientY - this.offsetY
    },

    startDrag(e) {
      if (this.isResizing) return
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
      this.isResizing = true
      this.offsetX = e.clientX
      document.addEventListener('mousemove', this.resize)
      document.addEventListener('mouseup', this.stopResize)
    },
    resize(e) {
      if (!this.isResizing) return

      const widthChange = this.offsetX - e.clientX - 0.5
      this.videoWidth = Math.max(10,this.videoWidth + (widthChange / window.innerWidth) * 100 )

      this.x = this.x - widthChange 
      this.offsetX = e.clientX
    },
    stopResize() {
      this.isResizing = false
      document.removeEventListener('mousemove', this.resize)
      document.removeEventListener('mouseup', this.stopResize)
    },
    speedBtnHandleClick(event) { 
      const value = event.target.children[0].id
      this.setSpeed(value)
    },
  }
})