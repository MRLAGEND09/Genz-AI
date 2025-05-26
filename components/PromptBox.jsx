import Image from "next/image";
import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";

const PromptBox = ({ setIsLoading, isLoading, messages, setMessages }) => {
  const [prompt, setPrompt] = useState('');
  const { user, chats, setChats, selectedChat, setSelectedChat } = useAppContext();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e);
    }
  };

  const sendPrompt = async (e) => {
    e.preventDefault();

    if (!user) return toast.error("Please login to send a message");
    if (isLoading) return toast.error("Please wait for the previous prompt response");
    if (!selectedChat) return toast.error("No chat selected");
    if (!prompt.trim()) return;

    const promptCopy = prompt;

    try {
      setIsLoading(true);
      setPrompt('');

      const userPrompt = {
        role: "user",
        content: promptCopy,
        timestamp: Date.now(),
      };

      // Instantly update UI with user message
      setMessages(prev => [...prev, userPrompt]);

      // Update context chats & selectedChat
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: [...(chat.messages || []), userPrompt] }
            : chat
        )
      );

      setSelectedChat((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), userPrompt],
      }));

      const { data } = await axios.post('/api/chat/ai', {
        chatId: selectedChat._id,
        prompt: promptCopy,
      });

      if (data.success) {
        const aiMessage = data.data;
        // Update UI with AI response
        setMessages(prev => [...prev, aiMessage]);

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === selectedChat._id
              ? { ...chat, messages: [...(chat.messages || []), aiMessage] }
              : chat
          )
        );

        setSelectedChat((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), aiMessage],
        }));
      } else {
        toast.error(data.message || "Error in response");
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={sendPrompt}
      className={`w-full ${
        selectedChat?.messages?.length > 0 ? "max-w-3xl" : "max-w-2xl"
      } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
    >
      <textarea
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none overflow-hidden break-words bg-transparent text-white placeholder-gray-400"
        rows={2}
        placeholder="Message DeepSeek"
        required
        onChange={(e) => setPrompt(e.target.value)}
        value={prompt}
      />
      <div className="flex justify-between items-center text-sm mt-2">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
            <Image className="h-5" src={assets.deepthink_icon} alt="DeepThink" />
            DeepThink (R1)
          </p>
          <p className="flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition">
            <Image className="h-5" src={assets.search_icon} alt="Search" />
            Search
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Image className="w-4 cursor-pointer" src={assets.pin_icon} alt="Pin" />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className={`rounded-full p-2 cursor-pointer ${
              prompt.trim() ? "bg-primary" : "bg-[#71717a]"
            }`}
          >
            <Image
              className="w-3.5 aspect-square"
              src={prompt.trim() ? assets.arrow_icon : assets.arrow_icon_dull}
              alt="Send"
            />
          </button>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;
