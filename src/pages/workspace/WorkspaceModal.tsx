import {
  CloseOutlined,
  ReloadOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  forwardRef,
  ForwardRefRenderFunction,
  useRef,
  useState,
  useEffect,
} from "react";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";

interface WorkspaceModalProps {
  url?: string;
}

const WorkspaceModal: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  WorkspaceModalProps
> = ({ url }, ref) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // URL 历史栈
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // 初始化 URL 历史
  useEffect(() => {
    console.log(url, isOverlayOpen, urlHistory, currentIndex);
    if (url && url !== urlHistory[currentIndex] && isOverlayOpen) {
      const newHistory = urlHistory.slice(0, currentIndex + 1);
      newHistory.push(url);
      setUrlHistory(newHistory);
      const newIndex = newHistory.length - 1;
      setCurrentIndex(newIndex);
      setCurrentUrl(url);
      // 更新前进/后退按钮状态
      setCanGoBack(newIndex > 0);
      setCanGoForward(false);
    }
  }, [url, isOverlayOpen]);

  // 监听 IPC 事件,处理 iframe 内部打开的新链接
  useEffect(() => {
    const handleWorkspaceOpenUrl = (data: { url: string }) => {
      console.log("workspace-open-url", data);

      // 使用函数式更新避免闭包问题
      setUrlHistory((prevHistory) => {
        setCurrentIndex((prevIndex) => {
          const newHistory = prevHistory.slice(0, prevIndex + 1);
          newHistory.push(data.url);
          const newIndex = newHistory.length - 1;

          setCurrentUrl(data.url);
          setCanGoBack(newIndex > 0);
          setCanGoForward(false);

          if (iframeRef.current) {
            iframeRef.current.src = data.url;
          }

          return newIndex;
        });
        return [...prevHistory.slice(0, currentIndex + 1), data.url];
      });
      console.log("Updated history:", urlHistory, currentIndex); // 打印更新后的历史记录
    };

    if (window.electronAPI?.subscribe) {
      const unsubscribe = window.electronAPI.subscribe(
        "workspace-open-url",
        handleWorkspaceOpenUrl,
      );
      return unsubscribe;
    }
  }, []); // 移除依赖项,使用函数式更新

  const handleGoBack = () => {
    console.log("go back", urlHistory, currentIndex);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const newUrl = urlHistory[newIndex];

      setCurrentIndex(newIndex);
      setCurrentUrl(newUrl);
      setCanGoBack(newIndex > 0);
      setCanGoForward(true);

      if (iframeRef.current) {
        iframeRef.current.src = newUrl;
      }
    }
  };

  const handleGoForward = () => {
    if (currentIndex < urlHistory.length - 1) {
      const newIndex = currentIndex + 1;
      const newUrl = urlHistory[newIndex];

      setCurrentIndex(newIndex);
      setCurrentUrl(newUrl);
      setCanGoForward(newIndex < urlHistory.length - 1);
      setCanGoBack(true);

      if (iframeRef.current) {
        iframeRef.current.src = newUrl;
      }
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current && currentUrl) {
      iframeRef.current.src = currentUrl;
    }
  };

  const handleClose = () => {
    closeOverlay();
    // 清空历史记录
    setUrlHistory([]);
    setCurrentIndex(-1);
    setCurrentUrl("");
    setCanGoBack(false);
    setCanGoForward(false);
  };

  if (!isOverlayOpen) return null;

  return (
    <div className="workspace-modal-overlay" style={{ left: `60px` }}>
      <div className="workspace-toolbar">
        <div className="toolbar-left">
          <button
            onClick={handleGoBack}
            disabled={!canGoBack}
            className="toolbar-btn"
            title="后退"
          >
            <LeftOutlined />
          </button>
          <button
            onClick={handleGoForward}
            disabled={!canGoForward}
            className="toolbar-btn"
            title="前进"
          >
            <RightOutlined />
          </button>
          <button onClick={handleRefresh} className="toolbar-btn" title="刷新">
            <ReloadOutlined />
          </button>
        </div>
        <div className="toolbar-center">
          <span className="current-url" title={currentUrl}>
            {currentUrl}
          </span>
        </div>
        <div className="toolbar-right">
          <button onClick={handleClose} className="toolbar-btn close-btn" title="关闭">
            <CloseOutlined />
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src={currentUrl}
        className="workspace-iframe"
        title="工作台"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

export default forwardRef(WorkspaceModal);
