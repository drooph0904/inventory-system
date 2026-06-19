import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/client';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductForm from './ProductForm';
import { useToast } from '../components/Toast';

export default function Products() {
  const showToast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    API.get('/products')
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAdd = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/products/${product.id}`);
      showToast('Product deleted');
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete product', 'error');
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchProducts();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No products found</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={p.quantity < 10 ? 'bg-amber-50' : ''}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${parseFloat(p.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.quantity}</td>
                  <td className="px-6 py-4">
                    {p.quantity < 10
                      ? <Badge label="Low Stock" variant="low" />
                      : <Badge label="In Stock" variant="ok" />}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'Edit Product' : 'Add Product'}
      >
        <ProductForm product={editProduct} onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
}
