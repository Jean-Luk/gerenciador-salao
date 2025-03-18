import { registrar, login, logoff } from "../controllers/authController.js"
import { isNotAuthenticated } from "../middlewares/index.js"

export default (router) => {
    router.post("/auth/registrar", isNotAuthenticated, registrar)
    router.post("/auth/login", isNotAuthenticated, login)
    router.post("/auth/logoff", logoff)
}