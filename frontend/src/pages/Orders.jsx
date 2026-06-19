import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const PAGE_SIZE = 10;

export default function Orders() {
  const showToast = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([API.get('/orders'), API.get('/customers')])
      .then(([ordersRes, custRes]) => {
        setOrders(ordersRes.data);
        const map = {};
        custRes.data.forEach((c) => { map[c.id] = c; });
        setCustomers(map);
        setLastUpdated(new Date().toLocaleString());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel order #${String(order.id).substring(0, 8)}? Stock will be restored.`)) return;
    try {
      await API.delete(`/orders/${order.id}`);
      showToast('Order cancelled — stock restored');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to cancel order', 'error');
    }
  };

  // Summary counts
  const pending = orders.filter((o) => o.status === 'pending');
  const confirmed = orders.filter((o) => o.status === 'confirmed');
  const cancelled = orders.filter((o) => o.status === 'cancelled');

  const pendingTotal = pending.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const confirmedTotal = confirmed.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Filter + search
  const filtered = orders
    .filter((o) => filter === 'all' || o.status === filter)
    .filter((o) => {
      if (!search) return true;
      const cust = customers[o.customer_id];
      const custName = cust ? cust.full_name.toLowerCase() : '';
      return (
        String(o.id).toLowerCase().includes(search.toLowerCase()) ||
        custName.includes(search.toLowerCase())
      );
    });

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'confirmed', label: 'Confirmed', count: confirmed.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Orders</h2>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">Last updated: {lastUpdated}</p>
          )}
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          + Create Order
        </button>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-lg shadow border border-gray-100 px-6 py-4 flex flex-wrap gap-8 items-center">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Summary</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span className="text-sm text-gray-600">Pending Orders</span>
          <span className="font-bold text-gray-900">{pending.length}</span>
          <span className="text-sm text-amber-600 font-semibold">{fmt(pendingTotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          <span className="text-sm text-gray-600">Confirmed Orders</span>
          <span className="font-bold text-gray-900">{confirmed.length}</span>
          <span className="text-sm text-green-600 font-semibold">{fmt(confirmedTotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          <span className="text-sm text-gray-600">Cancelled</span>
          <span className="font-bold text-gray-900">{cancelled.length}</span>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setFilter(t.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === t.key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === t.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by order ID or customer..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order & Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                  No orders found
                </td>
              </tr>
            ) : (
              paginated.map((o) => {
                const cust = customers[o.customer_id];
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-medium text-gray-900">
                        #{String(o.id).substring(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        }) : '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {cust ? cust.full_name : '—'}
                      </p>
                      <p className="text-xs text-gray-400">{cust ? cust.email : ''}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {(o.items || []).length} item{(o.items || []).length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {fmt(parseFloat(o.total_amount || 0))}
                    </td>
                    <td className="px-6 py-4">
                      <Badge label={o.status} variant={o.status} />
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button
                        onClick={() => navigate(`/orders/${o.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        View
                      </button>
                      {o.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(o)}
                          className="text-red-500 hover:text-red-800 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-white"
              >
                ‹
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-white"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
