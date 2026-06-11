import { readStore, resetStore, writeStore } from './persistentStore.js';

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();

function load() {
  return readStore();
}

function save(store) {
  return writeStore(store);
}

function byId(collection, id) {
  return collection.find((entry) => entry.id === id);
}

function ensureProduct(store, productId) {
  const product = byId(store.products, productId);
  if (!product) throw new Error(`Unknown product: ${productId}`);
  return product;
}

function ensureOwner(store, ownerId) {
  const owner = byId(store.owners, ownerId);
  if (!owner) throw new Error(`Unknown owner: ${ownerId}`);
  return owner;
}

function pushMovement(store, movement) {
  store.inventoryMovements.push({
    id: uid('mov'),
    createdAt: now(),
    ...movement
  });
}

function pushCash(store, entry) {
  store.cashMovements.push({
    id: uid('cash'),
    createdAt: now(),
    ...entry
  });
}

function pushBank(store, entry) {
  store.bankMovements.push({
    id: uid('bank'),
    createdAt: now(),
    ...entry
  });
}

function pushJournal(store, entry) {
  store.journalEntries.push({
    id: uid('jrn'),
    createdAt: now(),
    ...entry
  });
}

function recalcSale(store, sale) {
  const totalCost = sale.items.reduce((sum, item) => sum + item.costPrice * item.qty, 0);
  const totalRevenue = sale.items.reduce((sum, item) => sum + item.salePrice * item.qty, 0);
  sale.totalCost = totalCost;
  sale.totalRevenue = totalRevenue;
  sale.totalProfit = sale.finalBillAmount - totalCost;
  sale.profitRate = totalRevenue === 0 ? 0 : Math.round((sale.totalProfit / totalRevenue) * 10000) / 100;
  sale.ownerProfitDistribution = distributeProfitByCost(sale.items, sale.totalProfit);
  sale.ownerDistributionSummary = sale.ownerProfitDistribution.map((row) => ({
    ownerId: row.ownerId,
    ownerName: byId(store.owners, row.ownerId)?.name ?? 'Unassigned',
    profit: row.profit
  }));
}

function distributeProfitByCost(items, totalProfit) {
  const totalItemCost = items.reduce((sum, item) => sum + item.costPrice * item.qty, 0) || 1;
  const ownerMap = new Map();

  for (const item of items) {
    const share = (item.costPrice * item.qty) / totalItemCost;
    const ownerId = item.ownerId || 'unassigned';
    ownerMap.set(ownerId, (ownerMap.get(ownerId) ?? 0) + totalProfit * share);
  }

  return Array.from(ownerMap.entries()).map(([ownerId, profit]) => ({
    ownerId,
    profit: Math.round(profit * 100) / 100
  }));
}

export function listOwners() {
  const store = load();
  return store.owners;
}

export function createOwner(input) {
  const store = load();
  const owner = {
    id: uid('own'),
    status: 'active',
    ...input
  };
  store.owners.push(owner);
  save(store);
  return owner;
}

export function updateOwner(id, changes) {
  const store = load();
  const owner = byId(store.owners, id);
  if (!owner) return null;
  Object.assign(owner, changes);
  save(store);
  return owner;
}

export function updateOwnerStatus(id, status) {
  return updateOwner(id, { status });
}

export function listProducts() {
  const store = load();
  return store.products.map((product) => ({
    ...product,
    owner: byId(store.owners, product.ownerId) ?? null
  }));
}

export function getProducts() {
  return listProducts();
}

export function createProduct(input) {
  const store = load();
  ensureOwner(store, input.ownerId);
  const product = {
    id: uid('prod'),
    barcode: input.barcode ?? uid('bc'),
    name: input.name,
    category: input.category ?? 'General',
    brand: input.brand ?? 'Unbranded',
    color: input.color ?? 'N/A',
    size: input.size ?? 'N/A',
    ownerId: input.ownerId,
    costPrice: Number(input.costPrice ?? 0),
    salePrice: Number(input.salePrice ?? Number(input.costPrice ?? 0)),
    quantity: Number(input.quantity ?? 0),
    lowStockThreshold: Number(input.lowStockThreshold ?? 5),
    imageUrl: input.imageUrl ?? '',
    createdAt: now()
  };
  store.products.push(product);
  pushMovement(store, { type: 'product_create', productId: product.id, delta: product.quantity, reason: 'opening stock' });
  save(store);
  return product;
}

