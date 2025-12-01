export type MsgData = {
  msgID: string;
  sendID: string;
  recvID: string;
  sessionType: number;
  content: string;
  sendTime: number;
  msgType: number;
  status: number;
};

export type RequestPagination = {
  pageNumber: number;
  showNumber: number;
  total?: number;
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

export const createFavorite = async (
  userID: string,
  conversationID: string,
  clientMsgID: string,
  serverMsgID: string,
  seq: number,
  msgData: MsgData,
  remark: string,
): Promise<boolean> => {
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
  operationID: string,
  pagination: string,
  // pageNumber: number,
  // showNumber: number,
  sessionTypes: any,
  startTime: number,
  endTime: number,
): Promise<{
  favorites: any; list: FavoriteItem[]; total: number 
}> => {
  const fn = window.listFavorite;
  if (typeof fn !== "function") {
    throw new Error("WASM未暴露listFavorite函数");
  }
  return fn(operationID, pagination, sessionTypes, startTime, endTime);
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
