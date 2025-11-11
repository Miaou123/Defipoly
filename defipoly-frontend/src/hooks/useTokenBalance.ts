import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { TOKEN_MINT } from '@/utils/constants';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export function useTokenBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      setBalance(0);
      return;
    }

    const fetchBalance = async () => {
      // Only show loading state on initial load
      if (isInitialLoad) {
        setLoading(true);
      }
      
      try {
        const tokenAccount = await getAssociatedTokenAddress(
          TOKEN_MINT,
          publicKey
        );
        
        // Add retry logic for RPC calls
        let retries = 3;
        let accountInfo = null;
        
        while (retries > 0) {
          try {
            accountInfo = await connection.getAccountInfo(tokenAccount);
            break;
          } catch (error: any) {
            retries--;
            if (retries === 0) {
              console.error('Error fetching token balance:', error);
              setBalance(0);
              return;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
          }
        }
        
        if (!accountInfo) {
          // Token account doesn't exist yet
          setBalance(0);
          return;
        }

        const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
        setBalance(Number(tokenBalance.value.amount) / 1e9); // Convert from lamports
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance(0);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection, isInitialLoad]);

  return { balance, loading };
}