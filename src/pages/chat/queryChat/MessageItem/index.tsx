import { MessageItem as MessageItemType, MessageType } from "@openim/wasm-client-sdk";
import clsx from "clsx";
import { FC, memo, useCallback, useRef, useState } from "react";
import { Avatar } from "antd";
import { useTranslation } from "react-i18next";

import OIMAvatar from "@/components/OIMAvatar";
import { formatMessageTime } from "@/utils/imCommon";
import { MockMessageReadStatusService } from "@/services/mockMessageReadStatus";

import CatchMessageRender from "./CatchMsgRenderer";
import MediaMessageRender from "./MediaMessageRender";
import styles from "./message-item.module.scss";
import MessageItemErrorBoundary from "./MessageItemErrorBoundary";
import MessageSuffix from "./MessageSuffix";
import TextMessageRender from "./TextMessageRender";

export interface IMessageItemProps {
  message: MessageItemType;
  isSender: boolean;
  disabled?: boolean;
  conversationID?: string;
  messageUpdateFlag?: string;
}

const components: Record<number, FC<IMessageItemProps>> = {
  [MessageType.TextMessage]: TextMessageRender,
  [MessageType.PictureMessage]: MediaMessageRender,
};

const MessageItem: FC<IMessageItemProps> = ({
  message,
  disabled,
  isSender,
  conversationID,
}) => {
  const messageWrapRef = useRef<HTMLDivElement>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [isReadPanelExpanded, setIsReadPanelExpanded] = useState(false);
  const { t } = useTranslation();
  const MessageRenderComponent = components[message.contentType] || CatchMessageRender;

  const closeMessageMenu = useCallback(() => {
    setShowMessageMenu(false);
  }, []);

  const canShowMessageMenu = !disabled;

  // 获取模拟已读状态
  const mockReadStatus = MockMessageReadStatusService.getMockReadStatus(
    message.clientMsgID,
  );

  // 判断是否为群聊且为发送者
  const isGroupConversation = conversationID?.startsWith("sg_");
  const shouldShowReadStatus = isGroupConversation && isSender;

  const toggleReadPanel = () => {
    setIsReadPanelExpanded(!isReadPanelExpanded);
  };

  return (
    <>
      <div
        id={`chat_${message.clientMsgID}`}
        className={clsx("relative flex select-text px-5 py-3")}
      >
        <div
          className={clsx(
            styles["message-container"],
            isSender && styles["message-container-sender"],
          )}
        >
          <OIMAvatar
            size={36}
            src={message.senderFaceUrl}
            text={message.senderNickname}
          />

          <div className={styles["message-wrap"]} ref={messageWrapRef}>
            <div className={styles["message-profile"]}>
              <div
                title={message.senderNickname}
                className={clsx(
                  "max-w-[30%] truncate text-[var(--sub-text)]",
                  isSender ? "ml-2" : "mr-2",
                )}
              >
                {message.senderNickname}
              </div>
              <div className="text-[var(--sub-text)]">
                {formatMessageTime(message.sendTime)}
              </div>
            </div>

            <div className={styles["menu-wrap"]}>
              <MessageItemErrorBoundary message={message}>
                <MessageRenderComponent
                  message={message}
                  isSender={isSender}
                  disabled={disabled}
                />
              </MessageItemErrorBoundary>

              <MessageSuffix
                message={message}
                isSender={isSender}
                disabled={false}
                conversationID={conversationID}
              />
            </div>

            {/* 已读状态显示 */}
            {shouldShowReadStatus && (
              <div className="mt-2">
                <div
                  className="flex cursor-pointer items-center text-xs text-[var(--sub-text)] hover:text-[var(--primary-text)]"
                  onClick={toggleReadPanel}
                >
                  <span>已读：{mockReadStatus.readCount}</span>
                  {mockReadStatus.unreadCount > 0 && (
                    <span className="ml-2">未读：{mockReadStatus.unreadCount}</span>
                  )}
                  <span className="ml-1 text-[var(--sub-text)]">
                    {isReadPanelExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {/* 折叠面板内容 */}
                {isReadPanelExpanded && (
                  <div className="read-panel mt-2 rounded-md border border-[var(--border)] bg-[var(--chat-bubble)] p-2">
                    {/* 已读成员 */}
                    <div className="mb-3">
                      <div className="mb-2 text-xs font-medium text-[var(--primary-text)]">
                        已读成员 ({mockReadStatus.readCount})
                      </div>
                      <div className="space-y-1">
                        {mockReadStatus.readUsers.map((user) => (
                          <div
                            key={user.userID}
                            className="read-member-item flex items-center"
                          >
                            <Avatar size="small" src={user.faceURL} className="mr-2">
                              {user.nickname?.[0]}
                            </Avatar>
                            <span className="text-xs text-[var(--primary-text)]">
                              {user.nickname}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 未读成员 */}
                    {mockReadStatus.unreadCount > 0 && (
                      <div>
                        <div className="mb-2 text-xs font-medium text-[var(--primary-text)]">
                          未读成员 ({mockReadStatus.unreadCount})
                        </div>
                        <div className="space-y-1">
                          {mockReadStatus.unreadUsers.map((user) => (
                            <div
                              key={user.userID}
                              className="read-member-item flex items-center"
                            >
                              <Avatar size="small" src={user.faceURL} className="mr-2">
                                {user.nickname?.[0]}
                              </Avatar>
                              <span className="text-xs text-[var(--primary-text)]">
                                {user.nickname}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(MessageItem);
