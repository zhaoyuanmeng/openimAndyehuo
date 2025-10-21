import { MessageStatus } from "@openim/wasm-client-sdk";  
import { Image, Spin, message } from "antd";  
import { DownloadOutlined } from "@ant-design/icons";  
import { FC } from "react";  
  
import { IMessageItemProps } from ".";  
  
const min = (a: number, b: number) => (a > b ? b : a);  
  
const MediaMessageRender: FC<IMessageItemProps> = ({ message: msg }) => {  
  const imageHeight = msg.pictureElem!.sourcePicture.height;  
  const imageWidth = msg.pictureElem!.sourcePicture.width;  
  const snapshotMaxHeight = msg.pictureElem!.snapshotPicture?.height ?? imageHeight;  
  const minHeight = min(200, imageWidth) * (imageHeight / imageWidth) + 2;  
  const adaptedHight = min(minHeight, snapshotMaxHeight) + 10;  
  const adaptedWidth = min(imageWidth, 200) + 10;  
  
  const thumbnailUrl =  
    msg.pictureElem!.snapshotPicture?.url || msg.pictureElem!.sourcePicture.url;  
  const originalUrl = msg.pictureElem!.sourcePicture.url;  
    
  const isSending = msg.status === MessageStatus.Sending;  
  const minStyle = { minHeight: `${adaptedHight}px`, minWidth: `${adaptedWidth}px` };  
  
  // 下载图片函数  
  const handleDownload = async () => {  
    try {  
      if (window.electronAPI) {  
        const result = await window.electronAPI.ipcInvoke('save-image', {  
          url: originalUrl,  
          filename: `image_${Date.now()}.png`,  
        });  
          
        if (result) {  
          message.success('图片下载成功!');  
        }  
      } else {  
        const link = document.createElement('a');  
        link.href = originalUrl;  
        link.download = `image_${Date.now()}.png`;  
        link.target = '_blank';  
        document.body.appendChild(link);  
        link.click();  
        document.body.removeChild(link);  
          
        message.success('图片下载成功!');  
      }  
    } catch (error) {  
      console.error('下载图片失败:', error);  
      message.error('图片下载失败,请重试');  
    }  
  };  
  
  return (  
    <Spin spinning={isSending}>  
      <div className="relative max-w-[200px]" style={minStyle}>  
        <Image  
          rootClassName="message-image cursor-pointer"  
          className="max-w-[200px] rounded-md"  
          src={thumbnailUrl}  
          preview={{  
            src: originalUrl,  
            // 修改这里:不使用 toolbarRender,使用 onVisibleChange 来处理关闭  
            onVisibleChange: (visible) => {  
              if (!visible) {  
                // 预览关闭时的逻辑(如果需要)  
              }  
            },  
            // 或者简化版本:只提供原图预览,不自定义工具栏  
          }}  
          placeholder={  
            <div style={minStyle} className="flex items-center justify-center">  
              <Spin />  
            </div>  
          }  
        />  
        {/* 在图片下方添加下载按钮 */}  
        <div className="absolute bottom-2 right-2">  
          <DownloadOutlined   
            className="cursor-pointer text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"   
            onClick={handleDownload}  
          />  
        </div>  
      </div>  
    </Spin>  
  );  
};  
  
export default MediaMessageRender;