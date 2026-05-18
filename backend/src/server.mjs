import express from "express"
import cors from "cors"
import envVars from "../config/envConfig.mjs"
import appDataSource from "../config/dbConfig.mjs"
import authRoutes from "./auth/auth.routes.mjs"
import usersRoutes from "./users/users.routes.mjs"
import clubsRoutes from "./clubs/clubs.routes.mjs"
import eventsRoutes from "./events/events.routes.mjs"
import proposalsRoutes from "./proposals/proposals.routes.mjs"
import volunteeringRoutes from "./volunteering/volunteering.routes.mjs"
import certificatesRoutes from "./certificates/certificates.routes.mjs"
import reportsRoutes from "./reports/reports.routes.mjs"
import leadRoleRequestsRoutes from "./requests/lead_role_requests.routes.mjs"

const app = express();
const PORT = envVars.port || 5000;

app.use(express.json())
app.use(cors())
app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/clubs", clubsRoutes)
app.use("/api/events", eventsRoutes)
app.use("/api/proposals", proposalsRoutes)
app.use("/api/volunteering", volunteeringRoutes)
app.use("/api/certificates", certificatesRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/requests/lead-role", leadRoleRequestsRoutes)

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"
    console.error(err)
    res.status(statusCode).json({ error: message })
})

appDataSource.initialize()
    .then(() => {
        console.log("Database connected")
        app.listen(PORT, () => console.log("Listening on PORT:", PORT))
    })
    .catch(err => {
        console.error("Database connection failed:", err)
        process.exit(1)
    })