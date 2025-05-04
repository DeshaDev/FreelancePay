import React from 'react';
import { Header } from './components/Header';
import { PaymentForm } from './components/PaymentForm';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-md flex-1">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 md:p-8">
          <Header />
          
          <div className="mt-8">
            <PaymentForm />
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

export default App;