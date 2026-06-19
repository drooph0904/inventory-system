import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const STATUS_STEPS = ['pending', 'confirmed', 'cancelled'];

function StatusPipeline({ status }) {
  const steps = [
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'confirmed', label: 'Confirmed', icon: '✓' },
    { key: 'cancelled', label: 'Cancelled', icon: '✕' },
  ];

  const activeIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isActive = step.key === status;
        const isPast = idx < activeIdx;
        const isCancelled = status === 'cancelled';

        let circleClass = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ';
        if (isActive && isCancelled) circleClass += 'bg-red-100 border-red-500 text-red-600';
        else if (isActive) circleClass += 'bg-indigo-600 border-indigo-600 text-white';
        else if (isPast && !isCancelled) circleClass += 'bg-indigo-100 border-indigo-300 text-indigo-500';
        else circleClass += 'bg-gray-100 border-gray-300 text-gray-400';

        let labelClass = 'text-xs font-medium mt-1 ';
        if (isActive && isCancelled) labelClass += 'text-red-600';
        else if (isActive) labelClass += 'text-indigo-700';
        else labelClass += 'text-gray-400';

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div className={circleClass}>{step.icon}</div>
              <span className={labelClass}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 w-16 mb-4 ${
                idx < activeIdx && !isCancelled ? 'bg-indigo-300' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order? Stock will be restored.')) return;
    setCancelling(true);
    try {
      await API.delete(`/orders/${id}`);
      showToast('Order cancelled — stock restored');
      navigate('/orders');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to cancel order', 'error');
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Link to="/orders" className="text-indigo-600 hover:underline text-sm">← Back to Orders</Link>
      </div>
    );
  }

  const items = order.items || [];
  const totalAmount = parseFloat(order.total_amount || 0);
  const totalQty = items.reduce((s, i) => s + parseInt(i.quantity, 10), 0);
  const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/orders')} className="hover:text-indigo-600 flex items-center gap-1">
          ← Orders
        </button>
        <span>›</span>
        <span className="text-gray-900 font-medium">Order Details</span>
      </div>

      {/* Order header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Order #{String(order.id).substring(0, 8).toUpperCase()}
            </h2>
            {order.customer && (
              <p className="text-sm text-gray-500 mt-0.5">
                {order.customer.full_name}
                <span className="text-gray-400"> · {order.customer.email}</span>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
            </p>
          </div>
          <StatusPipeline status={order.status} />
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Products</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Qty</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalQty}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
            <p className="text-sm font-semibold mt-2 capitalize"
              style={{ color: order.status === 'cancelled' ? '#ef4444' : order.status === 'confirmed' ? '#16a34a' : '#6366f1' }}>
              {order.status}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Amount</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">{fmt(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Order Items table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">Order Details</h3>
          <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product & SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Ordered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => {
              const unitPrice = parseFloat(item.unit_price || 0);
              const qty = parseInt(item.quantity, 10) || 0;
              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {item.product?.name || '—'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {item.product?.sku || String(item.product_id).substring(0, 8)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{fmt(unitPrice)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{qty}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {fmt(unitPrice * qty)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                Total Amount
              </td>
              <td className="px-6 py-4 text-base font-bold text-indigo-700">{fmt(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          {order.status !== 'cancelled' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-5 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
            >
              ✕ Cancel Order
            </button>
          )}
          {order.status === 'cancelled' && (
            <span className="text-sm text-gray-400 italic">This order has been cancelled.</span>
          )}
        </div>
      </div>
    </div>
  );
}
