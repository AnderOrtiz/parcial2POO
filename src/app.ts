import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import subscriptionRouter from "./routers/subscriptionRouter";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "API Biblioteca funcionando 🚀"
    });
});

app.use("/user", subscriptionRouter);


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Error:", err.message);

    res.status(500).json({
        message: "Error interno del servidor"
    });
});

app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: "Ruta no encontrada"
    });
});

const PORT = process.env.BACKEND_PORT;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});