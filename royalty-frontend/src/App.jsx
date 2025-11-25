import React from 'react';
import { WalletProvider } from './context/WalletContext';
import AppRouter from './routes/router';

function App() {
  return (
    <WalletProvider>
      <AppRouter />
    </WalletProvider>
  );
}

export default App;