import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Footer from './Footer';

function App() {
  const [file, setFile] = useState(null);
  const [names, setNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(null);
  const [selectedNames, setSelectedNames] = useState([]);
  const [splitResult, setSplitResult] = useState(null);
  const [currency, setCurrency] = useState('$');
  const [checkboxClicked, setCheckboxClicked] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleNamesChange = (e) => setNames(e.target.value);

  // Logic for enabling/disabling Enter on "Go" and "Calculate Split"
  useEffect(() => {
    const handleEnterKey = (event) => {
      if (event.key === "Enter") {
        if (file && names && !items) {
          handleGo();
        } else if (checkboxClicked && items) {
          handleSplitCalculation();
        }
      }
    };
    window.addEventListener("keydown", handleEnterKey);
    return () => window.removeEventListener("keydown", handleEnterKey);
  }, [file, names, items, checkboxClicked]);

  // Scroll to the items table when items are loaded
  useEffect(() => {
    if (items) {
      const itemsSection = document.getElementById("items-section");
      if (itemsSection) {
        itemsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [items]);

  const handleGo = async () => {
    if (!file || !names) {
      setModalMessage("Please upload a file and add names first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('bill', file);

    try {
      const result = await axios.post(`${backendUrl}/upload-bill`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setItems(result.data.items.map(item => ({ ...item, selected: [] }))); // Clear selections
      setSplitResult(null);
      setCheckboxClicked(false);
      setSelectedNames(names.split(",").map(name => name.trim()));
      setCurrency(result.data.currency === 'INR' ? '₹' : '$');
    } catch (error) {
      console.error("Error processing the document:", error);
      setModalMessage("Failed to process the document.");
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

  const handleRemoveItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
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

    // Scroll down to the Split Result section
    setTimeout(() => {
      document.getElementById("split-result").scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleCheckboxChange = (index, name) => {
    setCheckboxClicked(true);
    const updatedItems = [...items];
    if (updatedItems[index].selected.includes(name)) {
      updatedItems[index].selected = updatedItems[index].selected.filter(n => n !== name);
    } else {
      updatedItems[index].selected.push(name);
    }
    setItems(updatedItems);
  };

  const handleSelectAllChange = (index, checked) => {
    const updatedItems = [...items];
    updatedItems[index].selected = checked ? [...selectedNames] : [];
    setItems(updatedItems);
  };

  const total = items ? items.reduce((acc, item) => acc + item.price, 0) : 0;
  const allItemsSelected = items && items.every(item => item.selected.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-100 flex flex-col items-center py-8">
      <h1 className="text-5xl font-bold text-teal-600 mb-8 tracking-wide">
        Smart<span className="text-green-500">Bill</span> Splitter
      </h1>

      {modalMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md">
          {modalMessage}
          <button onClick={() => setModalMessage("")} className="ml-4 text-white underline">Close</button>
        </div>
      )}

      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Step 1: Upload Bill Image</h2>
        <input type="file" onChange={handleFileChange} className="block w-full mb-4 border p-2 rounded" />

        <h2 className="text-lg font-semibold mb-4 text-gray-700">Step 2: Add Names</h2>
        <input
          type="text"
          value={names}
          onChange={handleNamesChange}
          placeholder="Enter names separated by commas"
          className="block w-full p-2 border border-gray-300 rounded-md mb-4"
        />

        <button
          onClick={handleGo}
          disabled={loading || !file || !names}
          className={`w-full py-2 ${file && names ? 'bg-lime-600 hover:bg-lime-900' : 'bg-gray-400'} text-white font-semibold rounded-md transition`}
        >
          {loading ? "Processing..." : "Go"}
        </button>
      </div>

      {items && (
        <div id="items-section" className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Bill Items and Payers</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded-lg text-center table-auto">
              <thead>
                <tr className="bg-green-100 text-green-800">
                  <th className="p-2 font-semibold">Item</th>
                  <th className="p-2 font-semibold">Price</th>
                  {selectedNames.map(name => (
                    <th key={name} className="p-2 font-semibold hidden md:table-cell">{name}</th>
                  ))}
                  <th className="p-2 font-semibold hidden md:table-cell">Select All</th>
                  <th className="p-2 font-semibold text-right">Edit</th>
                  <th className="p-2 font-semibold text-right">Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-100 transition">
                    <td className="p-2 text-gray-700">{item.item}</td>
                    <td className="p-2 text-gray-700">{currency}{item.price.toFixed(2)}</td>
                    {selectedNames.map(name => (
                      <td key={`${index}-${name}`} className="p-2 text-center hidden md:table-cell">
                        <input
                          type="checkbox"
                          checked={item.selected.includes(name)}
                          onChange={() => handleCheckboxChange(index, name)}
                          className="accent-purple-500"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center hidden md:table-cell">
                      <input
                        type="checkbox"
                        checked={item.selected.length === selectedNames.length} // Check if all selected
                        onChange={(e) => handleSelectAllChange(index, e.target.checked)}
                        className="accent-purple-500"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => handleEditPrice(index)}
                        className="text-blue-600 font-medium hover:text-blue-800 transition underline"
                      >
                        Edit
                      </button>
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 font-medium hover:text-red-800 transition underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAddItem}
              className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
            >
              Add Item
            </button>
          </div>
          <div className="text-center mt-4">
            <h3 className="text-lg font-semibold">Total: <span className="text-green-600">{currency}{total.toFixed(2)}</span></h3>
            <button
              onClick={handleSplitCalculation}
              disabled={!allItemsSelected}
              className={`m-4 py-2 px-8 ${allItemsSelected ? 'bg-lime-600 hover:bg-lime-900' : 'bg-gray-400'} text-white font-semibold rounded-md transition`}
            >
              Calculate
            </button>
          </div>
        </div>
      )}

      {splitResult && (
        <div id="split-result" className="w-full max-w-sm bg-white p-4 rounded-lg shadow-lg mt-6 px-20 ">
          <h2 className="text-2xl font-semibold mb-4 text-green-700 text-center">Split Per Person</h2>
          <ul className="divide-y divide-gray-200">
            {Object.entries(splitResult).map(([name, amount]) => (
              <li key={name} className="py-3 flex justify-between items-center gap-x-4">
                <strong className="text-gray-700 text-lg">{name}</strong>
                <span className="text-gray-700 text-lg font-bold">{currency}{amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default App;
