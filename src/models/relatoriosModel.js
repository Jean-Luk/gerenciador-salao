import pool from "../database/index.js"

class RelatoriosModel {
    static async gerarRelatorios (dataInicio, dataFim, tipoRelatorio) {
        if (tipoRelatorio === "agendamentos") {
            return await this.gerarRelatorioAgendamentos(dataInicio, dataFim);
        } else if (tipoRelatorio === "clientes") {
            return await this.gerarRelatorioClientes(dataInicio, dataFim);
        }
    }

    static async gerarRelatorioAgendamentos (dataInicio, dataFim) {
        
        const dataInicioConvertida = new Date(dataInicio);
        const dataFimConvertida = new Date(dataFim);

        if (isNaN(dataInicioConvertida) || isNaN(dataFimConvertida)) {
            return { erro:"Data inválida", sucesso:false }
        }

        dataFimConvertida.setDate(dataFimConvertida.getDate() + 1) // Adicionar um dia

        const servicos = await pool.query(`
            SELECT servicos.pk_servico_id, servicos.nome_servico, COUNT(servicos_por_agendamento.pk_fk_servico_id) AS quantidade_agendamentos
            FROM agendamentos
            INNER JOIN servicos_por_agendamento ON servicos_por_agendamento.pk_fk_agendamento_id = agendamentos.pk_agendamento_id
            INNER JOIN servicos ON servicos.pk_servico_id = servicos_por_agendamento.pk_fk_servico_id
            WHERE agendamentos.horario_inicio >= $1
              AND agendamentos.horario_inicio <= $2
            GROUP BY servicos.pk_servico_id, servicos.nome_servico
            ORDER BY quantidade_agendamentos DESC;
        `, [dataInicio, dataFim]);

        const agendamentos = await pool.query(`
            SELECT COUNT(agendamentos.pk_agendamento_id) AS quantidade_agendamentos
                        FROM agendamentos
                        WHERE agendamentos.horario_inicio >= $1 AND agendamentos.horario_inicio <= $2
            `, [dataInicio, dataFim]);


        const result = {
            servicos:servicos.rows,
            quantidade_agendamentos: agendamentos.rows[0].quantidade_agendamentos
        }
        

        return result
    }

    static async gerarRelatorioClientes (dataInicio, dataFim) {
        
        const dataInicioConvertida = new Date(dataInicio);
        const dataFimConvertida = new Date(dataFim);

        if (isNaN(dataInicioConvertida) || isNaN(dataFimConvertida)) {
            return { erro:"Data inválida", sucesso:false }
        }

        dataFimConvertida.setDate(dataFimConvertida.getDate() + 1) // Adicionar um dia

        const clientes = await pool.query(`
            SELECT usuarios.nome, usuarios.email, usuarios.data_cadastro, COUNT(agendamentos.pk_agendamento_id) AS quantidade_agendamentos
            FROM usuarios
            LEFT JOIN agendamentos ON usuarios.pk_usuario_id = agendamentos.fk_usuario_id
            WHERE usuarios.data_cadastro >= $1
              AND usuarios.data_cadastro <= $2
              AND NOT usuarios.adm
            GROUP BY usuarios.pk_usuario_id
            ORDER BY usuarios.data_cadastro DESC;
        `, [dataInicio, dataFim]);

        const result = {
            clientes:clientes.rows,
            quantidade_clientes:clientes.rowCount
        }
        
        return result
    }
}

export default RelatoriosModel;