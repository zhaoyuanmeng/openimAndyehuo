import { MessageItem } from "@openim/wasm-client-sdk";
import { Popover, PopoverProps, Upload } from "antd";
import { TooltipPlacement } from "antd/es/tooltip";
import clsx from "clsx";
import i18n, { t } from "i18next";
import { UploadRequestOption } from "rc-upload/lib/interface";
import { memo, ReactNode, useState } from "react";
import React from "react";

import image from "@/assets/images/chatFooter/image.png";
import rtc from "@/assets/images/chatFooter/rtc.png";
import { useConversationStore } from "@/store";
import { SendMessageParams } from "../useSendMessage";
import CallPopContent from "./CallPopContent";

const sendActionList = [
  {
    title: t("placeholder.image"),
    icon: image,
    key: "image",
    accept: "image/*",
    comp: null,
    placement: undefined,
  },
  {
    title: t("placeholder.call"),
    icon: rtc,
    key: "rtc",
    accept: undefined,
    comp: <CallPopContent />,
    placement: "top",
  },
  {
    title: t("placeholder.screenshot"),
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJDNi42ODYyOSAyIDQgNC42ODYyOSA0IDhWMTJDNCAxNS4zMTM3IDYuNjg2MjkgMTggMTAgMThDMTMuMzEzNyAxOCAxNiAxNS4zMTM3IDE2IDEyVjhDMTYgNC42ODYyOSAxMy4zMTM3IDIgMTAgMloiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCA4SDZWNkg4VjhaIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xNCA4SDEyVjZIMTRWOFoiIGZpbGw9IiMzMzMzMzMiLz4KPHBhdGggZD0iTTEwIDEwVjE0IiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+", // 截图图标
    key: "screenshot",
    accept: undefined,
    comp: null,
    placement: undefined,
  },
  // 新增:文件上传按钮
  {
    title: "发送文件",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgMTBIMTRNMTAgNlYxNE0zIDEwQzMgMTMuODY2IDYuMTM0IDE3IDEwIDE3QzEzLjg2NiAxNyAxNyAxMy44NjYgMTcgMTBDMTcgNi4xMzQgMTMuODY2IDMgMTAgM0M2LjEzNCAzIDMgNi4xMzQgMyAxMFoiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=",
    key: "file",
    accept: "*/*",
    comp: null,
    placement: undefined,
  },
];

i18n.on("languageChanged", () => {
  sendActionList[0].title = t("placeholder.image");
  sendActionList[1].title = t("placeholder.call");
  sendActionList[2].title = t("placeholder.screenshot");
});

const SendActionBar = ({
  sendMessage,
  getImageMessage,
  getFileMessage,
}: {
  sendMessage: (params: SendMessageParams) => Promise<void>;
  getImageMessage: (file: File) => Promise<MessageItem>;
  getFileMessage: (file: File) => Promise<MessageItem>;
}) => {
  const [visibleState, setVisibleState] = useState(false);
  const isGroupSession = useConversationStore((state) =>
    Boolean(state.currentConversation?.groupID),
  );

  const closePop = () => setVisibleState(false);
  // 新增:文件消息处理
  const fileHandle = async (options: UploadRequestOption) => {
    const message = await getImageMessage(options.file as File);
    sendMessage({
      message,
    });
  };

  // 新增:普通文件上传处理
  const generalFileHandle = async (options: UploadRequestOption) => {
    const message = await getFileMessage(options.file as File);
    sendMessage({
      message,
    });
  };

  // 新增截图处理函数
  const handleScreenshot = () => {
    if (window.electronAPI) {
      window.electronAPI.startScreenshot(true); // 默认隐藏窗口
    }
  };

  // 新增不隐藏窗口的截图处理函数
  const handleScreenshotNoHide = () => {
    if (window.electronAPI) {
      window.electronAPI.startScreenshot(false); // 不隐藏窗口
    }
  };

  return (
    <div className="flex items-center px-4.5 pt-2">
      {sendActionList.map((action) => {
        if (action.key === "rtc" && isGroupSession) {
          return null;
        }

        // 截图按钮特殊处理
        if (action.key === "screenshot") {
          if (!window.electronAPI) return null; // 只在Electron环境显示

          return (
            <div
              key={action.key}
              className="group relative mr-5 flex cursor-pointer items-center"
            >
              <img src={action.icon} width={20} alt={action.title} />

              {/* 截图模式选择下拉菜单 */}
              <div className="invisible absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="min-w-[140px] py-1">
                  <div
                    className="flex cursor-pointer items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleScreenshot();
                    }}
                  >
                    <span className="mr-2">📷</span>
                    <span>{t("placeholder.screenshotHide")}</span>
                  </div>
                  <div
                    className="flex cursor-pointer items-center border-t border-gray-100 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleScreenshotNoHide();
                    }}
                  >
                    <span className="mr-2">🖼️</span>
                    <span>{t("placeholder.screenshotNoHide")}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // 其他按钮保持原有逻辑
        const popProps: PopoverProps = {
          placement: action.placement as TooltipPlacement,
          content:
            action.comp &&
            React.cloneElement(action.comp as React.ReactElement, {
              closePop,
            }),
          title: null,
          arrow: false,
          trigger: "click",
          open: action.comp ? visibleState : false,
          onOpenChange: (visible) => setVisibleState(visible),
        };

        return (
          <ActionWrap
            popProps={popProps}
            key={action.key}
            accept={action.accept}
            fileHandle={action.key === "file" ? generalFileHandle : fileHandle}
          >
            <div
              className={clsx("flex cursor-pointer items-center last:mr-0", {
                "mr-5": !action.accept,
              })}
            >
              <img src={action.icon} width={20} alt={action.title} />
            </div>
          </ActionWrap>
        );
      })}
    </div>
  );
};

export default memo(SendActionBar);

const ActionWrap = ({
  accept,
  popProps,
  children,
  fileHandle,
}: {
  accept?: string;
  children: ReactNode;
  popProps?: PopoverProps;
  fileHandle: (options: UploadRequestOption) => void;
}) => {
  return accept ? (
    <Upload
      showUploadList={false}
      customRequest={fileHandle}
      accept={accept}
      multiple
      className="mr-5 flex"
    >
      {children}
    </Upload>
  ) : (
    <Popover {...popProps}>{children}</Popover>
  );
};
