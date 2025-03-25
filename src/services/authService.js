import { validarNovoUsuario } from "../helpers/index.js"
import AuthModel from "../models/authModel.js"
import { random, authentication } from "../helpers/auth.js";

class authService {
    static async registrar ({ nome, email, cpf, senha }) {
        try {
            if (!nome || !email || !cpf || !senha ) { 
                throw {mensagem:"Algum campo não foi preenchido", status:400}
            }
    
            // Retirar pontos e traços do CPF
            const cpfFormatado = cpf.replace(/[\.-]/g, "");

            // Verificar se campos são válidos (tamanho, etc.)
            const validacao = await validarNovoUsuario(nome, email, cpfFormatado, senha)
            if (!validacao.sucesso) {
                throw {mensagem:validacao.erro || null, status:400}
            }
    
            // Se ainda não existem usuários, é ADM, se já existem, então é cliente
            const qtdUsuarios = AuthModel.contarUsuarios();
            const adm = qtdUsuarios === 0 ? true : false;

            const salt = random();

            const result = await AuthModel.registrar(nome, email, cpfFormatado, senha, adm, salt);
    
            return result;

        } catch (err) {
            console.error("Erro no service: ", err);

            if (err.status) {
                throw err;
            }

            throw {status:500, mensagem:"Erro interno no servidor, tente novamente mais tarde"}
        }
    }
    
    static async login ({email, senha}) {
        try {
            if (!email || !senha) {
                throw { status:400, mensagem:"Preencha todos os campos"}
            }    
            
            const usuario = await AuthModel.buscarUsuarioPorEmail(email);
            
            if(!usuario) {
                throw { status:400, erro:"E-mail ou senha inválidos"};
            }
            const usuarioId = usuario.pk_usuario_id;
    
            const hash = authentication(usuario.salt, senha)
            if (usuario.senha !== hash) {
                throw { status:400, erro:"E-mail ou senha inválidos"}
            }
    
            const salt = random();
            const tokenAutenticacao = authentication(salt, usuarioId)

            await AuthModel.login(usuarioId, tokenAutenticacao);
    
            return tokenAutenticacao;
            
        } catch (err) {
            console.error("Erro no service: ", err);
        
            if (err.status) {
                throw err;
            }
        
            throw {status:500, mensagem:"Erro interno no servidor, tente novamente mais tarde"}
            
        }
    }
}

export default authService;