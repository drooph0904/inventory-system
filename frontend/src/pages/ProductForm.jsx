import React, { useState } from 'react';
import API from '../api/client';
import { useToast } from '../components/Toast';

export default function ProductForm({ product, onSuccess }) {
  const showToast = useToast();
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    price: product?.price || '',
    quantity: product?.quantity ?? 0,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.price || parseFloat(form.price) < 0.01) errs.price = 'Price must be at least $0.01';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
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
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity, 10) || 0,
      };
      if (product?.id) {
        await API.put(`/products/${product.id}`, payload);
        showToast('Product updated successfully');
      } else {
        await API.post('/products', payload);
        showToast('Product created successfully');
      }
      onSuccess();
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {errors.submit}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Name *</label>
        <input name="name" value={form.name} onChange={handleChange} className={inputClass('name')} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">SKU *</label>
        <input name="sku" value={form.sku} onChange={handleChange} className={inputClass('sku')} />
        {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Price *</label>
        <input
          name="price"
          type="number"
          min="0.01"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          className={inputClass('price')}
        />
        {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Quantity</label>
        <input
          name="quantity"
          type="number"
          min="0"
          value={form.quantity}
          onChange={handleChange}
          className={inputClass('quantity')}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Saving...' : product?.id ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
