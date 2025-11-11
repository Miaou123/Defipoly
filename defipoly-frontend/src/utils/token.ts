import { Connection, PublicKey } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { TOKEN_MINT } from './constants';

export async function getOrCreateTokenAccount(
  connection: Connection,
  payer: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const tokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const accountInfo = await connection.getAccountInfo(tokenAccount);
  
  if (!accountInfo) {
    throw new Error('TOKEN_ACCOUNT_NOT_FOUND');
  }

  return tokenAccount;
}

export async function createTokenAccountInstruction(owner: PublicKey) {
  const tokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return createAssociatedTokenAccountInstruction(
    owner, // payer
    tokenAccount,
    owner, // owner
    TOKEN_MINT,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

export async function checkTokenAccountExists(
  connection: Connection,
  owner: PublicKey
): Promise<boolean> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      owner,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Add retry logic for RPC failures
    let retries = 3;
    while (retries > 0) {
      try {
        const accountInfo = await connection.getAccountInfo(tokenAccount);
        return accountInfo !== null;
      } catch (error: any) {
        retries--;
        if (retries === 0) throw error;
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
      }
    }
    
    return false;
  } catch (error: any) {
    console.error(`failed to get info about account ${owner.toString()}:`, error);
    return false; // Assume doesn't exist on error
  }
}