import express from "express"
import cors from "cors"

export function applyMiddleware(app) {
    app.use(express.json({ limit: "1mb" }))
    app.use(cors())
    app.use("/uploads", express.static("uploads"))
}
