import { FC } from "react";

import { formatBr } from "@/utils/common";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";

const TextMessageRender: FC<IMessageItemProps> = ({ message }) => {
  let content = message.textElem?.content;
  console.log("TextMessageRender content:", content);
  // 处理跳转连接
  if (content) {
    content = content.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      return `<a href="#" onclick="event.preventDefault(); window.openWorkspace('${url}');" style="color: #1890ff; text-decoration: underline; cursor: pointer;">${url}</a>`;
    });
  }
  console.log("TextMessageRender content after link format:", content);
  content = formatBr(content!);

  return (
    <div className={styles.bubble} dangerouslySetInnerHTML={{ __html: content }}></div>
  );
};

export default TextMessageRender;
