import { Router } from "express";
import SubscriptionController from "../controllers/subscriptionController";

const router = Router();

router.post("/", SubscriptionController.crear);
router.patch("/:id/renew", SubscriptionController.renovar);
router.patch("/:id/cancel", SubscriptionController.cancelar);
router.get("/:id/status", SubscriptionController.estado);
router.get("/search", SubscriptionController.buscar);
router.delete("/:id", SubscriptionController.eliminar);

export default router;