import pool from "../database/index.js"

class ServicosModel {
    static async listar() {
        const result = await pool.query(`
            SELECT * FROM servicos
            `);

        return result.rows
    }
}
export default ServicosModel;