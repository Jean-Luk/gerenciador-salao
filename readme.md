
# Gerenciador de agendamentos para salão
Sistema para criar/visualizar/atualizar/deletar agendamentos. O sistema armazena os agendamentos criados, impedindo a criação de 2 agendamentos no mesmo horário (contabilizando a duração estipulada do serviço).

### Tecnologias utilizadas:

✍ Javascript/Node  
📚 Express.js  
📚 EJS  
📚 Dotenv  
📚 pg  
📚 Cookie-Parser  
📚 Lodash  
🎲 PostgreSQL

### Instruções para rodar o projeto localmente:

Para executar o sistema localmente, é necessário ter instalado na máquina os aplicativos NodeJS e PostgreSQL (para a criação do banco de dados).
Primeiro, baixe o repositório do projeto e instale as dependências utilizando “npm i” no terminal.
Depois, configure o arquivo .env (crie um arquivo chamado .env no diretório do package.json) com os seguintes campos:

DATABASE_URL=postgresql://<nome_de_usuario>:<senha>@<host>:<porta>/<nome_do_banco_de_dados>  
AUTH_SECRET=<Segredo_para_geracao_das_senhas>  
PORT=8080  

DATABASE_URL é a url de conexão do banco de dados. O banco de dados pode ser criado localmente (nesse caso utilize localhost para <host>) ou ser acessado remotamente. Troque os <> pelo que for solicitado. A porta padrão para o postgreSQL é 5432
AUTH_SECRET é o segredo para geração das senhas, coloque qualquer palavra aleatória como “SEGREDO”
PORT é a porta que vai rodar o servidor (opcional).

Após realizar as configurações acima, digite “npm run start” para começar a rodar o projeto. As tabelas no banco de dados são criadas automaticamente caso ainda não existam, no entanto, o código SQL também está disponível. Abra seu navegador e digite localhost:PORT/ para acessar a página inicial.

### Principais funcionalidades:
- Clientes podem realizar agendamentos, selecionando os serviços desejados, data e horário de preferência. O sistema salva no banco de dados todos os agendamentos e impede que um sobreponha o outro.
- Os clientes podem visualizar seus agendamentos e editá-los com até 2 dias de antecedência.
- Os clientes podem cancelar seus agendamentos.
- O usuário administrador pode visualizar todos os agendamentos ou filtrá-los por período.
- O usuário adminsitrador pode editar e cancelar os agendamentos dos clientes.
- O sistema detecta automaticamente quando um cliente possui mais de 1 agendamento em um período menor que 7 dias, e notifica o administrador ao visualizá-los.
- O adminsitrador pode re-agendar estes serviços para um único horário, na data do agendamento que vem mais cedo.
- O administrador pode criar relatórios de agendamentos e clientes, para visualizar o desempenho do seu negócio.

### Considerações finais

Este projeto foi desenvolvido em 4 dias para um processo seletivo. Através dele, tive a oportunidade de colocar mais uma vez em prática os meus conhecimentos em programação e desenvolver um sistema até o final seguindo o relato de um cliente fictício.