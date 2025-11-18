import { question } from '../utils/input.js';
import { validatePublicKey, validateNumber, validatePropertyId } from '../utils/validation.js';
import type { ProgramContext } from '../types.js';
import {
  GrantPropertyCommand,
  RevokePropertyCommand,
  GrantShieldCommand,
  UpdateCooldownCommand,
  EmergencyWithdrawCommand,
  TransferAuthorityCommand,
  ClosePlayerAccountCommand,
  UpdatePropertyPriceCommand,
  UpdatePropertyMaxSlotsCommand,
  UpdatePropertyYieldCommand,
  UpdateShieldCostCommand,
  PauseGameCommand,
  UnpauseGameCommand,
  UpdatePhaseCommand,
  UpdateStealChancesCommand,
  UpdateGlobalRatesCommand,
  ClearCooldownCommand,
  ClearStealCooldownCommand
} from '../commands/index.js';

export class MenuHandler {
  private ctx: ProgramContext;
  private commands: {
    grantProperty: GrantPropertyCommand;
    revokeProperty: RevokePropertyCommand;
    grantShield: GrantShieldCommand;
    updateCooldown: UpdateCooldownCommand;
    emergencyWithdraw: EmergencyWithdrawCommand;
    transferAuthority: TransferAuthorityCommand;
    closePlayerAccount: ClosePlayerAccountCommand;
    updatePropertyPrice: UpdatePropertyPriceCommand;
    updatePropertyMaxSlots: UpdatePropertyMaxSlotsCommand;
    updatePropertyYield: UpdatePropertyYieldCommand;
    updateShieldCost: UpdateShieldCostCommand;
    pauseGame: PauseGameCommand;
    unpauseGame: UnpauseGameCommand;
    updatePhase: UpdatePhaseCommand;
    updateStealChances: UpdateStealChancesCommand;
    updateGlobalRates: UpdateGlobalRatesCommand;
    clearCooldown: ClearCooldownCommand;
    clearStealCooldown: ClearStealCooldownCommand;
  };

  constructor(ctx: ProgramContext) {
    this.ctx = ctx;
    this.commands = {
      grantProperty: new GrantPropertyCommand(),
      revokeProperty: new RevokePropertyCommand(),
      grantShield: new GrantShieldCommand(),
      updateCooldown: new UpdateCooldownCommand(),
      emergencyWithdraw: new EmergencyWithdrawCommand(),
      transferAuthority: new TransferAuthorityCommand(),
      closePlayerAccount: new ClosePlayerAccountCommand(),
      updatePropertyPrice: new UpdatePropertyPriceCommand(),
      updatePropertyMaxSlots: new UpdatePropertyMaxSlotsCommand(),
      updatePropertyYield: new UpdatePropertyYieldCommand(),
      updateShieldCost: new UpdateShieldCostCommand(),
      pauseGame: new PauseGameCommand(),
      unpauseGame: new UnpauseGameCommand(),
      updatePhase: new UpdatePhaseCommand(),
      updateStealChances: new UpdateStealChancesCommand(),
      updateGlobalRates: new UpdateGlobalRatesCommand(),
      clearCooldown: new ClearCooldownCommand(),
      clearStealCooldown: new ClearStealCooldownCommand(),
    };
  }

  async handleGrantProperty(): Promise<void> {
    console.log('\n🎁 Grant Property Slots');
    console.log('-'.repeat(70));
    
    const propertyId = await this.getValidInput('Property ID (0-21): ', validatePropertyId);
    const playerAddress = await this.getValidInput('Player wallet address: ', validatePublicKey);
    const slots = await this.getValidInput('Number of slots: ', (input) => validateNumber(input, 1));

    await this.commands.grantProperty.execute(this.ctx, parseInt(propertyId), playerAddress, parseInt(slots));
  }

  async handleRevokeProperty(): Promise<void> {
    console.log('\n🚫 Revoke Property Slots');
    console.log('-'.repeat(70));
    
    const propertyId = await this.getValidInput('Property ID (0-21): ', validatePropertyId);
    const playerAddress = await this.getValidInput('Player wallet address: ', validatePublicKey);
    const slots = await this.getValidInput('Number of slots: ', (input) => validateNumber(input, 1));

    await this.commands.revokeProperty.execute(this.ctx, parseInt(propertyId), playerAddress, parseInt(slots));
  }

