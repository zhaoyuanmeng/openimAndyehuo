import { useRef, useState, useEffect } from "react";
import "./workspace.scss";

export const Workspace = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const workspaceUrl = "http://144.7.97.233:7080/";

  useEffect(() => {
    setCurrentUrl(workspaceUrl);

    // 计算工具栏高度,为 BrowserView 预留空间
    const calculateBounds = () => {
      if (!containerRef.current) return;

      const toolbar = containerRef.current.querySelector(".workspace-toolbar");
      const toolbarHeight = toolbar?.clientHeight || 40;
      const rect = containerRef.current.getBoundingClientRect();

      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y + toolbarHeight),
        width: Math.round(rect.width),
        height: Math.round(rect.height - toolbarHeight),
      };
    };

    // 创建 BrowserView
    const bounds = calculateBounds();
    if (bounds && window.electronAPI?.createWorkspaceView) {
      window.electronAPI.createWorkspaceView(workspaceUrl, bounds);
    }

    // 监听导航状态变化
    if (window.electronAPI?.onWorkspaceNavigationChanged) {
      window.electronAPI.onWorkspaceNavigationChanged((data) => {
        setCanGoBack(data.canGoBack);
        setCanGoForward(data.canGoForward);
        setCurrentUrl(data.url);
      });
    }

    // 监听窗口大小变化,更新 BrowserView 位置
    const handleResize = () => {
      const newBounds = calculateBounds();
      if (newBounds && window.electronAPI?.createWorkspaceView) {
        window.electronAPI.createWorkspaceView(currentUrl, newBounds);
      }
    };

    window.addEventListener("resize", handleResize);

    // 清理
    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.electronAPI?.destroyWorkspaceView) {
        window.electronAPI.destroyWorkspaceView();
      }
    };
  }, []);

  const handleGoBack = () => {
    if (window.electronAPI?.workspaceGoBack) {
      window.electronAPI.workspaceGoBack();
    }
  };

  const handleGoForward = () => {
    if (window.electronAPI?.workspaceGoForward) {
      window.electronAPI.workspaceGoForward();
    }
  };

  const handleRefresh = () => {
    if (window.electronAPI?.refreshWorkspaceView) {
      window.electronAPI.refreshWorkspaceView();
    }
  };

  const handleOpenModal = () => {
    window.openWorkspace("http://www.chinaxiongan.cn/");
  };

  useEffect(() => {
    const handleWorkspaceOpenUrl = (data: { url: string }) => {
      console.log("workspace-open-url---", data.url);
      window.openWorkspace(data.url);
    };

    if (window.electronAPI?.subscribe) {
      const unsubscribe = window.electronAPI.subscribe(
        "workspace-open-url",
        handleWorkspaceOpenUrl,
      );
      return unsubscribe;
    }
  }, []);

  return (
    <div className="workspace-container" ref={containerRef}>
      <div className="workspace-toolbar">
        <button onClick={handleRefresh} className="toolbar-btn">
          刷新
        </button>
        <button onClick={handleGoBack} disabled={!canGoBack} className="toolbar-btn">
          ← 后退
        </button>
        <button
          onClick={handleGoForward}
          disabled={!canGoForward}
          className="toolbar-btn"
        >
          前进 →
        </button>
      </div>
      {/* BrowserView 会覆盖这个区域,这里只是占位 */}
      <div className="workspace-content" style={{ flex: 1 }} />
    </div>
  );
};
