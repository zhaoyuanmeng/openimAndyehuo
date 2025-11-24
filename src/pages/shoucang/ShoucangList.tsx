import { useEffect, useState } from "react";  
  
type Category = "all" | "file" | "media" | "composite";  
  
interface FavItem {  
  id: string;  
  type: "file" | "image" | "video" | "composite";  
  title: string;  
  timestamp: number;  
  sender: string;  
  data?: any;  
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
    // TODO: 实现实际的数据加载逻辑  
    // 这里是模拟数据  
    setTimeout(() => {  
      setItems([  
        {  
          id: "1",  
          type: "file",  
          title: "示例文件.pdf",  
          timestamp: Date.now(),  
          sender: "用户A",  
        },  
        {  
          id: "2",  
          type: "image",  
          title: "图片.jpg",  
          timestamp: Date.now(),  
          sender: "用户B",  
        },  
      ]);  
      setLoading(false);  
    }, 500);  
  };  
  
  const filteredItems = items.filter((item) => {  
    if (category === "all") return true;  
    if (category === "file") return item.type === "file";  
    if (category === "media")  
      return item.type === "image" || item.type === "video";  
    if (category === "composite") return item.type === "composite";  
    return false;  
  });  
  
  const getCategoryTitle = () => {  
    switch (category) {  
      case "all":  
        return "全部";  
      case "file":  
        return "文件";  
      case "media":  
        return "图片与视频";  
      case "composite":  
        return "聊天记录";  
      default:  
        return "";  
    }  
  };  
  
  return (  
    <div className="flex flex-1 flex-col">  
      <h2 className="flex h-[60px] items-center px-5 text-base font-normal">  
        {getCategoryTitle()}  
      </h2>  
      <div className="flex-1 overflow-y-auto px-5">  
        {loading ? (  
          <p className="text-gray-500">加载中...</p>  
        ) : filteredItems.length === 0 ? (  
          <p className="text-gray-500">暂无收藏内容</p>  
        ) : (  
          <ul>  
            {filteredItems.map((item) => (  
              <li  
                key={item.id}  
                className="border-b border-gray-100 py-3 hover:bg-gray-50"  
              >  
                <div className="flex items-center">  
                  <div className="flex-1">  
                    <p className="text-sm font-medium">{item.title}</p>  
                    <p className="text-xs text-gray-500">{item.sender}</p>  
                  </div>  
                  <p className="text-xs text-gray-400">  
                    {new Date(item.timestamp).toLocaleDateString()}  
                  </p>  
                </div>  
              </li>  
            ))}  
          </ul>  
        )}  
      </div>  
    </div>  
  );  
};