  async handleGrantShield(): Promise<void> {
    console.log('\n🛡️  Grant Shield');
    console.log('-'.repeat(70));
    
    const playerAddress = await this.getValidInput('Player wallet address: ', validatePublicKey);
    const hours = await this.getValidInput('Duration (hours): ', (input) => validateNumber(input, 1));

    await this.commands.grantShield.execute(this.ctx, playerAddress, parseInt(hours));
  }

  async handleUpdateCooldown(): Promise<void> {
    console.log('\n⏱️  Update Property Cooldown');
    console.log('-'.repeat(70));
    
    const propertyId = await this.getValidInput('Property ID (0-21): ', validatePropertyId);
    const minutes = await this.getValidInput('Cooldown duration (minutes): ', (input) => validateNumber(input, 0));

    await this.commands.updateCooldown.execute(this.ctx, parseInt(propertyId), parseInt(minutes));
  }

  async handleEmergencyWithdraw(): Promise<void> {
    console.log('\n🚨 Emergency Withdraw');
    console.log('-'.repeat(70));
    console.log('💡 Note: Enter whole token amounts (e.g., 1000 = 1,000 tokens)');
    console.log('   Decimals are added automatically.');
    
    const amount = await this.getValidInput('Amount to withdraw (whole tokens): ', (input) => validateNumber(input, 1));
    const destination = await this.getValidInput('Destination wallet address: ', validatePublicKey);

    const confirm = await question('⚠️  Withdraw from reward pool? (yes/no): ');
    if (confirm.toLowerCase() === 'yes') {
      await this.commands.emergencyWithdraw.execute(this.ctx, parseInt(amount), destination);
    } else {
      console.log('❌ Cancelled');
    }
  }

  async handleTransferAuthority(): Promise<void> {
    console.log('\n👑 Transfer Authority');
    console.log('-'.repeat(70));
    
    const newAuthority = await this.getValidInput('New authority wallet address: ', validatePublicKey);

    const confirm = await question('⚠️  Transfer ALL admin control? (yes/no): ');
    if (confirm.toLowerCase() === 'yes') {
      await this.commands.transferAuthority.execute(this.ctx, newAuthority);
    } else {
      console.log('❌ Cancelled');
    }
  }

  async handleClosePlayerAccount(): Promise<void> {
    console.log('\n🗑️  Close Player Account');
    console.log('-'.repeat(70));
    
    const playerAddress = await this.getValidInput('Player wallet address: ', validatePublicKey);

    const confirm = await question('Close account and recover rent? (yes/no): ');
    if (confirm.toLowerCase() === 'yes') {
      await this.commands.closePlayerAccount.execute(this.ctx, playerAddress);
    } else {
      console.log('❌ Cancelled');
    }
  }

  async handleUpdatePropertyPrice(): Promise<void> {
    console.log('\n💰 Update Property Price');
    console.log('-'.repeat(70));
    console.log('💡 Note: Enter whole token amounts (e.g., 1000 = 1,000 tokens)');
    console.log('   Decimals are added automatically.');
    
    const propertyId = await this.getValidInput('Property ID (0-21): ', validatePropertyId);
    const newPrice = await this.getValidInput('New price (whole tokens): ', (input) => validateNumber(input, 1));

    await this.commands.updatePropertyPrice.execute(this.ctx, parseInt(propertyId), parseInt(newPrice));
  }

  async handleUpdatePropertyMaxSlots(): Promise<void> {
    console.log('\n🏠 Update Property Max Slots');
    console.log('-'.repeat(70));
    
    const propertyId = await this.getValidInput('Property ID (0-21): ', validatePropertyId);
    const newMaxSlots = await this.getValidInput('New max slots: ', (input) => validateNumber(input, 1));

    await this.commands.updatePropertyMaxSlots.execute(this.ctx, parseInt(propertyId), parseInt(newMaxSlots));
  }

  async handleUpdatePropertyYield(): Promise<void> {
    console.log('\n📈 Update Property Yield');
    console.log('-'.repeat(70));
    
    const propertyId = await this.getValidInput('Property ID (0-21): ', validatePropertyId);
    const newYieldBps = await this.getValidInput('New yield (bps, e.g., 500 = 5%): ', (input) => validateNumber(input, 0));

    await this.commands.updatePropertyYield.execute(this.ctx, parseInt(propertyId), parseInt(newYieldBps));
  }

