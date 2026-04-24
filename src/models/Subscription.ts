// models/Subscription.ts
class Subscription {
    constructor(
        private userId: string,
        private plan: string,
        private startDate: Date,
        private endDate: Date,
        private status: string = "active"
    ) {}

    public getData() {
        return {
            userId: this.userId,
            plan: this.plan,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status
        };
    }
}

export default Subscription;