export function updateProduct(id, changes) {
  const store = load();
  const product = byId(store.products, id);
  if (!product) return null;
  if (changes.ownerId) ensureOwner(store, changes.ownerId);
  Object.assign(product, {
    ...changes,
    costPrice: changes.costPrice !== undefined ? Number(changes.costPrice) : product.costPrice,
    salePrice: changes.salePrice !== undefined ? Number(changes.salePrice) : product.salePrice,
    quantity: changes.quantity !== undefined ? Number(changes.quantity) : product.quantity,
    lowStockThreshold: changes.lowStockThreshold !== undefined ? Number(changes.lowStockThreshold) : product.lowStockThreshold
  });
  save(store);
  return product;
}

export function getProductLedger(productId) {
  const store = load();
  const product = byId(store.products, productId);
  if (!product) return null;
  return {
    product,
    movements: store.inventoryMovements.filter((movement) => movement.productId === productId),
    sales: store.sales
      .filter((sale) => sale.items.some((item) => item.productId === productId))
      .map((sale) => ({
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        date: sale.date,
        qty: sale.items.filter((item) => item.productId === productId).reduce((sum, item) => sum + item.qty, 0),
        finalBillAmount: sale.finalBillAmount,
        totalProfit: sale.totalProfit
      })),
    purchases: store.purchases
      .filter((purchase) => purchase.items.some((item) => item.productId === productId))
      .map((purchase) => ({
        id: purchase.id,
        invoiceNo: purchase.invoiceNo,
        date: purchase.date,
        qty: purchase.items.filter((item) => item.productId === productId).reduce((sum, item) => sum + item.qty, 0),
        totalCost: purchase.totalCost
      }))
  };
}

export function adjustProductQuantity(productId, delta, reason = 'adjustment', meta = {}) {
  const store = load();
  const product = byId(store.products, productId);
  if (!product) return null;
  product.quantity = Math.max(0, Number(product.quantity) + Number(delta));
  pushMovement(store, { type: 'adjustment', productId, delta: Number(delta), reason, ...meta });
  save(store);
  return product;
}

export function stockEntry({ productId, qty, costPrice, ownerId, branchId, source = 'stock_entry' }) {
  const store = load();
  const product = ensureProduct(store, productId);
  if (ownerId) ensureOwner(store, ownerId);
  product.quantity += Number(qty);
  if (costPrice !== undefined) product.costPrice = Number(costPrice);
  if (ownerId) product.ownerId = ownerId;
  pushMovement(store, { type: source, productId, delta: Number(qty), reason: 'stock in', branchId, ownerId, costPrice: Number(costPrice ?? product.costPrice) });
  save(store);
  return product;
}

export function stockTransfer({ productId, qty, fromBranchId, toBranchId }) {
  const store = load();
  const product = ensureProduct(store, productId);
  const moveQty = Number(qty);
  if (product.quantity < moveQty) throw new Error('Insufficient stock for transfer');
  pushMovement(store, {
    type: 'transfer_out',
    productId,
    delta: 0,
    qty: moveQty,
    reason: `transfer to ${toBranchId}`,
    branchId: fromBranchId
  });
  pushMovement(store, {
    type: 'transfer_in',
    productId,
    delta: 0,
    qty: moveQty,
    reason: `transfer from ${fromBranchId}`,
    branchId: toBranchId
  });
  save(store);
  return product;
}

export function markDamage({ productId, qty, reason }) {
  return adjustProductQuantity(productId, -Math.abs(Number(qty)), reason ?? 'damage', { type: 'damage' });
}

export function markMissing({ productId, qty, reason }) {
  return adjustProductQuantity(productId, -Math.abs(Number(qty)), reason ?? 'missing', { type: 'missing' });
}

export function auditStock({ productId, systemQty, actualQty, branchId }) {
  const delta = Number(actualQty) - Number(systemQty);
  const product = adjustProductQuantity(productId, delta, 'stock audit', { type: 'audit', systemQty: Number(systemQty), actualQty: Number(actualQty), branchId });
  return { product, delta };
}

export function listInventoryMovements() {
  const store = load();
  return store.inventoryMovements;
}

export function listLowStockProducts() {
  const store = load();
  return store.products.filter((product) => product.quantity <= product.lowStockThreshold);
}

export function listPurchases() {
  const store = load();
  return store.purchases;
}

export function getPurchases() {
  return listPurchases();
}

