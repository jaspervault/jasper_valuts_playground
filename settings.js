import inquirer from "inquirer";
import { readFile } from 'fs/promises';
import { ethers } from "ethers";
import { SimpleAccountAPI } from "@account-abstraction/sdk";
import Set from "set.js";
import { default as dotenv } from "dotenv"
var contractData = {}
var network = {}
var settings = {}
dotenv.config();
async function ask_start_args() {
    if (process.env.NET_WORK_NAME !== undefined) {
        return process.env.NET_WORK_NAME
    }
    const questions = [
        {
            name: 'opt',
            type: 'checkbox',
            message: 'Choice Chain NetWork',
            choices: [
                { name: "1 Ethereum", value: "ethereum" },
                { name: "2 Goerli", value: "goerli" },
                { name: "3 Sepolia", value: "sepolia" },
                { name: "4 Polygon", value: "polygon" },
                { name: "5 Mumbai", value: "mumbai" },
            ],
            validate: function (answer) {
                console.log(answer);
                if (answer.length < 1) {
                    return 'You must choose at least one chain';
                }
                return true
            }
        }
    ]
    let net = await inquirer.prompt(questions)
    process.env.NET_WORK_NAME = net.opt[0]
    network = net.opt[0]

    contractData = JSON.parse(
        await readFile(
            new URL(`./contractData.${network}.json`, import.meta.url)
        )
    )
    settings = JSON.parse(
        await readFile(
            new URL(`./settings.${network}.json`, import.meta.url)
        )
    )
    var accounts = JSON.parse(
        await readFile(
            new URL('./accounts.json', import.meta.url)
        )
    )
    let provider = new ethers.providers.JsonRpcProvider(settings.json_rpc)
    let data = []
    for (const [key, value] of Object.entries(accounts)) {
        data.push({
            name: key,
            value: value
        })
    }
    let answer = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'account',
            message: 'Which account?',
            choices: data
        }
    ]);
    let signer = new ethers.Wallet(new ethers.Wallet(answer.account[0]), provider)
    if (settings.accountIndex != -1) {
        let accountAPI = await getVaultAccountAPI(signer, settings.accountIndex)
        settings.aa_options = { accountAPI: accountAPI, use_paymaster: settings.use_paymaster }
    }
    else {
        settings.aa_options = {};
    }
    const contract_address = {
        controllerAddress: contractData.Controller,
        setTokenCreatorAddress: contractData.SetTokenCreator,
        basicIssuanceModuleAddress: contractData.BasicIssuanceModule,
        debtIssuanceModuleAddress: contractData.DebtIssuanceModule,
        debtIssuanceModuleV2Address: contractData.DebtIssuanceModuleV2,
        streamingFeeModuleAddress: contractData.StreamingFeeModule,
        tradeModuleAddress: contractData.TradeModule,
        navIssuanceModuleAddress: contractData.NavIssuanceModule,
        protocolViewerAddress: contractData.ProtocolViewer,
    };
    const SetJsConfig = {
        ethersProvider: provider,
        ...contract_address,
    };
    let SetJs = Set.default

    const SetJsInstance = new SetJs(SetJsConfig);
    if (settings.aa_options) {
        signer = settings.aa_options.accountAPI.owner;
    }

    return {
        settings: settings,
        network: network,
        contractData: contractData,
        provider: provider,
        signer: signer,

        SetJsInstance: SetJsInstance,
    }
}

async function getVaultAccountAPI(signer, index) {
    const accountAPI = new SimpleAccountAPI({
        provider: signer.provider,
        entryPointAddress: settings.entryPoint,
        owner: signer,
        factoryAddress: contractData.VaultFactory,
        index: index
    });
    accountAPI.getUserOpReceipt = async (
        userOpHash,
        timeout = 30000,
        interval = 5000
    ) => {
        const endtime = Date.now() + timeout;
        const block = await accountAPI.provider.getBlock("latest");
        while (Date.now() < endtime) {
            // @ts-ignore
            const events = await accountAPI.entryPointView.queryFilter(
                // @ts-ignore
                accountAPI.entryPointView.filters.UserOperationEvent(userOpHash),
                Math.max(0, block.number - 100)
            );
            if (events.length > 0) {
                return events[0].transactionHash;
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        return null;
    };
    return accountAPI;
}


export default { ask_start_args }
export { contractData, network, settings, getVaultAccountAPI, ask_start_args }