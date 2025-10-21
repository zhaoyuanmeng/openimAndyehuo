import { BrowserWindow, ipcMain,nativeImage  } from "electron";
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
      const tempDir = app.getPath("temp");  
      const fileName = `screenshot_${Date.now()}.png`;  
      const filePath = join(tempDir, fileName);  
  
      // 使用 nativeImage 保存高质量 PNG  
      const image = nativeImage.createFromBuffer(buffer);  
      const pngBuffer = image.toPNG();  
      writeFileSync(filePath, pngBuffer);  
  
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
  ipcMain.handle("start-screenshot", async (_, hideWindow = true) => {
    if (screenshots) {
      if (hideWindow) {
        // 隐藏主窗口
        mainWindow.hide();
        // 增加延迟启动截图,确保窗口完全隐藏，避免透明度问题
        setTimeout(() => {
          screenshots?.startCapture();
        }, 500);
      } else {
        // 不隐藏窗口直接截图
        screenshots?.startCapture();
      }
    }
  });
};
