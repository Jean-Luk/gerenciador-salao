import AuthModel from "../models/authModel.js"

import { validarNovoUsuario } from "../helpers/index.js"

export const registrar = async (req, res) => {
    try {
        const { nome, email, cpf, senha } = req.body;

        if (!nome || !email || !cpf || !senha ) { 
            res.status(400).render("registrar", { identity:{}, mensagem:"Preencha todos os campos", sucesso:false});
            return;
        }

        const cpfFormatado = cpf.replace(/[\.-]/g, "");

        const validacao = await validarNovoUsuario(nome, email, cpfFormatado, senha)

        if (!validacao.sucesso) {
            res.status(400).render("registrar", { identity:{}, mensagem:validacao.erro, sucesso:false});
            return;
        }

        await AuthModel.registrar(nome, email, cpfFormatado, senha);

        res.status(200).redirect("/login")

    } catch (err) {
        console.error(err);
    }
}
export const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            res.status(400).render("login", { identity:{}, mensagem:"Preencha todos os campos", sucesso:false});
            return;
        }

        const result = await AuthModel.login(email, senha);

        if (!result.sucesso) {
            res.status(400).render("login", { identity:{}, mensagem:result.erro, sucesso:false});
            return;
        }

        res.cookie("AUTH-SALAO", result.tokenAutenticacao, { domain: 'localhost', path: '/' });

        res.status(200).redirect("/");

    } catch (err) {
        console.error(err);
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