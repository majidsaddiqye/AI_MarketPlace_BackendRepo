# AI Marketplace Backend with Smart Shopping Assistant

A scalable backend microservices architecture for an **AI-powered marketplace**, featuring an intelligent **AI Buddy** capable of understanding product requirements, searching products, and performing actions like **adding items to cart on behalf of users**.

---

## Overview

This repository contains the backend services for the **AI MarketPlace** platform.
Each service runs independently as a Node.js microservice and communicates via REST, WebSockets, and lightweight asynchronous messaging.

The system is designed to support both **traditional e-commerce workflows** and **AI-assisted user experiences**.

---

## Core AI Highlight — AI Buddy Service

The **AI Buddy** acts as an intelligent shopping assistant:

* Accepts **natural-language product requirements** from users
* Searches products across the marketplace catalog
* Understands user intent and preferences
* Can **add products to the user’s cart on their behalf**
* Communicates with cart, product, and order services securely
* Supports real-time interactions via WebSockets

This enables a **conversational commerce experience**, where users can shop using AI instead of manual browsing.

---

## Microservices

* **authService** — User authentication, JWT issuance, validation, user management
* **productService** — Product CRUD, validation, image handling (ImageKit)
* **cartService** — User cart management
* **orderService** — Order creation, processing, and lifecycle management
* **paymentService** — Payment processing and provider integration hooks
* **notificationService** — Email notifications and event listeners
* **seller-dashboardService** — Seller-specific APIs and aggregated views
* **ai-buddyService** — Autonomous AI assistant with tools, agents, and WebSockets

---

## Features

* JWT-based authentication and authorization
* Product management with validation and image processing
* User-scoped shopping cart operations
* Complete order lifecycle handling
* Payment integration abstraction layer
* Event-driven inter-service communication (broker pattern)
* Email notification service
* Seller dashboard with aggregated insights
* **AI-powered assistant for product discovery and cart actions**

---

## Architecture & Communication

* Each service runs as a **single Node.js process**
* Independent `package.json` and `server.js` per service
* Services communicate using a **broker-based asynchronous pattern**
* Common structure across services:

  * `src/app.js` — Express app setup (middleware, routes)
  * `src/db/` — Database connections and models
  * `auth.middleware.js` — JWT-based route protection
* WebSocket support where required

  * Example: `ai-buddyService/sockets/socket.server.js`

---

## Project Structure

Top-level layout (each folder is a service):

```
ai-buddyService
authService
cartService
notificationService
orderService
paymentService
productService
seller-dashboardService
```

Common structure inside each service:

```
package.json
server.js
src/
 ├─ app.js
 ├─ db/
 ├─ routes/
 ├─ controllers/
 ├─ middlewares/
```

### productService Key Files

* `src/controllers/product.controller.js`
* `src/models/product.model.js`
* `src/services/imageKit.service.js`
* `src/validators/product.validator.js`

---

## Environment Variables

Each service uses its own `.env` file.

Common variables:

* `PORT`
* `NODE_ENV` (development | production)
* `DB_URL` / `MONGO_URI`
* `JWT_SECRET`
* `BROKER_URL`
* `EMAIL_SMTP_HOST`
* `EMAIL_SMTP_PORT`
* `EMAIL_USER`
* `EMAIL_PASS`
* `PAYMENT_PROVIDER_API_KEY`
* `IMAGEKIT_*` (for productService)

---

## Running Locally

1. Install dependencies inside each service directory
2. Ensure database and message broker are running
3. Start services in separate terminals
4. Docker can be used for local infrastructure (MongoDB, broker)

---

## Development Tips

* Use `nodemon` for automatic reloads
* Avoid duplication; extract shared logic if needed
* Never hardcode secrets
* Keep environment-specific config outside source code

---

## Deployment

* Each service is containerized using **Docker**
* Deployed on **AWS** (ECS / EC2 / EKS based setups)
* Stateless services can scale independently
* External managed databases and message brokers are recommended

---

## License

This project is **open-source** and licensed under the **MIT License**.
See the `LICENSE` file for details.

