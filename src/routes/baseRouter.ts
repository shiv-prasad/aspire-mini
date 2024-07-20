import { Router } from "express";

export abstract class BaseRouter {
    readonly app: string;

    constructor(app: string) {
        this.app = app;
    }

    abstract getRoutes(): Router;
}