import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Chat from '../../../../models/Chat';
import connectDB from '../../../../config/db';

export async function GET(req) {
  try {
    // Debug log environment variable
    console.log('MongoDB URI:', process.env.MONGODB_URI);

    const { userId } = getAuth(req);
    console.log('User ID:', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated', data: [] },
        { status: 401 }
      );
    }

    await connectDB();

    const chats = await Chat.find({ userId }).sort({ createdAt: -1 });
    console.log('Fetched chats:', chats);

    return NextResponse.json(
      {
        success: true,
        message: chats.length ? 'Chats fetched successfully' : 'No chats found',
        data: chats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(' API Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching chats',
        error: error.message,
        data: [],
      },
      { status: 500 }
    );
  }
}
