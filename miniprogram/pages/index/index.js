Page({
  data:{
   imageSrc: '',
   showCropper: false,
   croppedImage: ''
 },

 chooseImage() {
   wx.chooseImage({
     success: (res) => {
       this.setData({
         imageSrc: res.tempFilePaths[0],
         showCropper: true
       }, () => {
         // 数据更新后，确保组件已渲染
         this.cropperComponent = this.selectComponent('#cropper');
       });
     }
   });
 },

 onConfirmCrop() {
   if (this.cropperComponent) {
     this.cropperComponent.getCropperImage();
   } else {
     console.error('裁剪组件未初始化');
   }
 },

 onCropConfirm(e) {
   const tempFilePath = e.detail.tempFilePath;
   this.setData({
     croppedImage: tempFilePath,
     showCropper: false
   });
   wx.showToast({ title: '裁剪成功' });
 },

 onCropCancel() {
   this.setData({ showCropper: false });
   wx.showToast({ title: '已取消', icon: 'none' });
 }
})