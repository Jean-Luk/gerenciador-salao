import pool from "../database/index.js"

class StatusModel {
    static async listar() {
        const result = await pool.query(`
            SELECT * FROM status_agendamento
            `);

        return result.rows
    }
}
export default StatusModel;