import { useRef, useState, useEffect } from "react";
import "./workspace.scss";

export const Workspace = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  // 配置第三方应用列表的 URL
  // const workspaceUrl = "http://144.7.97.233:7080/";
  const workspaceUrl = "http://localhost:5173/";

  useEffect(() => {
    setCurrentUrl(workspaceUrl);
  }, []);

  const handleGoBack = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.history.back();
    }
  };

  const handleGoForward = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.history.forward();
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };
  const handleOpenModal = () => {
    // window.openWorkspace("http://www.chinaxiongan.cn/");
    // https://www.lanxhan.com/
    // window.openWorkspace("http://144.7.97.233:7080/");
    window.openWorkspace("https://www.lanxhan.com/");
  };

  const handleClose = () => {
    // 返回到主页或关闭当前标签
    // window.location.href = "/";
    window.history.replaceState({}, "", "/"); // 清空历史记录
  };

  // useEffect(() => {
  //   const handleWorkspaceOpenUrl = (data: { url: string }) => {
  //     console.log("workspace-open-url---", data.url);
  //     // window.openWorkspace(data.url); // 打开新窗口
  //   };

  //   if (window.electronAPI?.subscribe) {
  //     const unsubscribe = window.electronAPI.subscribe(
  //       "workspace-open-url",
  //       handleWorkspaceOpenUrl,
  //     );
  //     return unsubscribe;
  //   }
  // }, []); // 移除依赖项,使用函数式更新

  return (
    <div className="workspace-container">
      <div className="workspace-toolbar">
        <button onClick={handleOpenModal} className="toolbar-btn">
          打开弹窗
        </button>
        {/* <button onClick={handleGoBack} disabled={!canGoBack} className="toolbar-btn">
          ← 后退
        </button>
        <button
          onClick={handleGoForward}
          disabled={!canGoForward}
          className="toolbar-btn"
        >
          前进 →
        </button> */}
        <button onClick={handleRefresh} className="toolbar-btn">
          刷新
        </button>
        {/* <button onClick={handleClose} className="toolbar-btn close-btn">
          关闭
        </button> */}
        <span className="current-url">{currentUrl}</span>
      </div>
      <iframe
        ref={iframeRef}
        src={workspaceUrl}
        className="workspace-iframe"
        title="工作台"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};
