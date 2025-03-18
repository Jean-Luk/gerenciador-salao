import pool from "../database/index.js"

class ClientesModel {
    static async listar() {
        const result = await pool.query(`
            SELECT usuarios.nome, usuarios.email, usuarios.data_cadastro, COUNT(agendamentos.fk_usuario_id) AS total_agendamentos
            FROM usuarios
            LEFT JOIN agendamentos ON usuarios.pk_usuario_id = agendamentos.fk_usuario_id
            WHERE adm = false
            GROUP BY usuarios.nome, usuarios.email, usuarios.data_cadastro
            ORDER BY usuarios.data_cadastro DESC
            `);


        return result.rows
    }
}
export default ClientesModel;