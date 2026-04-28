// models/Subscription.ts
class Subscription {
    constructor(
        private name: string,
        private lastname: string,
        private startDate: Date,
        private endDate: Date,
        private daysRemaining: number,
        private status: string = "active"
    ) {}

    public getData() {
        return {
            name: this.name,
            lastname: this.lastname,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status,
            daysRemaining: this.daysRemaining
        };
    }
}

export default Subscription;