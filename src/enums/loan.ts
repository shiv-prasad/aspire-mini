export enum LoanTermType {
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
}

export enum LoanStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PAID = "PAID",
}

export enum LoanActivityType {
    REQUEST_CREATED = "REQUEST_CREATED",
    LOAN_APPROVED = "LOAN_APPROVED",
    LOAN_REJECTED = "LOAN_REJECTED",
    REPAYMENT_DONE = "REPAYMENT_DONE",
    LOAN_CLOSED = "LOAN_CLOSED",
}

export enum RepaymentScheduleStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PAID = "PAID",
    DEFAULTED = "DEFAULTED",
}

export enum RepaymentActivityType {
    SCHEDULE_CREATED = "SCHEDULE_CREATED",
    PAYMENT_MADE = "PAYMENT_MADE",
    SCHEDULE_UPDATED = "SCHEDULE_UPDATED",
    DEFAULTED = "DEFAULTED",
}