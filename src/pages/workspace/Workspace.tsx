import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./workspace.scss";

export const Workspace = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const location = useLocation();

  const workspaceUrl = "http://144.7.97.233:7080/";

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

  // 只在首次挂载时初始化
  useEffect(() => {
    setCurrentUrl(workspaceUrl);

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

    // 监听窗口调整大小事件
    const handleWindowResized = () => {
      const newBounds = calculateBounds();
      if (newBounds && window.electronAPI?.updateWorkspaceViewBounds) {
        window.electronAPI.updateWorkspaceViewBounds(newBounds);
      }
    };

    let unsubscribeResize: (() => void) | undefined;
    if (window.electronAPI?.onWorkspaceWindowResized) {
      unsubscribeResize =
        window.electronAPI.onWorkspaceWindowResized(handleWindowResized);
    }

    return () => {
      if (unsubscribeResize) {
        unsubscribeResize();
      }
    };
  }, []);

  // 监听路由变化,控制 BrowserView 显示/隐藏
  useEffect(() => {
    // 检查当前路由是否是 Workspace
    const isWorkspaceRoute = location.pathname.includes("/WorkspacePage");

    if (isWorkspaceRoute) {
      // 显示 BrowserView
      const bounds = calculateBounds();
      if (bounds && window.electronAPI?.showWorkspaceView) {
        window.electronAPI.showWorkspaceView(bounds);
      }
    } else {
      // 隐藏 BrowserView
      if (window.electronAPI?.hideWorkspaceView) {
        window.electronAPI.hideWorkspaceView();
      }
    }
  }, [location.pathname]);

  // 监听 workspace-open-url 事件
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

  const handleGoHome = () => {
    if (window.electronAPI?.workspaceGoHome) {
      window.electronAPI.workspaceGoHome();
    }
  };

  return (
    <div className="workspace-container" ref={containerRef}>
      <div className="workspace-toolbar">
        <button onClick={handleGoHome} className="toolbar-btn">
          回到首页
        </button>
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
      <div className="workspace-content" style={{ flex: 1 }} />
    </div>
  );
};
