import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

function ProductNode({ data }) {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

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

  return (
    <div
      style={{
        border: '1px solid #aaa',
        borderRadius: 4,
        padding: 6,
        backgroundColor: '#f9f9f9',
        width:180,
        fontSize: 12,
        textAlign: 'center',
      }}
    >
      {/* Top handle (incoming connection from previous product) */}
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

      <div style={{ fontWeight: 600, marginBottom: 4, color: "black" }}>Product</div>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          fontSize: 11,
          padding: 3,
          marginBottom: 4,
          color: "grey"
        }}
      />

      <select
        value={selectedProductId}
        onChange={handleSelect}
        style={{
          width: '100%',
          fontSize: 11,
          padding: 3,
          
        }}
      >
        <option value="">-- Choose --</option>
        {filteredProducts.map((product) => (
          <option key={product.PRODUCT_ID} value={product.PRODUCT_ID}>
            {product.NAME}
          </option>
        ))}
      </select>

      {/* Bottom handle (connection to actions or next node) */}
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
}

export default ProductNode;
