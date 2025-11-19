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

  // 导航状态由 BrowserView 自动维护
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  // 计算 BrowserView 的位置和大小
  const calculateBounds = () => {
    if (!containerRef.current) return null;

    const toolbar = containerRef.current.querySelector(".workspace-toolbar");
    const toolbarHeight = toolbar?.clientHeight || 48; // 工具栏高度
    const rect = containerRef.current.getBoundingClientRect();

    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y + toolbarHeight),
      width: Math.round(rect.width),
      height: Math.round(rect.height - toolbarHeight),
    };
  };

  // 1. 初始化和创建 BrowserView
  useEffect(() => {
    if (isOverlayOpen && url && url.trim() !== "") {
      const bounds = calculateBounds();
      if (bounds && window.electronAPI?.createWorkspaceView) {
        window.electronAPI.createWorkspaceView(url, bounds);
        setCurrentUrl(url);
      }
    }

    // 监听导航状态变化
    if (window.electronAPI?.onWorkspaceNavigationChanged) {
      const unsubscribe = window.electronAPI.onWorkspaceNavigationChanged((data) => {
        setCanGoBack(data.canGoBack);
        setCanGoForward(data.canGoForward);
        setCurrentUrl(data.url);
      });
      return unsubscribe;
    }
  }, [isOverlayOpen, url]);

  // 2. 监听窗口大小变化,更新 BrowserView 位置
  useEffect(() => {
    if (!isOverlayOpen) return;

    const handleResize = () => {
      const bounds = calculateBounds();
      if (bounds && currentUrl && window.electronAPI?.createWorkspaceView) {
        window.electronAPI.createWorkspaceView(currentUrl, bounds);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOverlayOpen, currentUrl]);

  // 3. 监听 IPC 事件(打开新 URL)
  useEffect(() => {
    if (!isOverlayOpen) return;

    const handleOpenUrl = (data: { url: string }) => {
      if (data?.url) {
        const bounds = calculateBounds();
        if (bounds && window.electronAPI?.createWorkspaceView) {
          window.electronAPI.createWorkspaceView(data.url, bounds);
        }
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

  // 4. 后退 - 使用 BrowserView 的内置历史记录
  const handleGoBack = () => {
    if (window.electronAPI?.workspaceGoBack) {
      window.electronAPI.workspaceGoBack();
    }
  };

  // 5. 前进 - 使用 BrowserView 的内置历史记录
  const handleGoForward = () => {
    if (window.electronAPI?.workspaceGoForward) {
      window.electronAPI.workspaceGoForward();
    }
  };

  // 6. 刷新
  const handleRefresh = () => {
    if (window.electronAPI?.refreshWorkspaceView) {
      window.electronAPI.refreshWorkspaceView();
    }
  };

  // 7. 关闭
  const handleClose = () => {
    if (window.electronAPI?.destroyWorkspaceView) {
      window.electronAPI.destroyWorkspaceView();
    }
    closeOverlay();
    setCanGoBack(false);
    setCanGoForward(false);
    setCurrentUrl("");
  };

  // 组件卸载时清理 BrowserView
  useEffect(() => {
    return () => {
      if (window.electronAPI?.destroyWorkspaceView) {
        window.electronAPI.destroyWorkspaceView();
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
      {/* BrowserView 会覆盖这个区域 */}
      <div className="workspace-content" style={{ flex: 1 }} />
    </div>
  );
};

export default forwardRef(WorkspaceModal);