export function createPurchase(input) {
  const store = load();
  const supplier = input.supplierId ? ensureOwner(store, input.supplierId) : null;
  const items = input.items.map((item) => {
    const product = ensureProduct(store, item.productId);
    const qty = Number(item.qty);
    const costPrice = Number(item.costPrice ?? product.costPrice);
    product.quantity += qty;
    product.costPrice = costPrice;
    if (item.ownerId) product.ownerId = item.ownerId;
    pushMovement(store, { type: 'purchase_in', productId: product.id, delta: qty, reason: 'purchase entry', supplierId: supplier?.id ?? null, costPrice });
    return {
      productId: product.id,
      productName: product.name,
      qty,
      costPrice,
      ownerId: product.ownerId
    };
  });

  const totalCost = items.reduce((sum, item) => sum + item.qty * item.costPrice, 0);
  const paidAmount = Number(input.paidAmount ?? 0);
  const purchase = {
    id: uid('pur'),
    invoiceNo: input.invoiceNo ?? `PUR-${1000 + store.purchases.length + 1}`,
    supplierId: supplier?.id ?? input.supplierId ?? null,
    supplierName: supplier?.name ?? input.supplierName ?? 'Unknown Supplier',
    branchId: input.branchId ?? 'branch_main',
    date: input.date ?? now(),
    paymentMethod: input.paymentMethod ?? 'cash',
    items,
    totalCost,
    paidAmount,
    balance: totalCost - paidAmount,
    status: input.status ?? (paidAmount >= totalCost ? 'paid' : 'partial')
  };

  store.purchases.push(purchase);
  if (paidAmount > 0) {
    pushCash(store, { type: 'purchase_payment', amount: paidAmount, referenceId: purchase.id, direction: 'out' });
  }
  pushJournal(store, { type: 'purchase', referenceId: purchase.id, debit: totalCost, credit: 0, note: purchase.invoiceNo });
  save(store);
  return purchase;
}

export function recordPurchasePayment({ purchaseId, amount, method = 'cash', note = '' }) {
  const store = load();
  const purchase = byId(store.purchases, purchaseId);
  if (!purchase) return null;
  const payment = Number(amount);
  purchase.paidAmount = Number(purchase.paidAmount) + payment;
  purchase.balance = Math.max(0, purchase.totalCost - purchase.paidAmount);
  purchase.status = purchase.balance === 0 ? 'paid' : 'partial';
  pushCash(store, { type: 'supplier_payment', amount: payment, referenceId: purchaseId, direction: 'out', method, note });
  save(store);
  return purchase;
}

export function returnPurchase({ purchaseId, items, reason = '' }) {
  const store = load();
  const purchase = byId(store.purchases, purchaseId);
  if (!purchase) throw new Error('Purchase not found');
  const returnItems = items.map((item) => {
    const product = ensureProduct(store, item.productId);
    const qty = Number(item.qty);
    product.quantity = Math.max(0, product.quantity - qty);
    pushMovement(store, { type: 'purchase_return', productId: product.id, delta: -qty, reason: reason || 'purchase return', referenceId: purchaseId });
    return { productId: product.id, productName: product.name, qty, costPrice: Number(item.costPrice ?? product.costPrice) };
  });
  const returnTotal = returnItems.reduce((sum, item) => sum + item.qty * item.costPrice, 0);
  const record = {
    id: uid('prt'),
    purchaseId,
    date: now(),
    reason,
    items: returnItems,
    returnTotal
  };
  store.purchaseReturns.push(record);
  save(store);
  return record;
}

export function listSales() {
  const store = load();
  return store.sales;
}

export function getSales() {
  return listSales();
}

export function holdSale(input) {
  const store = load();
  const sale = {
    id: uid('hold'),
    draftName: input.draftName ?? `Draft ${store.saleHolds.length + 1}`,
    date: input.date ?? now(),
    customerName: input.customerName ?? 'Walk-in Customer',
    items: input.items ?? [],
    note: input.note ?? ''
  };
  store.saleHolds.push(sale);
  save(store);
  return sale;
}

export function listSaleHolds() {
  const store = load();
  return store.saleHolds;
}

export function resumeSale(id) {
  const store = load();
  const index = store.saleHolds.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  const [sale] = store.saleHolds.splice(index, 1);
  save(store);
  return sale;
}

