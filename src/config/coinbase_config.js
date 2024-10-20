import { config } from 'dotenv';
config();

class CoinbaseConfig {
    constructor(data) {
        this.bundlerUrl = data.bundlerUrl;
        this.entryPoint = data.entryPoint;
    }
}

const coinbaseConfig = new CoinbaseConfig({
    bundlerUrl: process.env.COINBASE_BUNDLERURL || '',
    entryPoint: process.env.ENTRYPOINT_06 || ''
});

export { coinbaseConfig };