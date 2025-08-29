// 获取设备信息
const { windowWidth, windowHeight } = wx.getWindowInfo();
const dpr = wx.getDeviceInfo().pixelRatio;

Component({
  properties: {
    // 要裁剪的图片路径
    src: {
      type: String,
      value: '',
      observer(newVal) {
        if (newVal) {
          this.init();
        }
      }
    },
    // 裁剪区域的容器宽高 (px)
    boundWidth: {
      type: Number,
      value: windowWidth
    },
    boundHeight: {
      type: Number,
      value: windowWidth
    },
    // 最终裁剪输出的宽高 (px)
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
    // 图片缩放比例
    scale: 1,
    // 最小缩放比例
    scaleMin: 0.5,
    // 最大缩放比例
    scaleMax: 3,
    // 手势起始点
    startTouch: null,
    // 双指距离
    touchDistance: 0,
    // 图片位置
    imageLeft: 0,
    imageTop: 0,
    // 图片渲染尺寸
    imageWidth: 0,
    imageHeight: 0,
    // 裁剪框位置
    cropperLeft: 0,
    cropperTop: 0,
    // Canvas 实例
    canvas: null,
    // Canvas 2D 上下文
    ctx: null
  }),

  methods: {
    /**
     * 初始化，获取图片信息
     */
    init() {
      const { src, boundWidth, boundHeight, cutWidth, cutHeight } = this.properties;

      wx.getImageInfo({
        src,
        success: (info) => {
          console.log('获取图片信息成功', info);
          let imgWidth, imgHeight;
          const ratio = info.width / info.height;

          // 保持图片在容器内，等比缩放
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
            imageLeft,
            imageTop,
            imageWidth: imgWidth,
            imageHeight: imgHeight,
            cropperLeft,
            cropperTop
          }, () => {
            // 数据更新后绘制
            this.drawImage();
          });
        },
        fail: (err) => {
          console.error('获取图片信息失败', err);
          wx.showToast({ title: '图片加载失败', icon: 'error' });
        }
      });
    },

    /**
     * 将图片绘制到 Canvas 上
     */
    drawImage() {
      if (!this.ctx || !this.data.src) return;

      const { src, imageLeft, imageTop, imageWidth, imageHeight, scale } = this.data;
      const ctx = this.ctx;

      // 清空画布
      ctx.clearRect(0, 0, this.properties.boundWidth, this.properties.boundHeight);

      // ✅ 使用 new Image()，更稳定
      const image = new Image();
      image.onload = () => {
        console.log('✅ 图片已加载，开始绘制');
        ctx.drawImage(
          image,
          imageLeft,
          imageTop,
          imageWidth * scale,
          imageHeight * scale
        );
        // ✅ 主动触发绘制
        ctx.draw();
      };
      image.onerror = (err) => {
        console.error('❌ 图片加载失败', err, 'src:', src);
        wx.showToast({ title: '图片加载失败', icon: 'error' });
      };
      // ✅ 最后设置 src，确保事件已绑定
      image.src = src;
    },

    /**
     * 触摸开始
     */
    touchStart(e) {
      if (e.touches.length >= 2) {
        this.data.touchDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
      this.data.startTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    },

    /**
     * 触摸移动（缩放、拖动）
     */
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

    /**
     * 触摸结束
     */
    touchEnd() {
      this.data.startTouch = null;
    },

    /**
     * 计算两点间距离
     */
    getDistance(p1, p2) {
      const dx = p1.clientX - p2.clientX;
      const dy = p1.clientY - p2.clientY;
      return Math.hypot(dx, dy);
    },

    /**
     * 执行裁剪，生成裁剪后的图片
     */
    getCropperImage() {
      if (!this.canvas) {
        console.error('❌ Canvas 未初始化');
        wx.showToast({ title: '组件未就绪', icon: 'error' });
        return;
      }

      const { cropperLeft, cropperTop, cutWidth, cutHeight } = this.properties;
      const { scale = 1 } = this.data;
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

    /**
     * 取消裁剪
     */
    cancel() {
      this.triggerEvent('cancel');
    }
  },

  /**
   * 组件实例化完成后，初始化 Canvas
   */
  ready() {
    const query = this.createSelectorQuery();
    query.select('#cropper').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0]) {
        console.error('❌ 未找到 canvas 节点');
        return;
      }

      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');

      // 设置 canvas 实际像素
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      // 缩放上下文，使绘制单位与逻辑像素一致
      ctx.scale(dpr, dpr);

      // 保存到组件实例
      this.canvas = canvas;
      this.ctx = ctx;

      // 如果已有图片，则绘制
      if (this.data.src) {
        this.drawImage();
      }
    });
  }
});