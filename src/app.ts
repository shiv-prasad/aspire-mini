import express from 'express';
import httpContext from "express-http-context";
import bodyParser from 'body-parser';
import { AdminRouter } from './routes/admin';
import UserDB from './utils/dbUtils/userDbUtil';
import CustomerService from './services/customer';
import { ActivityController, AdminController, CustomerController, JobsController, LoanController } from './controllers';
import { handleError } from './utils/errorHandler';
import LoanDB from './utils/dbUtils/loanDbUtil';
import LoanService from './services/loan';
import { CustomerRouter } from './routes/customer';
import { LoanRouter } from './routes/loan';
import UserService from './services/user';
import UserAuthorizationMiddleware from './middlewares/user';
import CustomerMiddleware from './middlewares/customer';
import AdminMiddleware from './middlewares/admin';
import LoanMiddleware from './middlewares/loan';
import { ActivityRouter } from './routes/activity';
import { JobsRouter } from './routes/jobs';

// Utils
const userDb = new UserDB();
const loanDb = new LoanDB();

// Services
const loanService = new LoanService(loanDb);
const customerService = new CustomerService(userDb);
const userService = new UserService(userDb);

// Middleware
const userMiddleware = new UserAuthorizationMiddleware(userService);
const customerMiddleware = new CustomerMiddleware(userService);
const adminMiddleware = new AdminMiddleware(userService);
const loanMiddleware = new LoanMiddleware(loanService);

// Controllers
const adminController = new AdminController(
    customerService, 
    loanService,
);
const customerController = new CustomerController(customerService, loanService);
const loanController = new LoanController(loanService);
const activityController = new ActivityController(loanService);
const jobsController = new JobsController(loanService);

const app = express();
app.use(bodyParser.json());

app.use(httpContext.middleware);
app.use(express.json());

// Routes
const adminRoutes = new AdminRouter("admin", userMiddleware, adminMiddleware, adminController);
const customerRoutes = new CustomerRouter("customer", userMiddleware, customerMiddleware, customerController);
const loanRoutes = new LoanRouter("loans",  userMiddleware, loanMiddleware, loanController);
const activityRoutes = new ActivityRouter("activity", userMiddleware, loanMiddleware, activityController);
const jobsRoutes = new JobsRouter("jobs", userMiddleware, adminMiddleware, jobsController);

// app.use("/jobs", jobRoutes)
app.use(customerRoutes.getRoutes())
app.use(adminRoutes.getRoutes())
app.use(loanRoutes.getRoutes())
app.use(activityRoutes.getRoutes())
app.use(jobsRoutes.getRoutes())
app.use(handleError);

export default app;