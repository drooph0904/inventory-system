import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

export default function CreateOrder() {
  const showToast = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState('');
  const [cart, setCart] = useState({});        // { productId: quantity }
  const [qtys, setQtys] = useState({});        // pending qty per row before ADD
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([API.get('/customers'), API.get('/products')])
      .then(([custRes, prodRes]) => {
        setCustomers(custRes.data);
        setProducts(prodRes.data);
        const initQtys = {};
        prodRes.data.forEach((p) => { initQtys[p.id] = 1; });
        setQtys(initQtys);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stockLabel = (qty) => {
    if (qty === 0) return 'out';
    if (qty < 10) return 'low';
    return 'in';
  };

  const filteredProducts = products
    .filter((p) => {
      if (stockFilter === 'in') return p.quantity >= 10;
      if (stockFilter === 'low') return p.quantity > 0 && p.quantity < 10;
      if (stockFilter === 'out') return p.quantity === 0;
      return true;
    })
    .filter((p) => {
      if (!search) return true;
      return (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      );
    });

  const addToCart = (product) => {
    const qty = parseInt(qtys[product.id], 10) || 1;
    if (qty < 1) return;
    setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + qty }));
    setQtys((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const cartItems = Object.entries(cart)
    .map(([pid, qty]) => ({ product: products.find((p) => p.id === pid), qty }))
    .filter((i) => i.product);

  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalAmount = cartItems.reduce((s, i) => s + parseFloat(i.product.price) * i.qty, 0);

  const handleSubmit = async () => {
    const errs = {};
    if (!customerId) errs.customer = 'Select a customer';
    if (cartItems.length === 0) errs.cart = 'Add at least one product';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await API.post('/orders', {
        customer_id: customerId,
        items: cartItems.map((i) => ({ product_id: i.product.id, quantity: i.qty })),
      });
      showToast('Order placed successfully');
      navigate('/orders');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Place New Order
            <span className="ml-2 text-base font-normal text-gray-400">
              ({filteredProducts.length} products)
            </span>
          </h2>
        </div>
      </div>

      {/* Customer select */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Customer *</label>
        <select
          value={customerId}
          onChange={(e) => { setCustomerId(e.target.value); setErrors((p) => ({ ...p, customer: undefined })); }}
          className={`flex-1 min-w-48 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.customer ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">— Select a customer —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
          ))}
        </select>
        {errors.customer && <p className="text-xs text-red-600">{errors.customer}</p>}
        {errors.cart && <p className="text-xs text-red-600">{errors.cart}</p>}
      </div>

      {/* Search + stock filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'in', label: 'In Stock' },
            { key: 'low', label: 'Low Stock' },
            { key: 'out', label: 'Out of Stock' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStockFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                stockFilter === f.key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-24 flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product & SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No products match your filter
                </td>
              </tr>
            )}
            {filteredProducts.map((p) => {
              const inCart = !!cart[p.id];
              const sl = stockLabel(p.quantity);
              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${inCart ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {inCart && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${parseFloat(p.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {sl === 'out' ? (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Out of Stock
                      </span>
                    ) : sl === 'low' ? (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Low · {p.quantity} left
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        In Stock · {p.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQtys((prev) => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] || 1) - 1) }))}
                        className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={p.quantity}
                        value={qtys[p.id] || 1}
                        onChange={(e) => setQtys((prev) => ({ ...prev, [p.id]: parseInt(e.target.value, 10) || 1 }))}
                        className="w-12 text-center border border-gray-300 rounded text-sm py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => setQtys((prev) => ({ ...prev, [p.id]: Math.min(p.quantity, (prev[p.id] || 1) + 1) }))}
                        className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {inCart ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => addToCart(p)}
                          disabled={p.quantity === 0}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-40"
                        >
                          + Add More
                        </button>
                        <button
                          onClick={() => removeFromCart(p.id)}
                          className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-medium rounded hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.quantity === 0}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ADD
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sticky bottom cart bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-lg px-8 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            {cartItems.length > 0 && (
              <span className="bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{cartItems.length}</span> product
            {cartItems.length !== 1 ? 's' : ''} selected
          </div>
          <div className="text-sm text-gray-600">
            Total Qty: <span className="font-semibold text-gray-900">{totalQty}</span>
          </div>
          <div className="text-sm text-gray-600">
            Total Amount:{' '}
            <span className="font-bold text-indigo-700 text-base">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || cartItems.length === 0 || !customerId}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? 'Placing...' : 'Place Order →'}
          </button>
        </div>
      </div>
    </div>
  );
}
