import Image from 'next/image'
import React from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '@/context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const ChatLabel = ({ openMenu, setOpenMenu, id, name }) => {
  const { fetchUserChats, chats, setSelectedChat } = useAppContext()

  const selectChat = () => {
    const chatData = chats.find(chat => chat._id === id)
    setSelectedChat(chatData)
    console.log('Selected chat:', chatData)
  }

  const renameHandler = async () => {
    try {
      const newName = prompt('Enter new chat name:')?.trim()
      if (!newName) return
      const { data } = await axios.post('/api/chat/rename', { chatId: id, name: newName })
      if (data.success) {
        toast.success(data.message)
        fetchUserChats()
        setOpenMenu({ id: 0, open: false })
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.message || 'Something went wrong.')
    }
  }

  const deleteHandler = async () => {
    try {
      const confirmDelete = confirm('Are you sure you want to delete this chat?')
      if (!confirmDelete) return
      const { data } = await axios.post('/api/chat/delete', { chatId: id })
      if (data.success) {
        toast.success(data.message)
        fetchUserChats()
        setOpenMenu({ id: 0, open: false })
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.message || 'Something went wrong.')
    }
  }

  const showMenu = openMenu.id === id && openMenu.open

  return (
    <div
      onClick={selectChat}
      className="flex items-center justify-between p-2 text-white/80 hover:bg-white/10 rounded-lg text-sm group cursor-pointer"
    >
      <p className="group-hover:max-w-5/6 truncate">{name}</p>
      <div
        onClick={e => {
          e.stopPropagation()
          setOpenMenu({ id, open: !openMenu.open })
        }}
        className="group relative flex items-center justify-center h-6 w-6 aspect-square hover:bg-black/80 rounded-lg"
      >
        <Image
          src={assets.three_dots}
          alt="Menu"
          className={`w-4 ${showMenu ? '' : 'hidden'} group-hover:block`}
        />

        <div
          className={`absolute ${
            showMenu ? 'block' : 'hidden'
          } -right-36 top-6 bg-gray-700 rounded-xl w-max p-2 z-10`}
        >
          <div
            onClick={renameHandler}
            className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
          >
            <Image src={assets.pencil_icon} alt="Rename chat" className="w-4" />
            <p>Rename</p>
          </div>
          <div
            onClick={deleteHandler}
            className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
          >
            <Image src={assets.delete_icon} alt="Delete chat" className="w-4" />
            <p>Delete</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatLabel
