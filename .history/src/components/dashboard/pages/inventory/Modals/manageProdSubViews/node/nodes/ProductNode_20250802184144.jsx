import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

function ProductNode({ data }) {
  console.log('Selected ID:', data.selectedProductId);
console.log('Available products:', data.products.find(p => p.PRODUCT_ID === data.selectedProductId));

  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(data.selectedProductId || '');

  // 🔁 Update local state if prop changes
  useEffect(() => {
    setSelectedProductId(data.selectedProductId || '');
  }, [data.selectedProductId]);

  const handleSelect = (e) => {
    const selected = e.target.value;
    setSelectedProductId(selected);
    if (data.onChange) {
      const product = data.products.find((p) => p.PRODUCT_ID === selected);
      data.onChange(data.id, product);
    }
  };

  const filteredProducts = (data.products || []).filter((p) =>
    p.NAME.toLowerCase().includes(search.toLowerCase())
  );
const displayName =
  data.name ||
  data.products.find(p => p.PRODUCT_ID === data.selectedProductId)?.NAME ||
  '';

  return (
    <div
      style={{
        border: '1px solid #aaa',
        borderRadius: 15,
        padding: 6,
        backgroundColor: '#919de2dd',
        width: 260,
        fontSize: 30,
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

      <div style={{ fontWeight: 600, marginBottom: 4, color: 'black' }}>Product</div>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          fontSize: 23,
          padding: 3,
          marginBottom: 4,
          color: 'grey',
        }}
      />

      <select
        value={data.name}
        onChange={(e) => data.onFieldChange(data.id, 'name', e.target.value)}
        style={{
          width: '100%',
          fontSize: 23,
          padding: 3,
          color: 'black',
        }}
      >
        <option value="">-- Choose --</option>
        {filteredProducts.map((product) => (
          <option key={product.PRODUCT_ID} value={product.PRODUCT_ID}>
            {product.NAME}
          </option>
        ))}
      </select>

      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
}

export default ProductNode;
