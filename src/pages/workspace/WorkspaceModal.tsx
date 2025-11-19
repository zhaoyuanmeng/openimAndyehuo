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
import "./workspace.scss";
interface WorkspaceModalProps {
  url?: string;
}

const WorkspaceModal: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  WorkspaceModalProps
> = ({ url }, ref) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // 用 ref 缓存历史记录和位置，避免状态更新滞后问题
  const historyRef = useRef<string[]>([]);
  const positionRef = useRef<number>(-1);
  // 状态仅用于触发渲染
  const [, setForceRender] = useState(0);

  // 暴露给组件的状态（从 ref 中获取最新值）
  const currentUrl = historyRef.current[positionRef.current] || "";
  const canGoBack = positionRef.current > 0;
  const canGoForward = positionRef.current < historyRef.current.length - 1;

  // 1. 初始化 URL
  useEffect(() => {
    if (isOverlayOpen && url && url.trim() !== "") {
      if (url !== currentUrl) {
        addToHistory(url);
      }
    }
  }, [url, isOverlayOpen]);

  // 2. 核心方法：添加到历史记录（用 ref 确保同步更新）
  const addToHistory = (newUrl: string) => {
    if (!newUrl || newUrl === currentUrl) {
      // 重复 URL 只刷新
      if (iframeRef.current) {
        iframeRef.current.src = newUrl;
      }
      return;
    }

    // 从 ref 中获取最新的历史和位置（避免状态滞后）
    const currentHistory = [...historyRef.current];
    const currentPos = positionRef.current;

    // 截断当前位置后的记录，添加新 URL
    const newHistory = currentHistory.slice(0, currentPos + 1);
    newHistory.push(newUrl);

    // 更新 ref（同步操作，立即生效）
    historyRef.current = newHistory;
    positionRef.current = newHistory.length - 1;

    // 触发组件渲染
    setForceRender((prev) => prev + 1);

    // 加载新 URL
    if (iframeRef.current) {
      iframeRef.current.src = newUrl;
    }
  };

  // 3. 监听 IPC 事件
  useEffect(() => {
    const handleOpenUrl = (data: { url: string }) => {
      if (isOverlayOpen && data?.url) {
        addToHistory(data.url);
      }
    };

    if (window.electronAPI?.subscribe) {
      const unsubscribe = window.electronAPI.subscribe(
        "workspace-open-url",
        handleOpenUrl,
      );
      return () => unsubscribe();
    }
  }, [isOverlayOpen]);

  // 4. 后退
  const handleGoBack = () => {
    if (!canGoBack) return;
    positionRef.current -= 1;
    setForceRender((prev) => prev + 1);
    if (iframeRef.current) {
      iframeRef.current.src = historyRef.current[positionRef.current];
    }
    console.log("后退到:", positionRef.current, historyRef.current);
  };

  // 5. 前进
  const handleGoForward = () => {
    if (!canGoForward) return;
    positionRef.current += 1;
    setForceRender((prev) => prev + 1);
    if (iframeRef.current) {
      iframeRef.current.src = historyRef.current[positionRef.current];
    }
    console.log("前进到:", positionRef.current, historyRef.current);
  };

  // 6. 刷新
  const handleRefresh = () => {
    if (currentUrl && iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  // 7. 关闭
  const handleClose = () => {
    closeOverlay();
    historyRef.current = [];
    positionRef.current = -1;
    setForceRender(0);
  };

  if (!isOverlayOpen) return null;

  return (
    <div className="workspace-modal-overlay" style={{ left: "60px" }}>
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
      />
    </div>
  );
};

export default forwardRef(WorkspaceModal);
