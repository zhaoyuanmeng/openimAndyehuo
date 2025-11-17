import { useMount } from "ahooks";
import { Layout, Spin } from "antd";
import { t } from "i18next";
import { Outlet, useMatches, useNavigate } from "react-router-dom";
import WorkspaceModal from "@/pages/workspace/WorkspaceModal";
import { useUserStore } from "@/store";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import LeftNavBar from "./LeftNavBar";
import TopSearchBar from "./TopSearchBar";
import { useGlobalEvent } from "./useGlobalEvents";
import { useRef, useState, useEffect } from "react";
export const MainContentLayout = () => {
  useGlobalEvent();
  const matches = useMatches();
  const navigate = useNavigate();

  const progress = useUserStore((state) => state.progress);
  const syncState = useUserStore((state) => state.syncState);
  const reinstall = useUserStore((state) => state.reinstall);
  const isLogining = useUserStore((state) => state.isLogining);

  const workspaceModalRef = useRef<OverlayVisibleHandle>(null);
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  // 暴露打开工作台的方法给全局使用
  useEffect(() => {
    window.openWorkspace = (url: string) => {
      console.log(url, "url--------");
      setWorkspaceUrl(url);
      setTimeout(() => {
        console.log("open workspace", workspaceModalRef.current);
        workspaceModalRef.current?.openOverlay();
      }, 200);
    };
  }, []);
  useMount(() => {
    const isRoot = !matches.find((item) => item.pathname !== "/");
    const inConversation = matches.some((item) => item.params.conversationID);
    if (isRoot || inConversation) {
      navigate("chat", {
        replace: true,
      });
    }
  });

  const loadingTip = isLogining ? t("toast.loading") : `${progress}%`;
  const showLockLoading = isLogining || (reinstall && syncState === "loading");

  return (
    <Spin className="!max-h-none" spinning={showLockLoading} tip={loadingTip}>
      <Layout className="h-full">
        <TopSearchBar />
        <Layout className="relative">
          <LeftNavBar />
          <Outlet />
          <WorkspaceModal ref={workspaceModalRef} url={workspaceUrl} />
        </Layout>
      </Layout>
    </Spin>
  );
};
