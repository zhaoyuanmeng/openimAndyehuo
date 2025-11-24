import { useState } from "react";  
import { ShoucangList } from "./ShoucangList";  
  
type Category = "all" | "file" | "media" | "composite";  
  
export const Shoucang = () => {  
  const [category, setCategory] = useState<Category>("all");  
  
  const handleCategoryChange = (newCategory: Category) => {  
    if (category === newCategory) return;  
    setCategory(newCategory);  
  };  
  
  return (  
    <section className="flex h-full">  
      {/* 左侧导航栏 */}  
      <div className="flex w-[280px] flex-col border-r border-gray-200">  
        <div className="flex-1 overflow-y-auto bg-[#ffffff]">  
          <ul>  
            <li>  
              <div  
                className={`flex h-[50px] cursor-pointer items-center px-5 hover:bg-[#f3f8ff] active:bg-[#f3f8ff] ${  
                  category === "all" ? "bg-[#f3f8ff]" : ""  
                }`}  
                onClick={() => handleCategoryChange("all")}  
              >  
                <i className="icon-cloud text-xl" />  
                <p className="ml-2.5 flex-1 text-sm">全部</p>  
              </div>  
            </li>  
            <li>  
              <div  
                className={`flex h-[50px] cursor-pointer items-center px-5 hover:bg-[#f3f8ff] active:bg-[#f3f8ff] ${  
                  category === "file" ? "bg-[#f3f8ff]" : ""  
                }`}  
                onClick={() => handleCategoryChange("file")}  
              >  
                <i className="icon-document text-xl" />  
                <p className="ml-2.5 flex-1 text-sm">文件</p>  
              </div>  
            </li>  
            <li>  
              <div  
                className={`flex h-[50px] cursor-pointer items-center px-5 hover:bg-[#f3f8ff] active:bg-[#f3f8ff] ${  
                  category === "media" ? "bg-[#f3f8ff]" : ""  
                }`}  
                onClick={() => handleCategoryChange("media")}  
              >  
                <i className="icon-image text-xl" />  
                <p className="ml-2.5 flex-1 text-sm">图片</p>  
              </div>  
            </li>  
            <li>  
              <div  
                className={`flex h-[50px] cursor-pointer items-center px-5 hover:bg-[#f3f8ff] active:bg-[#f3f8ff] ${  
                  category === "composite" ? "bg-[#f3f8ff]" : ""  
                }`}  
                onClick={() => handleCategoryChange("composite")}  
              >  
                <i className="icon-chat text-xl" />  
                <p className="ml-2.5 flex-1 text-sm">聊天记录</p>  
              </div>  
            </li>  
          </ul>  
        </div>  
      </div>  
  
      {/* 右侧内容区域 */}  
      <ShoucangList category={category} />  
    </section>  
  );  
};