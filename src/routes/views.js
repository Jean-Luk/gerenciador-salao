import { getIdentity, isNotAuthenticated } from "../middlewares/index.js";

import { telaAgendar, telaAgendamentos } from "../controllers/agendarController.js"

export default (router) => {
    router.get("/registrar", isNotAuthenticated, (req, res) => {
        res.render('registrar', { identity:req.identity, mensagem:null});
    })
    router.get("/login", isNotAuthenticated, (req, res) => {
        res.render('login', { identity:req.identity, mensagem:null});
    })
    router.get("/", getIdentity, (req, res) => {
        res.render('index', { identity:req.identity});
    })

}