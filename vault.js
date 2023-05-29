import { contractData, settings } from "./settings.js"
import { ethers } from "ethers";
import { Client, UserOperationBuilder, Presets } from "userop";


function getHolding(unitvalue, tokenprice, decimals) {
    var unit = unitvalue / tokenprice;
    unit = unit.toFixed(8)
    return ethers.utils.parseUnits(unit.toString(), decimals)
}
async function approveERC20(context, token_addr, spender) {
    try {
        let erc20_contract = getContract(context, "ERC20", token_addr);
        let allowance = await erc20_contract.allowance(context.deployer.address, spender);

        if (allowance.eq(ethers.constants.Zero)) {
            console.log(`Approve ${spender} to spend token in ${context.deployer.address}`);
            let r = await sendTransaction(settings.aa_options, erc20_contract, "approve", spender, ethers.constants.MaxUint256)
            await r.wait(1);
            return r;
        } else {
            return {
                hash: "1", wait: function () {
                    return 1;
                }
            };
        }
    } catch (ex) {
        console.error(ex);
        return ex
    }
}

async function createV2(context, newfund_config, components, isLeverage = false) {
    let DelegatedManagerFactory = getContract(context, "DelegatedManagerFactory");
    var StreamingFeeSplitExtension = getContract(context, "StreamingFeeSplitExtension");
    var NAVIssuanceExtension = getContract(context, "NAVIssuanceExtension");
    var IssuanceExtension = getContract(context, "IssuanceExtension");
    var SignalSuscriptionExtension = getContract(context, "SignalSuscriptionExtension");
    var CopyTradingExtension = getContract(context, "CopyTradingExtension");
    var WrapExtension = getContract(context, "WrapExtension");
    var UtilsExtension = getContract(context, "UtilsExtension");
    if (contractData.LeverageExtension && isLeverage) {
        var LeverageExtension = getContract(context, "LeverageExtension");
    }
    let init_holdings = []
    let init_holdings_units = []
    for (const component of components) {
        init_holdings.push(component.token_addr)
        init_holdings_units.push(component.unit)
    }
    let address = settings.aa_options ? await settings.aa_options.accountAPI.getCounterFactualAddress() : await context.deployer.getAddress();
    const newToken = {
        vaultType: newfund_config.vaultType,
        followFee: ethers.utils.parseEther("0.02"),
        profitShareFee: ethers.utils.parseEther("0.2"),
        components: init_holdings,
        units: init_holdings_units,
        name: newfund_config.name,
        symbol: newfund_config.symbol,
        owner: address,
        methodologist: address,
        delay: 1,
        modules: [contractData.StreamingFeeModule, contractData.DebtIssuanceModule, contractData.NavIssuanceModule, contractData.TradeModule, contractData.SignalSuscriptionModule, contractData.UtilsModule],
        adapters: [contractData.UniswapV2ExchangeAdapter, contractData.AaveV2WrapV2Adapter],
        operators: [address, context.deployer.address],
        assets: init_holdings.concat([settings.ausdc_addr, settings.awbtc_addr, settings.aweth_addr]),
        extensions: [contractData.VaultPaymaster, contractData.IssuanceExtension, contractData.NAVIssuanceExtension, contractData.StreamingFeeSplitExtension, contractData.SignalSuscriptionExtension, contractData.CopyTradingExtension, contractData.UtilsExtension]
    }
    if (isLeverage) {
        newToken.modules.push(contractData.WrapModuleV2, contractData.AaveLeverageModule)
        newToken.extensions.push(contractData.WrapExtension, contractData.LeverageExtension)
    }
    console.log(newToken);
    console.log("account:", await context.deployer.getAddress());
    console.log("Account balance:", (await context.deployer.getBalance()).toString());

    let r = await sendTransaction(settings.aa_options, DelegatedManagerFactory, "createSetAndManager", newToken)


    var tr = await r.wait(3);
    console.log("Set Created");
    const setTokenAddress = await getSetAddressFromCreateHash(context, r.hash);
    console.log("new set token addr:" + setTokenAddress);
    console.log("transactionHash:" + tr.transactionHash + " status:" + tr.status);



    const initializeParams = await DelegatedManagerFactory.initializeState(setTokenAddress);

    console.log(initializeParams);
    const delegatedManager = { address: initializeParams.manager }
    const feeSettingsThree = {
        feeRecipient: delegatedManager.address,
        maxStreamingFeePercentage: ethers.utils.parseEther("0.05"),
        streamingFeePercentage: ethers.utils.parseEther("0.01"),
        lastStreamingFeeTimestamp: ethers.constants.Zero,
        profitSharingPercentage: ethers.utils.parseEther("0.2")

    };
    const streamingFeeSplitExtensionThreeBytecode = StreamingFeeSplitExtension.interface.encodeFunctionData(
        "initializeModuleAndExtension",
        [
            delegatedManager.address,
            feeSettingsThree
        ]
    );
    const navIssuanceSettings = {
        managerIssuanceHook: ethers.constants.AddressZero,
        managerRedemptionHook: ethers.constants.AddressZero,
        reserveAssets: [settings.usdc_addr],
        feeRecipient: await context.deployer.getAddress(),
        managerFees: ["0", "0"],
        maxManagerFee: 0,
        premiumPercentage: 0,
        maxPremiumPercentage: 0,
        minSetTokenSupply: 1,
    }

    const navIssuanceExtensionThreeBytecode = NAVIssuanceExtension.interface.encodeFunctionData(
        "initializeModuleAndExtension",
        [delegatedManager.address,
            navIssuanceSettings,
        [address, context.deployer.address]
        ]);

    const issuanceExtensionThreeBytecode = IssuanceExtension.interface.encodeFunctionData(
        "initializeModuleAndExtension",
        [
            delegatedManager.address,
            ethers.utils.parseEther("0"),
            ethers.utils.parseEther("0"),
            ethers.utils.parseEther("0"),
            delegatedManager.address,
            ethers.constants.AddressZero,
            [address, context.deployer.address]
        ]
    );
    const copyTradingExtensionThreeBytecode = CopyTradingExtension.interface.encodeFunctionData(
        "initializeModuleAndExtension",
        [delegatedManager.address]

    );
    const signalSuscriptionThreeBytecode = SignalSuscriptionExtension.interface.encodeFunctionData(
        "initializeModuleAndExtension",
        [delegatedManager.address]
    );
    const utilsExtensionThreeBytecode = UtilsExtension.interface.encodeFunctionData(
        "initializeModuleAndExtension",
        [delegatedManager.address]
    );


    let initialize_extensions = [contractData.StreamingFeeSplitExtension, contractData.IssuanceExtension, contractData.NAVIssuanceExtension, contractData.SignalSuscriptionExtension, contractData.CopyTradingExtension, contractData.UtilsExtension];
    let initialize_bytecode = [streamingFeeSplitExtensionThreeBytecode, issuanceExtensionThreeBytecode, navIssuanceExtensionThreeBytecode, signalSuscriptionThreeBytecode, copyTradingExtensionThreeBytecode, utilsExtensionThreeBytecode]
    if (isLeverage) {
        const wrapExtensionThreeBytecode = WrapExtension.interface.encodeFunctionData(
            "initializeModuleAndExtension",
            [delegatedManager.address]
        );
        const leverageExtensionThreeBytecode = LeverageExtension.interface.encodeFunctionData(
            "initializeModuleAndExtension",
            [delegatedManager.address, [], []]
        );
        initialize_extensions.push(contractData.WrapExtension);
        initialize_bytecode.push(wrapExtensionThreeBytecode);
        initialize_extensions.push(contractData.LeverageExtension);
        initialize_bytecode.push(leverageExtensionThreeBytecode);
    }
    let rt = await sendTransaction(settings.aa_options, DelegatedManagerFactory, "initialize",
        setTokenAddress,
        initialize_extensions,
        initialize_bytecode
    )

    console.log(`${setTokenAddress} initialize done`);
    return {
        fund_addr: setTokenAddress,
        manager_addr: delegatedManager.address,
        create_hash: r.hash,
        init_hash: rt.hash
    };
}
function getContract(context, name, address) {
    if (address) {
        return new ethers.Contract(address, context.contractConfig[name].abi, context.ethers_provider).connect(context.deployer);
    }
    else {
        return new ethers.Contract(context.contractData[name], context.contractConfig[name].abi, context.ethers_provider).connect(context.deployer);
    }
}

