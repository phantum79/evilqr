const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// --- CONFIG SECTION ---
const PORT = process.env.PORT;
const API_TOKEN = process.env.API_TOKEN;
const QRCODE_ID = process.env.QRCODE_ID;
const TIMEOUT = 60000;

// --- MEMORY STORE ---
const qrSessions = new Map();
const waitingClients = new Map();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// Auth Logic
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader === `Bearer ${API_TOKEN}`) {
        return next();
    }
    console.error(`[AUTH ERROR] Token Mismatch!`);
    return res.status(404).send();
};

// --- ROUTES ---

// 1. PUT: Extension se QR data lena
app.put('/qrcode/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { source, host } = req.body;

    if (!source) {
        return res.status(400).send("Missing source");
    }

    const qrcode = { id, source, host, update_time: Date.now() };
    qrSessions.set(id, qrcode);
    
    console.log(`>>> [OK] QR Stored for ${host}.`);

    // Long Polling Signal - Releasing waiting clients
    if (waitingClients.has(id)) {
        const clientRes = waitingClients.get(id);
        waitingClients.delete(id);
        
        // Safety check: Response bhejne se pehle check karo ki headers sent toh nahi
        if (!clientRes.headersSent) {
            console.log(` [SIGNAL] Sending data to waiting frontend for ${id}`);
            clientRes.json(qrcode);
        }
    }

    res.json({ status: "success" });
});

// 2. GET: index.html ke liye data
app.get('/qrcode/:id', (req, res) => {
    const { id } = req.params;
    const t = parseInt(req.query.t) || 0;

    const qrcode = qrSessions.get(id);

    // Agar session exist karta hai aur naya data hai, turant bhej do
    if (qrcode && (t === 0 || qrcode.update_time > t)) {
        console.log(`<<< [DIRECT] Sending QR for ${qrcode.host}`);
        return res.json(qrcode);
    }

    // Long Polling Logic
    console.log(`<<< [POLLING] Holding request for ${id}...`);
    waitingClients.set(id, res);

    // Timeout handling with cleanup
    const timeoutId = setTimeout(() => {
        // Sirf tabhi response bhejo agar ye wahi specific response object hai jo abhi bhi waiting mein hai
        if (waitingClients.get(id) === res) {
            waitingClients.delete(id);
            console.log(` [TIMEOUT] 60s limit reached for ${id}`);
            if (!res.headersSent) {
                res.status(408).send("Timeout");
            }
        }
    }, TIMEOUT);

    // Agar user tab band kar de ya request cancel ho jaye
    req.on('close', () => {
        clearTimeout(timeoutId);
        if (waitingClients.get(id) === res) {
            waitingClients.delete(id);
        }
    });
});

// 3. Static Files
app.use(express.static(path.join(__dirname, 'templates')));

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 REFINED SERVER RUNNING ON PORT ${PORT}`);
    console.log(`========================================\n`);
});