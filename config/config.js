import { readFile } from 'fs/promises';

export default {
    ERC20: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/erc20.json', import.meta.url)
            )
        ),
        name: 'ERC20',
    },
    IntegrationRegistry: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/intergration_registry.json', import.meta.url)
            )
        ),
        name: 'IntegrationRegistry',
    },
    SetTokenCreator: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/set_token_creator.json', import.meta.url)
            )
        ),
        name: 'SetTokenCreator',
    },
    SetToken: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/set_token.json', import.meta.url)
            )
        ),
        name: 'SetToken',
    },
    Controller: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/controller.json', import.meta.url)
            )
        ),
        name: 'Controller',
    },
    StreamingFeeModule: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/streaming_fee.json', import.meta.url)
            )
        ),
        name: 'StreamingFeeModule',
    },
    NavIssuanceModule: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/nav_issuance.json', import.meta.url)
            )
        ),
        name: 'NavIssuanceModule',
    },
    BasicIssuanceModule: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/basic_issuance.json', import.meta.url)
            )
        ),
        name: 'BasicIssuanceModule',
    },
    SetValuer: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/set_value.json', import.meta.url)
            )
        ),
        name: 'SetValuer',
    },
    TradeModule: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/trade_module.json', import.meta.url)
            )
        ),
        name: 'TradeModule',
    },
    CopyTradingModule: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/copytrading_module.json', import.meta.url)
            )
        ),
        name: 'TradeModule',
    },
    AaveLeverageModule: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/aave_leverage.json', import.meta.url)
            )
        ),
        name: 'AaveLeverageModule',
    },
    UniswapV2ExchangeAdapter: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/univ2_adapter.json', import.meta.url)
            )
        ),
        name: 'UniswapV2ExchangeAdapter',
    },
    WrapModuleV2: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/wrap_modulev2.json', import.meta.url)
            )
        ),
        name: 'WrapModuleV2',
    },
    DebtIssuanceModule: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/debt_issuance.json', import.meta.url)
            )
        ),
        name: 'DebtIssuanceModuleV2',
    },
    DebtIssuanceModuleV2: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/debt_issuancev2.json', import.meta.url)
            )
        ),
        name: 'DebtIssuanceModuleV2',
    },
    SignalSuscriptionModule: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/signalSuscription.json', import.meta.url)
            )
        ),
        name: 'SignalSuscriptionModule',
    },
    DelegatedManagerFactory: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/delegatedManagerFactory.json', import.meta.url)
            )
        ),
        name: 'DelegatedManagerFactory',
    },
    DelegatedManager: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/delegatedManager.json', import.meta.url)
            )
        ),
        name: 'DelegatedManager',
    },
    StreamingFeeSplitExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/streamingFeeSplitExtension.json', import.meta.url)
            )
        ),
        name: 'StreamingFeeSplitExtension',
    },
    IssuanceExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/issuanceExtension.json', import.meta.url)
            )
        ),
        name: 'IssuanceExtension',
    },
    BatchTradeExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/batchTradeExtension.json', import.meta.url)
            )
        ),
        name: 'BatchTradeExtension',
    },
    SignalSuscriptionExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/signalSuscriptionExtension.json', import.meta.url)
            )
        ),
        name: 'SignalSuscriptionExtension',
    },
    CopyTradingExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/copyTradingExtension.json', import.meta.url)
            )
        ),
        name: 'CopyTradingExtension',
    },
    WrapExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/wrap_extension.json', import.meta.url)
            )
        ),
        name: 'WrapExtension',
    },
    NAVIssuanceExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/navIssuanceExtension.json', import.meta.url)
            )
        ),
        name: 'NAVIssuanceExtension',
    },
    LeverageExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/leverageExtension.json', import.meta.url)
            )
        ),
        name: 'LeverageExtension',
    },

    IdentityService: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/identityService.json', import.meta.url)
            )
        ),
        name: 'IdentityService',
    },


    ProtocolViewer: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/protocolViewer.json', import.meta.url)
            )
        ),
        name: 'ProtocolViewer',
    },
    TokenOracle: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/tokenOracle.json', import.meta.url)
            )
        ),
        name: 'TokenOracle',
    },
    UniswapFactory: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/univ2_facotry.json', import.meta.url)
            )
        ),
        name: 'UniswapFactory',
    },
    AaveToken: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/atoken.json', import.meta.url)
            )
        ),
        name: 'AToken',
    },
    TokenMinter: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/aavev2_tokenMinter.json', import.meta.url)
            )
        ),
        name: 'TokenMinter',
    },
    VaultFactory: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/vault_factory.json', import.meta.url)
            )
        ),
        name: 'VaultFactory',
    },
    VaultPaymaster: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/vault_paymaster.json', import.meta.url)
            )
        ),
        name: 'VaultPaymaster',
    },
    UtilsExtension: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/utilsExtension.json', import.meta.url)
            )
        ),
        name: 'UtilsExtension',
    },
    EntryPoint: {
        address: '',
        abi: JSON.parse(
            await readFile(
                new URL('./abi/entryPoint.json', import.meta.url)
            )
        ),
        name: 'entryPoint',
    }
}
