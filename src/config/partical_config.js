const { config } = require('dotenv');
config();

class ParticalConfig {
    constructor(data) {
        this.projectUuid = data.projectUuid;
        this.projectKey = data.projectKey;
        this.paymasterUrl = data.paymasterUrl;
        this.bundlerUrl = data.bundlerUrl;
        this.entryPoint = data.entryPoint;
    }
}

const particalConfig = new ParticalConfig({
    projectUuid: process.env.PARTICAL_PROJECTUUID || '',
    projectKey: process.env.PARTICAL_PROJECTKEY || '',
    paymasterUrl: process.env.PARTICAL_PAYMASTERURL || '',
    bundlerUrl: process.env.PARTICAL_BUNDLERURL || '',
    entryPoint: process.env.ENTRYPOINT_06 || ''
});

module.exports = { particalConfig };