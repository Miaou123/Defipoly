import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { TOKEN_MINT } from '@/utils/constants';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export function useTokenBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setBalance(0);
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const tokenAccount = await getAssociatedTokenAddress(
          TOKEN_MINT,
          publicKey
        );
        
        const accountInfo = await connection.getAccountInfo(tokenAccount);
        
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
        setLoading(false);
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  return { balance, loading };
}