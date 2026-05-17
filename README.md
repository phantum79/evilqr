# The project is an Express.js server that syncs QR codes using Long Polling, tailored for Render.com deployment.

# QR Code Sync Server (Long Polling)

A professional, lightweight, and high-performance **Express.js** backend built to handle real-time QR code synchronization between a browser extension (or external source) and a frontend application using **Long Polling architecture**. 

Optimized for persistent container platforms like **Render.com** or **Railway.app**.

---

## 🚀 Features

- **Real-Time Synchronization:** Uses an efficient Long Polling mechanism (`60s` timeout) to deliver QR updates instantly without the overhead of WebSockets.
- **In-Memory State Management:** High-speed data retrieval using Node.js native `Map` data structures.
- **Secure API Communication:** Route protection via Bearer Token Authentication.
- **Connection Cleanup:** Automatic resource management and timeout handling on client disconnects to prevent memory leaks.
- **Robust Payload Handling:** Built-in CORS and extended JSON body parser supporting up to `10mb` data payloads.

---

## 🛠️ Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Security & Utilities:** Cors, Dotenv

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory of your project and configure the following variables:
