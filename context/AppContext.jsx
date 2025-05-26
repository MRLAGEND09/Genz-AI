"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = ({ children }) => {
    const { user } = useUser()
    const { getToken } = useAuth()

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    const createNewChat = async () => {
        try {
            if (!user) return null;

            const token = await getToken();

            await axios.post(
                "/api/chat/create",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            fetchUserChats();
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchUserChats = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/chat/get", { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                setChats(data.data)

                // If the user has no chats, create a new one
                if (data.data.length === 0) {
                    await createNewChat();
                    return fetchUserChats();
                } else {
                    // Sort chats by updated date
                    data.data.sort((a, b) => {
                        return new Date(b.updatedAt) - new Date(a.updatedAt);
                    });

                    // Set the most recently updated chat as selected, if available
                    if (data.data[0]) {
                        setSelectedChat(data.data[0]);
                    } else {
                        setSelectedChat(null);
                    }
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (user) {
            fetchUserChats();
        }
    }, [user])

    const value = {
        user,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        createNewChat,
        fetchUserChats
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

// Reminder: In your UI, always use optional chaining like selectedChat?.messages to avoid null errors.