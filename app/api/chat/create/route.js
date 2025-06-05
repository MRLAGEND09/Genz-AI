import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "../../../../config/db";
import Chat from "../../../../models/Chat";

export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" });
        }

        // Prepare the chat data
        const chatData = {
            userId,
            messages: [],
            name: "New Chat",
        };

        // Connect to the database and create a new chat
        await connectDB();
        const chat = await Chat.create(chatData);

        // Return the new chat's ID so frontend can use it
        return NextResponse.json({ success: true, message: "Chat created", chatId: chat._id });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Error creating chat", error: error.message });
    }
}