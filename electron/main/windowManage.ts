import { join } from "node:path";
import { BrowserWindow, BrowserView, dialog, shell, ipcMain } from "electron";
import { isLinux, isMac, isWin } from "../utils";
import { destroyTray } from "./trayManage";
import { getIsForceQuit } from "./appManage";
import { registerShortcuts, unregisterShortcuts } from "./shortcutManage";
import { initIMSDK } from "../utils/imsdk";
import { initScreenshots } from "../utils/screenshot";
import OpenIMSDKMain from "@openim/electron-client-sdk";

const url = process.env.VITE_DEV_SERVER_URL;
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let sdkInstance: OpenIMSDKMain | null = null;
let workspaceView: BrowserView | null = null; // 新增
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    frame: false,
    width: 200,
    height: 200,
    resizable: false,
    transparent: true,
  });
  splashWindow.loadFile(global.pathConfig.splashHtml);
  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

export function createMainWindow() {
  createSplashWindow();
  mainWindow = new BrowserWindow({
    title: "Dev-ER",
    icon: join(global.pathConfig.publicPath, "favicon.ico"),
    frame: false,
    show: false,
    width: 1024,
    height: 726,
    minWidth: 1024,
    minHeight: 726,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: global.pathConfig.preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      devTools: true,
      webSecurity: false,
    },
  });

  sdkInstance = initIMSDK(mainWindow.webContents);

  if (process.env.VITE_DEV_SERVER_URL) {
    // Open devTool if the app is not packaged
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(global.pathConfig.indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // // Make all links open with the browser, not with the application
  mainWindow.webContents.setWindowOpenHandler(({ url, disposition }) => {
    console.log("windowOpenHandler:", { url, disposition });
    if (disposition === "foreground-tab" || disposition === "new-window") {
      mainWindow?.webContents.send("workspace-open-url", { url });
      return { action: "deny" };
    }

    // 其他链接在外部浏览器打开
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("focus", () => {
    mainWindow?.flashFrame(false);
    registerShortcuts();
  });

  mainWindow.on("blur", () => {
    unregisterShortcuts();
  });

  mainWindow.on("close", (e) => {
    if (getIsForceQuit() || !mainWindow.isVisible()) {
      mainWindow = null;
      destroyTray();
    } else {
      e.preventDefault();
      if (isMac && mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      }
      mainWindow?.hide();
    }
  });
  // 初始化截图功能
  initScreenshots(mainWindow);

  // 设置 workspaceView 相关的 IPC 处理函数
  setupWorkspaceViewHandlers();
  return mainWindow;
}

export function splashEnd() {
  splashWindow?.close();
  mainWindow?.show();
}

// utils
export const isExistMainWindow = (): boolean =>
  !!mainWindow && !mainWindow?.isDestroyed();
export const isShowMainWindow = (): boolean => {
  if (!mainWindow) return false;
  return mainWindow.isVisible() && (isWin ? true : mainWindow.isFocused());
};

export const closeWindow = () => {
  if (!mainWindow) return;
  mainWindow.close();
};

export const hotReload = () => {
  if (!mainWindow) return;
  mainWindow.reload();
};

export const sendEvent = (name: string, ...args: any[]) => {
  if (!mainWindow) return;
  mainWindow.webContents.send(name, ...args);
};

export const showSelectDialog = async (options: Electron.OpenDialogOptions) => {
  if (!mainWindow) throw new Error("main window is undefined");
  return await dialog.showOpenDialog(mainWindow, options);
};
export const showDialog = ({
  type,
  message,
  detail,
}: Electron.MessageBoxSyncOptions) => {
  if (!mainWindow) return;
  dialog.showMessageBoxSync(mainWindow, {
    type,
    message,
    detail,
  });
};
export const showSaveDialog = async (options: Electron.SaveDialogOptions) => {
  if (!mainWindow) throw new Error("main window is undefined");
  return await dialog.showSaveDialog(mainWindow, options);
};
export const minimize = () => {
  if (!mainWindow) return;
  mainWindow.minimize();
};
export const updateMaximize = () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
};
export const toggleHide = () => {
  if (!mainWindow) return;
  mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
};
export const toggleMinimize = () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.restore();
    mainWindow.focus();
  } else {
    mainWindow.minimize();
  }
};
export const showWindow = () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (mainWindow.isVisible()) {
    mainWindow.focus();
  } else {
    mainWindow.show();
  }
};
export const hideWindow = () => {
  if (!mainWindow) return;
  mainWindow.hide();
};
export const toggleWindowVisible = (visible: boolean) => {
  if (!mainWindow) return;
  const opacity = mainWindow.getOpacity() ? 0 : 1;
  if (Boolean(opacity) !== visible) return;
  mainWindow.setOpacity(opacity);
};
export const setProgressBar = (
  progress: number,
  options?: Electron.ProgressBarOptions,
) => {
  if (!mainWindow) return;
  mainWindow.setProgressBar(progress, options);
};
export const taskFlicker = () => {
  if (
    isMac ||
    (mainWindow.isVisible() && mainWindow.isFocused() && !isExistMainWindow())
  )
    return;
  mainWindow?.flashFrame(true);
};
export const setIgnoreMouseEvents = (
  ignore: boolean,
  options?: Electron.IgnoreMouseEventsOptions,
) => {
  if (!mainWindow) return;
  mainWindow.setIgnoreMouseEvents(ignore, options);
};
export const toggleDevTools = () => {
  if (!mainWindow) return;
  if (mainWindow.webContents.isDevToolsOpened()) {
    mainWindow.webContents.closeDevTools();
  } else {
    mainWindow.webContents.openDevTools({
      mode: "detach",
    });
  }
};

