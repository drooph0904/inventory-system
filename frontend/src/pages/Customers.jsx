import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/client';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomerForm from './CustomerForm';
import { useToast } from '../components/Toast';

export default function Customers() {
  const showToast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    API.get('/customers')
      .then((res) => setCustomers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete "${customer.full_name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/customers/${customer.id}`);
      showToast('Customer deleted');
      fetchCustomers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete customer', 'error');
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchCustomers();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          + Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No customers found</td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Customer">
        <CustomerForm onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
}
