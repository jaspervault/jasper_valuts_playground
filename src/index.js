import { JVault, ADDRESSES, OptionType } from "@jaspervault/jvault.js";
import { ethers } from 'ethers';
import config from "@jaspervault/jvault.js/dist/src/api/config/arbitrum.json" assert { type: "json" };
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    let network_config = JVault.readNetworkConfig("arbitrum");

    let config_holder = {
        ethersProvider: new ethers.providers.JsonRpcProvider(network_config.rpcUrl),
        ethersSigner: new ethers.Wallet(process.env.PRIVATE_KEY_HOLDER,
            new ethers.providers.JsonRpcProvider(network_config.rpcUrl)),
        network: network_config.name,
        EOA: new ethers.Wallet(process.env.PRIVATE_KEY_HOLDER,
            new ethers.providers.JsonRpcProvider(network_config.rpcUrl)).address
    };
    let feeData = await config_holder.ethersProvider.getFeeData();
    let jVault_holder = new JVault(config_holder);
    let optionVault = ethers.constants.AddressZero
    let vaults_1 = await jVault_holder.VaultAPI.initNewAccount();

    console.log(`optionVault: ${optionVault}`);
    console.log("feeData:", feeData.lastBaseFeePerGas?.toString());
    console.log(`vaults_1: ${vaults_1}`);
    try {
        let writer_config = await jVault_holder.OptionTradingAPI.getOptionWriterSettings();
        let tx = await jVault_holder.OptionTradingAPI.createOrder({
            amount: ethers.utils.parseEther('0.01'),
            underlyingAsset: ADDRESSES.arbitrum.ARB,
            optionType: OptionType.CALL,
            premiumAsset: ADDRESSES.arbitrum.USDT,
            optionVault: optionVault,
            optionWriter: writer_config.arbitrum.CALL.ARB,
            premiumVault: vaults_1,
            chainId: config.chainId,
            secondsToExpiry: 3600 * 2
        }, {
            maxFeePerGas: feeData.lastBaseFeePerGas?.add(ethers.utils.parseUnits('0.001', 'gwei')),
            maxPriorityFeePerGas: ethers.utils.parseUnits('0.001', 'gwei')
        });
        if (tx) {
            console.log(`order TX: ${tx.hash}`);
            let order = await jVault_holder.OptionTradingAPI.getOrderByHash(tx.hash);
            console.log(order);
        }
    }
    catch (error) {
        console.error(`call order failed: ${error}`);
    }


}

main().catch(error => {
    console.error(error);
    // process.exitCode = 1;
});
