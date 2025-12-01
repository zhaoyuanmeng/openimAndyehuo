import { FC } from 'react';  
import { t } from 'i18next';  
  
interface MessageMenuProps {  
  position: { x: number; y: number };  
  onClose: () => void;  
  onFavorite: () => void;  
}  
  
const MessageMenu: FC<MessageMenuProps> = ({ position, onClose, onFavorite }) => {  
  return (  
    <div  
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"  
      style={{ left: position.x, top: position.y }}  
    >  
      <button  
        className="px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"  
        onClick={onFavorite}  
      >  
        收藏  
      </button>  
    </div>  
  );  
};  
  
export default MessageMenu;