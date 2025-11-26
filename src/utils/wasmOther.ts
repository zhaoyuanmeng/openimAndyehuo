// wasm/favoriteWasm.ts
// 关键：告诉 TS window 上有这3个函数（解决类型报错）
// declare global {
//   interface Window {
//     createFavorite: (...args: any[]) => Promise<boolean>;
//     listFavorite: (...args: any[]) => Promise<{ list: FavoriteItem[]; total: number }>;
//     deleteFavorite: (...args: any[]) => Promise<number>;

//     // Electron环境
//     favoriteWasm?: {
//       createFavorite: (...args: any[]) => Promise<boolean>;
//       listFavorite: (...args: any[]) => Promise<{ list: FavoriteItem[]; total: number }>;
//       deleteFavorite: (...args: any[]) => Promise<number>;
//     };
//   }
// }

// 1. 定义必要的简单类型（对应Go端结构体，按需调整字段）
export type MsgData = {
  msgID: string;
  sendID: string;
  recvID: string;
  sessionType: number;
  content: string;
  sendTime: number;
  msgType: number;
  status: number;
  // 其他字段按需加，和Go端sdkws.MsgData对齐即可
};

export type RequestPagination = {
  page: number;
  pageSize: number;
  total?: number; // 可选，Go端返回时赋值
};

export type FavoriteItem = {
  favoriteID: string;
  userID: string;
  conversationID: string;
  clientMsgID: string;
  serverMsgID: string;
  seq: number;
  msgData: MsgData;
  remark: string;
  createTime: number;
};

// 2. 封装3个核心函数（直接映射window，无单例、无多余逻辑）
/**
 * 创建收藏
 */
/**
 * 创建收藏
 */
export const createFavorite = async (
  userID: string,
  conversationID: string,
  clientMsgID: string,
  serverMsgID: string,
  seq: number,
  msgData: MsgData,
  remark: string,
): Promise<boolean> => {
  // 优先使用Electron环境暴露的函数，回退到浏览器环境
  const fn = window.createFavorite;
  if (typeof fn !== "function") {
    throw new Error("WASM未暴露createFavorite函数");
  }
  return fn(userID, conversationID, clientMsgID, serverMsgID, seq, msgData, remark);
};

/**
 * 列出收藏
 */
export const listFavorite = async (
  userID: string,
  pagination: RequestPagination,
  sessionTypes: number[],
  startTime: number,
  endTime: number,
): Promise<{ list: FavoriteItem[]; total: number }> => {
  const fn = window.listFavorite;
  if (typeof fn !== "function") {
    throw new Error("WASM未暴露listFavorite函数");
  }
  return fn(userID, pagination, sessionTypes, startTime, endTime);
};

/**
 * 删除收藏
 */
export const deleteFavorite = async (
  userID: string,
  favoriteIDs: string[],
): Promise<number> => {
  const fn = window.deleteFavorite;
  if (typeof fn !== "function") {
    throw new Error("WASM未暴露deleteFavorite函数");
  }
  return fn(userID, favoriteIDs);
};
