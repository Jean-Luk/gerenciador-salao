import pool from "../database/index.js"
import AuthModel from "../models/authModel.js"

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

    const emailCadastrado = await AuthModel.buscarUsuarioPorEmail(email);
    if (emailCadastrado) {
        return {erro:"Email já cadastrado", sucesso:false}
    }

    const cpfCadastrado = await AuthModel.buscarUsuarioPorCpf(cpf);
    if (cpfCadastrado) {
        return {erro:"CPF já cadastrado", sucesso:false}
    }

    return {erro:false, sucesso:true}

}

export const horarioParaDateObject = (horario) => {
    const [horas, minutos] = horario.split(":").map(Number);
    const data = new Date();
    data.setHours(horas, minutos, 0, 0);
    return data;
}