export function createSale(input) {
  const store = load();
  const customer = input.customerId ? byId(store.customers, input.customerId) : null;
  const customerName = input.customerName ?? customer?.name ?? 'Walk-in Customer';

  const items = input.items.map((item) => {
    const product = ensureProduct(store, item.productId);
    const qty = Number(item.qty);
    if (product.quantity < qty) throw new Error(`Insufficient stock for ${product.name}`);
    product.quantity -= qty;
    return {
      productId: product.id,
      productName: product.name,
      ownerId: product.ownerId,
      qty,
      salePrice: Number(item.salePrice ?? product.salePrice),
      costPrice: Number(item.costPrice ?? product.costPrice)
    };
  });

  const sale = {
    id: uid('sale'),
    invoiceNo: input.invoiceNo ?? `INV-${1000 + store.sales.length + 1}`,
    customerId: customer?.id ?? input.customerId ?? null,
    customerName,
    date: input.date ?? now(),
    paymentMethod: input.paymentMethod ?? 'cash',
    items,
    finalBillAmount: Number(input.finalBillAmount ?? items.reduce((sum, item) => sum + item.salePrice * item.qty, 0)),
    status: input.status ?? 'completed',
    profitMode: input.profitMode ?? 'automatic'
  };

  recalcSale(store, sale);
  store.sales.push(sale);
  pushCash(store, {
    type: 'sale',
    amount: sale.finalBillAmount,
    referenceId: sale.id,
    direction: 'in',
    method: sale.paymentMethod
  });
  pushJournal(store, { type: 'sale', referenceId: sale.id, debit: 0, credit: sale.finalBillAmount, note: sale.invoiceNo });
  save(store);
  return sale;
}

export function listCustomers() {
  const store = load();
  return store.customers;
}

export function getCustomers() {
  return listCustomers();
}

export function createCustomer(input) {
  const store = load();
  const customer = {
    id: uid('cust'),
    name: input.name,
    mobile: input.mobile ?? '',
    address: input.address ?? '',
    createdAt: now()
  };
  store.customers.push(customer);
  save(store);
  return customer;
}

export function listCashMovements() {
  const store = load();
  return store.cashMovements;
}

export function getCashMovements() {
  return listCashMovements();
}

export function recordCashMovement(input) {
  const store = load();
  const entry = {
    id: uid('cash'),
    type: input.type ?? 'manual',
    direction: input.direction ?? 'in',
    amount: Number(input.amount ?? 0),
    note: input.note ?? '',
    referenceId: input.referenceId ?? null,
    createdAt: now()
  };
  store.cashMovements.push(entry);
  save(store);
  return entry;
}

export function listBankMovements() {
  const store = load();
  return store.bankMovements;
}

export function getBankMovements() {
  return listBankMovements();
}

export function recordBankMovement(input) {
  const store = load();
  const entry = {
    id: uid('bank'),
    type: input.type ?? 'deposit',
    direction: input.direction ?? 'in',
    amount: Number(input.amount ?? 0),
    bankName: input.bankName ?? 'Main Bank',
    note: input.note ?? '',
    referenceId: input.referenceId ?? null,
    createdAt: now()
  };
  store.bankMovements.push(entry);
  save(store);
  return entry;
}

export function listBranches() {
  const store = load();
  return store.branches;
}

export function getBranches() {
  return listBranches();
}

export function createBranch(input) {
  const store = load();
  const branch = {
    id: uid('branch'),
    name: input.name,
    status: input.status ?? 'active'
  };
  store.branches.push(branch);
  save(store);
  return branch;
}

export function updateBranch(id, changes) {
  const store = load();
  const branch = byId(store.branches, id);
  if (!branch) return null;
  Object.assign(branch, changes);
  save(store);
  return branch;
}

export function getDashboardSummary() {
  const store = load();
  const inventoryValue = store.products.reduce((sum, product) => sum + product.quantity * product.costPrice, 0);
  const totalSales = store.sales.reduce((sum, sale) => sum + sale.finalBillAmount, 0);
  const totalCost = store.sales.reduce((sum, sale) => sum + sale.totalCost, 0);
  const totalProfit = store.sales.reduce((sum, sale) => sum + sale.totalProfit, 0);
  const lowStock = store.products.filter((product) => product.quantity <= product.lowStockThreshold);

  const ownerProfitMap = new Map();
  for (const sale of store.sales) {
    for (const row of sale.ownerProfitDistribution ?? distributeProfitByCost(sale.items, sale.totalProfit)) {
      ownerProfitMap.set(row.ownerId, (ownerProfitMap.get(row.ownerId) ?? 0) + row.profit);
    }
  }

  return {
    today: now().slice(0, 10),
    ownerCount: store.owners.length,
    productCount: store.products.length,
    saleCount: store.sales.length,
    purchaseCount: store.purchases.length,
    branchCount: store.branches.length,
    inventoryValue,
    totalSales,
    totalCost,
    totalProfit,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock,
    topSellingProducts: store.products
      .map((product) => ({
        ...product,
        soldQty: store.sales.reduce((sum, sale) => sum + sale.items.filter((item) => item.productId === product.id).reduce((s, item) => s + item.qty, 0), 0)
      }))
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, 5),
    ownerProfitSummary: Array.from(ownerProfitMap.entries()).map(([ownerId, profit]) => ({
      ownerId,
      ownerName: byId(store.owners, ownerId)?.name ?? 'Unassigned',
      ownerType: byId(store.owners, ownerId)?.type ?? 'Unassigned',
      profit: Math.round(profit * 100) / 100
    }))
  };
}

