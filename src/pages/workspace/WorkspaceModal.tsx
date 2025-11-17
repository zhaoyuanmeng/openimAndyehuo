import { CloseOutlined, ReloadOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";  
import { forwardRef, ForwardRefRenderFunction, useRef, useState, useEffect } from "react";  
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";  
  
interface WorkspaceModalProps {  
  url?: string;  
}  
  
const WorkspaceModal: ForwardRefRenderFunction<OverlayVisibleHandle, WorkspaceModalProps> = ({ url }, ref) => {  
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);  
  const iframeRef = useRef<HTMLIFrameElement>(null);  
  const [currentUrl, setCurrentUrl] = useState(url || "");  
  const [canGoBack, setCanGoBack] = useState(false);  
  const [canGoForward, setCanGoForward] = useState(false);  
  
  useEffect(() => {  
    if (url) {  
      setCurrentUrl(url);  
    }  
  }, [url]);  
  
  const handleGoBack = () => {  
    if (iframeRef.current?.contentWindow) {  
      iframeRef.current.contentWindow.history.back();  
      setCanGoBack(false);  
      setCanGoForward(true);  
    }  
  };  
  
  const handleGoForward = () => {  
    if (iframeRef.current?.contentWindow) {  
      iframeRef.current.contentWindow.history.forward();  
      setCanGoForward(false);  
      setCanGoBack(true);  
    }  
  };  
  
  const handleRefresh = () => {  
    if (iframeRef.current) {  
      iframeRef.current.src = iframeRef.current.src;  
    }  
  };  
  
  const handleClose = () => {  
    closeOverlay();  
    setCurrentUrl("");  
    setCanGoBack(false);  
    setCanGoForward(false);  
  };  
  
  if (!isOverlayOpen) return null;  
  
  return (  
    <div className="workspace-modal-overlay">  
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
          <button   
            onClick={handleRefresh}  
            className="toolbar-btn"  
            title="刷新"  
          >  
            <ReloadOutlined />  
          </button>  
        </div>  
        <div className="toolbar-center">  
          <span className="current-url" title={currentUrl}>{currentUrl}</span>  
        </div>  
        <div className="toolbar-right">  
          <button   
            onClick={handleClose}  
            className="toolbar-btn close-btn"  
            title="关闭"  
          >  
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