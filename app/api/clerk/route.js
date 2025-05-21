import { Webhook } from "svix";
import connectDB from "../../../config/db";
import User from "../../../models/User";
import { headers } from "next/headers";
import {NextResponse } from "next/server";


export async function POST(req){
    const wh = new Webhook(process.env.SIGNING_SECRET)
    const haderPayLoad = await headers()
    const svixHeaders = {
        "svix-id": haderPayLoad.get("svix-id"),
        "svix-signature": haderPayLoad.get("svix-signature"), 
    };

    // Get  the payload and verify it

    const payload = await req.json();
    const body = JSON.stringify(payload);
    const {data, type} = wh.verify(body, svixHeaders);


    // Prepare the user data to be saved in the datadase

    const userData = {
        _id: data.id,
        name: `{${data.first_name} ${data.last_name}}`,
        email: data.email_address[0].email_address,
        image: data.image_url,
    };

    await connectDB();

    switch (type) {
        case 'user.created':
            await User.create(userData);
            break;
    case 'user.updated':
            await User.findByIdAndUpdate(data.id, userData);
            break;
    case 'user.deleted':
            await User.findByIdAndDelete(data.id);
            break;
        default:
            break;
    }

    return NextResponse.json({message: "Event received successfully"});
}