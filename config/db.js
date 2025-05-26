import mongoose from 'mongoose';

let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

export default async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URI)
            .then((mongoose) => mongoose)
            .catch((error) => {
                console.error("MongoDB connection error:", error);
                throw error;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}