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
        border: '1px solid #999',
        borderRadius: 6,
        padding: 10,
        backgroundColor: '#fff',
        minWidth: 200,
        boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
      }}
    >
      {/* Handle for receiving incoming connections (from previous product) */}
      <Handle type="target" position={Position.Left} />

      {/* Handle for sending connections to next product */}
      <Handle type="source" position={Position.Right} />

      {/* Handle for connecting to actions vertically */}
      <Handle type="source" position={Position.Bottom} />

      <div style={{ marginBottom: 6, fontWeight: 'bold' }}>Select Product</div>

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
          color: 'black',
        }}
      />

      <select
        value={selectedProductId}
        onChange={handleSelect}
        style={{
          width: '100%',
          padding: 4,
          fontSize: 12,
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
    </div>
  );
}

export default ProductNode;
