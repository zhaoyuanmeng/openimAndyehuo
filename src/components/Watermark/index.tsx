import React from "react";
import { useUserStore } from "@/store";

interface WatermarkProps {
  text?: string;
  color?: string;
  fontSize?: number;
  opacity?: number;
}

const Watermark: React.FC<WatermarkProps> = ({
  text,
  color = "rgba(0, 0, 0, 0.3)", // 增加透明度从 0.1 到 0.3
  fontSize = 16, // 增大字体
  opacity = 0.5, // 增加整体透明度
}) => {
  const selfInfo = useUserStore((state) => state.selfInfo);
  const watermarkText = text || `${selfInfo.userID || "OpenIM"}`;

  // 调试输出

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3e%3ctext x='50%25' y='50%25' dy='0.35em' text-anchor='middle' font-size='${fontSize}' fill='${encodeURIComponent(
          color,
        )}' transform='rotate(-45 100 100)'%3e${encodeURIComponent(
          watermarkText,
        )}%3c/text%3e%3c/svg%3e")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
        opacity,
      }}
    />
  );
};

export default Watermark;
