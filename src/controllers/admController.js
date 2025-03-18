import AgendamentoModel from "../models/agendamentoModel.js"
import ServicosModel from "../models/servicosModel.js"
import StatusModel from "../models/statusModel.js"
import ClientesModel from "../models/clientesModel.js"
import RelatoriosModel from "../models/relatoriosModel.js"

export const telaRelatorios  = async (req, res) => {
    try {
        res.status(200).render("admRelatorios", { identity:req.identity, dataInicio:false, dataFim:false, mensagem:false, relatorio:false, tipoRelatorio:false })

    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

export const gerarRelatorio = async (req, res) => {
    try {
        const { dataInicio, dataFim, tipoRelatorio="agendamentos" } = req.body;''

        if (!dataInicio || !dataFim) {
            res.status(400).render("admRelatorios", { identity:req.identity, dataInicio:false, dataFim:false, mensagem:"Preencha todos os campos", relatorio:false, tipoRelatorio:false });
            return;
        }

        const result = await RelatoriosModel.gerarRelatorios(dataInicio, dataFim, tipoRelatorio)

        res.status(200).render("admRelatorios", { identity:req.identity, dataInicio, dataFim, mensagem:false, relatorio:result, tipoRelatorio })
    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

export const listarClientes = async (req, res) => {
    try {
        const clientes = await ClientesModel.listar();

        res.render("admClientes", { identity:req.identity, clientes })
    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

export const listarAgendamentos = async (req, res) => {
    const { dataInicio="", dataFim="" } = req.body
    
    const agendamentos = await AgendamentoModel.buscarAgendamentosPorData(dataInicio, dataFim);

    if (!agendamentos.sucesso) {
        res.status(400).render("erro", { identity:req.identity, mensagem:agendamentos.erro || "Ocorreu um erro ao buscar os agendamentos. Por favor, tente novamente" })
        return;
    }

    res.status(200).render("admAgendamentos", { identity:req.identity, agendamentos:agendamentos.result, dataInicio, dataFim })
}

// Renderizar a tela com detalhes de um agendamento do cliente
export const visualizarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        if (!agendamentoId) {
            res.redirect("/agendamentosClientes");
            return;
        }

        const agendamento = await AgendamentoModel.buscarAgendamentoPorId(agendamentoId, req.identity.pk_usuario_id);

        if (!agendamento) {
            res.redirect("/agendamentosClientes");
            return;
        }

        const servicos = await AgendamentoModel.buscarServicosPorAgendamento(agendamentoId);
        const todosStatus = await StatusModel.listar();

        const agendamentosMesmaSemana = await AgendamentoModel.buscarAgendamentoNaMesmaSemana(agendamento);
        
        res.status(200).render("admVisualizarAgendamento", { identity:req.identity, agendamento, servicos, todosStatus, agendamentosMesmaSemana })

    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

// Renderizar a tela de confirmação para cancelar o agendamento de um cliente
export const telaCancelarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        if (!agendamentoId) {
            res.redirect("/agendamentosClientes");
            return;
        }
        
        const agendamento = await AgendamentoModel.buscarAgendamentoPorId(agendamentoId);
        
        if (!agendamento) {
            res.redirect("/agendamentosClientes");
            return;
        }
        
        res.status(200).render("admCancelarAgendamento", { identity:req.identity, agendamento })

    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

// Tela de edição do agendamento de um cliente
export const telaEditarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        const agendamento = await AgendamentoModel.buscarAgendamentoPorId(agendamentoId);

        if (!agendamento) {
            res.status(400).redirect("/agendamentosClientes");
            return;
        }
        
        const { 
            novaData=false, novosServicos=false, novoHorario=false // Caso os valores não tenham sido recebidos do front-end, defini-los para false
        } = req.body;

        const data=agendamento.horario_inicio.toISOString().split('T')[0];
        const horario=agendamento.horario_inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'});
        const servicos = await AgendamentoModel.buscarServicosPorAgendamento(agendamentoId);
        const horarios = novaData ? await AgendamentoModel.buscarHorariosDisponiveisNoDia(novaData, servicos, agendamentoId) : false;

        const todosServicos = await ServicosModel.listar();

        if (horarios && !horarios.sucesso) {
            res.status(400).render("admEditarAgendamento", { identity:req.identity, agendamento, servicos, horarios:false, data, horario, todosServicos, mensagem:horarios.erro || "Ocorreu um erro ao buscar os horários. Por favor, tente novamente mais tarde",
                novoHorario, novaData, novosServicos
            });

            return;
        }


        res.status(200).render("admEditarAgendamento", { identity:req.identity, agendamento, servicos, horarios, data, horario, todosServicos, mensagem:false,
            novoHorario, novaData, novosServicos
            });

    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

// Confirmar edição do agendamento de um cliente (após tela de confirmação)
export const confirmarEditarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;
        
        const agendamento = await AgendamentoModel.buscarAgendamentoPorId(agendamentoId);

        if (!agendamento) {
            res.status(400).redirect(`/agendamentosClientes`);
            return;
        }

        const { 
            novaData=false, novosServicos=false, novoHorario=false // Caso os valores não tenham sido recebidos do front-end, defini-los para false
        } = req.body;

        const data=agendamento.horario_inicio.toISOString().split('T')[0];
        const horario=agendamento.horario_inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'});
        const servicos = await AgendamentoModel.buscarServicosPorAgendamento(agendamentoId);
        const horarios = novaData ? await AgendamentoModel.buscarHorariosDisponiveisNoDia(novaData, servicos) : false;

        if (horarios && !horarios.sucesso) {
            const todosServicos = await ServicosModel.listar();

            res.status(400).render("admEditarAgendamento", { identity:req.identity, agendamento, servicos, horarios, data, horario, todosServicos, mensagem:horarios.erro || "Ocorreu um erro ao buscar os horários. Por favor, tente novamente mais tarde",
                novoHorario, novaData, novosServicos
            });

            return;
        }

        if (!novaData || !novosServicos || !novosServicos.length || !novoHorario) {
            const todosServicos = await ServicosModel.listar();

            res.status(400).render("admEditarAgendamento", { identity:req.identity, agendamento, servicos, horarios, data, horario, todosServicos, mensagem:"Preencha todos os campos",
                novoHorario, novaData, novosServicos
            });
            return;
        }

        const result = await AgendamentoModel.editarAgendamento(agendamentoId, novaData, novosServicos, novoHorario, agendamento.pk_usuario_id);

        if (!result.sucesso) {
            const todosServicos = await ServicosModel.listar();

            res.status(400).render("admEditarAgendamento", { identity:req.identity, agendamento, servicos, horarios, data, horario, todosServicos, mensagem:result.erro || "Ocorreu um erro ao editar o agendamento. Por favor, tente novamente",
                novoHorario, novaData, novosServicos
            });
            return;
        }

        res.status(200).redirect(`/visualizarAgendamentoCliente/${agendamentoId}`);

    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

export const alterarStatusAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        const agendamento = await AgendamentoModel.buscarAgendamentoPorId(agendamentoId);

        if (!agendamento) {
            res.status(400).redirect(`/agendamentosClientes`);
            return;
        }

        const { statusId } = req.body;

        const result = await AgendamentoModel.alterarStatusAgendamento(agendamentoId, statusId);

        if (!result.sucesso) {
            res.status(400).redirect(`/visualizarAgendamentoCliente/${agendamentoId}`, {mensagem:result.erro || "Ocorreu um erro ao alterar o status do agendamento. Por favor, tente novamente"})
            return;
        }

        res.status(200).redirect(`/visualizarAgendamentoCliente/${agendamentoId}`);

    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

// Renderizar a tela de agendamentos na mesma semana
export const visualizarAgendamentosNaMesmaSemana = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        if (!agendamentoId) {
            res.redirect("/agendamentosClientes");
            return;
        }

        const agendamento = await AgendamentoModel.buscarAgendamentoPorId(agendamentoId, req.identity.pk_usuario_id);

        if (!agendamento) {
            res.redirect("/agendamentosClientes");
            return;
        }

        const agendamentosMesmaSemana = await AgendamentoModel.buscarAgendamentoNaMesmaSemana(agendamento);
        const diaAgendamentoMaisCedo = await AgendamentoModel.buscarPrimeiroAgendamentoDisponivel(agendamentosMesmaSemana);

        const servicosCadaAgendamento = [];

        for (const agendamento of agendamentosMesmaSemana) {
            const servicos = await AgendamentoModel.buscarServicosPorAgendamento(agendamento.pk_agendamento_id);
            servicosCadaAgendamento.push(servicos);
        }

        res.status(200).render("admAgendamentosMesmaSemana", { identity:req.identity, diaAgendamentoMaisCedo, servicosCadaAgendamento, agendamentosMesmaSemana, agendamento })

    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);
    }
}

export const reagendarAgendamentosDaMesmaSemana = async (req, res) => {
    try {
        const { agendamentoId, horario } = req.body;

        if (!agendamentoId || !horario) {
            res.status(400).redirect("/agendamentosClientes");
            return;
        }

        const result = await AgendamentoModel.reagendarAgendamentosDaMesmaSemana(agendamentoId, horario);

        if (!result.sucesso) {
            res.status(400).render("erro", {mensagem:result.erro || "Ocorreu um erro ao reagendar. Por favor, tente novamente", identity:req.identity})
            return
        }

        res.status(200).render("sucesso", {mensagem:"Os serviços foram reagendados com sucesso.", identity:req.identity})

    } catch (err) {
        res.status(400).render("erro", {mensagem:false, identity:req.identity});
        console.error(err);

    }
}