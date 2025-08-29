// 获取设备信息
const { windowWidth, windowHeight } = wx.getWindowInfo();
const dpr = wx.getDeviceInfo().pixelRatio;

Component({
  properties: {
    src: {
      type: String,
      value: '',
      observer(newVal) {
        if (newVal) {
          this.init();
        }
      }
    },
    boundWidth: {
      type: Number,
      value: windowWidth
    },
    boundHeight: {
      type: Number,
      value: windowWidth
    },
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

  methods: {
    init() {
      const { src, boundWidth, boundHeight, cutWidth, cutHeight } = this.properties;
    
      wx.getImageInfo({
        src,
        success: (info) => {
          console.log('获取图片信息成功', info);
          let imgWidth, imgHeight; // ✅ 定义变量
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
    
          // ✅ 使用正确的变量名：imgWidth, imgHeight
          this.setData({
            imageLeft,
            imageTop,
            imageWidth: imgWidth,   // ✅ 不是 imageWidth: imageWidth
            imageHeight: imgHeight, // ✅ 
            cropperLeft,
            cropperTop,
            scale: 1 // ✅ 确保 scale 有初始值
          }, () => {
            this.drawImage();
          });
        },
        fail: (err) => {
          console.error('获取图片信息失败', err);
          wx.showToast({ title: '图片加载失败', icon: 'error' });
        }
      });
    },

    drawImage() {
      if (!this.ctx || !this.data.src) return;
    
      const { imageLeft, imageTop, imageWidth, imageHeight, scale } = this.data;
    
      // ✅ 安全检查
      if (!imageWidth || !imageHeight || !scale || isNaN(imageWidth) || isNaN(imageHeight) || isNaN(scale)) {
        console.error('❌ 绘制参数无效', { imageWidth, imageHeight, scale });
        return;
      }
    
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.properties.boundWidth, this.properties.boundHeight);
    
      const image = this.canvas.createImage();
    
      image.onload = () => {
        console.log('✅ 图片加载成功，开始绘制');
        console.log('绘制参数:', { 
          imageLeft, 
          imageTop, 
          width: imageWidth * scale, 
          height: imageHeight * scale 
        });
    
        ctx.drawImage(
          image,
          imageLeft,
          imageTop,
          imageWidth * scale,
          imageHeight * scale
        );
      };
    
      image.onerror = (err) => {
        console.error('❌ 图片加载失败', err);
      };
    
      image.src = src;
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
      if (!this.canvas) {
        console.error('❌ Canvas 未初始化');
        wx.showToast({ title: '组件未就绪', icon: 'error' });
        return;
      }

      const { cropperLeft, cropperTop, cutWidth, cutHeight } = this.properties;
      const dpr = wx.getDeviceInfo().pixelRatio;

      // 计算裁剪区域在 canvas 上的实际像素
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
          console.log('✅ 裁剪成功', res.tempFilePath);
          this.triggerEvent('confirm', { tempFilePath: res.tempFilePath });
        },
        fail: (err) => {
          console.error('❌ 裁剪失败', err);
          wx.showToast({ title: '裁剪失败', icon: 'error' });
          this.triggerEvent('cancel');
        }
      }, this);
    },

    cancel() {
      this.triggerEvent('cancel');
    }
  },

  ready() {
    const query = this.createSelectorQuery();
    query.select('#cropper').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) {
        console.error('❌ 未找到 canvas 节点');
        return;
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');

      // ✅ 设置 canvas 的绘图表面大小
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;

      // ✅ 缩放上下文，使绘图单位与逻辑像素一致
      ctx.scale(dpr, dpr);

      this.canvas = canvas;
      this.ctx = ctx;

      if (this.data.src) {
        this.drawImage();
      }
    });
  }
});