import WeCropper from '../../components/we-cropper/we-cropper.js';

Page({
  data: {
    cropperOpt: {
      id: 'cropper', // canvas ID，必须与 wxml 中的 canvas-id 一致
      width: 0, // 动态设置
      height: 0, // 动态设置
      src: '', // 图片路径
      scale: 2.5, // 缩放比例
      zoom: 8, // 缩放系数
      cut: {
        x: 0, // 裁剪框 x 坐标
        y: 0, // 裁剪框 y 坐标
        width: 200, // 裁剪框宽度
        height: 200 // 裁剪框高度
      }
    }
  },

  onLoad() {
    // 使用异步 API 获取设备信息
    wx.getSystemSetting({
      success: setting => {
        wx.getWindowInfo({
          success: window => {
            this.setData({
              'cropperOpt.width': window.windowWidth,
              'cropperOpt.height': window.windowHeight * 0.6,
              'cropperOpt.pixelRatio': window.pixelRatio || 1
            });
            console.log('cropperOpt:', this.data.cropperOpt);
            const { cropperOpt } = this.data;
            this.cropper = new WeCropper(cropperOpt)
              .on('ready', () => {
                console.log('裁剪框初始化完成');
              })
              .on('imageLoad', () => {
                console.log('图片加载完成');
              })
              .on('error', err => {
                console.error('裁剪组件错误:', err);
              });
          },
          fail: err => {
            console.error('获取窗口信息失败:', err);
            // 回退到默认值
            this.setData({
              'cropperOpt.width': 300,
              'cropperOpt.height': 300
            });
            const { cropperOpt } = this.data;
            this.cropper = new WeCropper(cropperOpt);
          }
        });
      },
      fail: err => {
        console.error('获取系统设置失败:', err);
      }
    });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const src = res.tempFilePaths[0];
        wx.getImageInfo({
          src: src,
          success: info => {
            console.log('图片信息:', info);
            this.setData({
              'cropperOpt.src': src
            });
            this.cropper.updateCanvas();
          },
          fail: err => {
            console.error('获取图片信息失败:', err);
          }
        });
      },
      fail: err => {
        console.error('选择图片失败:', err);
      }
    });
  },

  getCropperImage() {
    console.log('开始裁剪:', this.cropper);
    this.cropper.getCropperImage(res => {
      console.log('裁剪结果:', res);
      if (res && res.tempFilePath) {
        console.log('裁剪后的图片路径:', res.tempFilePath);
        wx.previewImage({
          urls: [res.tempFilePath]
        });
      } else {
        console.error('裁剪失败:', res);
      }
    });
  }
});