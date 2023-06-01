import { BigNumber, ethers } from "ethers";
import { SimpleAccountAPI, PaymasterAPI, HttpRpcClient } from "@account-abstraction/sdk"
import { default as axios } from 'axios';
import sleep from 'sleep-promise';
class Execution {
    constructor(context) {
        this.context = context;

    }
    async sendTransaction(options, contract, method_name, ...args) {
        console.log(options);
        if (options.accountAPI) {
            if (options.use_paymaster) {

                var result = await this.sendContractTransaction_withVault(options.accountAPI, contract, method_name, ...args)
            } else {
                var result = await this.sendContractTransaction_withVault_noPaymaster(options.accountAPI, contract, method_name, ...args)
            }
        } else {
            var result = await this.sendContractTransaction(contract, method_name, ...args)
        }
        return result;
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
        var client = new HttpRpcClient(this.context.settings.bundlerUrl, this.context.settings.entryPoint, this.context.settings.chainId)
        const address = await accountAPI.getCounterFactualAddress();
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
        return r

    }


    async sendContractTransaction_withVault_noPaymaster(accountAPI, contract, method_name, ...args) {
        const op = await accountAPI.createSignedUserOp({
            target: contract.address,
            data: contract.interface.encodeFunctionData(method_name, [...args])
        });
        const address = await accountAPI.getCounterFactualAddress();
        const client = new HttpRpcClient(this.context.settings.bundlerUrl, this.context.settings.entryPoint, this.context.settings.chainId);
        const uoHash = await client.sendUserOpToBundler(op);
        console.log(`UserOpHash: ${uoHash}`);
        console.log("Waiting for transaction...");
        const txHash = await accountAPI.getUserOpReceipt(uoHash);
        console.log(`Transaction hash: ${txHash}`);
        let tr = contract.provider.getTransaction(txHash);
        return tr;
    }

    async getGasFee(provider) {
        const [fee, block] = await Promise.all([
            provider.send("eth_maxPriorityFeePerGas", []),
            provider.getBlock("latest"),
        ]);
        const tip = ethers.BigNumber.from(fee);
        const buffer = tip.div(100).mul(13);
        const maxPriorityFeePerGas = tip.add(buffer);
        const maxFeePerGas = block.baseFeePerGas
            ? block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas)
            : maxPriorityFeePerGas;

        return { maxFeePerGas, maxPriorityFeePerGas };
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