import { SessionType } from "@openim/wasm-client-sdk";  
  
export const isGroupSession = (conversationType: SessionType): boolean => {  
  return conversationType === SessionType.WorkingGroup;  
};  
  
export const isGroupConversationID = (conversationID: string): boolean => {  
  return conversationID.startsWith("group_");  
};