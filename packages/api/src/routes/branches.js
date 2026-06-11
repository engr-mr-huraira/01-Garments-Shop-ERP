import express from 'express';
import { createBranch, listBranches, updateBranch } from '../services/erpStore.js';

export const branchesRouter = express.Router();

branchesRouter.get('/', (_req, res) => {
  res.json({ data: listBranches() });
});

branchesRouter.post('/', (req, res) => {
  try {
    const branch = createBranch(req.body);
    res.status(201).json({ data: branch });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

branchesRouter.patch('/:id', (req, res) => {
  const branch = updateBranch(req.params.id, req.body);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json({ data: branch });
});

