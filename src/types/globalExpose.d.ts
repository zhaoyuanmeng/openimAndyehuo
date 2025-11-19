import { Platform } from "@openim/wasm-client-sdk";

export type DataPath = "public" | "emojiData" | "sdkResources" | "logsPath";

export interface IElectronAPI {
  getDataPath: (key: DataPath) => string;
  getVersion: () => string;
  getPlatform: () => Platform;
  getSystemVersion: () => string;
  subscribe: (channel: string, callback: (...args: any[]) => void) => () => void;
  subscribeOnce: (channel: string, callback: (...args: any[]) => void) => void;
  unsubscribeAll: (channel: string) => void;
  ipcInvoke: <T = unknown>(channel: string, ...arg: any) => Promise<T>;
  ipcSendSync: <T = unknown>(channel: string, ...arg: any) => T;
  saveFileToDisk: (params: { file: File; sync?: boolean }) => Promise<string>;
  getFileByPath: (filePath: string) => Promise<{ file: File; path: string } | null>;
  startScreenshot: (hideWindow?: boolean) => Promise<void>; // 新增

  // 新增 BrowserView 相关类型
  createWorkspaceView: (
    url: string,
    bounds: { x: number; y: number; width: number; height: number },
  ) => void;
  destroyWorkspaceView: () => void;
  refreshWorkspaceView: () => void;
  workspaceGoBack: () => void;
  workspaceGoForward: () => void;
  onWorkspaceNavigationChanged: (
    callback: (data: {
      canGoBack: boolean;
      canGoForward: boolean;
      url: string;
    }) => void,
  ) => () => void;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
    userClick: (userID?: string, groupID?: string) => void;
    editRevoke: (clientMsgID: string) => void;
    screenshotPreview: (results: string) => void;

    openWorkspace?: (url: any) => any;
  }
}

declare module "i18next" {
  interface TFunction {
    (key: string, options?: object): string;
  }
}
