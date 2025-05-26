import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import Chat from "../../../../models/Chat";
import connectDB from "../../../../config/db";

export async function GET(req) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" });
        }

        // Connect to the database and fetch the chats for the user
        await connectDB();
        const data = await Chat.find({ userId });

        return NextResponse.json({ success: true, message: "Chats fetched", data });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Error fetching chats", error: error.message });
    }
}