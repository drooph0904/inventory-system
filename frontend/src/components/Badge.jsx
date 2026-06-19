const variants = {
  pending: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  low: 'bg-amber-100 text-amber-800',
  ok: 'bg-green-100 text-green-800',
};

export default function Badge({ label, variant }) {
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${variants[variant] || 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>
  );
}
