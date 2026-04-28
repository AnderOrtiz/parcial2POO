import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import subscriptionRouter from "./routers/subscriptionRouter";

dotenv.config();

const app = express();

// 🔹 Middleware
app.use(express.json());

// 🔹 Ruta base (health check)
app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "API Biblioteca funcionando 🚀"
    });
});

// 🔹 Rutas de suscripciones
app.use("/user", subscriptionRouter);

/**
 * 📌 ENDPOINTS DISPONIBLES:
 * 
 * POST   /subscriptions              → crear suscripción
 * GET    /subscriptions/user/:userId → obtener suscripción por usuario
 * PATCH  /subscriptions/:id/renew    → renovar suscripción
 * PATCH  /subscriptions/:id/cancel   → cancelar suscripción
 * GET    /subscriptions/:id/status   → estado (activa / vencida)
 * GET    /subscriptions/user/:userId/validate → validar acceso
 */

// 🔹 Middleware de manejo de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Error:", err.message);

    res.status(500).json({
        message: "Error interno del servidor"
    });
});

// 🔹 Ruta no encontrada
app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: "Ruta no encontrada"
    });
});

// 🔹 Puerto
const PORT = process.env.BACKEND_PORT;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});