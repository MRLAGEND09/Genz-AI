import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";

async function callAI(messages) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat:free",
      messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "AI API error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message;
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    const { chatId, prompt } = await req.json();
    if (!chatId || !prompt) {
      return NextResponse.json({ success: false, message: "Missing required fields" });
    }

    await connectDB();

    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) {
      return NextResponse.json({ success: false, message: "Chat not found" });
    }

    // Push user message
    const userPrompt = { role: "user", content: prompt, timestamp: Date.now() };
    chat.messages.push(userPrompt);

    // Auto rename chat if "New Chat"
    if (chat.name === "New Chat" && chat.messages.length === 1) {
      chat.name = prompt.slice(0, 30) + (prompt.length > 30 ? "..." : "");
    }

    // Prepare messages for AI call - full conversation so far
    const messagesForAI = chat.messages.map(m => ({ role: m.role, content: m.content }));

    // Step 1: Get main AI response
    const mainAIResponse = await callAI(messagesForAI);

    if (!mainAIResponse) {
      return NextResponse.json({ success: false, message: "No AI response" });
    }

    mainAIResponse.timestamp = Date.now();
    chat.messages.push(mainAIResponse);

    // Step 2: Prepare follow-up prompt for AI
    const followUpPrompt = [
      { role: "system", content: "You are a helpful assistant that suggests friendly and engaging follow-up questions or suggestions based on the conversation." },
      ...messagesForAI,
      mainAIResponse,
      { role: "user", content: "Please provide a friendly follow-up question or suggestion to keep the conversation going." }
    ];

    const followUpAIResponse = await callAI(followUpPrompt);

    if (followUpAIResponse) {
      followUpAIResponse.timestamp = Date.now();
      chat.messages.push(followUpAIResponse);
    }

    await chat.save();

    return NextResponse.json({
      success: true,
      message: "Chat updated",
      data: mainAIResponse,
      followUp: followUpAIResponse || null,
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
