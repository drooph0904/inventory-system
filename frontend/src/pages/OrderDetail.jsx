import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/client';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-sm">{error}</p>
        <Link to="/orders" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
          Back to Orders
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const total = parseFloat(order.total_amount || 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="text-indigo-600 hover:underline text-sm">
          &larr; Back to Orders
        </Link>
      </div>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Order #{String(order.id).substring(0, 8)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
            </p>
          </div>
          <Badge label={order.status} variant={order.status} />
        </div>
      </div>

      {/* Customer Info */}
      {order.customer && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Customer</h3>
          <p className="text-sm text-gray-900 font-medium">{order.customer.full_name}</p>
          <p className="text-sm text-gray-500">{order.customer.email}</p>
          {order.customer.phone && (
            <p className="text-sm text-gray-500">{order.customer.phone}</p>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-800">Items</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, idx) => {
              const unitPrice = parseFloat(item.unit_price || 0);
              const qty = parseInt(item.quantity, 10) || 0;
              const subtotal = unitPrice * qty;
              return (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.product?.name || String(item.product_id).substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{qty}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {subtotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-50">
              <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Total</td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                {total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
