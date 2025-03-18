import pool from "../database/index.js"

export const validarNovoUsuario = async (nome, email, cpf, senha) => {
    if (nome.length < 4) {
        return {erro:"Nome de usuário muito curto", sucesso:false}
    }

    if (senha.length < 6) {
        return {erro:"Senha muito curta", sucesso:false}
    }
    
    if (cpf.length != 11) {
        return {erro:"CPF inválido", sucesso:false}
    }

    const emailCadastrado = await buscarUsuarioPorEmail(email);
    if (emailCadastrado) {
        return {erro:"Email já cadastrado", sucesso:false}
    }

    const cpfCadastrado = await buscarUsuarioPorCpf(cpf);
    if (cpfCadastrado) {
        return {erro:"CPF já cadastrado", sucesso:false}
    }

    return {erro:false, sucesso:true}

}

export const buscarUsuarioPorEmail = async (email) => {
    const result = await pool.query(`
        SELECT * FROM usuarios
        WHERE email = $1`, [email]);

        return result.rows[0];
    }

export const buscarUsuarioPorCpf = async (cpf) => {
    const result = await pool.query(`
        SELECT * FROM usuarios
        WHERE cpf = $1`, [cpf]);

    return result.rows[0];
}

export const buscarUsuarioPorToken = async (token) => {
    const result = await pool.query(`
        SELECT nome, token_autenticacao, adm, email, cpf, pk_usuario_id FROM usuarios
        WHERE token_autenticacao = $1`, [token]);

    return result.rows[0];
}

export const horarioParaDateObject = (horario) => {
    const [horas, minutos] = horario.split(":").map(Number);
    const data = new Date();
    data.setHours(horas, minutos, 0, 0);
    return data;
}