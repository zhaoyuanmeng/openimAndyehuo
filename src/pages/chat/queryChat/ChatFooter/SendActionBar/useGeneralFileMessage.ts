import { MessageItem } from "@openim/wasm-client-sdk";  
import { IMSDK } from "@/layout/MainContentWrap";  
  
export interface FileWithPath extends File {  
  path?: string;  
}  
  
export const useGeneralFileMessage = () => {  
  const getFileMessage = async (file: FileWithPath): Promise<MessageItem> => {  
    // Electron 环境下使用文件路径  
    console.log("getFileMessage 收到 file:", file);
    if (window.electronAPI && file.path) {  
      const fileMessage = (await IMSDK.createFileMessageFromFullPath(file.path)).data;  
      return fileMessage;  
    }  
      
    // Web 环境下使用 File 对象  
    const options = {  
      filePath: "",  
      fileName: file.name,  
      file,  
    };  
      
    return (await IMSDK.createFileMessage(options)).data;  
  };  
  
  return { getFileMessage };  
};