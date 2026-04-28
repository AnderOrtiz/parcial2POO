import cron from "node-cron";
import DataBase from "../config/database";

export function startJobs() {
    // cron.schedule("0 * * * *", async () => {
    cron.schedule("*/10 * * * * *", async () => {
        console.log("Job: verificando suscripciones expiradas...");

        try {
            const db = (await DataBase.getInstance()).getDb();
            const now = new Date();


            const result = await db.collection("users").updateMany(
                {
                    status: "active",
                    endDate: { $lt: new Date() }
                },
                {
                    $set: {
                        status: "expired",
                        daysRemaining: 0
                    }
                }
            );

            const activas = await db.collection("users")
                .find({ status: "active" })
                .toArray();

            for (const subscription of activas) {
                const dias = Math.max(0, Math.ceil(
                    (new Date(subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                ));

                await db.collection("users").updateOne(
                    { _id: subscription._id },
                    { $set: { daysRemaining: dias } }
                );
                console.log(`  → ${subscription.name} ${subscription.lastname}: ${dias} días restantes`);
            }

            console.log(`Job completado: ${activas.length} suscripciones actualizaron sus días restantes.`);
            console.log(`Job completado: ${result.modifiedCount} suscripciones expiradas.`);
            console.log(`Job completado: ${now}`);

        } catch (error) {
            console.error("Error en job de expiración:", error);
        }
    });
}