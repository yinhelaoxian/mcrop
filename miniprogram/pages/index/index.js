import WeCropper from '../../components/we-cropper/we-cropper.js';

Page({
  data: {
    cropperOpt: {
      id: 'cropper', // canvas ID，必须与 wxml 中的 id 一致
      width: 300, // 裁剪框宽度（像素）
      height: 300, // 裁剪框高度（像素）
      src: '', // 图片路径
      scale: 2.5, // 缩放比例
      zoom: 8, // 缩放系数
      cut: {
        x: 50, // 裁剪框 x 坐标
        y: 50, // 裁剪框 y 坐标
        width: 200, // 裁剪框宽度
        height: 200 // 裁剪框高度
      }
    }
  },

  onLoad() {
    const { cropperOpt } = this.data;
    // 初始化 we-cropper
    this.cropper = new WeCropper(cropperOpt)
      .on('ready', () => {
        console.log('裁剪框初始化完成');
      })
      .on('imageLoad', () => {
        console.log('图片加载完成');
      });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1, // 一次选择一张图片
      sizeType: ['compressed'], // 压缩图片以提高性能
      sourceType: ['album', 'camera'], // 支持相册和相机
      success: res => {
        this.setData({
          'cropperOpt.src': res.tempFilePaths[0]
        });
        // 更新裁剪框
        this.cropper.updateCanvas();
      },
      fail: err => {
        console.error('选择图片失败:', err);
      }
    });
  },

  // 获取裁剪后的图片
  getCropperImage() {
    this.cropper.getCropperImage(res => {
      if (res.tempFilePath) {
        console.log('裁剪后的图片路径:', res.tempFilePath);
        // 预览裁剪结果
        wx.previewImage({
          urls: [res.tempFilePath]
        });
      } else {
        console.error('裁剪失败:', res);
      }
    });
  }
});