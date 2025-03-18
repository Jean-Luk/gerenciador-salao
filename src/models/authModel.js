import pool from "../database/index.js";
import { random, authentication } from "../helpers/auth.js";
import { buscarUsuarioPorEmail } from "../helpers/index.js";

class AuthModel {
    static async registrar (nome, email, cpf, senha) {
        const salt = random();
    
        const possuiUsuarios = await pool.query(`
                SELECT COUNT(*) FROM usuarios;
            `)

        const adm = parseInt(possuiUsuarios.rows[0].count) ? false : true;

        const novoUsuario = await pool.query(`
            INSERT INTO usuarios (nome, email, cpf, senha, salt, adm)
    
            VALUES ($1, $2, $3, $4, $5, $6)
            `, [nome, email, cpf, authentication(salt, senha), salt, adm])
    
        return novoUsuario.rows[0];
    }

    static async login (email, senha) {
        
        const usuario = await buscarUsuarioPorEmail(email);
        
        if(!usuario) {
            return { sucesso:false, erro:"E-mail ou senha inválidos"}
        }

        const hash = authentication(usuario.salt, senha)

        if (usuario.senha != hash) {
            return { sucesso:false, erro:"E-mail ou senha inválidos"}
        }

        const salt = random();
        const tokenAutenticacao = authentication(salt, usuario.id)

        await pool.query(`
            UPDATE usuarios
            SET token_autenticacao = $1
            WHERE pk_usuario_id = $2
            `, [tokenAutenticacao, usuario.pk_usuario_id]);

        return { sucesso:true, tokenAutenticacao}
    }
}

export default AuthModel;