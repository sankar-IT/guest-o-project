import express from 'express';
import { getAllTables, getTableDetails, createTable, deleteTable } from '../controllers/tableController.js';

const router = express.Router();

router.get('/', getAllTables);
router.post('/', createTable);
router.get('/:tableId', getTableDetails);
router.delete('/:tableId', deleteTable);

export default router;
