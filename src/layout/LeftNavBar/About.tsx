import { CloseOutlined, RightOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { CbEvents, Platform } from "@openim/wasm-client-sdk";
import { WSEvent } from "@openim/wasm-client-sdk/lib/types/entity";
import { useRequest } from "ahooks";
import { App, Button, Divider, Form, Input, Modal, Space, Spin } from "antd";
import { t } from "i18next";
import { forwardRef, ForwardRefRenderFunction, memo, useEffect, useState, useRef } from "react";
import { useCopyToClipboard } from "react-use";

import logo from "@/assets/images/profile/logo.png";
import { APP_NAME, APP_VERSION, SDK_VERSION } from "@/config";
import { feedbackToast } from "@/utils/common";

import { OverlayVisibleHandle, useOverlayVisible } from "../../hooks/useOverlayVisible";
import { IMSDK } from "../MainContentWrap";
import axios from "axios";

// 配置数据类型接口
interface ConfigData {
  winVersion?: string;
  [key: string]: unknown;
}

const About: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (_, ref) => {
  const [form] = Form.useForm();
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      centered
      onCancel={closeOverlay}
      afterClose={() => form.resetFields()}
      styles={{ mask: { opacity: 0, transition: "none" } }}
      width={360}
      className="no-padding-modal"
      maskTransitionName=""
    >
      <AboutContent closeOverlay={closeOverlay} />
    </Modal>
  );
};

export default memo(forwardRef(About));

