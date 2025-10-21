import { useLatest } from "ahooks";
import { Button } from "antd";
import { t } from "i18next";
import { forwardRef, ForwardRefRenderFunction, memo, useState } from "react";
import { useEffect } from "react";
import { useGeneralFileMessage } from "./SendActionBar/useGeneralFileMessage"; 
import CKEditor from "@/components/CKEditor";
import { getCleanText } from "@/components/CKEditor/utils";
import i18n from "@/i18n";
import { IMSDK } from "@/layout/MainContentWrap";
import { base64toFile, fileToBase64 } from "@/utils/common";

import SendActionBar from "./SendActionBar";
import { useFileMessage } from "./SendActionBar/useFileMessage";
import { useSendMessage } from "./useSendMessage";

const sendActions = [
  { label: t("placeholder.sendWithEnter"), key: "enter" },
  { label: t("placeholder.sendWithShiftEnter"), key: "enterwithshift" },
];

i18n.on("languageChanged", () => {
  sendActions[0].label = t("placeholder.sendWithEnter");
  sendActions[1].label = t("placeholder.sendWithShiftEnter");
});

// 在组件外部创建 Map 存储截图路径
const screenshotPathMap = new Map<string, string>();

const ChatFooter: ForwardRefRenderFunction<unknown, unknown> = (_, ref) => {
  const [html, setHtml] = useState("");
  const latestHtml = useLatest(html);

  const { getImageMessage } = useFileMessage();
  const { getFileMessage } = useGeneralFileMessage(); 
  const { sendMessage } = useSendMessage();

  useEffect(() => {
    window.screenshotPreview = async (filePath: string) => {
      console.log("screenshotPreview 收到 filePath:", filePath);
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.getFileByPath(filePath);
          if (!result) return;

          const { file, path: originalPath } = result;
          const correctedFile = new File([file], file.name, { type: "image/png" });
          const base64Data = await fileToBase64(correctedFile);
          const imgSrc = base64Data.startsWith("data:")
            ? base64Data
            : `data:image/png;base64,${base64Data}`;

          // 使用 imgSrc 作为 key 存储原始文件路径
          screenshotPathMap.set(imgSrc, originalPath);
          console.log(
            "存储到 Map:",
            imgSrc.substring(0, 50) + "...",
            "->",
            originalPath,
          );

          const imgTag = `<img src="${imgSrc}" alt="screenshot" style="max-width: 200px; max-height: 200px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);" />`;

          const currentContent = latestHtml.current;
          const newContent = currentContent
            ? `${currentContent}<br/>${imgTag}`
            : imgTag;

          setHtml(newContent);
        }
      } catch (error) {
        console.error("Screenshot preview failed:", error);
      }
    };

    return () => {
      window.screenshotPreview = () => {};
    };
  }, [latestHtml]);

  const onChange = (value: string) => {
    setHtml(value);
  };

  const enterToSend = async () => {
    const htmlContent = latestHtml.current;
    if (!htmlContent) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const textContent = tempDiv.textContent?.trim() || "";
    const images = Array.from(tempDiv.querySelectorAll("img"));

    // 发送文本消息
    if (textContent && textContent.trim()) {
      const textMessage = (await IMSDK.createTextMessage(textContent)).data;
      await sendMessage({ message: textMessage });
    }

    // 发送图片消息
    for (const img of images) {
      const src = img.getAttribute("src");
      if (!src) continue;

      const filePath = screenshotPathMap.get(src);

      if (filePath) {
        console.log("从 Map 找到 filePath:", filePath);
        try {
          if (window.electronAPI) {
            const result = await window.electronAPI.getFileByPath(filePath);
            if (result) {
              const { file } = result;
              // 手动添加 path 属性到 File 对象
              Object.defineProperty(file, "path", {
                value: filePath,
                writable: false,
                enumerable: true,
                configurable: false,
              });

              const imageMessage = await getImageMessage(file);
              await sendMessage({ message: imageMessage });
              screenshotPathMap.delete(src);
              console.log("截图发送成功");
            }
          }
        } catch (error) {
          console.error("Failed to send screenshot:", error);
        }
      } else if (
        src.startsWith("data:image") ||
        src.startsWith("data:application/octet-stream")
      ) {
        try {
          const response = await fetch(src);
          const blob = await response.blob();

          let fileType = "image/png";
          if (src.includes("iVBORw0KGgo")) {
            fileType = "image/png";
          } else if (src.includes("/9j/")) {
            fileType = "image/jpeg";
          }

          const file = new File(
            [blob],
            `image_${Date.now()}.${fileType.split("/")[1]}`,
            {
              type: fileType,
            },
          );

          const imageMessage = await getImageMessage(file);
          await sendMessage({ message: imageMessage });
        } catch (error) {
          console.error("Failed to send image:", error);
        }
      }
    }

    setHtml("");
  };

  return (
    <>
      <footer className="relative h-full bg-white py-px">
        <div className="flex h-full flex-col border-t border-t-[var(--gap-text)]">
          <SendActionBar sendMessage={sendMessage} getImageMessage={getImageMessage}  getFileMessage={getFileMessage}/>
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <CKEditor value={html} onEnter={enterToSend} onChange={onChange} />
            <div className="flex items-center justify-end py-2 pr-3">
              <Button className="w-fit px-6 py-1" type="primary" onClick={enterToSend}>
                {t("placeholder.send")}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default memo(forwardRef(ChatFooter));
