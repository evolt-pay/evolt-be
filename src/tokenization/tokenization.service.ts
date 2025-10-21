import { TokenCreateTransaction, TokenType, TokenSupplyType, Client } from "@hashgraph/sdk";
import { idToEvmAddress, compactTokenMeta } from "../util/util.hedera.js";
import AssetModel from "../asset/asset.model.js";

class TokenizationService {
    async tokenizeAsset(asset: any) {
        const meta = compactTokenMeta(asset);



        const tx = await new TokenCreateTransaction()
            .setTokenName(`${asset.assetType}-${asset.tokenName}`)
            .setTokenSymbol(`AST${asset._id.toString().slice(-4)}`)
            .setTokenType(TokenType.FungibleCommon)
            .setTreasuryAccountId(process.env.HEDERA_OPERATOR_ID!)
            .setInitialSupply(Math.floor(Number(asset.amount) / 10))
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(Math.floor(Number(asset.amount) / 10))
            .setDecimals(0)
            .setMetadata(Buffer.from(meta))
            .execute(Client.forTestnet().setOperator(
                process.env.HEDERA_OPERATOR_ID!,
                process.env.HEDERA_OPERATOR_KEY!
            ));

        const receipt = await tx.getReceipt(Client.forTestnet());
        const tokenId = receipt.tokenId?.toString();
        const tokenEvm = idToEvmAddress(tokenId!);

        await AssetModel.findByIdAndUpdate(asset._id, {
            status: "tokenized",
            tokenized: true,
            tokenId,
            tokenEvm,
        });

        return { tokenId, tokenEvm };
    }
}

export default new TokenizationService();