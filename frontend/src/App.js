import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [names, setNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(null);
  const [selectedNames, setSelectedNames] = useState([]);
  const [splitResult, setSplitResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleNamesChange = (e) => {
    setNames(e.target.value);
  };

  const handleGo = async () => {
    if (!file || !names) {
      alert("Please upload a file and add names first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('bill', file);

    try {
      const result = await axios.post('/api/upload-bill', formData, {  // Relative path for compatibility with Vercel
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setItems(result.data.items.map(item => ({ ...item, selected: [] })));
      setSelectedNames(names.split(",").map(name => name.trim()));
    } catch (error) {
      console.error("Error processing the document:", error);
      alert("Failed to process the document.");
    }
    setLoading(false);
  };

  const handleEditPrice = (index) => {
    const newPrice = prompt("Enter the new price:", items[index].price);
    if (newPrice) {
      const updatedItems = [...items];
      updatedItems[index].price = parseFloat(newPrice);
      setItems(updatedItems);
    }
  };

  const handleAddItem = () => {
    const itemName = prompt("Enter item name:");
    const itemPrice = prompt("Enter item price:");
    if (itemName && itemPrice) {
      setItems([...items, { item: itemName, price: parseFloat(itemPrice), selected: [] }]);
    }
  };

  const handleSplitCalculation = () => {
    const totalPerPerson = {};
    selectedNames.forEach(name => totalPerPerson[name] = 0);

    items.forEach(item => {
      const selectedPeople = item.selected || [];
      const splitCost = item.price / selectedPeople.length;

      selectedPeople.forEach(name => {
        totalPerPerson[name] += splitCost;
      });
    });

    setSplitResult(totalPerPerson);
  };

  const total = items ? items.reduce((acc, item) => acc + item.price, 0) : 0;
  const allItemsSelected = items && items.every(item => item.selected.length > 0);

  return (
    <div className="App">
      <h1>SmartBill Splitter</h1>

      <div className="upload-section">
        <h2>Step 1: Upload Bill Image</h2>
        <input type="file" onChange={handleFileChange} />
      </div>

      <div className="names-section">
        <h2>Step 2: Add Names</h2>
        <input
          type="text"
          value={names}
          onChange={handleNamesChange}
          placeholder="Enter names separated by commas"
          style={{ width: '100%', maxWidth: '400px', padding: '10px', fontSize: '1rem', boxSizing: 'border-box' }}
        />
      </div>

      <div className="action-section">
        <button onClick={handleGo} disabled={loading || !file || !names}>
          {loading ? "Processing..." : "Go"}
        </button>
      </div>

      {items && (
        <div className="table-section">
          <h2>Items and Prices</h2>
          <button onClick={handleAddItem}>Add Item</button>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                {selectedNames.map(name => (
                  <th key={name}>{name}</th>
                ))}
                <th>Select All</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.item}</td>
                  <td>${item.price.toFixed(2)}</td>
                  {selectedNames.map(name => (
                    <td key={`${index}-${name}`}>
                      <input
                        type="checkbox"
                        checked={item.selected.includes(name)}
                        onChange={() => {
                          const updatedItems = [...items];
                          if (updatedItems[index].selected.includes(name)) {
                            updatedItems[index].selected = updatedItems[index].selected.filter(n => n !== name);
                          } else {
                            updatedItems[index].selected.push(name);
                          }
                          setItems(updatedItems);
                        }}
                      />
                    </td>
                  ))}
                  <td>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const updatedItems = [...items];
                        updatedItems[index].selected = checked ? [...selectedNames] : [];
                        setItems(updatedItems);
                      }}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleEditPrice(index)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Total: <strong>${total.toFixed(2)}</strong></h3>
          <button onClick={handleSplitCalculation} disabled={!allItemsSelected}>Calculate Split</button>
        </div>
      )}

      {splitResult && (
        <div className="result-section">
          <h2>Split Per Person</h2>
          <ul>
            {Object.entries(splitResult).map(([name, amount]) => (
              <li key={name}>
                <strong>{name}</strong>: ${amount.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;















// import React, { useState } from 'react';
// import axios from 'axios';
// import './App.css';

// function App() {
//   const [file, setFile] = useState(null);
//   const [names, setNames] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [items, setItems] = useState(null);
//   const [selectedNames, setSelectedNames] = useState([]);
//   const [splitResult, setSplitResult] = useState(null);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   const handleNamesChange = (e) => {
//     setNames(e.target.value);
//   };

//   const handleGo = async () => {
//     if (!file || !names) {
//       alert("Please upload a file and add names first.");
//       return;
//     }

//     setLoading(true);
//     const formData = new FormData();
//     formData.append('bill', file);

//     try {
//       const result = await axios.post('http://localhost:3001/upload-bill', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         }
//       });
//       setItems(result.data.items.map(item => ({ ...item, selected: [] }))); // Initialize selected array
//       setSelectedNames(names.split(",").map(name => name.trim()));
//     } catch (error) {
//       console.error("Error processing the document:", error);
//       alert("Failed to process the document.");
//     }
//     setLoading(false);
//   };

//   // Allow editing item price using an "Edit" button
//   const handleEditPrice = (index) => {
//     const newPrice = prompt("Enter the new price:", items[index].price);
//     if (newPrice) {
//       const updatedItems = [...items];
//       updatedItems[index].price = parseFloat(newPrice);
//       setItems(updatedItems);
//     }
//   };

//   // Add a new item if it was missed in Textract
//   const handleAddItem = () => {
//     const itemName = prompt("Enter item name:");
//     const itemPrice = prompt("Enter item price:");
//     if (itemName && itemPrice) {
//       setItems([...items, { item: itemName, price: parseFloat(itemPrice), selected: [] }]);
//     }
//   };

//   const handleSplitCalculation = () => {
//     const totalPerPerson = {};
//     selectedNames.forEach(name => totalPerPerson[name] = 0);

//     items.forEach(item => {
//       const selectedPeople = item.selected || [];
//       const splitCost = item.price / selectedPeople.length;

//       selectedPeople.forEach(name => {
//         totalPerPerson[name] += splitCost;
//       });
//     });

//     setSplitResult(totalPerPerson);
//   };

//   // Calculate dynamic total based on item prices (without including it in the items list)
//   const total = items ? items.reduce((acc, item) => acc + item.price, 0) : 0;

//   // Ensure that "Calculate Split" is only enabled when all items are selected at least once
//   const allItemsSelected = items && items.every(item => item.selected.length > 0);

//   return (
//     <div className="App">
//       <h1>SmartBill Splitter</h1>

//       {/* Step 1: File Upload */}
//       <div className="upload-section">
//         <h2>Step 1: Upload Bill Image</h2>
//         <input type="file" onChange={handleFileChange} />
//       </div>

//       {/* Step 2: Enter Names */}
//       <div className="names-section">
//         <h2>Step 2: Add Names</h2>
//         <input
//           type="text"
//           value={names}
//           onChange={handleNamesChange}
//           placeholder="Enter names separated by commas"
//           style={{ width: '100%', maxWidth: '400px', padding: '10px', fontSize: '1rem', boxSizing: 'border-box' }}
//         />
//       </div>

//       {/* Step 3: Go Button */}
//       <div className="action-section">
//         <button onClick={handleGo} disabled={loading || !file || !names}>
//           {loading ? "Processing..." : "Go"}
//         </button>
//       </div>

//       {/* Display Items Table */}
//       {items && (
//         <div className="table-section">
//           <h2>Items and Prices</h2>
//           <button onClick={handleAddItem}>Add Item</button> {/* Add Item Button */}
//           <table>
//             <thead>
//               <tr>
//                 <th>Item</th>
//                 <th>Price</th>
//                 {selectedNames.map(name => (
//                   <th key={name}>{name}</th>
//                 ))}
//                 <th>Select All</th>
//                 <th>Edit</th>
//               </tr>
//             </thead>
//             <tbody>
//               {items.map((item, index) => (
//                 <tr key={index}>
//                   <td>{item.item}</td>
//                   <td>${item.price.toFixed(2)}</td>
//                   {selectedNames.map(name => (
//                     <td key={`${index}-${name}`}>
//                       <input
//                         type="checkbox"
//                         checked={item.selected.includes(name)}
//                         onChange={() => {
//                           const updatedItems = [...items];
//                           if (updatedItems[index].selected.includes(name)) {
//                             updatedItems[index].selected = updatedItems[index].selected.filter(n => n !== name);
//                           } else {
//                             updatedItems[index].selected.push(name);
//                           }
//                           setItems(updatedItems);
//                         }}
//                       />
//                     </td>
//                   ))}
//                   <td>
//                     <input
//                       type="checkbox"
//                       onChange={(e) => {
//                         const checked = e.target.checked;
//                         const updatedItems = [...items];
//                         updatedItems[index].selected = checked ? [...selectedNames] : [];
//                         setItems(updatedItems);
//                       }}
//                     />
//                   </td>
//                   <td>
//                     <button onClick={() => handleEditPrice(index)}>Edit</button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <h3>Total: <strong>${total.toFixed(2)}</strong></h3> {/* Total display */}
//           <button onClick={handleSplitCalculation} disabled={!allItemsSelected}>Calculate Split</button>
//         </div>
//       )}

//       {/* Display Split Results */}
//       {splitResult && (
//         <div className="result-section">
//           <h2>Split Per Person</h2>
//           <ul>
//             {Object.entries(splitResult).map(([name, amount]) => (
//               <li key={name}>
//                 <strong>{name}</strong>: ${amount.toFixed(2)}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
