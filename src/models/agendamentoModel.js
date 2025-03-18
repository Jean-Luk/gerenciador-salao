import pool from "../database/index.js"
import { horarioParaDateObject } from "../helpers/index.js";

class AgendamentoModel {

    static minutosEspacamento = 15;

    // Retorna todos os horários disponíveis em um dia da semana específico (de "minutosEspacamento" em "minutosEspacamento"). 
    static async buscarHorariosPorDiaDaSemana(codDia) { 
        const result = await pool.query(`
            SELECT * FROM horario_funcionamento
            WHERE fk_cod_dia = $1;
            `, [codDia]);
            

        let todosHorarios = [];

        // Caso haja mais de um período para 1 dia da semana, acrescenta todos eles na array "todosHorarios"
        for (const periodo of result.rows) {
            const horariosPorPeriodo = this.listarHorarios(periodo.horario_inicio, periodo.horario_termino);

            horariosPorPeriodo.forEach(hora => todosHorarios.push(hora));
        }

        return todosHorarios;

    }

    // Retorna um array com os horários, de 15 em 15 minutos, que separam a hora "início" e a hora "fim"
    static listarHorarios (inicio, fim) { 
        const horarios = [];

        let horaAtual = horarioParaDateObject(inicio);
        const horaFim =  horarioParaDateObject(fim);

        while (horaAtual <= horaFim) {
            horarios.push(horaAtual.toLocaleString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
            horaAtual.setMinutes(horaAtual.getMinutes() + this.minutosEspacamento);
        }

        return horarios
    }

    // Busca todos os serviços que estão solicitados em um agendamento
    static async buscarServicosPorAgendamento (agendamentoId) {
        const result = await pool.query(`
        SELECT servicos.pk_servico_id, servicos.duracao_minutos, servicos.nome_servico
        FROM servicos_por_agendamento
        INNER JOIN servicos ON servicos_por_agendamento.pk_fk_servico_id = servicos.pk_servico_id
        WHERE servicos_por_agendamento.pk_fk_agendamento_id = $1
        `, [agendamentoId])

        return result.rows;

    }

    // Calcula a duração total de todos os serviços de uma array de serviços (pode ser uma array com os IDs dos serviços, ou uma array com objects dos serviços)
    static async calcularDuracaoPorServicos (servicos) {
        let somaDuracao = 0;

        for (const servico of servicos) {
            let duracaoMinutos;
            if (typeof(servico) === "object" && servico.duracao_minutos) { // Se serviços já for um array com os objetos de cada serviço, pegar a duração em minutos
                duracaoMinutos = servico.duracao_minutos;
            } else { // Se não, fazer o select para cada servicoId
                const result = await pool.query(`
                    SELECT duracao_minutos
                    FROM servicos
                    WHERE pk_servico_id = $1`, [servico]);

                duracaoMinutos = result.rows[0].duracao_minutos;
            }

            somaDuracao += duracaoMinutos;
        }

        return somaDuracao;
    }

    // Calcula a duração total dos serviços de um agendamento
    static async calcularDuracao (agendamentoId) {
        const servicos = await this.buscarServicosPorAgendamento(agendamentoId);

        let somaDuracao = 0;

        servicos.forEach(servico => {
            somaDuracao += servico.duracao_minutos;
        })

        return somaDuracao;
    }

    // Busca os horários disponíveis em um dia e retorna 3 arrays: 
    // uma com todos os horários (todosHorarios), 
    // outra com os horários já ocupados (horariosOcupados) 
    // e outra com todos os horários menos os horários ocupados (horariosDisponiveis).
    // Esta array também leva em conta a duração dos serviços especificados no segundo argumento.
    static async buscarHorariosDisponiveisNoDia(dataString, servicos, agendamentoId=-1, usuarioId=-1) {

        try {
            const dataObject = new Date(dataString);
    
            const agendamentosNoMesmoDia = await pool.query(`
                SELECT pk_agendamento_id, horario_inicio FROM agendamentos
                WHERE horario_inicio::DATE = $1
                  AND pk_agendamento_id != $2 
                  AND fk_usuario_id != $3
                `, [dataString, agendamentoId, usuarioId]);
            
            const todosHorarios = await this.buscarHorariosPorDiaDaSemana(dataObject.getUTCDay());
    
            if (!todosHorarios.length) {
                return { sucesso:false, erro:"Não há horários disponíveis para esta data" }
            }
    
            const horariosOcupados = [];
    
            for (const agendamento of agendamentosNoMesmoDia.rows) {
                let duracao = await this.calcularDuracao(agendamento.pk_agendamento_id)
    
                while (duracao > 0) {
                    duracao -= this.minutosEspacamento;
    
                    const horaAtual = new Date(agendamento.horario_inicio)
                    
                    horaAtual.setMinutes(horaAtual.getMinutes() + duracao);
    
                    horariosOcupados.push(horaAtual.toLocaleString('pt-BR', {hour: '2-digit', minute:'2-digit'}))
                    
                }
            }
    
    
            const duracaoDesteAgendamento = await this.calcularDuracaoPorServicos(servicos);
            
            // Horários inválidos pois, considerando a duração dos serviços, não será possível concluir até a hora do próximo agendamento
            const horariosInvalidos = [];
            
            // Considerar o último horário um horário ocupado, para evitar que serviços longos sejam agendados próximos ao fim do horário de funcionamento
            horariosOcupados.push(todosHorarios[todosHorarios.length-1]); 
    
            for (const horarioOcupado of horariosOcupados) {
                let contadorDuracao = duracaoDesteAgendamento;
                while (contadorDuracao > 0) {
                    contadorDuracao -= this.minutosEspacamento;
    
                    const horaAtual = new Date(dataObject)
                    const [horas, minutos] = horarioOcupado.split(":");
    
                    horaAtual.setHours(parseInt(horas))
                    horaAtual.setMinutes(parseInt(minutos) - contadorDuracao);
    
    
                    horariosInvalidos.push(horaAtual.toLocaleString('pt-BR', {hour: '2-digit', minute:'2-digit'}))
                }
            }
    
            horariosOcupados.push(...horariosInvalidos);
    
            const horariosDisponiveis = todosHorarios.filter(horario => !horariosOcupados.includes(horario));
    
            return { todosHorarios, horariosDisponiveis, horariosOcupados, sucesso:true };

        } catch (err) {
            console.error(err);
            return { sucesso:false };
        }    
    }


    // Criar novo agendamento
    static async agendar (dataString, servicos, horario, usuarioId) {
        // Verificar se data e horário são válidos e não estão ocupados
        try {
            
            const agora = new Date();
            const dataMax = new Date(agora);
            
            dataMax.setDate(dataMax.getDate() + 30);
            
            const horarioInicioString = `${dataString}T${horario}:00`
            const horarioInicio = new Date(horarioInicioString);
            
            // Verificar se data está dentro do período máximo de 30 dias
            if (horarioInicio < agora || horarioInicio > dataMax) {
                return {erro:"Data inválida. Por favor, tente novamente.", sucesso:false}
            }

            // Verificar se horário está disponível
            const horarios = await AgendamentoModel.buscarHorariosDisponiveisNoDia(dataString, servicos);

            if (horarios.horariosDisponiveis.indexOf(horario) === -1) { // Horário ocupado
                return {erro:"Horário já ocupado. Por favor, tente novamente.", sucesso:false}
            }


            // Verificar se todos os serviços existem

            for (const servicoId of servicos) {
                const result = await pool.query(`
                    SELECT FROM servicos
                    WHERE pk_servico_id = $1
                    `, [servicoId]);
        
                if (!result.rowCount) {
                    return { erro:"Serviço inválido. Por favor, tente novamente.", sucesso:false}
                };

            }

            await pool.query("BEGIN");

            const result = await pool.query(`
                INSERT INTO agendamentos (fk_usuario_id, horario_inicio, fk_status_id)
                VALUES ($1, $2, $3)
                RETURNING *;
                `, [usuarioId, horarioInicio, 1])


            for  (const servicoId of servicos) {
                await pool.query(`
                        INSERT INTO servicos_por_agendamento (pk_fk_agendamento_id, pk_fk_servico_id)
                        VALUES ($1, $2)
                    `, [result.rows[0].pk_agendamento_id, servicoId]);

            }

            await pool.query("COMMIT");

            return { sucesso:true }
        } catch (err) {
            await pool.query("ROLLBACK");

            console.error(err);
            return {sucesso:false}
        }
    }

    // Editar um agendamento
    static async editarAgendamento (agendamentoId, data, servicos, horario) {

        try {

            
            // Verificar se data é válida e está dentro do período máximo de 30 dias

            const agora = new Date();
            const dataMax = new Date(agora);
            
            dataMax.setDate(dataMax.getDate() + 30);
            
            const horarioInicioString = `${data}T${horario}:00`
            const horarioInicio = new Date(horarioInicioString);

            if (isNaN(horarioInicio)) {
                return { erro:"Data inválida. Por favor, tente novamente.", sucesso:false}
            }
            
            if (horarioInicio < agora || horarioInicio > dataMax) {
                return {erro:"Data inválida. Por favor, tente novamente.", sucesso:false}
            }

            // Verificar se data e horário são válidos e não estão ocupados

            const horarios = await AgendamentoModel.buscarHorariosDisponiveisNoDia(data, servicos, agendamentoId);

            if (horarios.horariosDisponiveis.indexOf(horario) === -1) { // Horário ocupado
                return {erro:"Horário já ocupado. Por favor, tente novamente.", sucesso:false}
            }

            // Verificar se todos os serviços existem

            for (const servicoId of servicos) {
                const result = await pool.query(`
                    SELECT FROM servicos
                    WHERE pk_servico_id = $1
                    `, [servicoId]);
        
                if (!result.rowCount) {
                    return { erro:"Serviço inválido. Por favor, tente novamente.", sucesso:false}
                };

            }

            await pool.query("BEGIN");

            await pool.query(` 
                UPDATE agendamentos
                SET horario_inicio = $1, fk_status_id = 1
                WHERE pk_agendamento_id = $2
                RETURNING *;
                `, [horarioInicio, agendamentoId])


            // Remover todos os serviços antigos:
            await pool.query(`
                DELETE FROM servicos_por_agendamento
                WHERE pk_fk_agendamento_id = $1
                `, [agendamentoId]);


            // Criar os novos serviços:
            for  (const servicoId of servicos) {
                await pool.query(`
                        INSERT INTO servicos_por_agendamento (pk_fk_agendamento_id, pk_fk_servico_id)
                        VALUES ($1, $2)
                    `, [agendamentoId, servicoId]);

            }

            await pool.query("COMMIT");

            return { sucesso:true }
        } catch (err) {
            await pool.query("ROLLBACK");

            console.error(err);
            return {sucesso:false}
        }
    }

    // Buscar todos os agendamentos de um usuário específico.
    static async buscarAgendamentosPorUsuario (usuarioId, dataInicio, dataFim) {
        try {
            let sql = `
                SELECT agendamentos.pk_agendamento_id, agendamentos.horario_inicio, agendamentos.fk_status_id, status_agendamento.nome_status AS status
                FROM agendamentos
                INNER JOIN status_agendamento ON agendamentos.fk_status_id = status_agendamento.pk_status_id
                WHERE fk_usuario_id = $1
            `
    
            const dataInicioConvertida = new Date(dataInicio);
            const dataFimConvertida = new Date(dataFim);
    
            if (!isNaN(dataFimConvertida)) {
                dataFimConvertida.setDate(dataFimConvertida.getDate() + 1) // Adicionar um dia
            }
    
            const params = [usuarioId];
    
            if (!isNaN(dataInicioConvertida) && !isNaN(dataFimConvertida)) {
                sql += ` AND agendamentos.horario_inicio >= $2 AND agendamentos.horario_inicio <= $3`
    
                params.push(dataInicioConvertida, dataFimConvertida)
            } else if (!isNaN(dataInicioConvertida)) {
                sql += ` AND agendamentos.horario_inicio >= $2`
    
                params.push(dataInicioConvertida)
    
            } else if (!isNaN(dataFimConvertida)) {
                sql += ` AND agendamentos.horario_inicio <= $2`
    
                params.push(dataFimConvertida)
    
            }
    
            const result = await pool.query(sql, params)
    
            return {sucesso:true, result:result.rows};

        } catch (err) {
            console.error(err);
            return {sucesso:false}
        }
    }

    // Buscar um agendamento pelo seu ID
    static async buscarAgendamentoPorId (agendamentoId) {
        const result = await pool.query(`
            SELECT agendamentos.fk_usuario_id, agendamentos.pk_agendamento_id, agendamentos.horario_inicio, usuarios.nome AS cliente_nome, agendamentos.fk_status_id, status_agendamento.nome_status AS status
            FROM agendamentos
            INNER JOIN usuarios ON agendamentos.fk_usuario_id = usuarios.pk_usuario_id
            INNER JOIN status_agendamento ON agendamentos.fk_status_id = status_agendamento.pk_status_id
            WHERE agendamentos.pk_agendamento_id = $1
            `, [agendamentoId]);


        return result.rows[0];

    }

    // Buscar agendamento pelo seu ID (de um usuário específico)
    static async buscarAgendamentoPorIdPorUsuario (agendamentoId, usuarioId) {
        const result = await pool.query(`
            SELECT agendamentos.pk_agendamento_id, agendamentos.horario_inicio, usuarios.nome AS cliente_nome, agendamentos.fk_status_id, status_agendamento.nome_status AS status
            FROM agendamentos
            INNER JOIN usuarios ON agendamentos.fk_usuario_id = usuarios.pk_usuario_id
            INNER JOIN status_agendamento ON agendamentos.fk_status_id = status_agendamento.pk_status_id
            WHERE agendamentos.pk_agendamento_id = $1 AND agendamentos.fk_usuario_id = $2
            `, [agendamentoId, usuarioId]);

        return result.rows[0];
    }

    // Cancelar um agendamento
    static async cancelarAgendamento (agendamentoId) {
        try {
            const result = await pool.query(`
                DELETE FROM agendamentos
                WHERE pk_agendamento_id = $1
                `, [agendamentoId]);
            
            return {result, sucesso:true};

        } catch (err) {
            console.error(err);
            return {sucesso:false};
        }
    }

    // Buscar todos os agendamentos em um período específico
    static async buscarAgendamentosPorData (dataInicio, dataFim) {
        try {
            let sql = `
                SELECT agendamentos.pk_agendamento_id, agendamentos.horario_inicio, usuarios.nome AS cliente_nome, agendamentos.fk_status_id, status_agendamento.nome_status AS status
                FROM agendamentos
                INNER JOIN status_agendamento ON agendamentos.fk_status_id = status_agendamento.pk_status_id
                INNER JOIN usuarios ON agendamentos.fk_usuario_id = usuarios.pk_usuario_id
            `
    
            const dataInicioConvertida = new Date(dataInicio);
            const dataFimConvertida = new Date(dataFim);
    
            if (!isNaN(dataFimConvertida)) {
                dataFimConvertida.setDate(dataFimConvertida.getDate() + 1) // Adicionar um dia para que sejam inclusos os agendamentos do último dia
            }
    
            const params = [];
    
            // Fazer a query conforme a quantidade de parâmetros especificados
            if (!isNaN(dataInicioConvertida) && !isNaN(dataFimConvertida)) {
                sql += `WHERE agendamentos.horario_inicio >= $1 AND agendamentos.horario_inicio <= $2`
    
                params.push(dataInicioConvertida, dataFimConvertida)
            } else if (!isNaN(dataInicioConvertida)) {
                sql += `WHERE agendamentos.horario_inicio >= $1`
    
                params.push(dataInicioConvertida)
    
            } else if (!isNaN(dataFimConvertida)) {
                sql += `WHERE agendamentos.horario_inicio <= $1`
    
                params.push(dataFimConvertida)
    
            }
    
            sql += `
             ORDER BY agendamentos.horario_inicio DESC`;
    
            const result = await pool.query(sql, params)
    
            return {sucesso:true, result:result.rows};

        } catch (err) {
            console.error(err);
            return {sucesso:false}
        }
    }

    static async alterarStatusAgendamento (agendamentoId, statusId) {

        try {
            // Verificar se o status existe
    
            const status = await pool.query(`
                SELECT FROM status_agendamento
                WHERE pk_status_id = $1
                `, [statusId]);
    
            if (!status.rowCount) {
                return { erro:"Status inválido. Por favor, tente novamente.", sucesso:false}
            };
    
            await pool.query(` 
                UPDATE agendamentos
                SET fk_status_id = $1
                WHERE pk_agendamento_id = $2
                RETURNING *;
                `, [statusId, agendamentoId])
    
    
            return { sucesso:true }

        } catch (err) {
            console.error(err);
            return { sucesso:false }
        }
    }

    // Buscar todos os agendamentos de um usuário, que ocorrem em um período menor que 7 dias de um agendamento específico.
    static async buscarAgendamentoNaMesmaSemana (agendamento) { 
        try {
            const dataObj = new Date(agendamento.horario_inicio);
    
            if (isNaN(dataObj)) {
                return { possui:false }
            }
    
            const dataMax = new Date(dataObj);
            dataMax.setDate(dataMax.getDate() + 7);
    
            const dataMin = new Date(dataObj);
            dataMin.setDate(dataMin.getDate() - 7);
    
            const hoje = new Date();
    
            const usuarioId = agendamento.fk_usuario_id;
    
            const agendamentos = await pool.query(`
                SELECT agendamentos.*, status_agendamento.nome_status AS status
                FROM agendamentos
                INNER JOIN status_agendamento ON agendamentos.fk_status_id = status_agendamento.pk_status_id
                WHERE agendamentos.fk_usuario_id = $1
                  AND agendamentos.horario_inicio >= $2 
                  AND agendamentos.horario_inicio <= $3
                  AND agendamentos.horario_inicio >= $4
                ORDER BY agendamentos.horario_inicio ASC;
                `, [usuarioId, dataMin, dataMax, hoje]);
            
    
            if (agendamentos.rowCount > 1) {
                return agendamentos.rows
            } 
            
            return [];

        } catch (err) {
            console.error(err);
            return false;
        }
    }

    static async listarServicosDeAgendamentos (agendamentos ) {
        let todosServicos = [];

        for (const agendamento of agendamentos) {
            const servicos = await this.buscarServicosPorAgendamento(agendamento.pk_agendamento_id);
            todosServicos.push(...servicos)
        }

        return todosServicos;
    }

    // Em uma array de agendamentos, busca qual o primeiro agendamento que tem os horários disponíveis para remarcar todos os serviços
    static async buscarPrimeiroAgendamentoDisponivel (agendamentos) {

        const todosServicos = await this.listarServicosDeAgendamentos(agendamentos);

        const horariosDisponiveis = [];
        let data;

        for (const agendamento of agendamentos) {
            const dataObj = new Date(agendamento.horario_inicio);
            const dataString = dataObj.toISOString().split("T")[0];

            const todosHorarios = await this.buscarHorariosDisponiveisNoDia(dataString, todosServicos, agendamento.pk_agendamento_id, agendamento.fk_usuario_id)

            if (todosHorarios.horariosDisponiveis.length) { // É possível re-agendar os outros serviços para o dia deste agendamento
                horariosDisponiveis.push(...todosHorarios.horariosDisponiveis);
                data = dataString;
                break;
            }

        }
        
        return { data, horariosDisponiveis }

    }

    static async reagendarAgendamentosDaMesmaSemana (agendamentoId, horario, usuarioId) {

        try {
            const agendamento = await this.buscarAgendamentoPorId(agendamentoId);

            if (!agendamento) {
                return {erro:"Agendamento não encontrado", sucesso:false}
            }
    
            const agendamentosMesmaSemana = await this.buscarAgendamentoNaMesmaSemana(agendamento);
            const diaAgendamentoMaisCedo = await this.buscarPrimeiroAgendamentoDisponivel(agendamentosMesmaSemana);
    
            if (diaAgendamentoMaisCedo.horariosDisponiveis.indexOf(horario) === -1) { // Horário recebido não é compatível com os disponíveis
                return {erro:"Horário inválido", sucesso:false}
            }
    
            const todosServicos = await this.listarServicosDeAgendamentos(agendamentosMesmaSemana); // Salvar todos os serviços antes de deletar do banco de dados.
    

            await pool.query("BEGIN");

            for (const agendamento of agendamentosMesmaSemana) { // Deletar todos os agendamentos da mesma semana.
                await pool.query(`
                    DELETE FROM agendamentos
                    WHERE agendamentos.pk_agendamento_id = $1
                    `, [agendamento.pk_agendamento_id]);
            }

            // Criar um agendamento com todos os serviços no horário especificado:

            const todosServicosId = [];

            for (const servico of todosServicos) {
                if (todosServicosId.indexOf(servico.pk_servico_id) === -1) { // Remover serviços duplicados
                    todosServicosId.push(servico.pk_servico_id);
                }
            }

            const usuarioId = agendamento.fk_usuario_id;

            await this.agendar(diaAgendamentoMaisCedo.data, todosServicosId, horario, usuarioId)

            await pool.query("COMMIT");

            return { sucesso:true }
        } catch (err) {
            await pool.query("ROLLBACK");

            console.error(err);
            return {sucesso:false}
        }

    }
}

export default AgendamentoModel;