export const setFullScreen = (isFullscreen: boolean): boolean => {
  if (!mainWindow) return false;
  if (isLinux) {
    // linux It needs to be resizable before it can be full screen
    if (isFullscreen) {
      mainWindow.setResizable(isFullscreen);
      mainWindow.setFullScreen(isFullscreen);
    } else {
      mainWindow.setFullScreen(isFullscreen);
      mainWindow.setResizable(isFullscreen);
    }
  } else {
    mainWindow.setFullScreen(isFullscreen);
  }
  return isFullscreen;
};

export const clearCache = async () => {
  if (!mainWindow) throw new Error("main window is undefined");
  await mainWindow.webContents.session.clearCache();
  await mainWindow.webContents.session.clearStorageData();
};

export const getCacheSize = async () => {
  if (!mainWindow) throw new Error("main window is undefined");
  return await mainWindow.webContents.session.getCacheSize();
};

export const getWebContents = (): Electron.WebContents => {
  if (!mainWindow) throw new Error("main window is undefined");
  return mainWindow.webContents;
};

// 新增的
// BrowserView 管理函数
function setupWorkspaceViewHandlers() {
  // 创建或更新 BrowserView
  ipcMain.on("create-workspace-view", (event, { url, bounds }) => {
    if (!mainWindow) return;

    if (workspaceView) {
      // 如果已存在,只更新 URL 和位置
      workspaceView.setBounds(bounds);
      if (workspaceView.webContents.getURL() !== url) {
        workspaceView.webContents.loadURL(url);
      }
      return;
    }

    // 创建新的 BrowserView
    workspaceView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // 允许完整的浏览器功能,支持 cookie
        webSecurity: false, // 与主窗口保持一致
      },
    });

    mainWindow.setBrowserView(workspaceView);
    workspaceView.setBounds(bounds);
    workspaceView.setAutoResize({
      width: true,
      height: true,
      horizontal: true,
      vertical: true,
    });

    workspaceView.webContents.loadURL(url);

    // 监听导航事件
    workspaceView.webContents.on("did-navigate", () => {
      if (mainWindow && workspaceView) {
        mainWindow.webContents.send("workspace-navigation-changed", {
          canGoBack: workspaceView.webContents.canGoBack(),
          canGoForward: workspaceView.webContents.canGoForward(),
          url: workspaceView.webContents.getURL(),
        });
      }
    });

    workspaceView.webContents.on("did-navigate-in-page", () => {
      if (mainWindow && workspaceView) {
        mainWindow.webContents.send("workspace-navigation-changed", {
          canGoBack: workspaceView.webContents.canGoBack(),
          canGoForward: workspaceView.webContents.canGoForward(),
          url: workspaceView.webContents.getURL(),
        });
      }
    });

    workspaceView.webContents.setWindowOpenHandler(({ url, disposition }) => {
      console.log("BrowserView windowOpenHandler:", { url, disposition });

      if (disposition === "foreground-tab" || disposition === "new-window") {
        // 在当前 BrowserView 中打开
        workspaceView?.webContents.loadURL(url);
        return { action: "deny" };
      }

      // 其他链接在外部浏览器打开
      if (url.startsWith("https:") || url.startsWith("http:")) {
        shell.openExternal(url);
      }
      return { action: "deny" };
    });
  });

  // 销毁 BrowserView
  ipcMain.on("destroy-workspace-view", () => {
    if (workspaceView && mainWindow) {
      mainWindow.removeBrowserView(workspaceView);
      // 移除这行: workspaceView.webContents.destroy();
      workspaceView = null; // 只需要设置为 null
    }
  });

  // 刷新
  ipcMain.on("refresh-workspace-view", () => {
    if (workspaceView) {
      workspaceView.webContents.reload();
    }
  });

  // 后退
  ipcMain.on("workspace-go-back", () => {
    if (workspaceView && workspaceView.webContents.canGoBack()) {
      workspaceView.webContents.goBack();
    }
  });

  // 前进
  ipcMain.on("workspace-go-forward", () => {
    if (workspaceView && workspaceView.webContents.canGoForward()) {
      workspaceView.webContents.goForward();
    }
  });
}

// 导出 workspaceView 的 getter(可选)
export const getWorkspaceView = (): BrowserView | null => workspaceView;
