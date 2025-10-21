import { useLatest } from "ahooks";
import { Button } from "antd";
import { t } from "i18next";
import { forwardRef, ForwardRefRenderFunction, memo, useState } from "react";
import { useEffect } from "react";

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

const ChatFooter: ForwardRefRenderFunction<unknown, unknown> = (_, ref) => {
  const [html, setHtml] = useState("");
  const latestHtml = useLatest(html);

  const { getImageMessage } = useFileMessage();
  const { sendMessage } = useSendMessage();

  useEffect(() => {
    window.screenshotPreview = async (filePath: string) => {
      try {
        if (window.electronAPI) {
          const file = await window.electronAPI.getFileByPath(filePath);
          if (!file) return;

          const base64Data = await fileToBase64(file);

          // 确保base64数据正确，添加必要的前缀
          const imgSrc = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;

          // 直接将截图插入到CKEditor中
          const imgTag = `<img src="${imgSrc}" alt="screenshot" style="max-width: 200px; max-height: 200px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);" />`;

          // 如果当前有内容，在末尾添加换行和图片
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

    // 解析HTML内容，分离文本和图片
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
      if (src && src.startsWith("data:image")) {
        try {
          // 将base64转换为File对象
          const response = await fetch(src);
          const blob = await response.blob();

          // 根据图片格式确定文件类型
          const fileType = src.includes("image/png") ? "image/png" : 
                          src.includes("image/jpeg") ? "image/jpeg" : 
                          src.includes("image/webp") ? "image/webp" : "image/png";

          const file = new File([blob], `screenshot_${Date.now()}.${fileType.split('/')[1]}`, { type: fileType });

          // 使用getImageMessage创建图片消息
          const imageMessage = await getImageMessage(file);
          await sendMessage({ message: imageMessage });
        } catch (error) {
          console.error("Failed to send image:", error);
        }
      }
    }

    // 清空编辑器
    setHtml("");
  };

  return (
    <>
      <footer className="relative h-full bg-white py-px">
        <div className="flex h-full flex-col border-t border-t-[var(--gap-text)]">
          <SendActionBar sendMessage={sendMessage} getImageMessage={getImageMessage} />
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
