import express from "express"
import cors from "cors"
import envVars from "../config/envConfig.mjs"
import appDataSource from "../config/dbConfig.mjs"
import authRoutes from "./auth/auth.routes.mjs"
import eventsRoutes from "./events/events.routes.mjs"

const app = express();
const PORT = envVars.port || 5000;

app.use(express.json()) // parses application/json bodies into req.body
app.use(cors())         // allows the frontend to call this API

// ── Route registration ────────────────────────────────────────────────────────
app.use("/api/auth",   authRoutes)
app.use("/api/events", eventsRoutes)

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"
    console.error(err)
    res.status(statusCode).json({ error: message })
})

// ── Start server ──────────────────────────────────────────────────────────────
appDataSource.initialize()
    .then(() => {
        console.log("Database connected")
        app.listen(PORT, () => console.log("Listening on PORT:", PORT))
    })
    .catch(err => {
        console.error("Database connection failed:", err)
        process.exit(1)
    })