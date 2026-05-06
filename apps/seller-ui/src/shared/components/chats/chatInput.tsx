import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PickerProps } from "emoji-picker-react";
import { Send, ImageIcon, Smile } from "lucide-react";

const EmojiPicker = dynamic(() => import("emoji-picker-react").then((mod) => mod.default as React.FC<PickerProps>), {
  ssr: false,
});


const ChatInput = ({ onSendMessage, message, setMessage }: {
  onSendMessage: (e: any) => void;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {

  const [showEmoji, setShowEmoji] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setMessage((prev) => prev + "<img src=\"" + base64String + "\"/>");
      }
      reader.readAsDataURL(file);
    }
    console.log("Uploaded image:", file?.name);
  }

  return (
    <div>
      <form
        onSubmit={onSendMessage}
        className="border-t border-t-gray-200 px-4 py-3 flex items-center gap-2 relative">
        {/* {image Upload Icon} */}
        <label className="cursor-pointer p-2 hover:bg-gray-100 rounded:md">
          <ImageIcon className="w-5 h-5 text-gray-600" />
          <input type="file"
            accept="image/*"
            onChange={handleImageUpload}
            hidden />
        </label>

        {/* {Emoji Picker Toggle} */}
        <div className="relative">
          <button type="button"
            onClick={() => setShowEmoji((prev) => !prev)}
            className="p-2 hover:bg-gray-100 rounded:md">
            <Smile className="w-5 h-5 text-gray-600" />
          </button>
          {/* {Emoji Picker} */}
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>
        {/* Input Field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 text-sm border outline-none border-gray-200 rounded:md" />
        <button type="submit"
          className="p-2 hover:bg-gray-100 rounded:md">
          <Send className="w-5 h-5 text-gray-600" />
        </button>
      </form>
    </div>
  );
};
export default ChatInput; 