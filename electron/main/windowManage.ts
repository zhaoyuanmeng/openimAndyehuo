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
let workspaceView: BrowserView | null = null;
// 保存BrowserView状态（位置、URL），用于隐藏后恢复
let workspaceViewBounds: Electron.Rectangle | null = null;
let workspaceViewURL: string | null = null;
let workspaceHomeURL: string | null = null; // 新增：存储首页URL
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
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      devTools: true,
      webSecurity: false,
    },
  });

  sdkInstance = initIMSDK(mainWindow.webContents);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(global.pathConfig.indexHtml);
  }

  // 主窗口大小变化时，同步更新BrowserView布局
  mainWindow.on("resize", () => {
    if (workspaceView && mainWindow?.getBrowserViews().includes(workspaceView)) {
      const newBounds = mainWindow.getContentBounds();
      const updatedBounds = {
        x: 0,
        y: 0, // 若有顶部导航栏，可改为 64 等对应高度
        width: newBounds.width,
        height: newBounds.height,
      };
      workspaceView.setBounds(updatedBounds);
      workspaceViewBounds = updatedBounds;
    }
  });

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  mainWindow.webContents.setWindowOpenHandler(({ url, disposition }) => {
    console.log("windowOpenHandler:", { url, disposition });
    if (disposition === "foreground-tab" || disposition === "new-window") {
      mainWindow?.webContents.send("workspace-open-url", { url });
      return { action: "deny" };
    }

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
      // 主窗口关闭时，彻底销毁BrowserView释放资源
      if (workspaceView) {
        mainWindow.removeBrowserView(workspaceView);
        // workspaceView.destroy(); // 销毁BrowserView实例（内部webContents自动销毁）
        workspaceView = null;
        workspaceViewBounds = null;
        workspaceViewURL = null;
      }
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

  initScreenshots(mainWindow);
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

// BrowserView 管理函数（最终修正版）
function setupWorkspaceViewHandlers() {
  // 创建或更新 BrowserView
  ipcMain.on("create-workspace-view", (event, { url, bounds }) => {
    if (!mainWindow) return;

    // 保存位置和URL（用于隐藏后恢复）
    workspaceViewBounds = bounds || mainWindow.getContentBounds();
    workspaceViewURL = url;
    workspaceHomeURL = url; // 关键：保存初始URL作为首页
    if (workspaceView) {
      // 已存在实例：更新配置并重新挂载（显示）
      workspaceView.setBounds(workspaceViewBounds);
      mainWindow.setBrowserView(workspaceView);
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
        sandbox: false,
        webSecurity: false,
      },
    });

    mainWindow.setBrowserView(workspaceView);
    workspaceView.setBounds(workspaceViewBounds);
    workspaceView.setAutoResize({
      width: true,
      height: true,
      horizontal: true,
      vertical: true,
    });

    workspaceView.webContents.loadURL(url);

    // 监听导航事件，同步更新保存的URL
    const updateNavigationState = () => {
      if (mainWindow && workspaceView) {
        workspaceViewURL = workspaceView.webContents.getURL();
        mainWindow.webContents.send("workspace-navigation-changed", {
          canGoBack: workspaceView.webContents.canGoBack(),
          canGoForward: workspaceView.webContents.canGoForward(),
          url: workspaceViewURL,
        });
      }
    };

    workspaceView.webContents.on("did-navigate", updateNavigationState);
    workspaceView.webContents.on("did-navigate-in-page", updateNavigationState);

    workspaceView.webContents.setWindowOpenHandler(({ url, disposition }) => {
      console.log("BrowserView windowOpenHandler:", { url, disposition });

      if (disposition === "foreground-tab" || disposition === "new-window") {
        workspaceView?.webContents.loadURL(url);
        workspaceViewURL = url; // 同步更新URL
        return { action: "deny" };
      }

      if (url.startsWith("https:") || url.startsWith("http:")) {
        shell.openExternal(url);
      }
      return { action: "deny" };
    });
  });

  // 销毁 BrowserView（彻底释放资源）
  ipcMain.on("destroy-workspace-view", () => {
    if (workspaceView && mainWindow) {
      mainWindow.removeBrowserView(workspaceView);
      // workspaceView.destroy(); // 修正：销毁BrowserView实例（内部webContents自动销毁）
      workspaceView = null;
      workspaceViewBounds = null;
      workspaceViewURL = null;
      console.log("BrowserView 已彻底销毁");
    }
  });
  ipcMain.on("workspace-go-home", () => {
    if (!workspaceView || !workspaceHomeURL) return;

    // 跳转到首页URL
    workspaceView.webContents.loadURL(workspaceHomeURL);
    // 同步更新当前URL记录
    workspaceViewURL = workspaceHomeURL;
    console.log("BrowserView 已回到首页，URL:", workspaceHomeURL);
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

  // 隐藏BrowserView（不销毁实例，仅视觉隐藏）
  ipcMain.on("hide-workspace-view", () => {
    if (!workspaceView || !mainWindow) return;
    mainWindow.removeBrowserView(workspaceView); // 从主窗口移除=隐藏
    console.log("BrowserView 已隐藏，状态保留");
  });

  // 显示BrowserView（恢复实例和状态）
  ipcMain.on("show-workspace-view", () => {
    if (!workspaceView || !mainWindow || !workspaceViewBounds) return;
    mainWindow.setBrowserView(workspaceView); // 重新挂载=显示
    workspaceView.setBounds(workspaceViewBounds); // 恢复之前的位置大小
    workspaceView.setAutoResize({
      width: true,
      height: true,
      horizontal: true,
      vertical: true,
    });
    console.log("BrowserView 已显示，当前URL:", workspaceViewURL);
  });

  // 切换显示/隐藏（一键切换）
  ipcMain.on("toggle-workspace-view", () => {
    if (!workspaceView || !mainWindow || !workspaceViewBounds) return;
    // 判断当前是否显示（是否已挂载到主窗口）
    const isVisible = mainWindow.getBrowserViews().includes(workspaceView);

    if (isVisible) {
      mainWindow.removeBrowserView(workspaceView); // 显示→隐藏
      console.log("BrowserView 已隐藏，状态保留");
    } else {
      mainWindow.setBrowserView(workspaceView); // 隐藏→显示
      workspaceView.setBounds(workspaceViewBounds);
      workspaceView.setAutoResize({
        width: true,
        height: true,
        horizontal: true,
        vertical: true,
      });
      console.log("BrowserView 已显示，当前URL:", workspaceViewURL);
    }
  });
}

// 导出 workspaceView 的 getter(可选)
export const getWorkspaceView = (): BrowserView | null => workspaceView;
