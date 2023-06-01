import { BigNumber, ethers } from "ethers";
import { SimpleAccountAPI, PaymasterAPI, HttpRpcClient } from "@account-abstraction/sdk"
import { default as axios } from 'axios';
import sleep from 'sleep-promise';
import { Client, UserOperationBuilder, Presets } from "userop";

class Execution {
    constructor(context) {
        this.context = context;
    }
    async sendTransaction(options, contract, method_name, ...args) {
        if (this.context.settings.bundlerUrl != "") {
            return await this.sendContractTransaction_stackup(options, contract, method_name, ...args)
        }
        if (options.accountAPI) {
            if (options.use_paymaster) {
                return await this.sendContractTransaction_withVault(options.accountAPI, contract, method_name, ...args)
            } else {
                return await this.sendContractTransaction_withVault_noPaymaster(options.accountAPI, contract, method_name, ...args)
            }
        }
        return await this.sendContractTransaction(contract, method_name, ...args);
    }
    async sendContractTransaction_stackup(options, contract, method_name, ...args) {
        let rpcUrl = this.context.settings.bundlerUrl;
        const simpleAccount = await Presets.Builder.SimpleAccount.init(
            options.accountAPI.owner,
            rpcUrl,
            this.context.settings.entryPoint,
            this.context.contractData.VaultFactory,
            undefined
        );
        const client = await Client.init(rpcUrl, this.context.settings.entryPoint);
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
    async sendContractTransaction(contract, method_name, ...args) {
        // console.log(args);
        let estimateGas = await contract.estimateGas[method_name](...args)
        let gasLimit = estimateGas.mul(110).div(100)
        let gasPrice = (await this.context.ethers_provider.getFeeData()).gasPrice;
        let result = await contract[method_name](...args, {
            gasLimit: gasLimit,
            gasPrice: gasPrice
        })
        console.log("<transaction hash>", result.hash)
        return result;
    }
    getContract(name, address) {
        if (address) {
            return new ethers.Contract(address, this.context.contractConfig[name].abi, this.context.ethers_provider).connect(this.context.deployer);
        }
        else {
            return new ethers.Contract(this.context.contractData[name], this.context.contractConfig[name].abi, this.context.ethers_provider).connect(this.context.deployer);
        }
    }
    async getNonce(vaultAddr) {
        var EntryPoint = this.getContract("EntryPoint", this.context.settings.entryPoint);
        return await EntryPoint.getNonce(vaultAddr, 0)
    }
    async sendContractTransaction_withVault(accountAPI, contract, method_name, ...args) {
        const address = await accountAPI.getCounterFactualAddress();
        let VaultPaymaster = this.getContract("VaultPaymaster");
        let balance = await VaultPaymaster.user2balance(accountAPI.owner.address);
        console.log("balance", balance.toString());
        if (balance.lt(ethers.utils.parseEther("2"))) {
            let gasPrice = await this.context.ethers_provider.getGasPrice()
            let gasLimit = await VaultPaymaster.estimateGas.depositBalance(accountAPI.owner.address, ethers.constants.AddressZero, 0, 0, { value: ethers.utils.parseEther("1.5") })
            await VaultPaymaster.depositBalance(accountAPI.owner.address, ethers.constants.AddressZero, 0, 0, {
                gasLimit: gasLimit,
                gasPrice: gasPrice,
                value: ethers.utils.parseEther("3")
            });
        }
        console.log("getCounterFactual Address:", address, "VaultPaymaster", this.context.contractData.VaultPaymaster);
        var nonce = await this.getNonce(address);
        var unsignOp = await accountAPI.createUnsignedUserOp({
            target: contract.address,
            data: contract.interface.encodeFunctionData(method_name, args),
            nonce: nonce,
            gasLimit: 9000000
        })

        let feeData = await this.context.ethers_provider.getFeeData()
        console.log(feeData);
        unsignOp.paymasterAndData = this.context.contractData.VaultPaymaster
        unsignOp.maxFeePerGas = feeData.maxFeePerGas
        unsignOp.preVerificationGas = "90000"
        unsignOp.callGasLimit = 9000000;
        unsignOp.maxPriorityFeePerGas = 31000000000
        var op = await accountAPI.signUserOp(unsignOp)
        console.log("op---------------------------", op)
        let r = await this.handleOperation(op, 30000, 3000)
        console.log("r---------------------------", r)
        return r;
    }
    async sendContractTransaction_withVault_noPaymaster(accountAPI, contract, method_name, ...args) {

    }
    async sendBatchContractTransaction_withVault() {


    }
    async sendOperation(op) {
        op.sender = await op.sender
        op.maxFeePerGas = Number(await op.maxFeePerGas)
        op.maxPriorityFeePerGas = Number(await op.maxPriorityFeePerGas)
        op.maxFeePerGas = Number(await op.maxFeePerGas)
        op.nonce = Number(await op.nonce)
        op.verificationGasLimit = Number(op.verificationGasLimit)
        op.signature = await op.signature
        // console.log(`Signed UserOperation: `, op)
        let tokenUrl = `${this.context.settings.myBundlerUrl}/tyche/api/transact`
        let data = {
            "address": this.context.settings.entryPoint,
            "method": "handleOps",
            "args": {
                "ops": [
                    op
                ],
                "beneficiary": "0x2E4621E682272680AEAB78f48Fc0099CED79e7d6"
            }
        }
        console.log("tokenUrl", tokenUrl)
        let order = await axios.post(tokenUrl, data)
        if (!order || !order.data || !order.data.data) {
            console.error("order return error", order)
            return null
        }
        // console.log(order, "-------------------------")
        return order.data.data.id
    }

    async getOperationHash(orderID, timeout, interval) {
        let orderResponse
        let hash
        const endtime = Date.now() + timeout;
        let tokenUrl = `${this.context.settings.myBundlerUrl}/tyche/api/order/get`
        let transaction = false
        while (Date.now() < endtime) {
            //console.log("order-----------------------------------", orderID)
            let data = {
                "orderID": String(orderID)
            }
            orderResponse = await axios.post(tokenUrl, data)
            console.log("orderResponse", orderResponse.data)

            if (orderResponse && orderResponse.data && orderResponse.data.data && orderResponse.data.data.txHash) {
                hash = orderResponse.data.data.txHash
                while (!transaction) {
                    transaction = await this.context.ethers_provider.getTransaction(hash);
                    await sleep(500);
                }
                break
            }
            await new Promise((resolve) => setTimeout(resolve, interval));

        }
        return await this.context.ethers_provider.getTransaction(hash);

    }

    async handleOperation(op, timeout, interval) {
        let orderID = await this.sendOperation(op)
        return await this.getOperationHash(orderID, timeout, interval)
    }

}
export default Execution