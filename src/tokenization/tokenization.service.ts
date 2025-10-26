import {
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    Hbar,
    ContractId,
    Client,
    TransferTransaction,
    TokenId,
    AccountId,
    TopicMessageSubmitTransaction
} from "@hashgraph/sdk";

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { idToEvmAddress, compactTokenMeta } from "../util/util.hedera.js";
import AssetModel from "../asset/asset.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const abiPath = path.resolve(__dirname, "../abi/VoltEscrow.json");
const VoltEscrowArtifact = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

const TREASURY_ID = process.env.HEDERA_OPERATOR_ID!;
const TREASURY_KEY = process.env.HEDERA_OPERATOR_KEY!;
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID!;
const ESCROW_EVM = process.env.VOLT_ESCROW_EVM_ADDRESS!;
const EVM_OWNER_PK = process.env.HEDERA_EVM_OPERATOR_PRIVATE_KEY!;
const RPC_URL = process.env.HEDERA_RPC_URL!;
const ITOKEN_ESCROW_FUND = parseInt(process.env.ITOKEN_ESCROW_FUND || "0", 10);

const hederaClient = Client.forTestnet().setOperator(TREASURY_ID, TREASURY_KEY);
const provider = new ethers.JsonRpcProvider(RPC_URL, { name: "hedera-testnet", chainId: 296 });
const signer = new ethers.Wallet(EVM_OWNER_PK, provider);
const escrow = new ethers.Contract(ESCROW_EVM, (VoltEscrowArtifact as any).abi, signer);

class TokenizationService {


    async tokenizeAsset(asset: any) {
        console.log("🔹 Tokenizing asset:", asset._id);

        const ESCROW_CONTRACT_ID = ContractId.fromEvmAddress(0, 0, ESCROW_EVM).toString();
        const fractionSize = 10;
        const totalTokens = Math.floor(Number(asset.amount) / fractionSize);
        if (totalTokens <= 0) throw new Error("totalTokens calculated to 0; increase invoice amount");

        const metaString = compactTokenMeta(asset);

        const createTx = await new TokenCreateTransaction()
            .setTokenName(`${asset.assetType}-${asset.tokenName}`)
            .setTokenSymbol(`AST${asset._id.toString().slice(-4)}`)
            .setTokenType(TokenType.FungibleCommon)
            .setTreasuryAccountId(TREASURY_ID)
            .setInitialSupply(totalTokens)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(totalTokens)
            .setDecimals(0)
            .setMaxTransactionFee(new Hbar(20))
            .setMetadata(Buffer.from(metaString, "utf8"))
            .execute(hederaClient);

        const receipt = await createTx.getReceipt(hederaClient);
        const tokenId = receipt.tokenId?.toString();
        if (!tokenId) throw new Error("No tokenId returned in receipt");
        const tokenEvm = idToEvmAddress(tokenId);

        try {
            const aTx = await escrow.associateWithToken(tokenEvm);
            await aTx.wait();
            console.log("🤝 Escrow associated with iToken:", tokenEvm);
        } catch (e: any) {
            const msg = String(e?.reason || e?.message || e);
            if (!/(already|ALREADY|SUCCESS)/.test(msg)) {
                throw new Error("Escrow association failed: " + msg);
            }
        }

        const fundAmount = ITOKEN_ESCROW_FUND || totalTokens;
        const fundTx = await new TransferTransaction()
            .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(TREASURY_ID), -fundAmount)
            .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(ESCROW_CONTRACT_ID), fundAmount)
            .setTransactionMemo(`Fund escrow for ${asset._id}`)
            .execute(hederaClient);

        const fundRc = await fundTx.getReceipt(hederaClient);
        console.log("🏦 Escrow funded:", fundRc.status.toString());

        await new TopicMessageSubmitTransaction()
            .setTopicId(HCS_TOPIC_ID)
            .setMessage(
                JSON.stringify({
                    event: "INVOICE_TOKENIZED",
                    assetId: asset._id,
                    tokenId,
                    tokenEvm,
                    initialSupply: totalTokens,
                    escrowContractId: ESCROW_CONTRACT_ID,
                    createdAt: new Date(),
                })
            )
            .execute(hederaClient);

        await AssetModel.findByIdAndUpdate(asset._id, {
            status: "tokenized",
            tokenized: true,
            tokenId,
            tokenEvm,
            initialSupply: totalTokens,
            escrowContractId: ESCROW_CONTRACT_ID,
            escrowEvm: ESCROW_EVM,
        });

        return { tokenId, tokenEvm, initialSupply: totalTokens, escrowContractId: ESCROW_CONTRACT_ID };
    }
}

export default new TokenizationService();