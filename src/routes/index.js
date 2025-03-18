import express from 'express';

import views from './views.js';
import auth from './auth.js';
import agendamento from './agendamento.js';
import adm from './adm.js';

const router = express.Router();

views(router);
auth(router);
agendamento(router);
adm(router);

export default router;
