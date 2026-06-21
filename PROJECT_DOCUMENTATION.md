# Money Transfer Frontend Project Documentation

## 1. Executive Summary

This project is an Angular single-page application for a money transfer system. It provides a browser-based front end where users can:

- Create a new account.
- Sign in with a username and password.
- View account balance and reward points.
- Transfer money to another account.
- Optionally redeem reward points during a transfer.
- View transaction history.
- View reward point history.
- Log out.

The application is implemented as a standalone Angular application and communicates with a backend REST API running locally at `http://localhost:8080/api/v1`.

## 2. Technology Stack

| Area | Technology |
| --- | --- |
| Framework | Angular |
| Angular package version | `^17.3.0` |
| Language | TypeScript |
| UI templates | Angular HTML templates |
| Styling | Component CSS plus global CSS reset |
| Forms | Template-driven forms through `FormsModule` |
| HTTP | Angular `HttpClient` |
| Routing | Angular Router |
| Authentication transport | Basic Authentication header |
| Auth persistence | Browser `localStorage` |
| Unit test runner | Karma and Jasmine |

The project uses Angular standalone components rather than NgModules. Application providers are registered in `src/app/app.config.ts`.

## 3. Project Structure

```text
.
|-- angular.json
|-- package.json
|-- package-lock.json
|-- README.md
|-- tsconfig.json
|-- tsconfig.app.json
|-- tsconfig.spec.json
|-- public/
|   `-- favicon.ico
`-- src/
    |-- index.html
    |-- main.ts
    |-- styles.css
    `-- app/
        |-- app.component.ts
        |-- app.component.html
        |-- app.component.css
        |-- app.component.spec.ts
        |-- app.config.ts
        |-- app.routes.ts
        |-- models/
        |   `-- models.ts
        |-- guards/
        |   `-- auth.guard.ts
        |-- interceptors/
        |   `-- auth.interceptor.ts
        |-- services/
        |   |-- account.service.ts
        |   |-- auth.service.ts
        |   |-- reward.service.ts
        |   `-- transfer.service.ts
        `-- components/
            |-- create-account/
            |-- dashboard/
            |-- history/
            |-- login/
            |-- navbar/
            |-- rewards/
            `-- transfer/
