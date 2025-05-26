import { getAuth } from "@clerk/nextjs/server";
import connectDB from "../../../../config/db";
import Chat from "../../../../models/Chat";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    const { chatId, prompt } = await req.json();

    await connectDB();

    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) {
      return NextResponse.json({ success: false, message: "Chat not found" });
    }

    const userPrompt = { role: "user", content: prompt, timestamp: Date.now() };
    chat.messages.push(userPrompt);

    // Call DeepSeek API (OpenRouter)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("DeepSeek API error:", errorData);
      return NextResponse.json({
        success: false,
        message: "AI response failed",
        error: errorData.error || "Unknown error",
      });
    }

    const completion = await response.json();
    const message = completion.choices?.[0]?.message;

    if (!message) {
      return NextResponse.json({
        success: false,
        message: "No AI message returned",
      });
    }

    message.timestamp = Date.now();
    chat.messages.push(message);

    await chat.save();

    return NextResponse.json({
      success: true,
      message: "Chat updated",
      data: message,
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({
      success: false,
      message: "Error updating chat",
      error: error.message,
    });
  }
}
