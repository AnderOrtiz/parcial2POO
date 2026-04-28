import type { Request, Response } from "express";
import DataBase from "../config/database";
import Subscription from "../models/Subscription";
import { ObjectId } from "mongodb";

class SubscriptionController {

    public async crear(req: Request, res: Response) {
        const { name, lastname } = req.body;

        const db = (await DataBase.getInstance()).getDb();

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);
        const daysRemaining = 30;

        const subscription = new Subscription(name, lastname, startDate, endDate, daysRemaining);
        await db.collection("users").insertOne(subscription.getData());

        res.json({ mensaje: "Suscripción creada" });
    }

    public async renovar(req: Request, res: Response) {
        const { id } = req.params;

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const db = (await DataBase.getInstance()).getDb();

        const sub = await db.collection("users").findOne({ _id: new ObjectId(id as string) });

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

        await db.collection("users").updateOne(
            { _id: new ObjectId(id as string) },
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

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const db = (await DataBase.getInstance()).getDb();

        const sub = await db.collection("users").findOne({ _id: new ObjectId(id as string) });

        if (!sub) {
            return res.status(404).json({ mensaje: "No encontrada" });
        }

        if (sub.status === "inactive") {
            return res.status(409).json({ mensaje: "La suscripción ya está cancelada" });
        }

        const realDaysRemaining = Math.max(0, Math.ceil(
            (new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ));

        await db.collection("users").updateOne(
            { _id: new ObjectId(id as string) },
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

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const db = (await DataBase.getInstance()).getDb();

        const sub = await db.collection("users").findOne({ _id: new ObjectId(id as string) });

        if (!sub) {
            return res.status(404).json({ mensaje: "No encontrada" });
        }

        const now = new Date();

        const isActive = sub.status === "active" && new Date(sub.endDate) > now;

        let daysRemaining = 0;

        if (sub.status === "active") {
            daysRemaining = Math.ceil(
                (new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
        }

        res.json({
            isActive,
            expiresAt: sub.endDate,
            daysRemaining
        });
    }


    public async buscar(req: Request, res: Response) {
        const { name, lastname } = req.query;

        if (!name && !lastname) {
            return res.status(400).json({ mensaje: "Debe proporcionar name o lastname como parámetro de búsqueda" });
        }

        const db = (await DataBase.getInstance()).getDb();

        const query: Record<string, any> = {};
        if (name) query.name = { $regex: name as string, $options: "i" };
        if (lastname) query.lastname = { $regex: lastname as string, $options: "i" };

        const results = await db.collection("users").find(query).toArray();

        if (results.length === 0) {
            return res.status(404).json({ mensaje: "No se encontraron usuarios" });
        }

        res.json(results);
    }


    public async eliminar(req: Request, res: Response) {
        const { id } = req.params;

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ mensaje: "ID inválido" });
        }

        const db = (await DataBase.getInstance()).getDb();

        const result = await db.collection("users").deleteOne({
            _id: new ObjectId(id as string)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        res.json({ mensaje: "Usuario eliminado correctamente" });
    }
}

export default new SubscriptionController();