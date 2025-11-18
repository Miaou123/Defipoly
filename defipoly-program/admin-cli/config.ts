import { homedir } from 'os';
import * as path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

export const CONFIG = {
  RPC_URL: process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com',
  WALLET_PATH: process.env.ANCHOR_WALLET || path.join(homedir(), '.config/solana/id.json'),
  IDL_PATH: path.join(__dirname, '../target/idl/defipoly_program.json'),
  DEPLOYMENT_PATH: path.join(__dirname, '../scripts/deployment-info.json')
};