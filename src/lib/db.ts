import mongoose from "mongoose";
import { env } from "./env";

/**
 * Cached Mongoose connection. Next.js re-evaluates modules in dev and Vercel
 * reuses warm lambdas, so the promise is stored on `globalThis`.
 */
declare global {
  var __fabricnestMongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = globalThis.__fabricnestMongoose ?? (globalThis.__fabricnestMongoose = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    cached.promise = mongoose
      .connect(env.mongodbUri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

export const toId = (id: string) => new mongoose.Types.ObjectId(id);
export const isValidId = (id: unknown): id is string => typeof id === "string" && mongoose.isValidObjectId(id);
