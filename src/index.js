import { JVault, ADDRESSES, OptionType } from "@jaspervault/jvault.js";
import { ethers } from 'ethers';
import config from "@jaspervault/jvault.js/dist/src/api/config/arbitrum.json" assert { type: "json" };
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    let config_holder = {
        ethersProvider: new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc"),
        ethersSigner: new ethers.Wallet(process.env.PRIVATE_KEY_HOLDER,
            new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc")),
        network: 'arbitrum',
        EOA: new ethers.Wallet(process.env.PRIVATE_KEY_HOLDER,
            new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc")).address
    };
    let feeData = await config_holder.ethersProvider.getFeeData();

    let jVault_holder = new JVault(config_holder);
    let optionVault = await jVault_holder.VaultAPI.createNewVault(jVault_holder.EOA, {
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: ethers.utils.parseUnits('0.001', 'gwei')
    });
    console.log(`optionVault: ${optionVault}`);
    let vaults_1 = await jVault_holder.VaultAPI.getAddress(jVault_holder.EOA, 1);
    if (optionVault != ethers.constants.AddressZero) {
        try {
            let writer_config = await jVault_holder.OptionTradingAPI.getOptionWriterSettings();
            let tx = await jVault_holder.OptionTradingAPI.InitializeVaultAndplaceOrder({
                amount: ethers.utils.parseEther('100'),
                underlyingAsset: ADDRESSES.arbitrum.ARB,
                optionType: OptionType.CALL,
                premiumAsset: ADDRESSES.arbitrum.USDT,
                optionVault: optionVault,
                optionWriter: writer_config.arbitrum.CALL.ARB,
                premiumVault: vaults_1,
                chainId: config.chainId,
                secondsToExpiry: 3600 * 2
            }, {
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: ethers.utils.parseUnits('0.001', 'gwei')
            });
            if (tx) {
                console.log(`order TX: ${tx.hash}`);
                await tx.wait(1);
                let order = await jVault_holder.OptionTradingAPI.getOrderByHash(tx.hash);
                console.log(order);
            }
        }
        catch (error) {
            console.error(`call order failed: ${error}`);
        }
    }


}

main().catch(error => {
    console.error(error);
    // process.exitCode = 1;
});