  async handleUpdateShieldCost(): Promise<void> {
    console.log('\n🛡️ Update Shield Cost');
    console.log('-'.repeat(70));
    
    const propertyId = await this.getValidInput('Property ID (0-21): ', validatePropertyId);
    const newShieldCostBps = await this.getValidInput('New shield cost (bps, e.g., 1000 = 10%): ', (input) => validateNumber(input, 0));

    await this.commands.updateShieldCost.execute(this.ctx, parseInt(propertyId), parseInt(newShieldCostBps));
  }

  async handlePauseGame(): Promise<void> {
    console.log('\n⏸️ Pause Game');
    console.log('-'.repeat(70));
    
    const confirm = await question('⚠️  This will pause ALL game actions. Continue? (yes/no): ');
    if (confirm.toLowerCase() === 'yes') {
      await this.commands.pauseGame.execute(this.ctx);
    } else {
      console.log('❌ Cancelled');
    }
  }

  async handleUnpauseGame(): Promise<void> {
    console.log('\n▶️ Unpause Game');
    console.log('-'.repeat(70));
    
    const confirm = await question('Resume all game actions? (yes/no): ');
    if (confirm.toLowerCase() === 'yes') {
      await this.commands.unpauseGame.execute(this.ctx);
    } else {
      console.log('❌ Cancelled');
    }
  }

  async handleUpdatePhase(): Promise<void> {
    console.log('\n🔄 Update Game Phase');
    console.log('-'.repeat(70));
    
    const newPhase = await this.getValidInput('New phase number: ', (input) => validateNumber(input, 1));

    await this.commands.updatePhase.execute(this.ctx, parseInt(newPhase));
  }

  async handleUpdateStealChances(): Promise<void> {
    console.log('\n🎯 Update Steal Chances');
    console.log('-'.repeat(70));
    
    const targetedBps = await this.getValidInput('Targeted steal chance (bps, e.g., 2500 = 25%): ', (input) => validateNumber(input, 0));
    const randomBps = await this.getValidInput('Random steal chance (bps, e.g., 3300 = 33%): ', (input) => validateNumber(input, 0));

    await this.commands.updateStealChances.execute(this.ctx, parseInt(targetedBps), parseInt(randomBps));
  }

  async handleUpdateGlobalRates(): Promise<void> {
    console.log('\n🌍 Update Global Rates');
    console.log('-'.repeat(70));
    
    console.log('Enter new values (leave empty to skip):');
    
    const stealCost = await question('Steal cost (bps): ');
    const setBonus = await question('Set bonus (bps): ');
    const maxProperties = await question('Max properties per claim: ');
    const minInterval = await question('Min claim interval (minutes): ');

    const options: any = {};
    if (stealCost) options.stealCostBps = parseInt(stealCost);
    if (setBonus) options.setBonusBps = parseInt(setBonus);
    if (maxProperties) options.maxPropertiesClaim = parseInt(maxProperties);
    if (minInterval) options.minClaimInterval = parseInt(minInterval);

    if (Object.keys(options).length === 0) {
      console.log('❌ No changes specified');
      return;
    }

    await this.commands.updateGlobalRates.execute(this.ctx, options);
  }

  async handleClearCooldown(): Promise<void> {
    console.log('\n⏱️ Clear Purchase Cooldown');
    console.log('-'.repeat(70));
    
    const playerAddress = await this.getValidInput('Player wallet address: ', validatePublicKey);
    const setId = await this.getValidInput('Set ID (0-7): ', (input) => validateNumber(input, 0, 7));

    await this.commands.clearCooldown.execute(this.ctx, playerAddress, parseInt(setId));
  }

  async handleClearStealCooldown(): Promise<void> {
    console.log('\n🎯 Clear Steal Cooldown');
    console.log('-'.repeat(70));
    
    const playerAddress = await this.getValidInput('Player wallet address: ', validatePublicKey);
    const propertyId = await this.getValidInput('Property ID (0-21): ', validatePropertyId);

    await this.commands.clearStealCooldown.execute(this.ctx, playerAddress, parseInt(propertyId));
  }

  private async getValidInput(prompt: string, validator: (input: string) => boolean): Promise<string> {
    let input: string;
    do {
      input = await question(prompt);
      if (!validator(input)) {
        if (prompt.includes('address')) {
          console.log('❌ Invalid Solana address');
        } else if (prompt.includes('Property ID')) {
          console.log('❌ Invalid property ID (must be 0-21)');
        } else {
          console.log('❌ Invalid input');
        }
      }
    } while (!validator(input));
    return input;
  }
}