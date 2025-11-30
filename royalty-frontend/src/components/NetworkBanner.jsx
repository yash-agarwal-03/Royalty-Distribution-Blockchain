// src/components/NetworkBanner.jsx
import React, { useContext, useEffect, useState } from 'react';
import { WalletContext } from '../context/WalletContext';

const SEPOLIA_ID = '0xaa36a7'; 

const NetworkBanner = () => {
  const [networkError, setNetworkError] = useState(false);
  
  // You might need to expose 'chainId' from your WalletContext or just listen to window.ethereum here
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        // Warning: Localhost chainId is different ('0x7a69'), so this banner 
        // might show "Wrong Network" on local unless you add logic for that too.
        // For Production (Sepolia), this logic is correct.
        setNetworkError(chainId !== SEPOLIA_ID);
        
        window.ethereum.on('chainChanged', (newId) => {
            setNetworkError(newId !== SEPOLIA_ID);
        });
      }
    };
    checkNetwork();
  }, []);

  if (networkError) {
    return (
      <div className="bg-danger text-white text-center py-2 fw-bold fixed-top" style={{zIndex: 9999}}>
        ⚠️ WRONG NETWORK! Please switch your wallet to Sepolia Testnet.
      </div>
    );
  }

  return (
    <div className="bg-warning text-dark text-center py-1 small fw-bold" style={{zIndex: 9999}}>
      🚧 TESTNET MODE: Use Sepolia ETH only. Real money will be lost. 🚧
    </div>
  );
};

export default NetworkBanner;