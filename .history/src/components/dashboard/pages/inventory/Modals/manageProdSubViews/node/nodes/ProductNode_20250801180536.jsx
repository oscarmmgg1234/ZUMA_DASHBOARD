import React, { useState, useEffect } from 'react';

export default function ProductNode({ data }) {
  const [search, setSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(data.products);
  const [selectedProductId, setSelectedProductId] = useState(data.selectedProductId || '');

  useEffect(() => {
    if (!search) {
      setFilteredProducts(data.products);
    } else {
      setFilteredProducts(
        data.products.filter(p =>
          p.NAME.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, data.products]);

  const handleSelect = (e) => {
    const pid = e.target.value;
    setSelectedProductId(pid);
    const selected = data.products.find(p => p.PRODUCT_ID === pid);
    data.onChange?.(data.id, selected); // optional callback to parent
  };

  return (
    <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 6 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Select Product</div>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: 4,
          marginBottom: 6,
          fontSize: 12,
        }}
      />

      <select
        value={selectedProductId}
        onChange={handleSelect}
        style={{ width: '100%', padding: 4, fontSize: 12 }}
      >
        <option value="">-- Choose --</option>
        {filteredProducts.map((product) => (
          <option key={product.PRODUCT_ID} value={product.PRODUCT_ID}>
            {product.NAME}
          </option>
        ))}
      </select>
    </div>
  );
}