import express from 'express';
// import cors from 'cors';
import router from './routes/index.js'
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Configurações iniciais:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();


// Configurações iniciais do servidor:
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));



// Configurações EJS:
app.set("view engine", "ejs");
app.set("views", "./src/views");

// // Rotas:
app.use('/', router);

// Iniciar aplicação:
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`> Servidor rodando na porta ${PORT}`));