async function getSetAddressFromCreateHash(context, transactionHash) {
    let Controller = getContract(context, "Controller");

    const receipt = await Controller.provider.getTransactionReceipt(transactionHash);

    const events = await Controller.queryFilter(Controller.filters.SetAdded(), receipt.blockHash);

    for (const event of events.filter(e => e.transactionHash == receipt.transactionHash)) {
        return event.args._setToken
    }
}
async function sendTransaction(options, contract, method_name, ...args) {
    if (!options) {
        return await sendContractTransaction(contract, method_name, ...args);
    }
    let rpcUrl = settings.bundlerUrl;
    const simpleAccount = await Presets.Builder.SimpleAccount.init(
        options.accountAPI.owner,
        rpcUrl,
        settings.entryPoint,
        contractData.VaultFactory,
        undefined
    );
    const client = await Client.init(rpcUrl, settings.entryPoint);
    const res = await client.sendUserOperation(
        simpleAccount.execute(
            contract.address,
            0,
            contract.interface.encodeFunctionData(method_name, [...args])
        ),
        {
            onBuild: (op) => console.log("Signed UserOperation:", op),
        }
    );
    console.log(`UserOpHash: ${res.userOpHash}`);
    console.log("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    return await contract.provider.getTransaction(ev?.transactionHash ?? null);
}

async function sendContractTransaction(contract, method_name, ...args) {
    // console.log(args);
    let estimateGas = await contract.estimateGas[method_name](...args)
    let gasLimit = estimateGas.mul(110).div(100)
    let gasPrice = (await contract.provider.getFeeData()).gasPrice;
    let result = await contract[method_name](...args, {
        gasLimit: gasLimit,
        gasPrice: gasPrice
    })
    console.log("<transaction hash>", result.hash)
    return result;
}


export default {
    createV2: createV2,
    getHolding: getHolding,
    getSetAddressFromCreateHash: getSetAddressFromCreateHash,
    getContract: getContract,
    sendTransaction: sendTransaction
}