// routers/subscriptionRouter.ts
import { Router } from "express";
import SubscriptionController from "../controllers/subscriptionController";

const router = Router();

router.post("/", SubscriptionController.crear);
router.get("/user/:userId", SubscriptionController.obtenerPorUsuario);
router.patch("/:id/renew", SubscriptionController.renovar);
router.patch("/:id/cancel", SubscriptionController.cancelar);
router.get("/:id/status", SubscriptionController.estado);
router.get("/user/:userId/validate", SubscriptionController.validar);

export default router;