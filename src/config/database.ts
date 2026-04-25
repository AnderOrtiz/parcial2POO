// config/database.ts
import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

class DataBase {
    private static instance: DataBase;
    private client: MongoClient;
    private db!: Db;

    private constructor() {
        this.client = new MongoClient(`mongodb://${process.env.MONGO_USERNAME!}:${process.env.MONGO_PASSWORD}@localhost:${process.env.MONGO_DB_PORT}`
        );
    }

    public static async getInstance(): Promise<DataBase> {
        if (!DataBase.instance) {
            const instance = new DataBase();
            await instance.connect();
            DataBase.instance = instance;
        }
        return DataBase.instance;
    }

    private async connect() {
        await this.client.connect();
        this.db = this.client.db(process.env.MONGO_DB_NAME);
        console.log("MongoDB conectado");
    }

    public getDb(): Db {
        return this.db;
    }
}

export default DataBase;