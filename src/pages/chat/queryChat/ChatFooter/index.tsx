import { useLatest } from "ahooks";
import { Button } from "antd";
import { Modal } from "antd";
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
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string>("");
  const [screenshotFilePath, setScreenshotFilePath] = useState<string>("");

  const { getImageMessage } = useFileMessage();
  const { sendMessage } = useSendMessage();

  useEffect(() => {
    window.screenshotPreview = async (filePath: string) => {
      try {
        if (window.electronAPI) {
          const file = await window.electronAPI.getFileByPath(filePath);
          if (!file) return;

          const base64Data = await fileToBase64(file);

          setScreenshotFilePath(filePath);
          setScreenshotPreviewUrl(base64Data);
        }
      } catch (error) {
        console.error("Screenshot preview failed:", error);
      }
    };

    return () => {
      window.screenshotPreview = undefined;
    };
  }, []);

  const handleSendScreenshot = async () => {
    if (!screenshotFilePath || !screenshotPreviewUrl) return;

    try {
      // 直接使用文件路径创建消息
      const imageMessage = (
        await IMSDK.createImageMessageFromFullPath(screenshotFilePath)
      ).data;

      // 从 base64 获取图片尺寸
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = screenshotPreviewUrl;
      });

      // 设置预览 URL 和尺寸
      if (imageMessage.pictureElem?.sourcePicture) {
        imageMessage.pictureElem.sourcePicture.url = screenshotPreviewUrl;
        imageMessage.pictureElem.sourcePicture.width = img.width;
        imageMessage.pictureElem.sourcePicture.height = img.height;
      }

      await sendMessage({ message: imageMessage });

      setScreenshotPreviewUrl("");
      setScreenshotFilePath("");
    } catch (error) {
      console.error("Screenshot send failed:", error);
    }
  };

  const handleCancelScreenshot = () => {
    setScreenshotPreviewUrl("");
    setScreenshotFilePath("");
  };

  const onChange = (value: string) => {
    setHtml(value);
  };

  const enterToSend = async () => {
    const cleanText = getCleanText(latestHtml.current);
    const message = (await IMSDK.createTextMessage(cleanText)).data;
    setHtml("");
    if (!cleanText) return;

    sendMessage({ message });
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

      <Modal
        open={Boolean(screenshotPreviewUrl)}
        onCancel={handleCancelScreenshot}
        onOk={handleSendScreenshot}
        title={t("placeholder.screenshot")}
        okText={t("placeholder.send")}
        cancelText={t("close")}
        width={800}
      >
        <div className="flex items-center justify-center p-4">
          <img
            src={screenshotPreviewUrl}
            alt="screenshot preview"
            style={{ maxWidth: "100%", maxHeight: "60vh" }}
          />
        </div>
      </Modal>
    </>
  );
};

export default memo(forwardRef(ChatFooter));
