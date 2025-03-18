import pkg from 'pg';
const { Pool } = pkg;

import dotenv from 'dotenv';
import dbinit from './dbinit.js'

dotenv.config();

const pool = new Pool ({
    connectionString: process.env.DATABASE_URL
});

pool.connect()
    .then(async (client) => {
        console.log(`> Conectado ao banco de dados: ${pool.options.database || pool.options.connectionString}`);
        await dbinit(pool);
        client.release();
    })
    .catch(err => {
        console.error("> Erro ao conectar ao banco de dados:", err);
    });

export default pool;