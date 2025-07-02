# Messenger Backend

This is the backend for a real-time messaging app built using Node.js, TypeScript, TypeORM, PostgreSQL, and Socket.IO. It features robust event-driven architecture, domain events, delivery statuses, and real-time communication through WebSockets.

---

## 📁 Project Structure

```
├── config/               # Environment and server configurations
├── controllers/          # Socket controllers
├── entity/               # TypeORM entities (User, Message, Thread, etc.)
├── routes/               # Express REST API routes (if used)
├── services/             # Business logic and data access
├── utils/                # Helper functions and mappers
├── Types/                # Shared enums and interfaces
├── DataTransferObjects/  # DTOs for request and response shaping
├── middlewares/          # Express or Socket middlewares
└── index.ts              # App entry point
```

---

## 🛠️ Technologies Used

- **Node.js**
- **TypeScript**
- **Socket.IO**
- **PostgreSQL** with **TypeORM**
- **Redis** (for RedisEmitter)
- **RabbitMQ** (for async and reliable event delivery)
- **Cloudinary** (for file uploads)

---

## 🧠 Database Design (ERD Overview)

### Core Tables:

- **User**: Stores user details
- **Thread**: Can be of type DM or Group, created by a user
- **Message**: Message entity associated with threads and users
- **Reaction**: Stores user reactions (emojiHex) to messages
- **Attachment**: Files or media attached to messages
- **DomainEvent**: Event store containing serialized event payloads (event sourcing)
- **DeliveryStatus**: Tracks delivery and acknowledgment of each DomainEvent per user

### Enum-Based Types:

- **Thread_Types**: `DM`, `GROUP`
- **AttachmentTypes**: `IMAGE`, `VIDEO`, `FILE`, etc.
- **Domain_Events**: `MESSAGE_CREATED`, `MESSAGE_UPDATED`, etc.
- **Event_Aggregate_Type**: `MESSAGE`, `THREAD`, `USER`

---

## ⚙️ Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/your-org/messenger-backend.git
cd messenger-backend
npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
PORT=5000
JWT_SECRET=your_secret_key
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
REDIS_HOST=localhost
REDIS_PORT=6379
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
RABBITMQ_URI=amqp://localhost
```

### 3. Run DB Migrations (TypeORM sync)

Ensure your DB is running, then start the server:

```bash
npm run dev
```

---

## 🧪 API & Socket Events

### Socket Events

#### Client ➡️ Server

- `create_message`
- `update_message`
- `delete_message`
- `create_conversation`
- `add_reaction`
- `add_attachments`

#### Server ➡️ Client

- `message_created`
- `message_updated`
- `bulk_message_deleted`
- `conversation_created`
- `reaction_added`
- `attachment_added`

### REST APIs (optional)

- `POST /api/users`
- `POST /api/login`
- `PATCH /api/users/:id`

---

## ✅ Features

- JWT authentication (access + refresh tokens)
- Domain-driven design
- Socket authentication
- Event store and reliable delivery tracking
- Cloudinary uploads
- RabbitMQ-based retry and buffering logic
- Redis-emitter for event scaling
- Type-safe DTOs

---

## 📌 Upcoming Features

- Message seen status
- Soft delete for threads/messages
- Pagination for threads/messages
- Admin dashboard

---

## 👤 Author

- Himjyoti Sarma
- [GitHub](https://github.com/himjyoti)

---

## 📄 License

[MIT](LICENSE)
