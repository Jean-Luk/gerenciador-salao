import AgendamentoModel from "../models/agendamentoModel.js"
import ServicosModel from "../models/servicosModel.js"


// Renderizar a tela inicial do formulário para agendar
export const telaAgendar = async (req, res) => {
    try {

        const { data=false, servicos=false, horario=false } = req.body;

        const todosServicos = await ServicosModel.listar();
        const horarios = data ? await AgendamentoModel.buscarHorariosDisponiveisNoDia(data, servicos) : false;

        if (horarios && !horarios.sucesso) {
            res.status(400).render("agendar", { identity:req.identity, mensagem:horarios.erro || "Ocorreu um erro ao buscar os horários. Por favor, tente novamente", sucesso:true, todosServicos, horarios:false, data, servicos, horario });
            return;
        }

        res.status(200).render("agendar", { identity:req.identity, mensagem:false, sucesso:true, todosServicos, horarios, data, servicos, horario });

    } catch (err) {
        console.error(err);
    }
}

// Renderizar a tela com a lista de agendamentos
export const telaAgendamentos = async (req, res) => {
    try {
        const { dataInicio="", dataFim="" } = req.body;

        const agendamentos = await AgendamentoModel.buscarAgendamentosPorUsuario(req.identity.pk_usuario_id, dataInicio, dataFim);

        if (!agendamentos.sucesso) {
            res.status(400).render("erro", { identity:req.identity, mensagem: agendamentos.erro || "Ocorreu um erro ao buscar os agendamentos. Por favor, tente novamente"})
            return;
        }

        res.status(200).render("agendamentos", { identity:req.identity, agendamentos:agendamentos.result, dataInicio, dataFim })

    } catch (err) {
        console.error(err);
    }
}

// Renderizar a tela com detalhes de um agendamento
export const visualizarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        if (!agendamentoId) {
            res.redirect("/agendamentos");
            return;
        }

        const agendamento = await AgendamentoModel.buscarAgendamentoPorIdPorUsuario(agendamentoId, req.identity.pk_usuario_id);

        if (!agendamento) {
            res.redirect("/agendamentos");
            return;
        }

        const servicos = await AgendamentoModel.buscarServicosPorAgendamento(agendamentoId);
        res.status(200).render("visualizarAgendamento", { identity:req.identity, agendamento, servicos })

    } catch (err) {
        console.error(err);
    }
}

// Renderizar a tela de confirmação para cancelar um agendamento
export const telaCancelarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        if (!agendamentoId) {
            res.redirect("/agendamentos");
            return;
        }

        const agendamento = await AgendamentoModel.buscarAgendamentoPorIdPorUsuario(agendamentoId, req.identity.pk_usuario_id);

        if (!agendamento) {
            res.redirect("/agendamentos");
            return;
        }
        
        res.status(200).render("cancelarAgendamento", { identity:req.identity, agendamento })

    } catch (err) {
        console.error(err);
    }
}

// Cancelar agendamento (após a tela de confirmação)
export const cancelarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        if (!agendamentoId) {
            res.redirect("/agendamentos");
            return;
        }

        const agendamento = req.identity.adm ? await AgendamentoModel.buscarAgendamentoPorId(agendamentoId) : await AgendamentoModel.buscarAgendamentoPorIdPorUsuario(agendamentoId, req.identity.pk_usuario_id);

        if (!agendamento) {
            res.redirect("/agendamentos");
            return;
        }
        
        const result = await AgendamentoModel.cancelarAgendamento(agendamentoId);

        if (!result.sucesso) {
            res.status(400).render("erro", {identity:req.identity, mensagem:result.erro || "Ocorreu um erro ao cancelar o agendamento"});
            return;
        }

        res.status(200).render("sucesso", {identity:req.identity, mensagem:"Agendamento cancelado com sucesso"});

    } catch (err) {
        console.error(err);
    }
}

// Criar novo agendamento (após a tela de confirmação);
export const confirmarNovoAgendamento = async (req, res) => {
    try {
        const { data=false, servicos=false, horario=false } = req.body;

        const todosServicos = await ServicosModel.listar();
        
        if (!data || !servicos || !servicos.length || !horario) {
            res.status(400).render("agendar", {identity:req.identity, mensagem:"Preencha todos os campos", sucesso:false, todosServicos, horarios:false, data, servicos});
            return;
        }
        
        const result = await AgendamentoModel.agendar(data, servicos, horario, req.identity.pk_usuario_id);

        if (!result.sucesso) {
            res.status(400).render("agendar", {identity:req.identity, mensagem:result.erro || "Ocorreu um erro ao realizar seu agendamento. Por favor, tente novamente", sucesso:false, todosServicos,  horarios:false, data, servicos, horario});
            return;
        }

        res.status(200).redirect("/agendamentos");

    } catch (err) {
        console.error(err);
    }
}

