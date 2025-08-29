// 获取设备信息（替代已废弃的 getSystemInfoSync）
const { windowWidth, windowHeight } = wx.getWindowInfo();
const dpr = wx.getDeviceInfo().pixelRatio;

Component({
  properties: {
    src: {
      type: String,
      value: '',
      observer(newVal) {
        if (newVal) this.init();
      }
    },
    // 裁剪容器宽高（px）
    boundWidth: {
      type: Number,
      value: windowWidth
    },
    boundHeight: {
      type: Number,
      value: windowWidth
    },
    // 裁剪尺寸（px）
    cutWidth: {
      type: Number,
      value: 400
    },
    cutHeight: {
      type: Number,
      value: 400
    }
  },


  data: () => ({
    scale: 1,
    scaleMin: 0.5,
    scaleMax: 3,
    startTouch: null,
    touchDistance: 0,
    imageLeft: 0,
    imageTop: 0,
    imageWidth: 0,
    imageHeight: 0,
    cropperLeft: 0,
    cropperTop: 0,
    canvas: null,
    ctx: null
  }),

  ready() {
    const query = this.createSelectorQuery();
    query.select('#cropper').fields({ node: true, size: true }).exec(res => {
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');

      const width = res[0].width * dpr;
      const height = res[0].height * dpr;

      canvas.width = width;
      canvas.height = height;
      ctx.scale(dpr, dpr);

      this.canvas = canvas;
      this.ctx = ctx;

      if (this.data.src) {
        this.drawImage();
      }
    });
  },

  methods: {
    init() {
      const { src, boundWidth, boundHeight, cutWidth, cutHeight } = this.properties;

      wx.getImageInfo({
        src,
        success: (info) => {
          let imgWidth, imgHeight;
          const ratio = info.width / info.height;
          if (info.width > info.height) {
            imgWidth = boundWidth;
            imgHeight = boundWidth / ratio;
          } else {
            imgHeight = boundHeight;
            imgWidth = boundHeight * ratio;
          }

          const imageLeft = (boundWidth - imgWidth) / 2;
          const imageTop = (boundHeight - imgHeight) / 2;

          const cropperLeft = (boundWidth - cutWidth) / 2;
          const cropperTop = (boundHeight - cutHeight) / 2;

          this.setData({
            imageLeft, imageTop,
            imageWidth: imgWidth, imageHeight: imgHeight,
            cropperLeft, cropperTop
          }, () => {
            this.drawImage();
          });
        },
        fail: (err) => {
          console.error('获取图片信息失败', err);
        }
      });
    },

    drawImage() {
      if (!this.ctx || !this.data.src) return;
    
      const { src, imageLeft, imageTop, imageWidth, imageHeight, scale } = this.data;
      const ctx = this.ctx;
    
      // ✅ 清空画布
      ctx.clearRect(0, 0, this.properties.boundWidth, this.properties.boundHeight);
    
      // ✅ 使用 canvas.createImage()
      const image = this.canvas.createImage();
    
      // ✅ 确保 src 是本地临时文件路径（如 wx.chooseImage 返回的）
      image.src = src;
    
      image.onload = () => {
        console.log('✅ 图片加载成功，开始绘制', image.width, image.height);
        ctx.drawImage(
          image,
          imageLeft,
          imageTop,
          imageWidth * scale,
          imageHeight * scale
        );
        // ✅ 主动触发绘制
        ctx.draw && ctx.draw();
      };
    
      image.onerror = (err) => {
        console.error('❌ 图片加载失败', err, 'src:', src);
        // ✅ 提示用户
        wx.showToast({ title: '图片加载失败', icon: 'error' });
      };
    },

    touchStart(e) {
      if (e.touches.length >= 2) {
        this.data.touchDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
      this.data.startTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    },

    touchMove(e) {
      const { startTouch, touchDistance, scaleMin, scaleMax, scale } = this.data;

      if (e.touches.length >= 2) {
        const distance = this.getDistance(e.touches[0], e.touches[1]);
        if (!touchDistance) this.data.touchDistance = distance;
        const scaleDiff = (distance - touchDistance) / 1000;
        let newScale = scale + scaleDiff;
        newScale = Math.min(Math.max(newScale, scaleMin), scaleMax);

        if (newScale !== scale) {
          this.setData({ scale: newScale }, () => {
            this.drawImage();
          });
        }
        this.data.touchDistance = distance;
      } else if (startTouch) {
        const moveX = e.touches[0].clientX - startTouch.x;
        const moveY = e.touches[0].clientY - startTouch.y;

        let newLeft = this.data.imageLeft + moveX;
        let newTop = this.data.imageTop + moveY;

        this.setData({
          imageLeft: newLeft,
          imageTop: newTop
        }, () => {
          this.data.startTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          this.drawImage();
        });
      }
    },

    touchEnd() {
      this.data.startTouch = null;
    },

    getDistance(p1, p2) {
      const dx = p1.clientX - p2.clientX;
      const dy = p1.clientY - p2.clientY;
      return Math.hypot(dx, dy);
    },

    getCropperImage() {
      const { cropperLeft, cropperTop, cutWidth, cutHeight } = this.properties;
      const { scale = 1 } = this.data;
      const dpr = wx.getDeviceInfo().pixelRatio;

      const sx = cropperLeft * dpr;
      const sy = cropperTop * dpr;
      const sw = cutWidth * dpr;
      const sh = cutHeight * dpr;

      wx.canvasToTempFilePath({
        x: sx,
        y: sy,
        width: sw,
        height: sh,
        destWidth: cutWidth,
        destHeight: cutHeight,
        canvas: this.canvas,
        success: (res) => {
          this.triggerEvent('confirm', { tempFilePath: res.tempFilePath });
        },
        fail: (err) => {
          console.error('裁剪失败', err);
          this.triggerEvent('cancel');
        }
      }, this);
    },

    cancel() {
      this.triggerEvent('cancel');
    }
  }
});