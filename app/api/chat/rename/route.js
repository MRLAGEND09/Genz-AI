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

        const { chatId, name } = await req.json();

        // Connect to the database and update the chat name
        await connectDB();
        await Chat.findOneAndUpdate({ _id: chatId, userId }, { name });

        return NextResponse.json({ success: true, message: "Chat renamed" });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Error renaming chat", error: error.message });
    }
}