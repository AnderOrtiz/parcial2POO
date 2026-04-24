// controllers/subscriptionController.ts
import type { Request, Response } from "express";
import DataBase from "../config/database";
import Subscription from "../models/Subscription";
import { ObjectId } from "mongodb";

class SubscriptionController {

    // 🆕 Crear suscripción
    public async crear(req: Request, res: Response) {
        const { userId, plan } = req.body;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30); // mensual

        const subscription = new Subscription(
            userId,
            plan,
            startDate,
            endDate
        );

        const db = (await DataBase.getInstance()).getDb();

        await db.collection("subscriptions").insertOne(
            subscription.getData()
        );

        res.json({ mensaje: "Suscripción creada" });
    }

    // 🔍 Obtener por usuario
    public async obtenerPorUsuario(req: Request, res: Response) {
        const { userId } = req.params;

        const db = (await DataBase.getInstance()).getDb();

        const sub = await db.collection("subscriptions").findOne({ userId });

        if (!sub) {
            return res.status(404).json({ mensaje: "No tiene suscripción" });
        }

        res.json(sub);
    }

    // 🔄 Renovar
    public async renovar(req: Request, res: Response) {
        const { id } = req.params;

        const db = (await DataBase.getInstance()).getDb();

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const sub = await db.collection("subscriptions").findOne({
            _id: new ObjectId(id)
        });


        if (!sub) {
            return res.status(404).json({ mensaje: "No encontrada" });
        }

        const now = new Date();
        let newEndDate = new Date();

        if (sub.endDate > now) {
            // aún activa → extender
            newEndDate = new Date(sub.endDate);
        } else {
            // vencida → reiniciar
            newEndDate = now;
        }

        newEndDate.setDate(newEndDate.getDate() + 30);

        await db.collection("subscriptions").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    endDate: newEndDate,
                    status: "active"
                }
            }
        );

        res.json({ mensaje: "Suscripción renovada" });
    }

    // ❌ Cancelar
    public async cancelar(req: Request, res: Response) {
        const db = (await DataBase.getInstance()).getDb();

        const { id } = req.params;

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const sub = await db.collection("subscriptions").findOne({
            _id: new ObjectId(id)
        });

        res.json({ mensaje: "Suscripción cancelada" });
    }

    // 📅 Estado (aquí validas vencimiento)
    public async estado(req: Request, res: Response) {
        const db = (await DataBase.getInstance()).getDb();

        const { id } = req.params;

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const sub = await db.collection("subscriptions").findOne({
            _id: new ObjectId(id)
        });

        if (!sub) {
            return res.status(404).json({ mensaje: "No encontrada" });
        }

        const now = new Date();
        const isActive = sub.endDate > now && sub.status === "active";

        const daysRemaining = Math.ceil(
            (new Date(sub.endDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        res.json({
            isActive,
            expiresAt: sub.endDate,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0
        });
    }

    // 🔐 Validar acceso (clave)
    public async validar(req: Request, res: Response) {
        const { userId } = req.params;

        const db = (await DataBase.getInstance()).getDb();

        const sub: any = await db.collection("subscriptions").findOne({ userId });

        if (!sub) {
            return res.json({ hasAccess: false });
        }

        const hasAccess =
            sub.status === "active" &&
            new Date(sub.endDate) > new Date();

        res.json({ hasAccess });
    }
}

export default new SubscriptionController();