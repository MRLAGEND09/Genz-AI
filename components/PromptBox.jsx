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
    const promptCopy = prompt.trim();

    try {
      if (!user) return toast.error("Please login to send a message");
      if (isLoading) return toast.error("Please wait for the previous prompt response");
      if (!selectedChat) return toast.error("No chat selected");
      if (!promptCopy) return toast.error("Please enter a message");

      setIsLoading(true);
      setPrompt('');

      // User message object
      const userPrompt = {
        role: "user",
        content: promptCopy,
        timestamp: Date.now(),
      };

      // Update frontend states immediately with user message
      setMessages(prev => [...prev, userPrompt]);
      setChats(prevChats => prevChats.map(chat =>
        chat._id === selectedChat._id
          ? { ...chat, messages: [...(chat.messages || []), userPrompt] }
          : chat
      ));
      setSelectedChat(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), userPrompt],
      }));

      // 1️⃣ Try Google Knowledge Graph API first
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_KG_API_KEY;
      const googleRes = await fetch(`https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(promptCopy)}&key=${apiKey}&limit=1&indent=True`);
      const kgData = await googleRes.json();

      if (kgData?.itemListElement?.length > 0) {
        const result = kgData.itemListElement[0].result;
        const name = result.name || promptCopy;
        const desc = result.description || "No description";
        const detail = result.detailedDescription?.articleBody || "No further details available.";

        const kgResponse = {
          role: "assistant",
          content: `**${name}** (${desc})\n\n${detail}`,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, kgResponse]);
        setChats(prevChats => prevChats.map(chat =>
          chat._id === selectedChat._id
            ? { ...chat, messages: [...(chat.messages || []), kgResponse] }
            : chat
        ));
        setSelectedChat(prev => ({
          ...prev,
          messages: [...(prev?.messages || []), kgResponse],
        }));

      } else {
        // 2️⃣ Try Wikipedia API summary next
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(promptCopy)}`);

        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const wikiResponse = {
            role: "assistant",
            content: `**${wikiData.title}**\n\n${wikiData.extract}`,
            timestamp: Date.now(),
          };

          setMessages(prev => [...prev, wikiResponse]);
          setChats(prevChats => prevChats.map(chat =>
            chat._id === selectedChat._id
              ? { ...chat, messages: [...(chat.messages || []), wikiResponse] }
              : chat
          ));
          setSelectedChat(prev => ({
            ...prev,
            messages: [...(prev?.messages || []), wikiResponse],
          }));
        } else {
          // 3️⃣ Fallback to DeepSeek AI via your backend
          const { data } = await axios.post('/api/chat/ai', {
            chatId: selectedChat._id,
            prompt: promptCopy
          });

          if (data.success && data.data) {
            setMessages(prev => [...prev, data.data]);
            setChats(prevChats => prevChats.map(chat =>
              chat._id === selectedChat._id
                ? { ...chat, messages: [...(chat.messages || []), data.data] }
                : chat
            ));
            setSelectedChat(prev => ({
              ...prev,
              messages: [...(prev?.messages || []), data.data],
            }));
          } else {
            toast.error(data.message || "AI did not return a valid response");
            setPrompt(promptCopy);
          }
        }
      }

    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Unexpected error");
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={sendPrompt} className={`w-full ${selectedChat?.messages?.length > 0 ? "max-w-3xl" : "max-w-2xl"} bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}>
      <textarea
        onKeyDown={handleKeyDown}
        className='outline-none w-full resize-none overflow-hidden break-words bg-transparent'
        rows={2}
        placeholder='Message DeepSeek'
        required
        onChange={(e) => setPrompt(e.target.value)}
        value={prompt}
      />
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
            <Image className='h-5' src={assets.deepthink_icon} alt='' />
            DeepThink (R1)
          </p>
          <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
            <Image className='h-5' src={assets.search_icon} alt='' />
            Search
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Image className='w-4 cursor-pointer' src={assets.pin_icon} alt='' />
          <button type="submit" className={`${prompt ? "bg-primary" : "bg-[#71717a]"} rounded-full p-2 cursor-pointer`}>
            <Image className='w-3.5 aspect-square' src={prompt ? assets.arrow_icon : assets.arrow_icon_dull} alt='' />
          </button>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;
