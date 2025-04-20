
// Using Realm Web SDK
import * as Realm from 'realm-web';
import { Chat } from '../types';

// MongoDB Atlas App connection settings
const APP_ID = import.meta.env.VITE_MONGODB_APP_ID || 'your-app-id';
const DB_NAME = 'chatapp';
const COLLECTION_NAME = 'chats';

// Singleton pattern for MongoDB client
class MongoDBService {
  private static instance: MongoDBService;
  private app: Realm.App | null = null;
  private mongodb: any = null;
  private collection: any = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Initialize the Realm app
      this.app = new Realm.App({ id: APP_ID });
      
      // Authenticate anonymously
      const user = await this.app.logIn(Realm.Credentials.anonymous());
      
      // Get a MongoDB service client with authenticated user
      this.mongodb = user.mongoClient("mongodb-atlas");
      
      // Get a reference to the database and collection
      const db = this.mongodb.db(DB_NAME);
      this.collection = db.collection(COLLECTION_NAME);
      
      this.initialized = true;
      console.log("MongoDB connection initialized using Realm Web SDK");
      return true;
    } catch (err) {
      console.error("Error initializing MongoDB:", err);
      return false;
    }
  }

  async saveChat(chat: Chat): Promise<boolean> {
    if (!this.initialized && !(await this.initialize())) {
      return false;
    }

    try {
      // Convert to a format suitable for MongoDB
      const chatToSave = {
        ...chat,
        _id: chat.id // Use chat.id as MongoDB _id
      };

      // Insert or update the chat
      const result = await this.collection.updateOne(
        { _id: chat.id },
        { $set: chatToSave },
        { upsert: true }
      );

      return result.modifiedCount > 0 || result.upsertedCount > 0;
    } catch (err) {
      console.error("Error saving chat to MongoDB:", err);
      return false;
    }
  }

  async getChats(): Promise<Chat[]> {
    if (!this.initialized && !(await this.initialize())) {
      return [];
    }

    try {
      const docs = await this.collection.find({}).toArray();
      return docs.map((doc: any) => {
        const { _id, ...rest } = doc;
        return { id: _id, ...rest } as Chat;
      });
    } catch (err) {
      console.error("Error fetching chats from MongoDB:", err);
      return [];
    }
  }

  async deleteChat(chatId: string): Promise<boolean> {
    if (!this.initialized && !(await this.initialize())) {
      return false;
    }

    try {
      const result = await this.collection.deleteOne({ _id: chatId });
      return result.deletedCount > 0;
    } catch (err) {
      console.error("Error deleting chat from MongoDB:", err);
      return false;
    }
  }
}

export default MongoDBService.getInstance();
