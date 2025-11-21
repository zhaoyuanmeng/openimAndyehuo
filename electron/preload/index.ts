import fs from "fs";
import path from "path";
import { DataPath, IElectronAPI } from "./../../src/types/globalExpose.d";
import { contextBridge, ipcRenderer } from "electron";
import { isProd } from "../utils";
import "@openim/electron-client-sdk/lib/preload";
import { Platform } from "@openim/wasm-client-sdk";
const getPlatform = () => {
  if (process.platform === "darwin") {
    return Platform.MacOSX;
  }
  if (process.platform === "win32") {
    return Platform.Windows;
  }
  return Platform.Linux;
};

const getDataPath = (key: DataPath) => {
  switch (key) {
    case "public":
      return isProd ? ipcRenderer.sendSync("getDataPath", "public") : "";
    case "sdkResources":
      return isProd ? ipcRenderer.sendSync("getDataPath", "sdkResources") : "";
    case "logsPath":
      return isProd ? ipcRenderer.sendSync("getDataPath", "logsPath") : "";
    default:
      return "";
  }
};

const subscribe = (channel: string, callback: (...args: any[]) => void) => {
  const subscription = (_, ...args) => callback(...args);
  ipcRenderer.on(channel, subscription);
  return () => ipcRenderer.removeListener(channel, subscription);
};

const subscribeOnce = (channel: string, callback: (...args: any[]) => void) => {
  ipcRenderer.once(channel, (_, ...args) => callback(...args));
};

const unsubscribeAll = (channel: string) => {
  ipcRenderer.removeAllListeners(channel);
};

const ipcInvoke = (channel: string, ...arg: any) => {
  return ipcRenderer.invoke(channel, ...arg);
};

const ipcSendSync = (channel: string, ...arg: any) => {
  return ipcRenderer.sendSync(channel, ...arg);
};

const getUniqueSavePath = (originalPath: string) => {
  let counter = 0;
  let savePath = originalPath;
  let fileDir = path.dirname(originalPath);
  let fileName = path.basename(originalPath);
  let fileExt = path.extname(originalPath);
  let baseName = path.basename(fileName, fileExt);

  while (fs.existsSync(savePath)) {
    counter++;
    fileName = `${baseName}(${counter})${fileExt}`;
    savePath = path.join(fileDir, fileName);
  }

  return savePath;
};

const getFileByPath = async (filePath: string) => {
  try {
    const filename = path.basename(filePath);
    const data = await fs.promises.readFile(filePath);
    const file = new File([data], filename, { type: "image/png" });

    // 返回一个包含 file 和 path 的对象
    return { file, path: filePath };
  } catch (error) {
    console.log(error);
    return null;
  }
};

const saveFileToDisk = async ({
  file,
  sync,
}: {
  file: File;
  sync?: boolean;
}): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const saveDir = ipcRenderer.sendSync("getDataPath", "sdkResources");
  const savePath = path.join(saveDir, file.name);
  const uniqueSavePath = getUniqueSavePath(savePath);
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }
  if (sync) {
    await fs.promises.writeFile(uniqueSavePath, Buffer.from(arrayBuffer));
  } else {
    fs.promises.writeFile(uniqueSavePath, Buffer.from(arrayBuffer));
  }
  return uniqueSavePath;
};

const Api: IElectronAPI = {
  getDataPath,
  getVersion: () => process.version,
  getPlatform,
  getSystemVersion: process.getSystemVersion,
  subscribe,
  subscribeOnce,
  unsubscribeAll,
  ipcInvoke,
  ipcSendSync,
  getFileByPath,
  saveFileToDisk,
  startScreenshot: (hideWindow?: boolean) => ipcInvoke("start-screenshot", hideWindow), // 新增

  // 新增 BrowserView 相关方法
  createWorkspaceView: (
    url: string,
    bounds: { x: number; y: number; width: number; height: number },
  ) => {
    ipcRenderer.send("create-workspace-view", { url, bounds });
  },

  destroyWorkspaceView: () => {
    ipcRenderer.send("destroy-workspace-view");
  },
  hideWorkspaceView: () => ipcRenderer.send("hide-workspace-view"),
  showWorkspaceView: () => ipcRenderer.send("show-workspace-view"),
  toggleWorkspaceView: () => ipcRenderer.send("toggle-workspace-view"),

  refreshWorkspaceView: () => {
    ipcRenderer.send("refresh-workspace-view");
  },

  workspaceGoBack: () => {
    ipcRenderer.send("workspace-go-back");
  },

  workspaceGoForward: () => {
    ipcRenderer.send("workspace-go-forward");
  },

  onWorkspaceNavigationChanged: (
    callback: (data: {
      canGoBack: boolean;
      canGoForward: boolean;
      url: string;
    }) => void,
  ) => {
    const subscription = (_, data) => callback(data);
    ipcRenderer.on("workspace-navigation-changed", subscription);
    return () =>
      ipcRenderer.removeListener("workspace-navigation-changed", subscription);
  },
};

contextBridge.exposeInMainWorld("electronAPI", Api);
