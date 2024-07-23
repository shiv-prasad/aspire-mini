# Mini-Aspire API

## Introduction
The Mini-Aspire API is a RESTful service built using Node.js and TypeScript. It provides endpoints for managing users, loans, and related activities such as loan repayment schedules and activities.

## Features (Required)
- Customer create a loan:
  - Customer submit a loan request defining amount and term
    - example:
      - Request amount of 10.000 $ with term 3 on date 7th Feb 2022, he will generate 3 scheduled repayments:
        - 14th Feb 2022 with amount 3.333,33 $
        - 21st Feb 2022 with amount 3.333,33 $
        - 28th Feb 2022 with amount 3.333,34 $
        - The loan and scheduled repayments will have state PENDING
- Admin approve the loan:
  - Admin change the pending loans to state APPROVED
- Customer can view loan belong to him:
  - Add a policy check to make sure that the customers can view them own loan only.
- Customer add a repayments:
  - Customer add a repayment with amount greater or equal to the scheduled repayment
  - The scheduled repayment change the status to PAID
  - If all the scheduled repayments connected to a loan are PAID automatically also the loan become PAID

## Extra Features
- Customer can fetch his loan summary
  - How many loans user has requested
  - How many of the loans are in pending state (not verified by admin)
  - How many of the loans are approved or rejected by admin
  - Total Loan Amount which a user has requested
  - How much of the loan amount is already paid
  - How much of the loan amount is still pending
- Admins can create Customers
- Admins can view all the customer loan requests
- Admin / Customer Can fetch all the loans along with their Repayment Schedule
  - Customer can only view their loans
  - Admin can view all the loans
- Capturing all the activities taken on the loan and repayment
  - Admin / Customer Can fetch all the activities for a loan they have access of
- Exposed an API for cron job to frequently find all the repayment schedule which are not paid yet and the expected payment date is in past and mark them along with corresponding loan as DEFAULTED

## Tech Stack
- Node.js
- TypeScript
- Sequelize ORM (For database handling)
- SQLlite (Main database)
- Docker (Containerization of Project)

## Prerequisites
- Node.js (>=14.x)
- Docker

## Installation
Clone the repository:
```sh
git clone https://github.com/shiv-prasad/aspire-mini.git
cd aspire-mini
```

## Run the Server
Added a shell script in the root folder `run_server.sh` to start the server
Run this shell script to Start the Server
```sh
bash run_server.sh
```
This will initialize the docker container and start the node server which will run on port 3000.
If you want to change the port, You can change it in `.env` file present in the root folder.

## Running the Unit Test
Added all the tests covering all the API routes with all success as well as failure scenarios inside `tests` folder
Added a shell script in the root folder `test_app.sh`
Run this shell script to Start the Server
```sh
bash test_app.sh
```
This will initialize the docker container for running the test and exits when the tests are run

## Testing the service
For Testing, I have seeded the service by creating few customers / adming inside `src/server.ts` file
- Customers
  - Test User One (username: `testuserone`)
  - Test User Two (username: `testusertwo`)
- Admins
  - Admin User (username: `adminuser`)
  - Cron Admin User (username: `cronuser`)
These users will be created when the server starts

*Note: * I have not added any proper login handling, for authorization, I am just passing user's `username` in each request header to identify the requesting user

*_Step 1_*: Import the Postman API collection present in Root Folder (`Aspire Mini.postman_collection.json`) in your Postman
*_Step 2_*: Test the flows as required

## Testing the extra features
Once you are done with service testing, 
- You can check for activities on loans `(see activity folder in postman collection)`
- Create a new customer
- Get all pending loans for admin
- Run check for late payment jobs `(see jobs folder in postman collection)`

## Project Description
The project has majorly x folders inside `src`
- Util
  - Db Util (LoanDb, UserDb): Handling the database related actions for Loan and Users
- Services
  - Customer Service (Customer Related Service Provider)
    - Exposes method to create a customer
  - Loan Service (Loan Related Service Provider)
    - Fetches Loan Details along with Repayment Schedule and Loan / Repayment Activities
    - Exposed methods to create loan requests, repayment of the loan and marking loans which are not paid as defaulted
  - User Service (User Related Service Provider)
- Controllers: This has all the API controllers for each route which takes care of validating the apis and calling respective services to perform the action
  - Admin Controller (Serves the APIs for admin related actions : Create Customer, Get all Pending Loans, Verify the loan)
  - Customer Controller (Serves the APIs for customer related actions : Get user summary, Request a new Loan, Repay the loan)
  - Loan Controller (Serves the APIs for loan related actions : Get all loans, get loan detail and get loan repayment schedule)
  - Activity Controller (Serves the APIs for loan activity related actions : Get loan / repayment activities)
  - Jobs Controller (Serves the APIs for cron jobs: Check for outstanding loans and mark as defaulted)
- Middlewares
  - User Middleware: Exposes method to verify if a user is authenticated or not. Returns `401 Unauthorized` if user is not authorized
  - Admin Middeleware: Exposes method to verify if a user is admin or not. Returns `401 Unauthorized` if user is not admin for admin related action
  - Customer Middeleware: Exposes method to verify if a user is customer or not. Returns `401 Unauthorized` if user is not customer for customer related actions
  - Loan Middleware: Exposed methods to check if the requesting user can access the loan or not (Admin can access all the loans, where as customer can only access loans assigned to them)
- Routes (Refer Postman Collection)
  - Admin Routes (/admin/) Create Customer, View Pending Loans, Verify Loans (Uses User + Admin Middleware for authorization)
  - Customer Routes (/customer/) Get Customer details, Loan Request and Repay Loans (Uses User + Customer Middleware for authorization)
  - Loans Routes (/loans/) Get All Loans, Get Loan Details, Get Repayment Schedule (Uses User + Loan Middleware for authorization)
  - Activity Routes (/activity/) Get Loan Activity / Repayment Activity (Uses User + Loan Middleware for authorization)
  - Jobs Routes (/jobs/) Check for Late Payments (Uses User + Admin Middleware for authorization)
- Validators
  - Contains validator for Create customer request, repay loan request, new loan request and verify loan request
 
## Project Service Initialization
I have made use of dependency injection pattern for initializing the service. Refer `src/app.ts` for the code