export function getOwnerDashboard(ownerId) {
  const store = load();
  const owner = byId(store.owners, ownerId);
  if (!owner) return null;

  const products = store.products.filter((product) => product.ownerId === ownerId);
  const relatedSales = store.sales.filter((sale) => sale.items.some((item) => item.ownerId === ownerId));
  const stockValue = products.reduce((sum, product) => sum + product.quantity * product.costPrice, 0);
  const saleTotal = relatedSales.reduce((sum, sale) => sum + sale.finalBillAmount, 0);
  const costTotal = relatedSales.reduce((sum, sale) => sum + sale.totalCost, 0);
  const profitTotal = relatedSales.reduce((sum, sale) => sum + (sale.ownerProfitDistribution?.find((row) => row.ownerId === ownerId)?.profit ?? 0), 0);

  return {
    owner,
    stockValue,
    saleTotal,
    costTotal,
    profitTotal,
    payable: Math.max(0, profitTotal - 0),
    products,
    sales: relatedSales
  };
}

export function getOwnerStatement(ownerId) {
  const store = load();
  const owner = byId(store.owners, ownerId);
  if (!owner) return null;

  const products = store.products.filter((product) => product.ownerId === ownerId);
  const relatedSales = store.sales.filter((sale) => sale.items.some((item) => item.ownerId === ownerId));
  const productIds = new Set(products.map((product) => product.id));

  const stockValue = products.reduce((sum, product) => sum + product.quantity * product.costPrice, 0);
  const saleTotal = relatedSales.reduce((sum, sale) => sum + sale.finalBillAmount, 0);
  const costTotal = relatedSales.reduce((sum, sale) => sum + sale.totalCost, 0);
  const profitTotal = relatedSales.reduce((sum, sale) => sum + (sale.ownerProfitDistribution?.find((row) => row.ownerId === ownerId)?.profit ?? 0), 0);
  const stockIn = store.inventoryMovements.filter((movement) => movement.delta > 0 && productIds.has(movement.productId));
  const stockOut = store.inventoryMovements.filter((movement) => movement.delta < 0 && productIds.has(movement.productId));

  return {
    owner,
    stockValue,
    saleTotal,
    costTotal,
    profitTotal,
    balance: saleTotal - costTotal,
    products,
    sales: relatedSales,
    stockIn,
    stockOut,
    summary: {
      totalInventoryValue: stockValue,
      totalSales: saleTotal,
      totalProfit: profitTotal,
      totalPayable: Math.max(0, profitTotal * 0.25)
    }
  };
}

export function getWholesalerStatement(ownerId) {
  return getOwnerStatement(ownerId);
}

export function getProductHistory(productId) {
  const store = load();
  const product = byId(store.products, productId);
  if (!product) return null;

  return {
    product,
    stockMovements: store.inventoryMovements.filter((movement) => movement.productId === productId),
    saleHistory: store.sales.filter((sale) => sale.items.some((item) => item.productId === productId)),
    purchaseHistory: store.purchases.filter((purchase) => purchase.items.some((item) => item.productId === productId)),
    returnHistory: store.purchaseReturns.filter((ret) => ret.items.some((item) => item.productId === productId))
  };
}

export function getReports() {
  const summary = getDashboardSummary();
  const store = load();
  return {
    summary,
    dailySales: store.sales,
    dailyPurchases: store.purchases,
    dailyProfit: summary.totalProfit,
    monthlySales: store.sales,
    monthlyPurchases: store.purchases,
    monthlyProfit: summary.totalProfit,
    lowStockProducts: summary.lowStockProducts
  };
}

export function getLedgerSnapshot() {
  const store = load();
  return {
    cash: store.cashMovements,
    bank: store.bankMovements,
    journals: store.journalEntries
  };
}

export function getStockSummary() {
  const store = load();
  return {
    currentStock: store.products,
    movements: store.inventoryMovements,
    lowStockProducts: listLowStockProducts()
  };
}

export function getAllData() {
  return load();
}

export function resetAllData() {
  return resetStore();
}