export const AboutContent = ({ closeOverlay }: { closeOverlay?: () => void }) => {
  const { modal } = App.useApp();
  const [progress, setProgress] = useState(0);
  const [isNewVersionAvailable, setIsNewVersionAvailable] = useState(false);
  const [newversion, setNewVersion] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [savedPath, setSavedPath] = useState<string | undefined>();
  const savedPathRef = useRef<string | undefined>();
  const [_, copyToClipboard] = useCopyToClipboard();

  // 日志上传请求
  const { loading: uploadLoading, runAsync: uploadLogsAsync } = useRequest(
    IMSDK.uploadLogs,
    { manual: true },
  );

  // 版本配置请求
  const fetchConfig = async (): Promise<ConfigData> => {
    try {
      const response = await axios.get("http://144.7.97.233:7080/config/config.json");
      return response.data;
    } catch (error) {
      console.warn("config.json 访问失败，尝试访问 /config 路径", error);
      const fallbackResponse = await axios.get("http://144.7.97.233:7080/config");
      return fallbackResponse.data;
    }
  };

  const {
    data: configData,
    loading: checkVersionLoading,
    error: versionError,
  } = useRequest(fetchConfig, { manual: false });

  // 版本检查逻辑
  useEffect(() => {
    if (versionError) {
      console.error("版本检查失败", versionError);
      feedbackToast({ msg: t("placeholder.versionCheckFailed"), error: versionError });
      return;
    }
    if (configData?.winVersion) {
      console.log("版本信息：", configData.winVersion, APP_VERSION);
      if (configData.winVersion !== APP_VERSION) {
        setIsNewVersionAvailable(true);
        setNewVersion(configData.winVersion);
      } else {
        setIsNewVersionAvailable(false);
        setNewVersion("");
        setSavedPath(undefined);
        savedPathRef.current = undefined;
      }
    }
  }, [configData, APP_VERSION, versionError]);

  // 同步状态到 ref
  useEffect(() => {
    if (savedPath) {
      savedPathRef.current = savedPath;
      console.log("savedPath 同步到 ref：", savedPathRef.current);
    }
  }, [savedPath]);

  // 核心修复：正确截取文件夹路径（兼容 Windows \ 和 / 分隔符）
  const handleOpenFolder = async () => {
    const pathToOpen = savedPathRef.current || savedPath;
    console.log("准备打开的文件完整路径：", pathToOpen);

    if (!pathToOpen) {
      feedbackToast({ msg: t("placeholder.noSavedFile") });
      return;
    }

    const electronAPI = window.electronAPI;
    if (!electronAPI || typeof electronAPI.ipcInvoke !== "function") {
      feedbackToast({ msg: t("placeholder.electronApiNotFound") });
      return;
    }

    try {
      // 修复1：同时查找 \ 和 / 的最后一个位置（兼容两种分隔符）
      const lastSeparatorIndex = Math.max(
        pathToOpen.lastIndexOf("\\"),
        pathToOpen.lastIndexOf("/")
      );
      console.log("最后一个路径分隔符位置：", lastSeparatorIndex);

      if (lastSeparatorIndex === -1) {
        // 没有找到分隔符（说明是根目录或单文件），直接用原路径
        throw new Error("无法识别文件路径中的文件夹分隔符");
      }

      // 修复2：截取到最后一个分隔符之前的部分（即文件夹路径）
      let folderPath = pathToOpen.substring(0, lastSeparatorIndex);
      // 修复3：统一转换为 Windows 识别的 \ 分隔符
      folderPath = folderPath.replace(/[\\/]/g, "\\");
      console.log("最终传递给主进程的文件夹路径：", folderPath);

      await electronAPI.ipcInvoke("openFolder", folderPath);
    } catch (error) {
      console.error("打开文件夹失败", error);
      feedbackToast({ msg: `${t("placeholder.openFolderFailed")}：${(error as Error).message}`, error: error as Error });
    }
  };

  // 下载文件核心逻辑
  const handleDownloadNewVersion = async () => {
    if (!newversion) {
      feedbackToast({ msg: t("placeholder.noNewVersion") });
      return;
    }

    const downloadUrl = `http://144.7.97.233:7080/files/win-${newversion}.exe`;
    const fileName = `win-${newversion}.exe`;
    setDownloading(true);
    setDownloadProgress(0);
    setSavedPath(undefined);
    savedPathRef.current = undefined;

    try {
      const electronAPI = window.electronAPI;
      if (!electronAPI || typeof electronAPI.saveFileToDisk !== "function") {
        throw new Error(t("placeholder.electronApiNotFound"));
      }

      const response = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const currentProgress = Math.round((progressEvent.loaded / total) * 100);
          setDownloadProgress(currentProgress);
        },
      });

      const file = new File(
        [response.data],
        fileName,
        { type: response.headers["content-type"] || "application/octet-stream" }
      );

      const savePath = await electronAPI.saveFileToDisk({ file, sync: true });
      console.log("下载成功，获取到的 savePath：", savePath);

      if (!savePath) {
        throw new Error("saveFileToDisk 返回空路径");
      }

      setSavedPath(savePath);
      savedPathRef.current = savePath;

      modal.success({
        title: t("placeholder.downloadSuccess"),
        content: (
          <div>
            <p style={{ margin: "10px 0" }}>
              保存位置：<br />
              <span style={{ fontSize: 12, wordBreak: "break-all" }}>{savePath}</span>
            </p>
            <Button
              type="primary"
              size="small"
              onClick={handleOpenFolder}
              icon={<FolderOpenOutlined size={12} />}
              style={{ marginTop: 10 }}
            >
              打开文件夹
            </Button>
          </div>
        ),
        centered: true,
        onOk: () => {},
      });

    } catch (error) {
      console.error("下载失败", error);
      feedbackToast({
        msg: t("placeholder.downloadFailed"),
        error: error as Error,
        duration: 3,
      });
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const tryLogReport = async (line: number) => {
    try {
      await uploadLogsAsync({ line, ex: "" });
      feedbackToast({ msg: t("placeholder.uploadSuccess"), duration: 2 });
    } catch (error) {
      feedbackToast({ msg: t("placeholder.uploadFailed"), error: error, duration: 3 });
    }
    setProgress(0);
  };

  // 上传进度监听
  useEffect(() => {
    const uploadHandler = ({
      data: { current, size },
    }: WSEvent<{ current: number; size: number }>) => {
      const progress = (current / size) * 100;
      setProgress(Number(progress.toFixed(0)));
    };
    IMSDK.on(CbEvents.OnUploadLogsProgress, uploadHandler);
    return () => IMSDK.off(CbEvents.OnUploadLogsProgress, uploadHandler);
  }, []);

  // 日志上报模态框
  const LogReportModal = ({ close }: { close: () => void }) => {
    const [line, setLine] = useState(100);
    return (
      <div className="flex w-[300px] flex-col p-6">
        <Input
          addonBefore="Line:"
          value={line}
          onChange={(e) => setLine(Number(e.target.value))}
          type="number"
          min={1}
          max={100000}
        />
        <Space className="ml-auto mt-4">
          <Button onClick={() => close()}>{t("cancel")}</Button>
          <Button
            type="primary"
            onClick={() => { tryLogReport(line); close(); }}
          >
            {t("confirm")}
          </Button>
        </Space>
      </div>
    );
  };

  const openSelectLine = () => {
    const current = modal.info({
      title: null,
      icon: null,
      footer: null,
      width: 300,
      className: "no-padding-modal",
      centered: true,
      maskTransitionName: "",
      content: <LogReportModal close={() => current.destroy()} />,
    });
  };

  const handleCopy = () => {
    copyToClipboard(`${APP_NAME} ${APP_VERSION}/${SDK_VERSION}`);
    feedbackToast({ msg: t("toast.copySuccess"), duration: 2 });
  };

  // 合并加载态
  const isLoading = uploadLoading || checkVersionLoading || downloading;

  return (
    <Spin
      spinning={isLoading}
      tip={
        uploadLoading
          ? `${progress}%`
          : downloading
          ? `${t("placeholder.downloading")} ${downloadProgress}%`
          : t("placeholder.loading")
      }
    >
      <div className="bg-[var(--chat-bubble)]">
        <div className="app-drag flex items-center justify-between bg-[var(--gap-text)] p-5">
          <span className="text-base font-medium">{t("placeholder.about")}</span>
          <CloseOutlined
            className="app-no-drag cursor-pointer text-[#8e9aaf]"
            onClick={closeOverlay}
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <img className="mb-2 mt-7" width={56} src={logo} alt="" />
          <div
            className="mb-5 flex cursor-pointer flex-col items-center"
            onClick={handleCopy}
          >
            <div>{`${APP_NAME} ${APP_VERSION}`}</div>
            <div>{SDK_VERSION}</div>
          </div>
        </div>

        <Divider className="border-1 m-0 border-[var(--gap-text)]" />

        {window.electronAPI && (
          <>
            {/* 最新版本下载入口 */}
            {isNewVersionAvailable ? (
              <div
                className="text-primary flex cursor-pointer items-center justify-between border-b border-[var(--gap-text)] px-3 py-2"
                onClick={handleDownloadNewVersion}
                style={{
                  opacity: downloading ? 0.7 : 1,
                  pointerEvents: downloading ? "none" : "auto",
                }}
              >
                <div>最新版本：{newversion}</div>
                {downloading ? (
                  <span>{downloadProgress}%</span>
                ) : (
                  <RightOutlined />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-[var(--gap-text)] px-3 py-2 text-gray-500">
                <div>{t("placeholder.alreadyLatestVersion")}</div>
                <span>{APP_VERSION}</span>
              </div>
            )}

            {/* 下载成功后显示：路径 + 打开按钮 */}
            {(savedPath || savedPathRef.current) && (
              <div className="flex items-center justify-between border-b border-[var(--gap-text)] px-3 py-2">
                <div className="text-sm text-gray-600">
                  下载位置：{(savedPath || savedPathRef.current)!.length > 30 
                    ? `${(savedPath || savedPathRef.current)!.substring(0, 30)}...` 
                    : (savedPath || savedPathRef.current)!}
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={handleOpenFolder}
                  icon={<FolderOpenOutlined size={12} />}
                >
                  打开
                </Button>
              </div>
            )}

            <div
              className="flex cursor-pointer items-center justify-between border-b border-[var(--gap-text)] px-3 py-2"
              onClick={() => tryLogReport(10000)}
            >
              <div>{t("placeholder.reportLog")}</div>
              <RightOutlined />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between border-b border-[var(--gap-text)] px-3 py-2"
              onClick={openSelectLine}
            >
              <div>{t("placeholder.reportSpecificLog")}</div>
              <RightOutlined />
            </div>
          </>
        )}
      </div>
    </Spin>
  );
};