```

## 4. Application Bootstrap

The entry point is `src/main.ts`.

It bootstraps `AppComponent` with providers from `appConfig`:

- Router configuration from `app.routes.ts`.
- HTTP client support.
- A functional HTTP interceptor for authentication.
- Angular zone change detection with event coalescing.

`AppComponent` is the shell of the application. Its inline template contains only:

```html
<router-outlet></router-outlet>
```

This means the active routed page is rendered directly at the root of the app.

## 5. Routing

Routes are defined in `src/app/app.routes.ts`.

| Route | Component | Protected | Purpose |
| --- | --- | --- | --- |
| `/` | Redirects to `/login` | No | Default entry redirect |
| `/login` | `LoginComponent` | No | User sign-in |
| `/create-account` | `CreateAccountComponent` | No | New account registration |
| `/dashboard` | `DashboardComponent` | Yes | Account summary and quick actions |
| `/transfer` | `TransferComponent` | Yes | Send money |
| `/history` | `HistoryComponent` | Yes | View transaction history |
| `/rewards` | `RewardsComponent` | Yes | View reward points and reward history |
| `**` | Redirects to `/login` | No | Fallback for unknown paths |

Protected routes use `authGuard`.

## 6. Authentication Flow

Authentication is managed by `AuthService`.

### Login

The user enters a username and password on the login screen. `AuthService.login()` sends:

```http
POST http://localhost:8080/api/v1/accounts/login
```

with a `LoginRequest` payload:

```ts
{
  username: string;
  password: string;
}
```

If the backend returns an `Account`, the service stores two values in `localStorage`:

- `currentAccount`: serialized account object.
- `credentials`: Base64-encoded `username:password` string.

The stored credentials are later used by the HTTP interceptor to set the Basic Auth header.

### Route Protection

`authGuard` checks whether `AuthService.isAuthenticated()` is true. That method currently returns true when `currentAccount` exists in `localStorage`.

If no account is stored, the guard redirects the user to `/login`.

### Authenticated Requests

`auth.interceptor.ts` adds:

```http
Authorization: Basic <credentials>
```

to most outgoing API requests when credentials exist in `localStorage`.

The interceptor intentionally skips:

- Login requests.
- Account creation requests using `POST /accounts`.

### Logout

Logout removes both `currentAccount` and `credentials` from `localStorage`, resets the in-memory account subject, and navigates back to `/login`.

## 7. Backend API Contract

The frontend expects a backend service at:

```text
http://localhost:8080/api/v1
```

### Account API

Implemented in `AccountService`.

| Method | URL | Purpose | Response |
| --- | --- | --- | --- |
| `POST` | `/accounts` | Create account | `Account` |
| `GET` | `/accounts/{id}` | Fetch account details | `Account` |
| `GET` | `/accounts/{id}/balance` | Fetch current balance | `{ balance: number }` |
| `GET` | `/accounts/{id}/transactions` | Fetch transactions | `Transaction[]` |

### Auth API

Implemented in `AuthService`.

| Method | URL | Purpose | Response |
| --- | --- | --- | --- |
| `POST` | `/accounts/login` | Login | `Account` |

### Transfer API

Implemented in `TransferService`.

| Method | URL | Purpose | Response |
| --- | --- | --- | --- |
| `POST` | `/transfers` | Execute transfer | `TransferResponse` |

### Rewards API

Implemented in `RewardService`.

| Method | URL | Purpose | Response |
| --- | --- | --- | --- |
| `GET` | `/rewards/{accountId}` | Fetch reward summary and history | `RewardSummary` |

## 8. Data Models

Models are defined in `src/app/models/models.ts`.

### Account

Represents a bank account returned by the backend.

```ts
interface Account {
  id: number;
  accountNumber: string;
  username: string;
  holderName: string;
  balance: number;
  status: string;
}
```

### CreateAccountRequest

Used when registering a new account.

```ts
interface CreateAccountRequest {
  username: string;
  password: string;
  holderName: string;
  initialBalance: number;
}
```

### LoginRequest

Used when signing in.

```ts
interface LoginRequest {
  username: string;
  password: string;
}
```

### TransferRequest

Used when sending money.

```ts
interface TransferRequest {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  idempotencyKey: string;
  redeemRewards: boolean;
}
```

The `idempotencyKey` is generated client-side to help the backend avoid duplicate transfer processing.

### TransferResponse

Represents the transfer result.

```ts
interface TransferResponse {
  transactionId: string;
  status: string;
  message: string;
  debitedFrom: number;
  creditedTo: number;
  amount: number;
}
```

### Transaction

Represents a transaction shown in history.

```ts
interface Transaction {
  id: string;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  status: string;
  createdOn: string;
}
```

### RewardEntry and RewardSummary

Used by the rewards page.

```ts
interface RewardEntry {
  id: number;
  transactionId: string;
  pointsEarned: number;
  createdOn: string;
}