// Tela de edição de um agendamento:
export const telaEditarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;

        const agendamento = await AgendamentoModel.buscarAgendamentoPorIdPorUsuario(agendamentoId, req.identity.pk_usuario_id);

        // Id de agendamento não existe, ou pertence a outro usuário:
        if (!agendamento) {
            res.status(400).redirect(`/visualizarAgendamento/${agendamentoId}`);
            return;
        }


        // Verificar se faltam mais de 2 dias para o dia do agendamento:
        const hoje = new Date();
        const horarioAgendado = new Date (agendamento.horario_inicio);

        if ((horarioAgendado.getTime() - 1000 * 60 * 60 * 24 * 2) < hoje.getTime()) { // Faltam menos de 2 dias para o dia
            res.status(400).redirect(`/visualizarAgendamento/${agendamentoId}`);
            return;
        }
        
        const { 
            novaData=false, novosServicos=false, novoHorario=false // Caso os valores não tenham sido recebidos do front-end, defini-los para false
        } = req.body;

        const data=agendamento.horario_inicio.toISOString().split('T')[0];
        const horario=agendamento.horario_inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'});
        const servicos = await AgendamentoModel.buscarServicosPorAgendamento(agendamentoId);
        const horarios = novaData ? await AgendamentoModel.buscarHorariosDisponiveisNoDia(novaData, novosServicos) : false;

        const todosServicos = await ServicosModel.listar();

        if (horarios && !horarios.sucesso) {
            res.status(200).render("editarAgendamento", { identity:req.identity, agendamento, servicos, horarios, data, horario, todosServicos, mensagem:horarios.erro || "Ocorreu um erro ao buscar os horários. Por favor, tente novamente",
                novoHorario, novaData, novosServicos
                });
            return;
        }

        res.status(200).render("editarAgendamento", { identity:req.identity, agendamento, servicos, horarios, data, horario, todosServicos, mensagem:false,
            novoHorario, novaData, novosServicos
            });

    } catch (err) {
        console.error(err);
    }
}

// Confirmar edição de um agendamento (após tela de confirmação)
export const confirmarEditarAgendamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;
        
        const agendamento = await AgendamentoModel.buscarAgendamentoPorIdPorUsuario(agendamentoId, req.identity.pk_usuario_id);

        if (!agendamento) {
            res.status(400).redirect(`/agendamentos`);
            return;
        }

        const hoje = new Date();
        const horarioAgendado = new Date (agendamento.horario_inicio);

        if ((horarioAgendado.getTime() - 1000 * 60 * 60 * 24 * 2) < hoje.getTime()) { // Faltam menos de 2 dias para o dia
            res.status(400).redirect(`/visualizarAgendamento/${agendamentoId}`);
            return;
        }

        const { 
            novaData=false, novosServicos=false, novoHorario=false // Caso os valores não tenham sido recebidos do front-end, defini-los para false
        } = req.body;

        const data=agendamento.horario_inicio.toISOString().split('T')[0];
        const horario=agendamento.horario_inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'});
        const servicos = await AgendamentoModel.buscarServicosPorAgendamento(agendamentoId);
        const horarios = novaData ? await AgendamentoModel.buscarHorariosDisponiveisNoDia(novaData, novosServicos) : false;

        if (horarios && !horarios.sucesso) {
            const todosServicos = await ServicosModel.listar();

            res.status(400).render("agendar", { identity:req.identity, mensagem:horarios.erro || "Ocorreu um erro ao buscar os horários. Por favor, tente novamente", sucesso:true, todosServicos, horarios:false, data, servicos, horario });
            return;
        }

        if (!novaData || !novosServicos || !novosServicos.length || !novoHorario) {
            const todosServicos = await ServicosModel.listar();

            res.status(400).render("editarAgendamento", { identity:req.identity, agendamento, servicos, horarios, data, horario, todosServicos, mensagem:"Preencha todos os campos",
                novoHorario, novaData, novosServicos
            });
            return;
        }

        const result = await AgendamentoModel.editarAgendamento(agendamentoId, novaData, novosServicos, novoHorario);

        if (!result.sucesso) {
            const todosServicos = await ServicosModel.listar();

            res.status(400).render("editarAgendamento", { identity:req.identity, agendamento, servicos, horarios, data, horario, todosServicos, mensagem:result.erro || "Ocorreu um erro ao editar o agendamento. Por favor, tente novamente",
                novoHorario, novaData, novosServicos
            });
            return;
        }

        res.status(200).redirect("/agendamentos");

    } catch (err) {
        console.error(err);
    }
}

// let horaAtual = new Date(`2025-03-14T${inicio}:00`); // Define a hora de início
