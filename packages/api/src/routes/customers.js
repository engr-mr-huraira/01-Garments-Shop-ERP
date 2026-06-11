import express from 'express';
import { createCustomer, listCustomers } from '../services/erpStore.js';

export const customersRouter = express.Router();

customersRouter.get('/', (_req, res) => {
  res.json({ data: listCustomers() });
});

customersRouter.post('/', (req, res) => {
  try {
    const customer = createCustomer(req.body);
    res.status(201).json({ data: customer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

