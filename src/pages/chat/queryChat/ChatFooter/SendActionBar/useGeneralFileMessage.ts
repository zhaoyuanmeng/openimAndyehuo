import { MessageItem } from "@openim/wasm-client-sdk";
import { IMSDK } from "@/layout/MainContentWrap";

export interface FileWithPath extends File {
  path?: string;
}

export interface FileWithPath extends File {
  path?: string;
}

export const useGeneralFileMessage = () => {
  const getFileMessage = async (file: FileWithPath): Promise<MessageItem> => {
    if (window.electronAPI) {
      // 如果文件已有 path 属性,使用正确的参数格式
      if (file.path) {
        const params = {
          filePath: file.path,
          fileName: file.name,
        };
        const fileMessage = (await IMSDK.createFileMessageFromFullPath(params)).data;
        console.log("fileMessage", fileMessage);
        return fileMessage;
      }

      // 如果没有 path,先保存文件到磁盘获取路径
      const savedPath = await window.electronAPI.saveFileToDisk({
        file,
        sync: true,
      });
      const params = {
        filePath: savedPath,
        fileName: file.name,
      };
      const fileMessage = (await IMSDK.createFileMessageFromFullPath(params)).data;
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
