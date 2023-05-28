import { default as chalk } from 'chalk'
import { default as clear } from 'clear'
import { default as figlet } from 'figlet'
import { ethers } from 'ethers';
import { readFile } from 'fs/promises';
import { default as dotenv } from "dotenv"
import { ask_start_args } from "./settings.js"
import valut_helper from './vault.js';
import { default as contractConfig } from './config.js';

let args = await ask_start_args();
dotenv.config();
// let network = process.argv.slice(2)
let settings = args.settings
var contractData = args.contractData
var accounts = JSON.parse(
    await readFile(
        new URL('./accounts.json', import.meta.url)
    )
)
let accountData = []
for (const [key, value] of Object.entries(accounts)) {
    accountData.push({
        name: key,
        value: value
    })
}
let ctx = {
    ethers_provider: args.provider,
    deployer: args.signer,
    owner: args.owner,
    // new_fund_addr: "0xC39d6ab4E6CF1F1eEf93034D03963b3E9d523de5",
    master_fund: "",
    master: new ethers.Wallet(accountData[0].value, args.provider),
    SetJsInstance: args.SetJsInstance,
    cur_setdetails: {},
    settings: settings,
    contractData: contractData,
    contractConfig: contractConfig
}


async function main() {
    let r = {}
    showHEAD();
    const vault_address = await settings.aa_options.accountAPI.getCounterFactualAddress()
    console.log("vault_address", vault_address);
    if (!ctx.master_fund) {
        let create_data = await create({
            name: `master${new Date().getMonth()}${new Date().getDate()}`,
            symbol: `master${new Date().getMonth()}${new Date().getDate()}`,
            vaultType: 1
        });
        ctx.master_fund = create_data.fund_addr;
        console.log("create_data", create_data);
    }
}
async function showHEAD() {
    clear()
    console.log(
        chalk.green(
            figlet.textSync('Jasper Finance', { horizontalLayout: 'full' })
        )
    );
}

async function create(new_fund_settings) {
    let components = []
    components.push({
        token_addr: settings.usdc_addr,
        allocation: 100,
        price: 1,
        unit: 0
    })
    for (const component of components) {
        let erc20_contract = valut_helper.getContract(ctx, "ERC20", component.token_addr);
        component.unit = valut_helper.getHolding(component.allocation, component.price, await erc20_contract.decimals())
    }
    return await valut_helper.createV2(ctx, new_fund_settings, components, true);
}

main()
    .then(() => {
        console.log("EXIT--------------->")
        process.exit(0)
    }
    )
    .catch(error => {
        console.error(error);
        process.exit(1);
    });