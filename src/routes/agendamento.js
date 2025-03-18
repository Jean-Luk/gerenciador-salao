import { visualizarAgendamento, telaCancelarAgendamento, cancelarAgendamento, confirmarNovoAgendamento, telaEditarAgendamento, confirmarEditarAgendamento, telaAgendar, telaAgendamentos  } from "../controllers/agendarController.js"
import { isAuthenticated } from "../middlewares/index.js"

export default (router) => {
    router.get("/agendar", isAuthenticated, telaAgendar)
    router.post("/agendar", isAuthenticated, telaAgendar) // Agendamento confirmado
    router.post("/confirmarAgendamento", isAuthenticated, confirmarNovoAgendamento) // Agendamento confirmado

    router.get("/visualizarAgendamento/:id", isAuthenticated, visualizarAgendamento) // Visualizar detalhes de um agendamento
    router.get("/cancelarAgendamento/:id", isAuthenticated, telaCancelarAgendamento) // Tela de confirmação para cancelar agendamento
    router.post("/cancelarAgendamento/:id", isAuthenticated, cancelarAgendamento) // Agendamento cancelado

    router.get("/editarAgendamento/:id", isAuthenticated, telaEditarAgendamento) // Tela para editar agendamento
    router.post("/editarAgendamento/:id", isAuthenticated, telaEditarAgendamento) // Tela para editar agendamento
    router.post("/confirmarEditarAgendamento/:id", isAuthenticated, confirmarEditarAgendamento) // Tela para editar agendamento

    router.get("/agendamentos", isAuthenticated, telaAgendamentos)
    router.post("/agendamentos", isAuthenticated, telaAgendamentos)

}