import pool from "../database/index.js";
import { random, authentication } from "../helpers/auth.js";

class AuthModel {
    static async buscarUsuarioPorCpf (cpf) {
        const result = await pool.query(`
            SELECT * FROM usuarios
            WHERE cpf = $1`, [cpf]);
    
        return result.rows[0];
    }
    
    static async buscarUsuarioPorToken (token) {
        const result = await pool.query(`
            SELECT nome, token_autenticacao, adm, email, cpf, pk_usuario_id FROM usuarios
            WHERE token_autenticacao = $1`, [token]);
    
        return result.rows[0];
    }

    static async contarUsuarios () {
        try {
            const usuarios = await pool.query(`
                SELECT COUNT(*) FROM usuarios;
            `)
            
            return usuarios.rows[0].count
        } catch (err) {
            console.error("Erro no model:", err);
            throw err;
        }
    }

    static async registrar (nome, email, cpf, senha, adm, salt) {
        try {
            const novoUsuario = await pool.query(`
                INSERT INTO usuarios (nome, email, cpf, senha, salt, adm)
        
                VALUES ($1, $2, $3, $4, $5, $6)
                `, [nome, email, cpf, authentication(salt, senha), salt, adm])
        
            return novoUsuario.rows[0];
        } catch (err) {
            console.error("Erro no model:", err)
            throw err;
        }
    }

    static async buscarUsuarioPorEmail (email) {
        try {
            const result = await pool.query(`
                SELECT * FROM usuarios
                WHERE email = $1`, [email]);
        
            return result.rows[0];

        } catch (err) {
            console.error("Erro no model:", err);
            throw err;
        }
    }
    
    static async login (usuarioId, tokenAutenticacao) {
        try {
            await pool.query(`
                UPDATE usuarios
                SET token_autenticacao = $1
                WHERE pk_usuario_id = $2
                `, [tokenAutenticacao, usuarioId]);
    
            return { sucesso:true }

        } catch (err) {
            console.error("Erro no model:", err)
            throw err;
        }
    }
}

export default AuthModel;