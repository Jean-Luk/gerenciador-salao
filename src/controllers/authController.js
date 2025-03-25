import AuthModel from "../models/authModel.js"
import AuthService from "../services/authService.js"

import { validarNovoUsuario } from "../helpers/index.js"

export const registrar = async (req, res) => {
    try {

        const result = await AuthService.registrar(req.body);

        res.status(200).redirect("/login")

    } catch (err) {
        if (err.status) {
            res.status(err.status).render("registrar", {identity:{}, mensagem:err.mensagem || "Ocorreu um erro ao registrar. Tente novamente mais tarde.", sucesso:false});
            return
        }

        res.status(500).render("registrar", {identity:{}, mensagem:"Erro interno no servidor, tente novamente mais tarde"})
        console.error("Erro no controller:", err);
    }
}
export const login = async (req, res) => {
    try {
        const result = await AuthService.login(req.body);

        res.cookie("AUTH-SALAO", result, { domain: 'localhost', path: '/' });

        res.status(200).redirect("/");

    } catch (err) {
        if (err.status) {
            res.status(err.status).render("login", { identity:{}, mensagem:err.mensagem || "Ocorreu um erro ao realizar login. Tente novamente mais tarde", sucesso:false});
            return
        }

        res.status(500).render("login", {identity:{}, mensagem:"Erro interno no servidor, tente novamente mais tarde"})
        console.error("Erro no controller:", err);
    }
}

export const logoff = async (req, res) => {
    try {
        res.cookie("AUTH-SALAO", "", {domain: 'localhost', path: '/', expires: new Date(0)})

        res.redirect("/login");

    } catch (err) {
        console.error(err);
        res.status(400).redirect("/");
    }
}