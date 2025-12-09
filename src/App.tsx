import { App as AntdApp, ConfigProvider, theme } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { RouterProvider } from "react-router-dom";
import KeepAlive from "./keepalive";
import AntdGlobalComp from "./AntdGlobalComp";
import router from "./routes";
import { useUserStore } from "./store";
import Watermark from "./components/Watermark";
function App() {
  const locale = useUserStore((state) => state.appSettings.locale);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });
  const isShowWatermark = true; // 是否显示水印，可以根据需要从配置或状态中获取
  return (
    <ConfigProvider
      autoInsertSpaceInButton={false}
      locale={locale === "zh-CN" ? zhCN : enUS}
      theme={{
        token: { colorPrimary: "#0089FF" },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>loading...</div>}>
          <AntdApp>
            <AntdGlobalComp />
            <KeepAlive
              keepPaths={[
                /^\/chat\/?.*/, // 匹配 /chat 及所有子路径（如 /chat/123）
                /^\/WorkspacePage\/?.*/, // 匹配 /chat 及所有子路径（如 /chat/123）
              ]}
            >
              <RouterProvider router={router} />
            </KeepAlive>
            {isShowWatermark && <Watermark />} {/* 水印 */}
          </AntdApp>
        </Suspense>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
