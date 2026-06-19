import React, { useState } from 'react';
import API from '../api/client';
import { useToast } from '../components/Toast';

export default function CustomerForm({ onSuccess }) {
  const showToast = useToast();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
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
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      };
      await API.post('/customers', payload);
      showToast('Customer added successfully');
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
        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
        <input name="full_name" value={form.full_name} onChange={handleChange} className={inputClass('full_name')} />
        {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email *</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass('email')} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} className={inputClass('phone')} />
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Add Customer'}
        </button>
      </div>
    </form>
  );
}
