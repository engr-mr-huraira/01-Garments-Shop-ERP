import express from 'express';
import { createOwner, getOwnerDashboard, getOwnerStatement, listOwners, updateOwner, updateOwnerStatus } from '../services/erpStore.js';

export const ownersRouter = express.Router();

ownersRouter.get('/', (_req, res) => {
  res.json({ data: listOwners() });
});

ownersRouter.post('/', (req, res) => {
  const owner = createOwner(req.body);
  res.status(201).json({ data: owner });
});

ownersRouter.patch('/:id', (req, res) => {
  const owner = updateOwner(req.params.id, req.body);
  if (!owner) return res.status(404).json({ error: 'Owner not found' });
  res.json({ data: owner });
});

ownersRouter.patch('/:id/status', (req, res) => {
  const owner = updateOwnerStatus(req.params.id, req.body.status);
  if (!owner) return res.status(404).json({ error: 'Owner not found' });
  res.json({ data: owner });
});

ownersRouter.get('/:id/dashboard', (req, res) => {
  const dashboard = getOwnerDashboard(req.params.id);
  if (!dashboard) return res.status(404).json({ error: 'Owner not found' });
  res.json({ data: dashboard });
});

ownersRouter.get('/:id/statement', (req, res) => {
  const statement = getOwnerStatement(req.params.id);
  if (!statement) return res.status(404).json({ error: 'Owner not found' });
  res.json({ data: statement });
});
