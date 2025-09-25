# Copilot Instructions for wholesalenaija-backend

## Project Overview
- This is a Node.js/Express backend for Wholesalenaija, a marketplace platform.
- Main entry: `server.js`. All API routes are under `/api/*`.
- MongoDB is used for persistence. Models are in `src/models/`.
- Key business logic is in `src/controllers/` and `src/services/`.
- API documentation is auto-generated via Swagger (`/docs` route) using JSDoc comments in `src/routes/*`.

## Directory Structure
- `src/routes/`: API route definitions (auth, wallet, admin)
- `src/controllers/`: Route handlers and business logic
- `src/models/`: Mongoose schemas (User, Wallet, Transaction, etc.)
- `src/services/`: Integrations (Firebase, mail, SMS, etc.)
- `src/config/coins.js`: Default business constants (signup bonus, coin value, unlock cost)
- `scripts/seedSettings.js`: Script to seed default settings in DB

## Key Patterns & Conventions
- **Settings**: Dynamic business values (e.g., signup bonus) are stored in the `Setting` model and can be seeded or updated via admin endpoints or scripts.
- **Wallet & Transactions**: Users have a Wallet. All coin movements are tracked in `Transaction` with a `reason` field (e.g., SIGNUP_BONUS, COIN_PURCHASE).
- **Authentication**: JWT-based, with tokens set as HTTP-only cookies. Middleware in `src/middlewares/authMiddleware.js` protects routes.
- **Swagger Docs**: Annotate routes with `@openapi` JSDoc for auto-generated docs. See `src/routes/auth.js` for examples.
- **Environment**: Use `.env` for secrets and DB URIs. See `.env.example` for required variables.

## Developer Workflows
- **Start server (dev)**: `npm run dev` (uses nodemon)
- **Start server (prod)**: `npm start`
- **Seed settings**: `node scripts/seedSettings.js`
- **API docs**: Visit `/docs` in browser for live Swagger UI

## Integration Points
- **External services**: Firebase (OTP), Twilio, Termii, Cloudinary, Nodemailer
- **Admin endpoints**: `/api/admin/settings` and `/api/admin/seed-defaults` for managing business settings

## Examples
- To add a new transaction reason, update the `reason` enum in `src/models/Transaction.js` and handle logic in `walletController.js`.
- To change signup bonus, update `src/config/coins.js` and re-seed settings.
- To protect a route, use the `protect` middleware from `src/middlewares/authMiddleware.js`.

## Tips for AI Agents
- Always check for business logic in controllers before making model changes.
- Use the Setting model for any value that may change without code deploys.
- Follow Swagger annotation style for new routes.
- Reference `src/routes/auth.js` for best-practice route structure and docs.

---
If any section is unclear or missing, please ask for clarification or provide feedback to improve these instructions.
