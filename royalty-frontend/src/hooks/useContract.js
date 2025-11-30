import { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';

const useContract = () => {
  const { currentAccount } = useContext(WalletContext);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const initContract = async () => {
      if (window.ethereum && currentAccount) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
          );
          setContract(contractInstance);
        } catch (error) {
          console.error("Failed to load contract:", error);
        }
      }
    };
    initContract();
  }, [currentAccount]);

  return contract;
};

export default useContract;