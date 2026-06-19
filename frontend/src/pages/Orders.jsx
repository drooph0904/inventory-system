import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

export default function Orders() {
  const showToast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    API.get('/orders')
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel order ${String(order.id).substring(0, 8)}...?`)) return;
    try {
      await API.delete(`/orders/${order.id}`);
      showToast('Order cancelled and stock restored');
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to cancel order', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <button
          onClick={() => navigate('/orders/new')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          + Create Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No orders found</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {String(o.id).substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">
                    {String(o.customer_id).substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {parseFloat(o.total_amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge label={o.status} variant={o.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleCancel(o)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
