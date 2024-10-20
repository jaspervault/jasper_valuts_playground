import { JVault, ADDRESSES, OptionType } from "@jaspervault/jvault.js";
import { ethers } from 'ethers';
import config from "@jaspervault/jvault.js/dist/src/api/config/base.json" assert { type: "json" };
import * as dotenv from 'dotenv';
import { coinbaseConfig } from './config/coinbase_config.js';
import CoinbaseHandlerModule from '@jaspervault/jvault.js/dist/src/utils/CoinbaseHandler.js';
const CoinbaseHandler = CoinbaseHandlerModule.default;


dotenv.config();

async function main() {
    let network_config = JVault.readNetworkConfig("base");

    let ethersProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    let ethersSigner = new ethers.Wallet(process.env.PRIVATE_KEY_HOLDER, new ethers.providers.JsonRpcProvider(config.rpcUrl));


    let coinbaseHandler = new CoinbaseHandler({
        chainId: network_config.chainId,
        ethersProvider: ethersProvider,
        ethersSigner: ethersSigner,
        bundlerUrl: coinbaseConfig.bundlerUrl,
        data: {
            contractData: {
                EntryPoint: network_config.contractData.EntryPoint,
                VaultFactory: network_config.contractData.VaultFactory
            }
        }
    });

    let config_holder = {
        ethersProvider: ethersProvider,
        ethersSigner: ethersSigner,
        network: network_config.name,
        EOA: ethersSigner.address,
        transactionHandler: coinbaseHandler
    };
    let feeData = await config_holder.ethersProvider.getFeeData();
    let jVault_holder = new JVault(config_holder);
    let optionVault = ethers.constants.AddressZero;


    let vaults_1 = await jVault_holder.VaultAPI.initNewAccount();

    console.log(`optionVault: ${optionVault}`);
    console.log("feeData:", feeData.lastBaseFeePerGas?.toString());
    console.log(`vaults_1: ${vaults_1}`);




    try {
        let writer_config = await jVault_holder.OptionTradingAPI.getOptionWriterSettings();

        let tx = await jVault_holder.OptionTradingAPI.createOrder({
            amount: ethers.utils.parseEther('0.001'),
            underlyingAsset: ADDRESSES.base.CBBTC,
            optionType: OptionType.CALL,
            premiumAsset: ADDRESSES.base.USDC,
            optionVault: optionVault,
            optionWriter: writer_config.base.CALL.CBBTC,
            premiumVault: vaults_1,
            chainId: config.chainId,
            secondsToExpiry: 3600 * 2
        });
        if (tx) {
            console.log(`order TX: ${tx}`);
            let order = await jVault_holder.OptionTradingAPI.getOrderByHash(tx);
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
