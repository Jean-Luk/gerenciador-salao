
async function initdb (pool) {

    try {
        // Verificar se já existe alguma tabela:
        const tableExists = await pool.query(`SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'usuarios'
            )
        `)
        if (tableExists.rows[0].exists) {
            return; // Tabelas já foram criadas
        }

        // Caso contrário, inicializar tabelas:
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                pk_usuario_id SERIAL PRIMARY KEY,
                cpf VARCHAR(11) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                nome VARCHAR(255) NOT NULL,
                senha VARCHAR(255) NOT NULL,
                salt VARCHAR(255) NOT NULL,
                token_autenticacao VARCHAR(255) UNIQUE,
                adm BOOLEAN DEFAULT FALSE,
                data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS status_agendamento (
                pk_status_id SERIAL PRIMARY KEY,
                nome_status VARCHAR(50) NOT NULL           
            );

            CREATE TABLE IF NOT EXISTS agendamentos (
                pk_agendamento_id SERIAL PRIMARY KEY,
                fk_usuario_id INT NOT NULL,
                horario_inicio TIMESTAMP NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fk_status_id INT NOT NULL,
                CONSTRAINT fk_usuario_id FOREIGN KEY (fk_usuario_id) REFERENCES usuarios(pk_usuario_id) ON DELETE CASCADE,
                CONSTRAINT fk_status_id FOREIGN KEY (fk_status_id) REFERENCES status_agendamento(pk_status_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS servicos (
                pk_servico_id SERIAL PRIMARY KEY,
                nome_servico VARCHAR(255),
                duracao_minutos INT
            );

            CREATE TABLE IF NOT EXISTS servicos_por_agendamento (
                pk_fk_agendamento_id INT,
                pk_fk_servico_id INT,
                PRIMARY KEY (pk_fk_agendamento_id, pk_fk_servico_id),
                CONSTRAINT pk_fk_agendamento_id FOREIGN KEY (pk_fk_agendamento_id) REFERENCES agendamentos(pk_agendamento_id) ON DELETE CASCADE,
                CONSTRAINT pk_fk_servico_id FOREIGN KEY (pk_fk_servico_id) REFERENCES servicos(pk_servico_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS dias_da_semana (
                pk_cod_dia INT PRIMARY KEY,
                nome_dia VARCHAR(13),
                ativo BOOLEAN
            );

            CREATE TABLE IF NOT EXISTS horario_funcionamento (
                pk_cod_horario SERIAL PRIMARY KEY,
                fk_cod_dia INT NOT NULL,
                horario_inicio TIME NOT NULL,
                horario_termino TIME NOT NULL
            )
        `)

        // Adicionar dados fundamentais
        await pool.query(`
            INSERT INTO servicos (nome_servico, duracao_minutos) VALUES 
            ('Corte', 30),
            ('Luzes', 60);

            INSERT INTO status_agendamento (nome_status) VALUES 
            ('A confirmar'),
            ('Confirmado'),
            ('Concluído');

            INSERT INTO dias_da_semana (pk_cod_dia, nome_dia, ativo) VALUES
            (0, 'domingo', false),
            (1, 'segunda-feira', true),
            (2, 'terça-feira', true),
            (3, 'quarta-feira', true),
            (4, 'quinta-feira', true),
            (5, 'sexta-feira', true),
            (6, 'sábado', false);
            `)
        

        // Adicionar horários de funcionamento apenas nos dias que são ativos
        const diasDaSemana = await pool.query(`SELECT pk_cod_dia, ativo FROM dias_da_semana`);

        for (const dia of diasDaSemana.rows) {
            if (dia.ativo) {
                await pool.query(`
                    INSERT INTO horario_funcionamento (fk_cod_dia, horario_inicio, horario_termino) VALUES
                    ($1, $2, $3)
                    `, [dia.pk_cod_dia, '08:30:00', '18:00:00']);
            }
        }

        console.log("> Tabelas criadas com sucesso")
    } catch (error) {
        console.error("# Erro ao verificar/criar tabelas: ", error);
    }
}

export default initdb;