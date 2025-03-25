import pkg from 'lodash'
const { merge } = pkg;
import AuthModel from "../models/authModel.js"

export const isAuthenticated = async (req, res, next) => {
    try {
        const tokenAutenticacao = req.cookies["AUTH-SALAO"];

        if (!tokenAutenticacao) {
            res.redirect("/login");
            return;
        }

        const usuarioExiste = await AuthModel.buscarUsuarioPorToken(tokenAutenticacao);

        if (!usuarioExiste) {
            res.redirect("/login");
            return;
        }

        merge(req, { identity: usuarioExiste })

        next();
    } catch (err) {
        console.error(err);
        return res.sendStatus(400);
    }
}

export const isAdministrator = async (req, res, next) => {
    try {
        if (req.identity.adm) {
            next()
        } else {
            res.redirect("/");
        }

    } catch (err) {
        console.error(err);
        return res.sendStatus(400);
    }
}

export const getIdentity = async (req, res, next) => {
    try {
        const tokenAutenticacao = req.cookies["AUTH-SALAO"];

        if (!tokenAutenticacao) {
            merge(req, { identity:{}});
            next();
            return;
        }

        const usuarioExiste = await AuthModel.buscarUsuarioPorToken(tokenAutenticacao);

        if (!usuarioExiste) {
            merge(req, { identity:{}});
            next();
            return;
        }

        merge(req, { identity: usuarioExiste })

        next();
    } catch (err) {
        console.error(err);
        return res.sendStatus(400);
    }
}

export const isNotAuthenticated = async (req, res, next) => {
    try {
        const tokenAutenticacao = req.cookies["AUTH-SALAO"];

        if (!tokenAutenticacao) {
            next();
            return;
        }

        const usuarioExiste = await AuthModel.buscarUsuarioPorToken(tokenAutenticacao);

        if (!usuarioExiste) {
            next();
            return;
        }

        res.redirect("/");

    } catch (err) {
        console.error(err);
        return res.sendStatus(400);
    }
}