import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const WalletContext = createContext();

// CHANGED: Target Sepolia instead of Localhost
const SEPOLIA_NETWORK_ID = '0xaa36a7'; // 11155111 (Hex)
const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org'; // Public RPC for MetaMask configuration

export const WalletProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  // 1. ROBUST SESSION RESTORATION (UNTOUCHED)
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const storedRole = localStorage.getItem('userRole');
        const storedWallet = localStorage.getItem('walletAddress');

        if (storedRole && storedWallet && window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            // Silent connection check
            const accounts = await provider.send("eth_accounts", []);
            
            if (accounts.length > 0) {
                // If wallet matches stored session, restore it
                if (accounts[0].toLowerCase() === storedWallet.toLowerCase()) {
                    setCurrentAccount(accounts[0]);
                    setUserRole(storedRole);
                } else {
                    // Mismatch: User changed wallet in background. Clear session.
                    localStorage.clear();
                }
            } else {
                // Locked or Disconnected
                localStorage.clear();
            }
        }
      } catch (error) {
        console.error("Session check failed", error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // 2. LISTEN FOR ACCOUNT CHANGES (UNTOUCHED)
  useEffect(() => {
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', () => {
            // Immediate reload to Landing Page if wallet changes
            localStorage.clear();
            window.location.href = "/"; 
        });
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }
  }, []);

  // 3. CONNECT WALLET (UPDATED FOR SEPOLIA)
  const connectWallet = async (force = false) => {
    if (!window.ethereum) {
      alert("Please install Rabby or MetaMask!");
      return null;
    }
    try {
      if (force) {
        try {
            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }]
            });
        } catch (error) {
            console.error("User cancelled permission request:", error);
            return null;
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) return null;
      const address = accounts[0];

      // CHANGED: Switch to Sepolia Testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_NETWORK_ID }],
        });
      } catch (switchError) {
        // This error code 4902 means the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: SEPOLIA_NETWORK_ID,
                  chainName: 'Sepolia Testnet',
                  rpcUrls: [SEPOLIA_RPC_URL],
                  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                  blockExplorerUrls: ['https://sepolia.etherscan.io/']
                },
              ],
            });
          } catch (addError) { console.error("Failed to add Sepolia network", addError); }
        }
      }

      return address; 
    } catch (error) {
      console.error("Connection Error:", error);
      return null;
    }
  };

  const login = (role, address) => {
    setUserRole(role);
    setCurrentAccount(address);
    localStorage.setItem('userRole', role);
    localStorage.setItem('walletAddress', address);
  };

  const logout = () => {
    setUserRole(null);
    setCurrentAccount(null);
    localStorage.clear();
    window.location.href = "/"; 
  };

  return (
    <WalletContext.Provider value={{ currentAccount, userRole, connectWallet, login, logout, isLoading }}>
      {children}
    </WalletContext.Provider>
  );
};