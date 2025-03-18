import { listarAgendamentos, telaCancelarAgendamento, visualizarAgendamento, telaEditarAgendamento, confirmarEditarAgendamento, alterarStatusAgendamento, visualizarAgendamentosNaMesmaSemana, reagendarAgendamentosDaMesmaSemana, listarClientes, telaRelatorios, gerarRelatorio } from "../controllers/admController.js"
import { isAdministrator, isAuthenticated } from "../middlewares/index.js"

export default (router) => {
    router.get("/clientes", isAuthenticated, isAdministrator, listarClientes);
    
    router.get("/agendamentosClientes", isAuthenticated, isAdministrator, listarAgendamentos);
    router.post("/agendamentosClientes", isAuthenticated, isAdministrator, listarAgendamentos);
    router.get("/visualizarAgendamentoCliente/:id", isAuthenticated, isAdministrator, visualizarAgendamento);
    router.get("/cancelarAgendamentoCliente/:id", isAuthenticated, isAdministrator, telaCancelarAgendamento);

    router.get("/editarAgendamentoCliente/:id", isAuthenticated, isAdministrator, telaEditarAgendamento);
    router.post("/editarAgendamentoCliente/:id", isAuthenticated, isAdministrator, telaEditarAgendamento);
    router.post("/confirmarEditarAgendamentoCliente/:id", isAuthenticated, isAdministrator, confirmarEditarAgendamento);
 
    router.post("/alterarStatus/:id", isAuthenticated, isAdministrator, alterarStatusAgendamento);
 
    router.get("/agendamentosMesmaSemana/:id", isAuthenticated, isAdministrator, visualizarAgendamentosNaMesmaSemana);

    router.post("/reagendar", isAuthenticated, isAdministrator, reagendarAgendamentosDaMesmaSemana);
 
    router.get("/relatorios", isAuthenticated, isAdministrator, telaRelatorios);
    router.post("/relatorios", isAuthenticated, isAdministrator, gerarRelatorio);
}