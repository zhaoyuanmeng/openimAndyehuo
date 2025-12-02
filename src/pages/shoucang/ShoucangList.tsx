import { useEffect, useState } from "react";  
import { listFavorite } from "@/utils/wasmOther";  
import { v4 as uuidv4 } from "uuid";
type Category = "all" | "file" | "media" | "composite";  
  
interface FavItem {  
  favoriteID: string;  
  contentType: number; // 101文本 102图片 103文件  
  content: string;  
  remark: string;  
  createTime: number;  
  senderNickname?: string;  
}  
  
interface ShoucangListProps {  
  category: Category;  
}  
  
export const ShoucangList = ({ category }: ShoucangListProps) => {  
  const [items, setItems] = useState<FavItem[]>([]);  
  const [loading, setLoading] = useState(false);  
  
  useEffect(() => {  
    loadFavItems(category);  
  }, [category]);  
  
  const loadFavItems = async (cat: Category) => {  
    setLoading(true);  
    try {  
      const res = await listFavorite(  
        uuidv4(),  
        JSON.stringify({ pageNumber: 1, showNumber: 20 }),  
        JSON.stringify([1]),  
        0,  
        -10,  
      );  
        
      // 对返回结果进行JSON.parse处理  
      const parsedRes = typeof res === 'string' ? JSON.parse(res) : res;  
        
      const favItems: FavItem[] = parsedRes.favorites.map((fav: any) => ({  
        favoriteID: fav.favoriteID,  
        contentType: fav.contentType,  
        content: fav.msgData?.content || fav.content,  
        remark: fav.remark,  
        createTime: fav.createTime,  
        senderNickname: fav.msgData?.senderNickname,  
      }));  
        
      setItems(favItems);  
    } catch (error) {  
      console.error("加载收藏失败:", error);  
      setItems([]);  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  const filteredItems = items.filter((item) => {  
    if (category === "all") return true;  
    if (category === "file") return item.contentType === 103;  
    if (category === "media") return item.contentType === 102;  
    if (category === "composite") return item.contentType === 101;  
    return false;  
  });  
  
  const getCategoryTitle = () => {  
    switch (category) {  
      case "all": return "全部";  
      case "file": return "文件";  
      case "media": return "图片";  
      case "composite": return "聊天记录";  
      default: return "";  
    }  
  };  
  
  const renderContent = (item: FavItem) => {  
    switch (item.contentType) {  
      case 101: // 文本  
        return (  
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">  
            <p className="text-sm text-gray-700 leading-relaxed text-break">  
              {item.content}  
            </p>  
          </div>  
        );  
      case 102: // 图片  
        return (  
          <div className="flex items-center space-x-2 mt-2">  
            <i className="icon-image text-xl text-blue-500" />  
            <p className="text-sm text-gray-600">图片</p>  
          </div>  
        );  
      case 103: // 文件  
        return (  
          <div className="flex items-center space-x-2 mt-2">  
            <i className="icon-document text-xl text-green-500" />  
            <p className="text-sm text-gray-600">文件</p>  
          </div>  
        );  
      default:  
        return <p className="text-sm text-gray-600 mt-2">未知类型</p>;  
    }  
  };  
  
  return (  
    <div className="flex flex-1 flex-col">  
      <h2 className="flex h-[60px] items-center px-5 text-base font-normal border-b border-gray-100">  
        {getCategoryTitle()}  
      </h2>  
      <div className="flex-1 overflow-y-auto px-5 py-4">  
        {loading ? (  
          <div className="flex items-center justify-center py-8">  
            <p className="text-gray-500">加载中...</p>  
          </div>  
        ) : filteredItems.length === 0 ? (  
          <div className="flex items-center justify-center py-8">  
            <p className="text-gray-500">暂无收藏内容</p>  
          </div>  
        ) : (  
          <div className="space-y-4">  
            {filteredItems.map((item) => (  
              <div   
                key={item.favoriteID}   
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"  
              >  
                <div className="flex items-start justify-between">  
                  <div className="flex-1 min-w-0">  
                    <div className="flex items-center mb-2">  
                      <h3 className="text-sm font-medium text-gray-900 truncate">  
                        {item.remark || "无标题"}  
                      </h3>  
                    </div>  
                    {item.senderNickname && (  
                      <div className="flex items-center mb-2">  
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">  
                          <span className="text-xs text-blue-600 font-medium">  
                            {item.senderNickname.charAt(0)}  
                          </span>  
                        </div>  
                        <p className="text-xs text-gray-500">{item.senderNickname}</p>  
                      </div>  
                    )}  
                    {renderContent(item)}  
                  </div>  
                  <div className="ml-4 flex-shrink-0">  
                    <p className="text-xs text-gray-400 whitespace-nowrap">  
                      {new Date(item.createTime).toLocaleDateString()}  
                    </p>  
                  </div>  
                </div>  
              </div>  
            ))}  
          </div>  
        )}  
      </div>  
    </div>  
  );  
};