interface RewardSummary {
  accountId: number;
  totalPoints: number;
  history: RewardEntry[];
}
```

## 9. Screen-by-Screen Behavior

### Login Screen

Component: `LoginComponent`

Route: `/login`

Responsibilities:

- Captures username and password.
- Validates that both fields are present.
- Calls `AuthService.login()`.
- Shows a loading state during the request.
- Shows backend error messages when available.
- Navigates to `/dashboard` after successful login.
- Links to the account creation screen.

### Create Account Screen

Component: `CreateAccountComponent`

Route: `/create-account`

Responsibilities:

- Captures username, password, holder name, and optional initial balance.
- Defaults initial balance to `1000`.
- Validates required fields.
- Rejects negative initial balances.
- Calls `AccountService.createAccount()`.
- Shows success or error messages.
- Redirects to `/login` after successful account creation.

### Dashboard Screen

Component: `DashboardComponent`

Route: `/dashboard`

Responsibilities:

- Reads the current account from `AuthService`.
- Calls `AccountService.getBalance()` to display the latest balance.
- Calls `RewardService.getRewardSummary()` to display total reward points.
- Shows account holder name, account number, username, balance, account status, and reward total.
- Provides quick links to transfer, history, and rewards.
- Includes the shared navigation bar.

### Transfer Screen

Component: `TransferComponent`

Route: `/transfer`

Responsibilities:

- Uses the current account as the sender.
- Allows the user to enter a recipient account ID.
- Accepts recipient IDs either as plain numeric IDs or values prefixed with `ACC-`.
- Allows the user to enter a transfer amount.
- Loads available reward points.
- Allows reward redemption when points are available and an amount is entered.
- Calculates:
  - Reward value.
  - Net cash debited.
  - Points to deduct.
  - Estimated points earned.
- Prevents self-transfers.
- Prevents transfers when the remaining cash portion exceeds available balance.
- Generates an idempotency key.
- Calls `TransferService.transfer()`.
- Shows success or error messages.
- Redirects to `/dashboard` after a successful transfer.

Reward redemption is represented by the `redeemRewards` boolean in the transfer request. The UI currently treats 1 reward point as 1 rupee of transfer value, while points are earned at 1 point per 100 rupees of net cash transfer.

### Transaction History Screen

Component: `HistoryComponent`

Route: `/history`

Responsibilities:

- Loads all transactions for the current account.
- Determines whether each transaction is a debit or credit from the current account's perspective.
- Displays the other account involved in the transaction.
- Displays transaction date, type, amount, and status.
- For debit transactions, displays a cash-plus-points breakdown when reward redemption metadata is present.

The component extracts redeemed points from a `failureReason` field when that field starts with `REDEEMED_POINTS:`. This field is not currently declared on the `Transaction` interface, so the helper methods use `any`.

### Rewards Screen

Component: `RewardsComponent`

Route: `/rewards`

Responsibilities:

- Loads reward summary for the current account.
- Displays total reward points.
- Displays the reward earning rule: 1 point per 100 rupees transferred.
- Shows reward history entries with date, transaction ID, and points earned.
- Shows an empty state when no rewards exist.
- Links users to the transfer screen from the empty state.

### Navigation Bar

Component: `NavbarComponent`

Used by:

- Dashboard
- Transfer
- History
- Rewards

Responsibilities:

- Displays the brand name `ApexTransfer`.
- Shows navigation links for authenticated users.
- Displays the first letter of the account holder name as an avatar badge.
- Supports a mobile menu toggle.
- Logs the user out and redirects to `/login`.

## 10. Main User Flows

### New User Flow

1. User opens the app and is redirected to `/login`.
2. User clicks the create account link.
3. User enters registration details.
4. Frontend sends `POST /accounts`.
5. On success, user is redirected to `/login`.
6. User signs in.
7. Frontend stores account and credentials in `localStorage`.
8. User lands on the dashboard.

### Returning User Flow

1. User opens `/login`.
2. User signs in.
3. Backend returns account details.
4. Frontend stores account and credentials.
5. User navigates through protected routes.
6. The interceptor attaches Basic Auth credentials to protected API calls.

### Money Transfer Flow

1. User opens `/transfer`.
2. Frontend identifies sender from the stored account.
3. User enters recipient and amount.
4. Frontend optionally applies reward points.
5. Frontend validates the transfer locally.
6. Frontend sends `POST /transfers`.
7. Backend processes the transfer.
8. User sees a success message.
9. User is redirected to the dashboard.

### Rewards Flow

1. User completes transfers.
2. Backend awards points according to its reward logic.
3. Dashboard and rewards page request reward summary.
4. User can view total points and historical reward entries.
5. Transfer page can apply available points as a discount.

## 11. State Management

This application uses lightweight state management:

- `AuthService` stores the current account in a `BehaviorSubject`.
- The same account is persisted in `localStorage`.
- Components usually read the current account through `AuthService.getCurrentAccount()`.
- API data such as balance, transactions, and rewards is fetched directly by each page component.

There is no NgRx, signal store, or centralized application state library.

## 12. Styling and UI Design

Styling is split across:

- `src/styles.css` for global reset and base font.
- Component-specific CSS files for each screen.

The UI is organized around:

- Auth cards for login and registration.
- A dashboard layout with account summary cards.
- A shared top navigation bar.
- Responsive navigation for smaller screens.
- Form-driven transfer workflow.
- Table-like layouts for transaction and reward history.

The app presents itself as a banking or money-transfer product. Visible brand labels include `Transfer`, `ApexTransfer`, and `MTS Bank`.

## 13. Build and Run

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

This runs:

```bash
ng serve
```

The default Angular dev server URL is:

```text
http://localhost:4200/
```

### Production Build

```bash
npm run build
```

This runs:

```bash
ng build
```

Build output is configured for:

```text
dist/frontend
```

### Unit Tests

```bash
npm test
```

This runs:

```bash
ng test
```

using Karma and Jasmine.

## 14. Important Implementation Observations

### The Root HTML Template File Is Not Used

`src/app/app.component.ts` defines an inline template, so `src/app/app.component.html` is not used by the root component. The HTML file still contains Angular starter placeholder markup.

### README Angular Version Does Not Match `package.json`

The README says the project was generated with Angular CLI `18.2.21`, but `package.json` uses Angular `^17.3.0` packages and Angular CLI `^17.3.0`.

### Unit Test Expectations Are Outdated

`app.component.spec.ts` expects the root component title to be `frontend`, but `AppComponent` currently sets:

```ts
title = 'Money Transfer System';
```

The render-title test also expects starter template content that is no longer rendered by the inline root template.

### Asset Configuration May Need Review

`angular.json` refers to:

```text
src/favicon.ico
src/assets
```

The visible project files include:

```text
public/favicon.ico
```

If `src/favicon.ico` and `src/assets` are absent locally, the Angular build configuration may need to be aligned with the actual asset locations.

### Reward Metadata Is Partly Outside the Declared Transaction Model

`HistoryComponent` reads `transaction.failureReason` to infer redeemed reward points, but `failureReason` is not part of the declared `Transaction` interface. If this field is expected from the backend, the model should be extended.

### Authentication Depends on Browser Local Storage

The app stores both account data and Basic Auth credentials in `localStorage`. This is simple and convenient for a local/demo application, but for a production financial application it would need a stronger security model.

## 15. High-Level Architecture

```text
Browser
  |
  | Angular SPA
  |
  |-- Routes
  |   |-- Public: login, create account
  |   `-- Protected: dashboard, transfer, history, rewards
  |
  |-- Components
  |   |-- Collect user input
  |   |-- Render account, transfer, transaction, and reward data
  |   `-- Navigate between pages
  |
  |-- Services
  |   |-- AuthService
  |   |-- AccountService
  |   |-- TransferService
  |   `-- RewardService
  |
  |-- HTTP Interceptor
  |   `-- Adds Basic Auth header
  |
  `-- Backend REST API
      `-- http://localhost:8080/api/v1
```

## 16. Summary

This repository contains the Angular frontend for a money transfer application. Its core responsibility is to provide a user interface for account registration, login, account overview, money transfer, transaction history, and rewards tracking. It relies on a separate backend REST API for persistence, authentication, balance retrieval, transfer execution, transaction history, and reward calculations.

The codebase is compact and organized around Angular standalone components, feature-specific services, a route guard, and an auth interceptor. The main areas to review before production use are credential storage, stale starter files/tests, asset configuration, and alignment between TypeScript interfaces and backend response fields.
