import React, { useEffect, useState } from 'react';

const API = 'http://localhost:4000';

const tabs = [
  'Dashboard',
  'Owners',
  'Products',
  'Inventory',
  'Purchases',
  'POS',
  'Customers',
  'Branches',
  'Cash & Bank',
  'Reports'
];

const emptyOwner = {
  name: '',
  type: 'Partner',
  cnic: '',
  mobile: '',
  address: ''
};

const emptyProduct = {
  barcode: '',
  name: '',
  category: 'Men Wear',
  brand: '',
  color: '',
  size: '',
  ownerId: '',
  costPrice: '',
  salePrice: '',
  quantity: '',
  lowStockThreshold: 5,
  imageUrl: ''
};

const emptyPurchase = {
  invoiceNo: '',
  supplierId: '',
  branchId: 'branch_main',
  productId: '',
  qty: '',
  costPrice: '',
  paidAmount: '',
  paymentMethod: 'cash'
};

const emptyCustomer = { name: '', mobile: '', address: '' };
const emptyBranch = { name: '', status: 'active' };

const emptyCash = { type: 'cash_in', direction: 'in', amount: '', note: '' };
const emptyBank = { type: 'deposit', direction: 'in', amount: '', bankName: 'Main Bank', note: '' };

const emptyStockEntry = { productId: '', qty: '', costPrice: '', ownerId: '', branchId: 'branch_main' };
const emptyTransfer = { productId: '', qty: '', fromBranchId: 'branch_main', toBranchId: 'branch_east' };
const emptyAudit = { productId: '', systemQty: '', actualQty: '', branchId: 'branch_main' };

function fmt(amount) {
  return `Rs ${Number(amount || 0).toLocaleString()}`;
}

function Section({ title, action, children }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, className = '', children }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return <input className="control" {...props} />;
}

function Select(props) {
  return <select className="control" {...props} />;
}

function Textarea(props) {
  return <textarea className="control" {...props} />;
}

async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

