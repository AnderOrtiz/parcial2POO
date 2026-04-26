import type { Request, Response } from "express";
import DataBase from "../config/database";
import Subscription from "../models/Subscription";
import { ObjectId } from "mongodb";

class SubscriptionController {

    public async crear(req: Request, res: Response) {
        const { userId, plan } = req.body;

        const db = (await DataBase.getInstance()).getDb();

        const existing = await db.collection("subscriptions").findOne({ userId });
        if (existing) {
            return res.status(409).json({ mensaje: "El usuario ya tiene una suscripción" });
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);
        const daysRemaining = 30;

        const subscription = new Subscription(userId, plan, startDate, endDate, daysRemaining);

        await db.collection("subscriptions").insertOne(subscription.getData());

        res.json({ mensaje: "Suscripción creada" });
    }

    public async obtenerPorUsuario(req: Request, res: Response) {
        const { userId } = req.params;

        const db = (await DataBase.getInstance()).getDb();

        const sub = await db.collection("subscriptions").findOne({ userId: Number(userId) });

        if (!sub) {
            return res.status(404).json({ mensaje: "No tiene suscripción" });
        }

        res.json(sub);
    }

    public async renovar(req: Request, res: Response) {
        const { id } = req.params;

        const db = (await DataBase.getInstance()).getDb();

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const sub = await db.collection("subscriptions").findOne({ _id: new ObjectId(id) });

        if (!sub) {
            return res.status(404).json({ mensaje: "No encontrada" });
        }

        const now = new Date();
        const isStillActive = sub.status === "active" && sub.endDate > now;

        if (isStillActive) {
            return res.status(409).json({ mensaje: "La suscripción ya está activa y vigente" });
        }

        const wasInactive = sub.status === "inactive";
        const daysToRestore: number = wasInactive
            ? (sub.daysRemainingBeforeCancel ?? 30)
            : 30;

        const newEndDate = new Date(now);
        newEndDate.setDate(newEndDate.getDate() + daysToRestore);

        await db.collection("subscriptions").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    endDate: newEndDate,
                    status: "active",
                    daysRemaining: daysToRestore,
                    daysRemainingBeforeCancel: 0
                }
            }
        );

        res.json({ mensaje: "Suscripción renovada" });
    }

    public async cancelar(req: Request, res: Response) {
        const { id } = req.params;

        const db = (await DataBase.getInstance()).getDb();

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const sub = await db.collection("subscriptions").findOne({ _id: new ObjectId(id) });

        if (!sub) {
            return res.status(404).json({ mensaje: "No encontrada" });
        }

        if (sub.status === "inactive") {
            return res.status(409).json({ mensaje: "La suscripción ya está cancelada" });
        }

        const realDaysRemaining = Math.max(0, Math.ceil(
            (new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ));

        await db.collection("subscriptions").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: "inactive",
                    daysRemainingBeforeCancel: realDaysRemaining,
                    daysRemaining: 0
                }
            }
        );

        res.json({ mensaje: "Suscripción cancelada" });
    }

    public async estado(req: Request, res: Response) {
        const { id } = req.params;

        const db = (await DataBase.getInstance()).getDb();

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const sub = await db.collection("subscriptions").findOne({ _id: new ObjectId(id) });

        if (!sub) {
            return res.status(404).json({ mensaje: "No encontrada" });
        }

        const now = new Date();
        const isActive = sub.endDate > now && sub.status === "active";

        const daysRemaining = Math.ceil(
            (new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        res.json({
            isActive,
            expiresAt: sub.endDate,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0
        });
    }

    public async validar(req: Request, res: Response) {
        const { userId } = req.params;

        const db = (await DataBase.getInstance()).getDb();

        const sub: any = await db.collection("subscriptions").findOne({ userId });

        if (!sub) {
            return res.json({ hasAccess: false });
        }

        const hasAccess = sub.status === "active" && new Date(sub.endDate) > new Date();

        res.json({ hasAccess });
    }
}

export default new SubscriptionController();