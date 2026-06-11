import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const dbFile = path.join(dataDir, 'runtime-db.json');

const seed = {
  meta: { version: 1, createdAt: new Date().toISOString() },
  owners: [
    { id: 'own_partner_1', name: 'Partner 1', type: 'Partner', cnic: '35202-1234567-1', mobile: '0300-1111111', address: 'Head Office', status: 'active' },
    { id: 'own_partner_2', name: 'Partner 2', type: 'Partner', cnic: '35202-1234567-2', mobile: '0300-2222222', address: 'Warehouse A', status: 'active' },
    { id: 'own_partner_3', name: 'Partner 3', type: 'Partner', cnic: '35202-1234567-3', mobile: '0300-3333333', address: 'Warehouse B', status: 'active' },
    { id: 'own_wholesaler_a', name: 'Wholesaler A', type: 'Wholesaler', cnic: '35202-2234567-1', mobile: '0300-4444444', address: 'Market Road', status: 'active' },
    { id: 'own_wholesaler_b', name: 'Wholesaler B', type: 'Wholesaler', cnic: '35202-2234567-2', mobile: '0300-5555555', address: 'City Center', status: 'active' }
  ],
  branches: [
    { id: 'branch_main', name: 'Main Branch', status: 'active' },
    { id: 'branch_east', name: 'East Branch', status: 'active' }
  ],
  products: [
    { id: 'prod_jeans_blue_32', barcode: '8901234567890', name: 'Jeans', category: 'Men Wear', brand: 'Levis', color: 'Blue', size: '32', ownerId: 'own_partner_1', costPrice: 1200, salePrice: 1500, quantity: 18, lowStockThreshold: 5, imageUrl: '', createdAt: new Date().toISOString() },
    { id: 'prod_shirt_white_l', barcode: '8901234567891', name: 'Casual Shirt', category: 'Men Wear', brand: 'Denim Co', color: 'White', size: 'L', ownerId: 'own_wholesaler_a', costPrice: 800, salePrice: 1100, quantity: 26, lowStockThreshold: 6, imageUrl: '', createdAt: new Date().toISOString() }
  ],
  customers: [
    { id: 'cust_walkin', name: 'Walk-in Customer', mobile: '', address: '', createdAt: new Date().toISOString() }
  ],
  purchases: [],
  purchaseReturns: [],
  sales: [],
  saleHolds: [],
  inventoryMovements: [],
  cashMovements: [],
  bankMovements: [],
  journalEntries: []
};

function ensureSeedFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify(seed, null, 2));
  }
}

export function readStore() {
  ensureSeedFile();
  const raw = fs.readFileSync(dbFile, 'utf8');
  return JSON.parse(raw);
}

export function writeStore(store) {
  ensureSeedFile();
  fs.writeFileSync(dbFile, JSON.stringify(store, null, 2));
  return store;
}

export function resetStore() {
  return writeStore(structuredClone(seed));
}

