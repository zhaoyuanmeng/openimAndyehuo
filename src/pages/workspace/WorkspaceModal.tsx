// WorkspaceModal.tsx
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
import "./workspaceModal.scss";

interface WorkspaceModalProps {
  url?: string;
}

const WorkspaceModal: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  WorkspaceModalProps
> = ({ url }, ref) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const calculateBounds = () => {
    if (!containerRef.current) return null;

    const toolbar = containerRef.current.querySelector(".workspace-toolbar");
    const toolbarHeight = toolbar?.clientHeight || 48;
    const rect = containerRef.current.getBoundingClientRect();

    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y + toolbarHeight),
      width: Math.round(rect.width),
      height: Math.round(rect.height - toolbarHeight),
    };
  };

  // 初始化和创建Modal专用BrowserView
  useEffect(() => {
    if (isOverlayOpen && url && url.trim() !== "") {
      const bounds = calculateBounds();
      if (bounds && window.electronAPI?.createModalWorkspaceView) {
        window.electronAPI.createModalWorkspaceView(url, bounds);
        setCurrentUrl(url);
      }
    }

    // 监听导航状态变化
    if (window.electronAPI?.onModalWorkspaceNavigationChanged) {
      const unsubscribe = window.electronAPI.onModalWorkspaceNavigationChanged((data) => {
        setCanGoBack(data.canGoBack);
        setCanGoForward(data.canGoForward);
        setCurrentUrl(data.url);
      });
      return unsubscribe;
    }
  }, [isOverlayOpen, url]);

  // 监听窗口大小变化,更新位置
  useEffect(() => {
    if (!isOverlayOpen) return;

    const handleResize = () => {
      const bounds = calculateBounds();
      if (bounds && currentUrl && window.electronAPI?.createModalWorkspaceView) {
        window.electronAPI.createModalWorkspaceView(currentUrl, bounds);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOverlayOpen, currentUrl]);

  // 监听IPC事件(打开新URL)
  useEffect(() => {
    if (!isOverlayOpen) return;

    const handleOpenUrl = (data: { url: string }) => {
      if (data?.url) {
        const bounds = calculateBounds();
        if (bounds && window.electronAPI?.createModalWorkspaceView) {
          window.electronAPI.createModalWorkspaceView(data.url, bounds);
        }
      }
    };

    if (window.electronAPI?.subscribe) {
      const unsubscribe = window.electronAPI.subscribe(
        "workspace-open-url",
        handleOpenUrl
      );
      return () => unsubscribe();
    }
  }, [isOverlayOpen]);

  // 后退
  const handleGoBack = () => {
    if (window.electronAPI?.modalWorkspaceGoBack) {
      window.electronAPI.modalWorkspaceGoBack();
    }
  };

  // 前进
  const handleGoForward = () => {
    if (window.electronAPI?.modalWorkspaceGoForward) {
      window.electronAPI.modalWorkspaceGoForward();
    }
  };

  // 刷新
  const handleRefresh = () => {
    if (window.electronAPI?.refreshModalWorkspaceView) {
      window.electronAPI.refreshModalWorkspaceView();
    }
  };

  // 关闭
  const handleClose = () => {
    if (window.electronAPI?.destroyModalWorkspaceView) {
      window.electronAPI.destroyModalWorkspaceView();
    }
    closeOverlay();
    setCanGoBack(false);
    setCanGoForward(false);
    setCurrentUrl("");
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (window.electronAPI?.destroyModalWorkspaceView) {
        window.electronAPI.destroyModalWorkspaceView();
      }
    };
  }, []);

  if (!isOverlayOpen) return null;

  return (
    <div
      className="workspace-modal-overlay"
      style={{ left: "60px" }}
      ref={containerRef}
    >
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
      <div className="workspace-content" style={{ flex: 1 }} />
    </div>
  );
};

export default forwardRef(WorkspaceModal);