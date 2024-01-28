import React, { useEffect, useState, useRef } from "react";
import BaseModal from "./Base";
import http_handler from "../HTTP/HTTPS_INTERFACE";
const http = new http_handler();



export default function OverrideStock(props){
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState("0");
    const [action, setAction] = useState(false);
    const [inventoryMap, setInventoryMap] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");



    const init = async () => {
        const productInventory = await http.getProductsInventory();
        const inventoryMap = new Map(productInventory.data.map(item=>[item.PRODUCT_ID, item]));
        setInventoryMap(inventoryMap);
        
        const products = await http.getProducts();
        const formatted_products = products.data.map((product)=>{
            return {...product, focus: false}
        })

        setProducts(formatted_products);
        setFilteredProducts(formatted_products);
    }

    const handleUpdateStock = () => {
        if(!quantity || !product){
            alert("Fields cannot be empty")
            return;
        }
        const data = {
            PRODUCT_ID: product.PRODUCT_ID,
            QUANTITY: parseInt(quantity)
        }
        http.updateStock(data, action)
        alert(`Stocked Changed for ${product.NAME}`)
        setTimeout(()=>{
            init();
        }, 500);
    }


    const onFocusProduct = (product) => {
        const focusEvent = filteredProducts.map((item) => {
            if (item.PRODUCT_ID === product.PRODUCT_ID) {
                return { ...item, focus: !item.focus };
            } else {
                return { ...item, focus: false };
            }
        });
        setProduct(product.focus ? null : product);
        setFilteredProducts(focusEvent);
    };
  
    useEffect(() => {
        if (searchQuery === "") return setFilteredProducts(products);
        else {
          const newData = products.filter((item) =>
            item.NAME.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredProducts(newData);
        }
      }, [searchQuery]);

    useEffect(()=>{
        init();
    }, [])

    const tableRows = filteredProducts.map((product, index) => (
        <tr
            key={product.PRODUCT_ID}
            className={`${product.focus ? "bg-orange-300" : index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
            onClick={() => onFocusProduct(product)}
        >
            <td className="px-4 py-2 border text-black">{product.NAME}</td>
            <td className="px-4 py-2 border text-black bg-rose-400">{product.PRODUCT_ID}</td>
            <td className="px-4 py-2 border text-black">{inventoryMap.get(product.PRODUCT_ID).STORED_STOCK.toFixed(2)}</td>
            <td className="px-4 py-2 border text-black">{inventoryMap.get(product.PRODUCT_ID).ACTIVE_STOCK.toFixed(2)}</td>
        </tr>
    ));

return ( 
    <>
        <BaseModal
      visible={props.visible}
      closeHandler={props.closeHandler}
      title={"Manual Stock Overrride"}
      closeName={"manual"}
    >
        <div className="h-full w-full">
        <button onClick={()=>setAction(!action)} className="w-32 h-24 bg-orange-300">
            <p className="text-xs">Click to toggle</p>
            <p className="font-bold">{action ? "Storage Stock" : "Active Stock"}</p>
        </button>
        <div className="flex flex-1 justify-center items-center">
                    <div className="p-6 bg-white rounded-lg shadow max-w-2xl w-full">
                    <div className="max-h-96 overflow-y-auto">
                  <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full mb-4 p-2 border rounded-lg text-black"
                  placeholder="Search..."
                />
                      <table className="min-w-full border-collapse ">
                          <thead>
                              <tr className="bg-gray-300">
                                  <th className="px-4 py-2 border text-black">Product Name</th>
                                  <th className="px-4 py-2 border text-black">Product ID</th>
                                  <th className="px-4 py-2 border text-black">Stored Stock</th>
                                  <th className="px-4 py-2 border text-black">Active Stock</th>

                              </tr>
                          </thead>
                          <tbody>{tableRows}</tbody>
                      </table>
                    
                      
                  </div>
                  <label className="mt-5 mr-5 text-black ">Quantity to Add or Delete: </label>
                  <input type="text" value={quantity} onChange={(e)=>setQuantity(e.target.value)} className="h-10 px-10 rounded border border-gray-300 text-black mt-5 "/>

                  {product != null && ( <button 
                          className="mt-4 ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                          onClick={()=>handleUpdateStock()}
                      >
                          Change Stock
                      </button>)}







                        </div>
                        </div>

       </div>



    </BaseModal>
    
    </>
)
}

