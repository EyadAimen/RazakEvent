import express from "express"
import envVars from "../config/envConfig.mjs";


const app = express();
const PORT = envVars.port || 5000;

app.get("/", (request, response) => {
    return response.sendStatus(200);
})

app.listen(PORT, () => {
    console.log("Listening to PORT: ", PORT)
})