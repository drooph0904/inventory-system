import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

function newItem() {
  return { product_id: '', quantity: 1 };
}

export default function CreateOrder() {
  const showToast = useToast();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([newItem()]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([API.get('/customers'), API.get('/products')])
      .then(([custRes, prodRes]) => {
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const productMap = products.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const liveTotal = items.reduce((sum, item) => {
    const product = productMap[item.product_id];
    if (!product) return sum;
    return sum + parseFloat(product.price) * parseInt(item.quantity || 0, 10);
  }, 0);

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`item_${idx}_${field}`];
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const errs = {};
    if (!customerId) errs.customerId = 'Please select a customer';
    items.forEach((item, idx) => {
      if (!item.product_id) errs[`item_${idx}_product_id`] = 'Select a product';
      if (!item.quantity || parseInt(item.quantity, 10) < 1) errs[`item_${idx}_quantity`] = 'Min qty 1';
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/orders', {
        customer_id: customerId,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity, 10),
        })),
      });
      showToast('Order created successfully');
      navigate('/orders');
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Failed to create order' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create Order</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {errors.submit}
          </div>
        )}

        {/* Customer */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-800">Customer</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Customer *</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setErrors((prev) => ({ ...prev, customerId: undefined }));
              }}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Select a customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
            {errors.customerId && <p className="mt-1 text-xs text-red-600">{errors.customerId}</p>}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-800">Items</h3>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="flex-1">
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                  className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors[`item_${idx}_product_id`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${parseFloat(p.price).toFixed(2)})
                    </option>
                  ))}
                </select>
                {errors[`item_${idx}_product_id`] && (
                  <p className="mt-1 text-xs text-red-600">{errors[`item_${idx}_product_id`]}</p>
                )}
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors[`item_${idx}_quantity`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors[`item_${idx}_quantity`] && (
                  <p className="mt-1 text-xs text-red-600">{errors[`item_${idx}_quantity`]}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Item
          </button>

          {/* Live Total */}
          <div className="pt-3 border-t flex justify-end">
            <span className="text-sm font-semibold text-gray-900">
              Total: {liveTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
