import React, { useState, useEffect } from 'react';
import API from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

function StatCard({ label, value, color = 'bg-indigo-600' }) {
  return (
    <div className={`${color} rounded-lg p-6 text-white shadow`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/products'),
      API.get('/customers'),
      API.get('/orders'),
    ])
      .then(([prodRes, custRes, ordRes]) => {
        setProducts(prodRes.data);
        setCustomers(custRes.data);
        setOrders(ordRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalRevenue = orders
    .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
    .toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const lowStockProducts = products.filter((p) => p.quantity < 10);
  const recentOrders = [...orders].reverse().slice(0, 5);

  const customerMap = customers.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Total Customers" value={customers.length} />
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard label="Total Revenue" value={totalRevenue} />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Low Stock Alerts</h3>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="bg-amber-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.quantity}</td>
                    <td className="px-6 py-4"><Badge label="Low Stock" variant="low" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Orders</h3>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No orders yet</td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const cust = customerMap[o.customer_id];
                  return (
                    <tr key={o.id}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">{String(o.id).substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {cust ? cust.full_name : String(o.customer_id).substring(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge label={o.status} variant={o.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {parseFloat(o.total_amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