async function apiSend(path, method, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

export default function App() {
  const [tab, setTab] = useState('Dashboard');
  const [summary, setSummary] = useState(null);
  const [owners, setOwners] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cash, setCash] = useState([]);
  const [bank, setBank] = useState([]);
  const [branches, setBranches] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [heldBills, setHeldBills] = useState([]);
  const [report, setReport] = useState(null);
  const [selectedOwnerStatement, setSelectedOwnerStatement] = useState(null);
  const [selectedProductHistory, setSelectedProductHistory] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [message, setMessage] = useState('');

  const [ownerForm, setOwnerForm] = useState(emptyOwner);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchase);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [branchForm, setBranchForm] = useState(emptyBranch);
  const [cashForm, setCashForm] = useState(emptyCash);
  const [bankForm, setBankForm] = useState(emptyBank);
  const [stockEntryForm, setStockEntryForm] = useState(emptyStockEntry);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [auditForm, setAuditForm] = useState(emptyAudit);

  const [saleCart, setSaleCart] = useState([]);
  const [saleDraft, setSaleDraft] = useState({ invoiceNo: '', customerId: '', customerName: 'Walk-in Customer', finalBillAmount: '', paymentMethod: 'cash' });
  const [purchaseCart, setPurchaseCart] = useState([]);
  const [editingOwnerId, setEditingOwnerId] = useState('');
  const [editingProductId, setEditingProductId] = useState('');

  async function loadAll() {
    const [
      dashboard,
      ownersData,
      productsData,
      purchasesData,
      salesData,
      customersData,
      cashData,
      bankData,
      branchesData,
      lowStockData,
      holdsData,
      reportData
    ] = await Promise.all([
      apiGet('/analytics/dashboard'),
      apiGet('/owners'),
      apiGet('/products'),
      apiGet('/purchases'),
      apiGet('/sales'),
      apiGet('/customers'),
      apiGet('/cash'),
      apiGet('/bank'),
      apiGet('/branches'),
      apiGet('/reports/low-stock'),
      apiGet('/sales/holds'),
      apiGet('/analytics/reports')
    ]);

    setSummary(dashboard);
    setOwners(ownersData);
    setProducts(productsData);
    setPurchases(purchasesData);
    setSales(salesData);
    setCustomers(customersData);
    setCash(cashData);
    setBank(bankData);
    setBranches(branchesData);
    setLowStock(lowStockData);
    setHeldBills(holdsData);
    setReport(reportData);
    if (!stockEntryForm.ownerId && ownersData[0]) {
      setStockEntryForm((prev) => ({ ...prev, ownerId: ownersData[0].id }));
    }
    if (!purchaseForm.supplierId && ownersData[0]) {
      setPurchaseForm((prev) => ({ ...prev, supplierId: ownersData[0].id }));
    }
  }

  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);

  function notify(text) {
    setMessage(text);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setMessage(''), 3500);
  }

  async function refreshAfter(action) {
    try {
      await action();
      await loadAll();
    } catch (error) {
      notify(error.message);
    }
  }

  async function submitOwner(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      if (editingOwnerId) {
        await apiSend(`/owners/${editingOwnerId}`, 'PATCH', ownerForm);
      } else {
        await apiSend('/owners', 'POST', ownerForm);
      }
      setOwnerForm(emptyOwner);
      setEditingOwnerId('');
      notify('Owner saved');
    });
  }

  async function submitProduct(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      const payload = {
        ...productForm,
        costPrice: Number(productForm.costPrice),
        salePrice: Number(productForm.salePrice),
        quantity: Number(productForm.quantity),
        lowStockThreshold: Number(productForm.lowStockThreshold)
      };
      if (editingProductId) {
        await apiSend(`/products/${editingProductId}`, 'PATCH', payload);
      } else {
        await apiSend('/products', 'POST', payload);
      }
      setProductForm(emptyProduct);
      setEditingProductId('');
      notify('Product saved');
    });
  }

  async function submitStockEntry(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      await apiSend('/inventory/entry', 'POST', {
        ...stockEntryForm,
        qty: Number(stockEntryForm.qty),
        costPrice: Number(stockEntryForm.costPrice)
      });
      setStockEntryForm(emptyStockEntry);
      notify('Stock entry recorded');
    });
  }

  async function submitTransfer(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      await apiSend('/inventory/transfer', 'POST', {
        ...transferForm,
        qty: Number(transferForm.qty)
      });
      setTransferForm(emptyTransfer);
      notify('Stock transferred');
    });
  }

  async function submitAudit(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      await apiSend('/inventory/audit', 'POST', {
        ...auditForm,
        systemQty: Number(auditForm.systemQty),
        actualQty: Number(auditForm.actualQty)
      });
      setAuditForm(emptyAudit);
      notify('Audit saved');
    });
  }

  async function submitPurchase(e) {
    e.preventDefault();
    const items = purchaseCart.length
      ? purchaseCart
      : purchaseForm.productId
        ? [{ productId: purchaseForm.productId, qty: Number(purchaseForm.qty), costPrice: Number(purchaseForm.costPrice) }]
        : [];
    await refreshAfter(async () => {
      if (!items.length) throw new Error('Purchase cart is empty');
      await apiSend('/purchases', 'POST', {
        invoiceNo: purchaseForm.invoiceNo,
        supplierId: purchaseForm.supplierId,
        branchId: purchaseForm.branchId,
        paymentMethod: purchaseForm.paymentMethod,
        paidAmount: Number(purchaseForm.paidAmount || 0),
        items
      });
      setPurchaseForm(emptyPurchase);
      setPurchaseCart([]);
      notify('Purchase saved');
    });
  }

  async function submitCash(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      await apiSend('/cash', 'POST', {
        ...cashForm,
        amount: Number(cashForm.amount)
      });
      setCashForm(emptyCash);
      notify('Cash entry saved');
    });
  }

  async function submitBank(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      await apiSend('/bank', 'POST', {
        ...bankForm,
        amount: Number(bankForm.amount)
      });
      setBankForm(emptyBank);
      notify('Bank entry saved');
    });
  }

  async function submitCustomer(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      await apiSend('/customers', 'POST', customerForm);
      setCustomerForm(emptyCustomer);
      notify('Customer saved');
    });
  }

  async function submitBranch(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      await apiSend('/branches', 'POST', branchForm);
      setBranchForm(emptyBranch);
      notify('Branch saved');
    });
  }

  function addSaleItem(productId) {
    const product = products.find((entry) => entry.id === productId);
    if (!product) return;
    setSaleCart((current) => {
      const found = current.find((item) => item.productId === productId);
      if (found) {
        return current.map((item) => (item.productId === productId ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...current, { productId, productName: product.name, qty: 1, salePrice: Number(product.salePrice), costPrice: Number(product.costPrice) }];
    });
  }

  async function submitSale(e) {
    e.preventDefault();
    await refreshAfter(async () => {
      if (!saleCart.length) throw new Error('Sale cart is empty');
      const payload = {
        invoiceNo: saleDraft.invoiceNo,
        customerId: saleDraft.customerId || undefined,
        customerName: saleDraft.customerName,
        finalBillAmount: saleDraft.finalBillAmount === '' ? undefined : Number(saleDraft.finalBillAmount),
        paymentMethod: saleDraft.paymentMethod,
        items: saleCart.map((item) => ({
          productId: item.productId,
          qty: Number(item.qty),
          salePrice: Number(item.salePrice),
          costPrice: Number(item.costPrice)
        }))
      };
      const sale = await apiSend('/sales', 'POST', payload);
      setSelectedSale(sale);
      setSaleCart([]);
      setSaleDraft({ invoiceNo: '', customerId: '', customerName: 'Walk-in Customer', finalBillAmount: '', paymentMethod: 'cash' });
      notify('Sale completed');
    });
  }

  async function holdCurrentBill() {
    if (!saleCart.length) return notify('Cart is empty');
    const draft = await apiSend('/sales/hold', 'POST', {
      draftName: saleDraft.invoiceNo || `Draft ${heldBills.length + 1}`,
      customerName: saleDraft.customerName,
      items: saleCart,
      note: 'Held from POS'
    });
    setSaleCart([]);
    setSelectedSale(null);
    notify(`Bill held as ${draft.draftName}`);
    await loadAll();
  }

  async function resumeBill(id) {
    const draft = await apiSend(`/sales/resume/${id}`, 'POST', {});
    setSaleCart(draft.items || []);
    setSaleDraft((prev) => ({ ...prev, customerName: draft.customerName ?? prev.customerName }));
    notify('Draft loaded into POS');
    await loadAll();
  }

  async function openOwnerStatement(ownerId) {
    const statement = await apiGet(`/reports/owners/${ownerId}/statement`);
    setSelectedOwnerStatement(statement);
    setTab('Reports');
  }

  async function openProductHistory(productId) {
    const history = await apiGet(`/products/${productId}/history`);
    setSelectedProductHistory(history);
    setTab('Products');
  }

  const dashboardCards = summary
    ? [
        ['Today Sales', fmt(summary.totalSales)],
        ['Today Profit', fmt(summary.totalProfit)],
        ['Inventory Value', fmt(summary.inventoryValue)],
        ['Low Stock', summary.lowStockCount],
        ['Owners', summary.ownerCount],
        ['Products', summary.productCount],
        ['Branches', summary.branchCount],
        ['Purchases', summary.purchaseCount]
      ]
    : [];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">G</div>
          <div>
            <div className="brand__title">Garments ERP</div>
            <div className="brand__subtitle">POS + Inventory + Profit Engine</div>
          </div>
        </div>

        <nav className="nav">
          {tabs.map((item) => (
            <button key={item} className={`nav__item ${tab === item ? 'nav__item--active' : ''}`} type="button" onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar__meta">
          <strong>API</strong>
          <span>{API}</span>
          <strong>Status</strong>
          <span>{message || 'Ready'}</span>
        </div>
      </aside>

      <main className="main">
        <header className="hero">
          <div>
            <p className="eyebrow">Multi partner + multi wholesaler model</p>
            <h1>Complete Garments POS and Inventory ERP.</h1>
            <p className="lead">
              Owner-wise stock, mixed ownership billing, purchase and credit tracking, cash/bank, branch movement, reports, and profit distribution are wired into one workspace.
            </p>
          </div>
          <div className="hero__panel">
            <span>Business date</span>
            <strong>{new Date().toISOString().slice(0, 10)}</strong>
            <small>{message || 'All core modules connected'}</small>
          </div>
        </header>

        {tab === 'Dashboard' && (
          <>
            <section className="grid">
              {dashboardCards.map(([label, value]) => (
                <article key={label} className="card">
                  <div className="card__label">{label}</div>
                  <div className="card__value">{value}</div>
                  <div className="card__hint">Live from API</div>
                </article>
              ))}
            </section>

            <section className="content">
              <Section title="Owner Wise Profit Summary">
                <div className="table">
                  {(summary?.ownerProfitSummary || []).map((row) => (
                    <div key={row.ownerId} className="table__row">
                      <span>{row.ownerName} <small>{row.ownerType}</small></span>
                      <strong>{fmt(row.profit)}</strong>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Low Stock & Top Sellers">
                <div className="mini-grid">
                  <div>
                    <h3>Low Stock</h3>
                    {(lowStock || []).map((item) => (
                      <div key={item.id} className="table__row">
                        <span>{item.name}</span>
                        <strong>{item.quantity}</strong>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3>Top Sellers</h3>
                    {(summary?.topSellingProducts || []).map((item) => (
                      <div key={item.id} className="table__row">
                        <span>{item.name}</span>
                        <strong>{item.soldQty}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            </section>
          </>
        )}

        {tab === 'Owners' && (
          <section className="content">
            <Section title="Add Owner">
              <form className="form-grid" onSubmit={submitOwner}>
                <Field label="Owner Name">
                  <Input value={ownerForm.name} onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })} />
                </Field>
                <Field label="Owner Type">
                  <Select value={ownerForm.type} onChange={(e) => setOwnerForm({ ...ownerForm, type: e.target.value })}>
                    <option value="Partner">Partner</option>
                    <option value="Wholesaler">Wholesaler</option>
                  </Select>
                </Field>
                <Field label="CNIC">
                  <Input value={ownerForm.cnic} onChange={(e) => setOwnerForm({ ...ownerForm, cnic: e.target.value })} />
                </Field>
                <Field label="Mobile">
                  <Input value={ownerForm.mobile} onChange={(e) => setOwnerForm({ ...ownerForm, mobile: e.target.value })} />
                </Field>
                <Field label="Address" className="span-2">
                  <Textarea value={ownerForm.address} onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })} rows="3" />
                </Field>
                <button className="primary-btn span-2" type="submit">Save Owner</button>
              </form>
            </Section>

            <Section title="Owner List" action={<span>{owners.length} owners</span>}>
              <div className="table">
                {owners.map((owner) => (
                  <div key={owner.id} className="table__row table__row--stack">
                    <div>
                      <strong>{owner.name}</strong>
                      <div className="muted">{owner.type} | {owner.mobile} | {owner.status}</div>
                    </div>
                    <div className="row-actions">
                      <button type="button" onClick={() => {
                        setOwnerForm({
                          name: owner.name,
                          type: owner.type,
                          cnic: owner.cnic,
                          mobile: owner.mobile,
                          address: owner.address
                        });
                        setEditingOwnerId(owner.id);
                        setTab('Owners');
                      }}>Edit</button>
                      <button type="button" onClick={() => openOwnerStatement(owner.id)}>Statement</button>
                      <button type="button" onClick={async () => refreshAfter(() => apiSend(`/owners/${owner.id}/status`, 'PATCH', { status: owner.status === 'active' ? 'inactive' : 'active' }))}>
                        Toggle Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </section>
        )}

        {tab === 'Products' && (
          <section className="content">
            <Section title="Add Product">
              <form className="form-grid" onSubmit={submitProduct}>
                <Field label="Barcode"><Input value={productForm.barcode} onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })} /></Field>
                <Field label="Product Name"><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></Field>
                <Field label="Category"><Input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} /></Field>
                <Field label="Brand"><Input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} /></Field>
                <Field label="Color"><Input value={productForm.color} onChange={(e) => setProductForm({ ...productForm, color: e.target.value })} /></Field>
                <Field label="Size"><Input value={productForm.size} onChange={(e) => setProductForm({ ...productForm, size: e.target.value })} /></Field>
                <Field label="Owner">
                  <Select value={productForm.ownerId} onChange={(e) => setProductForm({ ...productForm, ownerId: e.target.value })}>
                    <option value="">Select owner</option>
                    {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
                  </Select>
                </Field>
                <Field label="Cost Price"><Input type="number" value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })} /></Field>
                <Field label="Sale Price"><Input type="number" value={productForm.salePrice} onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })} /></Field>
                <Field label="Quantity"><Input type="number" value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })} /></Field>
                <Field label="Low Stock Threshold"><Input type="number" value={productForm.lowStockThreshold} onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })} /></Field>
                <Field label="Image URL" className="span-2"><Input value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} /></Field>
                <button className="primary-btn span-2" type="submit">Save Product</button>
              </form>
            </Section>

            <Section title="Product Ledger / Lookup" action={<span>{products.length} products</span>}>
              <div className="table">
                {products.map((product) => (
                  <div key={product.id} className="table__row table__row--stack">
                    <div>
                      <strong>{product.name}</strong>
                      <div className="muted">
                        {product.barcode} | {product.category} | {product.brand} | {product.color} | {product.size} | {product.owner?.name || 'Unassigned'}
                      </div>
                    </div>
                    <div className="row-actions">
                      <span>{product.quantity} pcs</span>
                      <span>{fmt(product.costPrice)}</span>
                      <span>{fmt(product.salePrice)}</span>
                      <button type="button" onClick={() => {
                        setProductForm({
                          barcode: product.barcode,
                          name: product.name,
                          category: product.category,
                          brand: product.brand,
                          color: product.color,
                          size: product.size,
                          ownerId: product.ownerId,
                          costPrice: product.costPrice,
                          salePrice: product.salePrice,
                          quantity: product.quantity,
                          lowStockThreshold: product.lowStockThreshold,
                          imageUrl: product.imageUrl || ''
                        });
                        setEditingProductId(product.id);
                        setTab('Products');
                      }}>Edit</button>
                      <button type="button" onClick={() => openProductHistory(product.id)}>History</button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedProductHistory && (
                <div className="detail-box">
                  <h3>{selectedProductHistory.product.name} History</h3>
                  <p className="muted">Stock movements, purchases, sales, returns</p>
                  <div className="mini-grid">
                    <div>
                      <h4>Movements</h4>
                      {selectedProductHistory.stockMovements.map((item) => <div key={item.id} className="table__row"><span>{item.type}</span><strong>{item.delta}</strong></div>)}
                    </div>
                    <div>
                      <h4>Sales</h4>
                      {selectedProductHistory.saleHistory.map((item) => <div key={item.id} className="table__row"><span>{item.invoiceNo}</span><strong>{fmt(item.finalBillAmount)}</strong></div>)}
                    </div>
                  </div>
                </div>
              )}
            </Section>
          </section>
        )}

        {tab === 'Inventory' && (
          <section className="content">
            <Section title="Stock Entry">
              <form className="form-grid" onSubmit={submitStockEntry}>
                <Field label="Product">
                  <Select value={stockEntryForm.productId} onChange={(e) => setStockEntryForm({ ...stockEntryForm, productId: e.target.value })}>
                    <option value="">Select product</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </Select>
                </Field>
                <Field label="Qty"><Input type="number" value={stockEntryForm.qty} onChange={(e) => setStockEntryForm({ ...stockEntryForm, qty: e.target.value })} /></Field>
                <Field label="Cost Price"><Input type="number" value={stockEntryForm.costPrice} onChange={(e) => setStockEntryForm({ ...stockEntryForm, costPrice: e.target.value })} /></Field>
                <Field label="Owner">
                  <Select value={stockEntryForm.ownerId} onChange={(e) => setStockEntryForm({ ...stockEntryForm, ownerId: e.target.value })}>
                    <option value="">Use current owner</option>
                    {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
                  </Select>
                </Field>
                <Field label="Branch">
                  <Select value={stockEntryForm.branchId} onChange={(e) => setStockEntryForm({ ...stockEntryForm, branchId: e.target.value })}>
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </Select>
                </Field>
                <button className="primary-btn span-2" type="submit">Entry Stock</button>
              </form>
            </Section>

            <Section title="Transfer / Damage / Audit">
              <div className="mini-grid">
                <form className="form-grid" onSubmit={submitTransfer}>
                  <h3>Stock Transfer</h3>
                  <Field label="Product"><Select value={transferForm.productId} onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</Select></Field>
                  <Field label="Qty"><Input type="number" value={transferForm.qty} onChange={(e) => setTransferForm({ ...transferForm, qty: e.target.value })} /></Field>
                  <Field label="From Branch"><Select value={transferForm.fromBranchId} onChange={(e) => setTransferForm({ ...transferForm, fromBranchId: e.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select></Field>
                  <Field label="To Branch"><Select value={transferForm.toBranchId} onChange={(e) => setTransferForm({ ...transferForm, toBranchId: e.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select></Field>
                  <button className="primary-btn" type="submit">Transfer</button>
                </form>

                <form className="form-grid" onSubmit={submitAudit}>
                  <h3>Stock Audit</h3>
                  <Field label="Product"><Select value={auditForm.productId} onChange={(e) => setAuditForm({ ...auditForm, productId: e.target.value })}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</Select></Field>
                  <Field label="System Qty"><Input type="number" value={auditForm.systemQty} onChange={(e) => setAuditForm({ ...auditForm, systemQty: e.target.value })} /></Field>
                  <Field label="Actual Qty"><Input type="number" value={auditForm.actualQty} onChange={(e) => setAuditForm({ ...auditForm, actualQty: e.target.value })} /></Field>
                  <Field label="Branch"><Select value={auditForm.branchId} onChange={(e) => setAuditForm({ ...auditForm, branchId: e.target.value })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select></Field>
                  <button className="primary-btn" type="submit">Save Audit</button>
                </form>
              </div>
            </Section>

            <Section title="Inventory Status">
              <div className="table">
                {lowStock.map((item) => (
                  <div key={item.id} className="table__row">
                    <span>{item.name}</span>
                    <strong>{item.quantity} pcs</strong>
                  </div>
                ))}
              </div>
            </Section>
          </section>
        )}

        {tab === 'Purchases' && (
          <section className="content">
            <Section title="Purchase Entry">
              <form className="form-grid" onSubmit={submitPurchase}>
                <Field label="Invoice No"><Input value={purchaseForm.invoiceNo} onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNo: e.target.value })} /></Field>
                <Field label="Supplier">
                  <Select value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}>
                    <option value="">Select supplier</option>
                    {owners.filter((owner) => owner.type === 'Wholesaler').map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
                  </Select>
                </Field>
                <Field label="Branch">
                  <Select value={purchaseForm.branchId} onChange={(e) => setPurchaseForm({ ...purchaseForm, branchId: e.target.value })}>
                    {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </Select>
                </Field>
                <Field label="Payment Method">
                  <Select value={purchaseForm.paymentMethod} onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="credit">Credit</option>
                  </Select>
                </Field>
                <Field label="Paid Amount"><Input type="number" value={purchaseForm.paidAmount} onChange={(e) => setPurchaseForm({ ...purchaseForm, paidAmount: e.target.value })} /></Field>
                <div className="span-2">
                  <div className="mini-grid">
                    <Field label="Product">
                      <Select value={purchaseForm.productId} onChange={(e) => setPurchaseForm({ ...purchaseForm, productId: e.target.value })}>
                        <option value="">Select product</option>
                        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Qty"><Input type="number" value={purchaseForm.qty} onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })} /></Field>
                    <Field label="Cost"><Input type="number" value={purchaseForm.costPrice} onChange={(e) => setPurchaseForm({ ...purchaseForm, costPrice: e.target.value })} /></Field>
                    <button className="secondary-btn" type="button" onClick={() => {
                      if (!purchaseForm.productId) return;
                      setPurchaseCart((current) => [...current, {
                        productId: purchaseForm.productId,
                        qty: Number(purchaseForm.qty || 1),
                        costPrice: Number(purchaseForm.costPrice || 0)
                      }]);
                      setPurchaseForm({ ...purchaseForm, productId: '', qty: '', costPrice: '' });
                    }}>Add Item</button>
                  </div>
                </div>
                <button className="primary-btn span-2" type="submit">Save Purchase</button>
              </form>
              <div className="detail-box">
                <h3>Purchase Cart</h3>
                {purchaseCart.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="table__row">
                    <span>{products.find((product) => product.id === item.productId)?.name}</span>
                    <strong>{item.qty} x {fmt(item.costPrice)}</strong>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Purchase History / Supplier Ledger">
              <div className="table">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="table__row table__row--stack">
                    <div>
                      <strong>{purchase.invoiceNo}</strong>
                      <div className="muted">{purchase.supplierName} | {purchase.status}</div>
                    </div>
                    <div className="row-actions">
                      <span>{fmt(purchase.totalCost)}</span>
                      <span>Balance {fmt(purchase.balance)}</span>
                      <button type="button" onClick={() => notify('Purchase ledger view is available in API /purchases and analytics')}>Ledger</button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </section>
        )}

        {tab === 'POS' && (
          <section className="content">
            <Section title="Smart POS Billing">
              <form className="form-grid" onSubmit={submitSale}>
                <Field label="Invoice No"><Input value={saleDraft.invoiceNo} onChange={(e) => setSaleDraft({ ...saleDraft, invoiceNo: e.target.value })} /></Field>
                <Field label="Customer Name"><Input value={saleDraft.customerName} onChange={(e) => setSaleDraft({ ...saleDraft, customerName: e.target.value })} /></Field>
                <Field label="Customer DB">
                  <Select value={saleDraft.customerId} onChange={(e) => {
                    const customer = customers.find((entry) => entry.id === e.target.value);
                    setSaleDraft({
                      ...saleDraft,
                      customerId: e.target.value,
                      customerName: customer?.name || saleDraft.customerName
                    });
                  }}>
                    <option value="">Walk-in / New</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </Select>
                </Field>
                <Field label="Manual Final Amount"><Input type="number" value={saleDraft.finalBillAmount} onChange={(e) => setSaleDraft({ ...saleDraft, finalBillAmount: e.target.value })} /></Field>
                <Field label="Payment Method">
                  <Select value={saleDraft.paymentMethod} onChange={(e) => setSaleDraft({ ...saleDraft, paymentMethod: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="credit">Credit</option>
                  </Select>
                </Field>
                <div className="span-2">
                  <div className="mini-grid">
                    <Field label="Scan / Search Product">
                      <Select onChange={(e) => addSaleItem(e.target.value)} defaultValue="">
                        <option value="">Choose product</option>
                        {products.map((product) => <option key={product.id} value={product.id}>{product.name} | {product.barcode}</option>)}
                      </Select>
                    </Field>
                    <button className="secondary-btn" type="button" onClick={holdCurrentBill}>Hold Bill</button>
                    <button className="secondary-btn" type="button" onClick={() => setSaleCart([])}>Clear Cart</button>
                  </div>
                </div>
                <button className="primary-btn span-2" type="submit">Complete Sale</button>
              </form>
              <div className="detail-box">
                <h3>Cart</h3>
                {saleCart.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="table__row">
                    <span>{item.productName}</span>
                    <strong>{item.qty} pcs</strong>
                  </div>
                ))}
              </div>
              {selectedSale && (
                <div className="detail-box">
                  <h3>Invoice Preview</h3>
                  <div className="table">
                    {selectedSale.items.map((item) => (
                      <div key={item.productId} className="table__row">
                        <span>{item.productName} x {item.qty}</span>
                        <strong>{fmt(item.salePrice * item.qty)}</strong>
                      </div>
                    ))}
                    <div className="table__row">
                      <span>Total Profit</span>
                      <strong>{fmt(selectedSale.totalProfit)}</strong>
                    </div>
                    <div className="table__row">
                      <span>Owner Distribution</span>
                      <strong>{selectedSale.ownerDistributionSummary.map((row) => `${row.ownerName}: ${fmt(row.profit)}`).join(' | ')}</strong>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Held Bills">
              <div className="table">
                {heldBills.map((bill) => (
                  <div key={bill.id} className="table__row table__row--stack">
                    <div>
                      <strong>{bill.draftName}</strong>
                      <div className="muted">{bill.customerName}</div>
                    </div>
                    <button type="button" onClick={() => resumeBill(bill.id)}>Resume</button>
                  </div>
                ))}
              </div>
            </Section>
          </section>
        )} 

        {tab === 'Customers' && (
          <section className="content">
            <Section title="Customer Setup">
              <form className="form-grid" onSubmit={submitCustomer}>
                <Field label="Customer Name"><Input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} /></Field>
                <Field label="Mobile"><Input value={customerForm.mobile} onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })} /></Field>
                <Field label="Address" className="span-2"><Input value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} /></Field>
                <button className="primary-btn span-2" type="submit">Save Customer</button>
              </form>
            </Section>

            <Section title="Customer Database" action={<span>{customers.length} customers</span>}>
              <div className="table">
                {customers.map((customer) => (
                  <div key={customer.id} className="table__row">
                    <span>{customer.name}</span>
                    <strong>{customer.mobile || 'No mobile'}</strong>
                  </div>
                ))}
              </div>
            </Section>
          </section>
        )}

        {tab === 'Branches' && (
          <section className="content">
            <Section title="Add Branch">
              <form className="form-grid" onSubmit={submitBranch}>
                <Field label="Branch Name"><Input value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} /></Field>
                <Field label="Status">
                  <Select value={branchForm.status} onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
                <button className="primary-btn span-2" type="submit">Save Branch</button>
              </form>
            </Section>

            <Section title="Branch Management" action={<span>{branches.length} branches</span>}>
              <div className="table">
                {branches.map((branch) => (
                  <div key={branch.id} className="table__row">
                    <span>{branch.name}</span>
                    <strong>{branch.status}</strong>
                  </div>
                ))}
              </div>
            </Section>
          </section>
        )}

        {tab === 'Cash & Bank' && (
          <section className="content">
            <Section title="Cash Entry">
              <form className="form-grid" onSubmit={submitCash}>
                <Field label="Type"><Select value={cashForm.type} onChange={(e) => setCashForm({ ...cashForm, type: e.target.value })}><option value="cash_in">Cash In</option><option value="cash_out">Cash Out</option></Select></Field>
                <Field label="Direction"><Select value={cashForm.direction} onChange={(e) => setCashForm({ ...cashForm, direction: e.target.value })}><option value="in">In</option><option value="out">Out</option></Select></Field>
                <Field label="Amount"><Input type="number" value={cashForm.amount} onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })} /></Field>
                <Field label="Note" className="span-2"><Input value={cashForm.note} onChange={(e) => setCashForm({ ...cashForm, note: e.target.value })} /></Field>
                <button className="primary-btn span-2" type="submit">Save Cash Entry</button>
              </form>
            </Section>

            <Section title="Bank Entry">
              <form className="form-grid" onSubmit={submitBank}>
                <Field label="Type"><Select value={bankForm.type} onChange={(e) => setBankForm({ ...bankForm, type: e.target.value })}><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option></Select></Field>
                <Field label="Direction"><Select value={bankForm.direction} onChange={(e) => setBankForm({ ...bankForm, direction: e.target.value })}><option value="in">In</option><option value="out">Out</option></Select></Field>
                <Field label="Bank Name"><Input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} /></Field>
                <Field label="Amount"><Input type="number" value={bankForm.amount} onChange={(e) => setBankForm({ ...bankForm, amount: e.target.value })} /></Field>
                <Field label="Note" className="span-2"><Input value={bankForm.note} onChange={(e) => setBankForm({ ...bankForm, note: e.target.value })} /></Field>
                <button className="primary-btn span-2" type="submit">Save Bank Entry</button>
              </form>
            </Section>

            <Section title="Movements">
              <div className="mini-grid">
                <div>
                  <h3>Cash Ledger</h3>
                  {cash.map((entry) => <div key={entry.id} className="table__row"><span>{entry.type}</span><strong>{fmt(entry.amount)}</strong></div>)}
                </div>
                <div>
                  <h3>Bank Ledger</h3>
                  {bank.map((entry) => <div key={entry.id} className="table__row"><span>{entry.bankName}</span><strong>{fmt(entry.amount)}</strong></div>)}
                </div>
              </div>
            </Section>
          </section>
        )}

        {tab === 'Reports' && (
          <section className="content">
            <Section title="Reports / Statements">
              <div className="mini-grid">
                <div>
                  <h3>Owner / Wholesaler Statements</h3>
                  {owners.map((owner) => (
                    <div key={owner.id} className="table__row table__row--stack">
                      <span>{owner.name}</span>
                      <div className="row-actions">
                        <button type="button" onClick={() => openOwnerStatement(owner.id)}>Open Statement</button>
                        <button type="button" onClick={async () => {
                          const statement = await apiGet(`/reports/wholesalers/${owner.id}/statement`);
                          setSelectedOwnerStatement(statement);
                          notify('Wholesaler statement loaded');
                        }}>Wholesaler View</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <h3>Current Statement</h3>
                  {selectedOwnerStatement ? (
                    <div className="detail-box">
                      <strong>{selectedOwnerStatement.owner.name}</strong>
                      <div className="muted">Stock Value: {fmt(selectedOwnerStatement.stockValue)}</div>
                      <div className="muted">Sales: {fmt(selectedOwnerStatement.saleTotal)}</div>
                      <div className="muted">Profit: {fmt(selectedOwnerStatement.profitTotal)}</div>
                      <div className="muted">Payable: {fmt(selectedOwnerStatement.summary?.totalPayable)}</div>
                    </div>
                  ) : (
                    <div className="detail-box">Select an owner statement to view details.</div>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Daily / Monthly Report Snapshot">
              {report && (
                <div className="mini-grid">
                  <div>
                    <h3>Daily Sales</h3>
                    <div className="table__row"><span>Total Sales</span><strong>{fmt(report.summary.totalSales)}</strong></div>
                    <div className="table__row"><span>Total Profit</span><strong>{fmt(report.summary.totalProfit)}</strong></div>
                  </div>
                  <div>
                    <h3>Stock Alerts</h3>
                    {report.summary.lowStockProducts.map((item) => (
                      <div key={item.id} className="table__row"><span>{item.name}</span><strong>{item.quantity}</strong></div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Sales History">
              <div className="table">
                {sales.slice(0, 10).map((sale) => (
                  <div key={sale.id} className="table__row table__row--stack">
                    <div>
                      <strong>{sale.invoiceNo}</strong>
                      <div className="muted">{sale.customerName} | {sale.paymentMethod}</div>
                    </div>
                    <div className="row-actions">
                      <span>{fmt(sale.finalBillAmount)}</span>
                      <span>Profit {fmt(sale.totalProfit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </section>
        )}

      </main>
    </div>
  );
}
