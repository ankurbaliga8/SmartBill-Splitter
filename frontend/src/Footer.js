// src/components/Footer.js
import React from 'react';

const Footer = () => (
    <footer className="w-full bg-gray-100 py-4 text-center text-gray-600 text-xs mt-8">
        <div className="container mx-auto">
            <p className="mb-1">SmartBill Splitter &copy; {new Date().getFullYear()} - Developed by <strong>Ankur Baliga</strong></p>
            <p className="mb-2">Making bill-splitting simple, accurate, and hassle-free.</p>
            <div className="flex justify-center space-x-4">
                <a href="hhttps://www.linkedin.com/in/ankurbaliga/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                    LinkedIn
                </a>
                <a href="https://github.com/ankurbaliga8" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-black">
                    GitHub
                </a>
            </div>
        </div>
    </footer>
);

export default Footer;
