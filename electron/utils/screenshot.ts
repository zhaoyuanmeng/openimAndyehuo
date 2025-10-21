import { BrowserWindow, ipcMain } from "electron";
import Screenshots from "electron-screenshots";
import { app } from "electron";
import { writeFileSync } from "fs";
import { join } from 'path';
let screenshots: Screenshots | null = null;

export const initScreenshots = (mainWindow: BrowserWindow) => {
  screenshots = new Screenshots({
    singleWindow: true,
  });

  // 监听截图完成事件
  screenshots.on("ok", (e, buffer, bounds) => {
    try {
      // 在临时目录保存截图
      const tempDir = app.getPath("temp");
      const fileName = `screenshot_${Date.now()}.png`;
      const filePath = join(tempDir, fileName);

      // 保存文件
      writeFileSync(filePath, buffer);

      // 只发送文件路径
      mainWindow.webContents.send("screenshot-complete", filePath);
      mainWindow.show();
    } catch (error) {
      console.error("Save screenshot failed:", error);
      mainWindow.show();
    }
  });

  screenshots.on("cancel", () => {
    // 取消截图,显示主窗口
    mainWindow.show();
  });

  // 注册IPC处理
  ipcMain.handle("start-screenshot", async () => {
    if (screenshots) {
      // 隐藏主窗口
      mainWindow.hide();
      // 延迟启动截图,确保窗口已隐藏
      setTimeout(() => {
        screenshots?.startCapture();
      }, 100);
    }
  });
};
