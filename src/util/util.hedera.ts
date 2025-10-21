import { Buffer } from 'buffer'
import {
    AccountId,
    PublicKey,
    Transaction,
    LedgerId,
    Query,
    SignerSignature,
} from '@hashgraph/sdk'
import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { proto } from '@hashgraph/proto'
import { ethers } from "ethers";


/**
 * Converts `Transaction` to a Base64-string.
 *
 * Converts a transaction to bytes and then encodes it as a Base64-string. Allow incomplete transaction (HIP-745).
 * @param transaction - Any instance of a class that extends `Transaction`
 * @returns Base64 encoded representation of the input `Transaction` object
 */
export function transactionToBase64String<T extends Transaction>(transaction: T): string {
    const transactionBytes = transaction.toBytes()
    return Buffer.from(transactionBytes).toString('base64')
}

/**
 * Recreates a `Transaction` from a base64 encoded string.
 *
 * Decodes the string to a buffer,
 * then passes to `Transaction.fromBytes`. For greater flexibility, this function uses the base
 * `Transaction` class, but takes an optional type parameter if the type of transaction is known,
 * allowing stronger typeing.
 * @param transactionBytes - a base64 encoded string
 * @returns `Transaction`
 * @example
 * ```ts
 * const txn1 = base64StringToTransaction(bytesString)
 * const txn2 = base64StringToTransaction<TransferTransaction>(bytesString)
 * // txn1 type: Transaction
 * // txn2 type: TransferTransaction
 * ```
 */
export function base64StringToTransaction<T extends Transaction>(transactionBytes: string): T {
    const decoded = Buffer.from(transactionBytes, 'base64')
    return Transaction.fromBytes(decoded) as T
}

/**
 * @param transaction - a base64 encoded string of proto.TransactionBody.encode().finish()
 * @param nodeAccountId - an optional `AccountId` to set the node account ID for the transaction
 * @returns `string`
 * */
export function transactionToTransactionBody<T extends Transaction>(
    transaction: T,
    nodeAccountId: AccountId | null = null,
): proto.ITransactionBody {
    // This is a private function, though provides the capabilities to construct a proto.TransactionBody
    //@ts-ignore
    return transaction._makeTransactionBody(nodeAccountId)
}

export function transactionBodyToBase64String(transactionBody: proto.ITransactionBody): string {
    return Uint8ArrayToBase64String(proto.TransactionBody.encode(transactionBody).finish())
}

/**
 * @param transactionList - a proto.TransactionList object
 * @returns `string`
 * */
export function transactionListToBase64String(transactionList: proto.TransactionList) {
    const encoded = proto.TransactionList.encode(transactionList).finish()
    return Uint8ArrayToBase64String(encoded)
}

/**
 * Extracts the first signature from a proto.SignatureMap object.
 * @param signatureMap - a proto.SignatureMap object
 * @returns `Uint8Array`
 * */
export const extractFirstSignature = (signatureMap: proto.ISignatureMap): Uint8Array => {
    const firstPair = signatureMap?.sigPair?.[0]
    const firstSignature = firstPair?.ed25519 || firstPair?.ECDSASecp256k1 || firstPair?.ECDSA_384

    if (!firstSignature) {
        throw new Error('No signatures found in response')
    }
    return firstSignature
}

/**
 * Decodes base64 encoded proto.TransactionBody bytes to a `proto.TransactionBody` object.
 *
 * @param transactionBody - a base64 encoded string of proto.TransactionBody.encode().finish()
 * @returns `Transaction`
 *
 * */

export function base64StringToTransactionBody(transactionBody: string): proto.TransactionBody {
    const bytes = Buffer.from(transactionBody, 'base64')
    return proto.TransactionBody.decode(bytes)
}

/**
 * Converts a `proto.SignatureMap` to a base64 encoded string.
 *
 * First converts the `proto.SignatureMap` object to a JSON.
 * Then encodes the JSON to a base64 encoded string.
 * @param signatureMap - The `proto.SignatureMap` object to be converted
 * @returns Base64-encoded string representation of the input `proto.SignatureMap`
 */
export function signatureMapToBase64String(signatureMap: proto.SignatureMap): string {
    const encoded = proto.SignatureMap.encode(signatureMap).finish()
    return Uint8ArrayToBase64String(encoded)
}

/**
 * Converts a Base64-encoded string to a `proto.SignatureMap`.
 * @param base64string - Base64-encoded string
 * @returns `proto.SignatureMap`
 */
export function base64StringToSignatureMap(base64string: string): proto.SignatureMap {
    const encoded = Buffer.from(base64string, 'base64')
    return proto.SignatureMap.decode(encoded)
}

/**
 * Encodes the binary data represented by the `Uint8Array` to a Base64 string.
 * @param binary - The `Uint8Array` containing binary data to be converted
 * @returns Base64-encoded string representation of the input `Uint8Array`
 */
export function Uint8ArrayToBase64String(binary: Uint8Array): string {
    return Buffer.from(binary).toString('base64')
}

/**
 * Encodes the binary data represented by the `Uint8Array` to a UTF-8 string.
 * @param binary - The `Uint8Array` containing binary data to be converted
 * @returns UTF-8 string representation of the input `Uint8Array`
 */
export function Uint8ArrayToString(binary: Uint8Array): string {
    return Buffer.from(binary).toString('utf-8')
}

/**
 * Converts a Base64-encoded string to a `Uint8Array`.
 * @param base64string - Base64-encoded string to be converted
 * @returns A `Uint8Array` representing the decoded binary data
 */
export function base64StringToUint8Array(base64string: string): Uint8Array {
    const encoded = Buffer.from(base64string, 'base64')
    return new Uint8Array(encoded)
}

/**
 * Converts a `Query` object to a Base64-encoded string.
 * First utilizes the `toBytes` method of the `Query` instance to obtain its binary `Uint8Array` representation.
 * Then encodes the binary `Uint8Array` to a Base64 string representation.
 * @param query - A `Query` object to be converted
 * @returns Base64 encoded representation of the input `Query` object
 */
export function queryToBase64String<T, Q extends Query<T>>(query: Q): string {
    const queryBytes = query.toBytes()
    return Buffer.from(queryBytes).toString('base64')
}

/**
 * Recreates a `Query` from a Base64-encoded string. First decodes the string to a buffer,
 * then passes to `Query.fromBytes`. For greater flexibility, this function uses the base
 * `Query` class, but takes an optional type parameter if the type of query is known,
 * allowing stronger typeing.
 * @param bytesString - Base64-encoded string
 * @returns `Query<T>`
 * @example
 * ```ts
 * const query1 = base64StringToQuery(bytesString)
 * const query2 = base64StringToQuery<AccountInfoQuery>(bytesString)
 * // query1 type: Query<any>
 * // query2 type: AccountInfoQuery
 * ```
 */
export function base64StringToQuery<Q extends Query<any>>(bytesString: string): Q {
    const decoded = Buffer.from(bytesString, 'base64')
    return Query.fromBytes(decoded) as Q
}

export function prefixMessageToSign(message: string) {
    return '\x19Hedera Signed Message:\n' + message.length + message
}
/**
 * Incorporates additional data (salt) into the message to alter the output signature.
 * This alteration ensures that passing a transaction here for signing will yield an invalid signature,
 * as the additional data modifies the signature text.
 *
 * @param message -  A plain text string
 * @returns An array of Uint8Array containing the prepared message for signing
 */
export function stringToSignerMessage(message: string): Uint8Array[] {
    return [Buffer.from(prefixMessageToSign(message))]
}

/**
 * This implementation expects a plain text string, which is prefixed and then signed by a wallet.
 * Because the spec calls for 1 message to be signed and 1 signer, this function expects a single
 * signature and used the first item in the sigPair array.
 *
 * @param message -  A plain text string
 * @param base64SignatureMap -  A base64 encoded proto.SignatureMap object
 * @param publicKey -  A PublicKey object use to verify the signature
 * @returns boolean - whether or not the first signature in the sigPair is valid for the message and public key
 */
export function verifyMessageSignature(
    message: string,
    base64SignatureMap: string,
    publicKey: PublicKey,
): boolean {
    const signatureMap = base64StringToSignatureMap(base64SignatureMap)
    const signature = signatureMap.sigPair[0].ed25519 || signatureMap.sigPair[0].ECDSASecp256k1

    if (!signature) throw new Error('Signature not found in signature map')

    return publicKey.verify(Buffer.from(prefixMessageToSign(message)), signature)
}

/**
 * This implementation expects a plain text string, which is prefixed and then signed by a wallet.
 * Because the spec calls for 1 message to be signed and 1 signer, this function expects a single
 * signature and used the first item in the sigPair array.
 *
 * @param message -  A plain text string
 * @param signerSignature -  A SignerSignature object
 * @param publicKey -  A PublicKey object use to verify the signature
 * @returns boolean - whether or not the first signature in the sigPair is valid for the message and public key
 */
export function verifySignerSignature(
    message: string,
    signerSignature: SignerSignature,
    publicKey: PublicKey,
): boolean {
    const signature = signerSignature.signature

    if (!signature) throw new Error('Signature not found in signature map')

    return publicKey.verify(Buffer.from(prefixMessageToSign(message)), signature)
}

/**
 *
 * https://github.com/hashgraph/hedera-sdk-js/blob/c78512b1d43eedf1d8bf2926a5b7ed3368fc39d1/src/PublicKey.js#L258
 * a signature pair is a protobuf object with a signature and a public key, it is the responsibility of a dApp to ensure the public key matches the account id
 * @param signerSignatures - An array of `SignerSignature` objects
 * @returns `proto.SignatureMap` object
 */
export function signerSignaturesToSignatureMap(
    signerSignatures: SignerSignature[],
): proto.SignatureMap {
    const signatureMap = proto.SignatureMap.create({
        sigPair: signerSignatures.map((s) => s.publicKey._toProtobufSignature(s.signature)),
    })

    return signatureMap
}

/**
 * A mapping of `LedgerId` to EIP chain id and CAIP-2 network name.
 *
 * Structure: [`LedgerId`, `number` (EIP155 chain id), `string` (CAIP-2 chain id)][]
 *
 * @see {@link https://namespaces.chainagnostic.org/hedera/README | Hedera Namespaces}
 * @see {@link https://hips.hedera.com/hip/hip-30 | CAIP Identifiers for the Hedera Network (HIP-30)}
 */
export const LEDGER_ID_MAPPINGS: [LedgerId, number, string][] = [
    [LedgerId.MAINNET, 295, 'hedera:mainnet'],
    [LedgerId.TESTNET, 296, 'hedera:testnet'],
    [LedgerId.PREVIEWNET, 297, 'hedera:previewnet'],
    [LedgerId.LOCAL_NODE, 298, 'hedera:devnet'],
]
const DEFAULT_LEDGER_ID = LedgerId.LOCAL_NODE
const DEFAULT_EIP = LEDGER_ID_MAPPINGS[3][1]
const DEFAULT_CAIP = LEDGER_ID_MAPPINGS[3][2]

/**
 * Converts an EIP chain id to a LedgerId object.
 *
 * If no mapping is found, returns `LedgerId.LOCAL_NODE`.
 *
 * @param chainId - The EIP chain ID (number) to be converted
 * @returns A `LedgerId` corresponding to the provided chain ID
 * @example
 * ```ts
 * const localnodeLedgerId = EIPChainIdToLedgerId(298)
 * console.log(localnodeLedgerId) // LedgerId.LOCAL_NODE
 * const mainnetLedgerId = EIPChainIdToLedgerId(295)
 * console.log(mainnetLedgerId) // LedgerId.MAINNET
 * ```
 */
export function EIPChainIdToLedgerId(chainId: number): LedgerId {
    for (let i = 0; i < LEDGER_ID_MAPPINGS.length; i++) {
        const [ledgerId, chainId_] = LEDGER_ID_MAPPINGS[i]
        if (chainId === chainId_) {
            return ledgerId
        }
    }
    return DEFAULT_LEDGER_ID
}

/**
 * Converts a LedgerId object to an EIP chain id.
 *
 * If no mapping is found, returns the EIP chain id for `LedgerId.LOCAL_NODE`.
 *
 * @param ledgerId - The `LedgerId` object to be converted
 * @returns A `number` representing the EIP chain id for the provided `LedgerId`
 * @example
 * ```ts
 * const previewnetChainId = ledgerIdToEIPChainId(LedgerId.PREVIEWNET)
 * console.log(previewnetChainId) // 297
 * const testnetChainId = ledgerIdToEIPChainId(LedgerId.TESTNET)
 * console.log(testnetChainId) // 296
 * ```
 */
export function ledgerIdToEIPChainId(ledgerId: LedgerId): number {
    for (let i = 0; i < LEDGER_ID_MAPPINGS.length; i++) {
        const [ledgerId_, chainId] = LEDGER_ID_MAPPINGS[i]
        if (ledgerId === ledgerId_) {
            return chainId
        }
    }
    return DEFAULT_EIP
}

/**
 * Converts a network name to an EIP chain id.
 * If no mapping is found, returns the EIP chain id for `LedgerId.LOCAL_NODE`.
 *
 * @param networkName - The network name (string) to be converted
 * @returns A `number` representing the EIP chain id for the provided network name
 * @example
 * ```ts
 * const mainnetChainId = networkNameToEIPChainId('mainnet')
 * console.log(mainnetChainId) // 295
 * const testnetChainId = networkNameToEIPChainId('testnet')
 * console.log(mainnetChainId) // 296
 * ```
 */
export function networkNameToEIPChainId(networkName: string): number {
    const ledgerId = LedgerId.fromString(networkName.toLowerCase())
    return ledgerIdToEIPChainId(ledgerId)
}

/**
 * Converts a CAIP chain id to a LedgerId object.
 *
 * If no mapping is found, returns `LedgerId.LOCAL_NODE`.
 *
 * @param chainId - The CAIP chain ID (string) to be converted
 * @returns A `LedgerId` corresponding to the provided CAIP chain ID
 * @example
 * ```ts
 * const previewnetLedgerId = CAIPChainIdToLedgerId(HederaChainId.Previewnet)
 * console.log(previewnetLedgerId) // LedgerId.PREVIEWNET
 * const testnetLedgerId = CAIPChainIdToLedgerId(HederaChainId.Testnet)
 * console.log(testnetLedgerId) // LedgerId.TESTNET
 * ```
 */
export function CAIPChainIdToLedgerId(chainId: string): LedgerId {
    for (let i = 0; i < LEDGER_ID_MAPPINGS.length; i++) {
        const [ledgerId, _, chainId_] = LEDGER_ID_MAPPINGS[i]
        if (chainId === chainId_) {
            return ledgerId
        }
    }
    return DEFAULT_LEDGER_ID
}

/**
 * Converts a LedgerId object to a CAIP chain id.
 *
 * If no mapping is found, returns the CAIP chain id for `LedgerId.LOCAL_NODE`.
 *
 * @param ledgerId - The `LedgerId` object to be converted
 * @returns A `string` representing the CAIP chain id for the provided `LedgerId`
 * @example
 * ```ts
 * const mainnetChainId = ledgerIdToCAIPChainId(HederaChainId.Mainnet)
 * console.log(mainnetChainId) // LedgerId.PREVIEWNET
 * const testnetChainId = ledgerIdToCAIPChainId(HederaChainId.Testnet)
 * console.log(testnetChainId) // LedgerId.TESTNET
 * ```
 */
export function ledgerIdToCAIPChainId(ledgerId: LedgerId): string {
    for (let i = 0; i < LEDGER_ID_MAPPINGS.length; i++) {
        const [ledgerId_, _, chainId] = LEDGER_ID_MAPPINGS[i]
        if (ledgerId.toString() === ledgerId_.toString()) {
            return chainId
        }
    }
    return DEFAULT_CAIP
}

/**
 * Converts a network name to a CAIP chain id.
 *
 * If no mapping is found, returns the CAIP chain id for `LedgerId.LOCAL_NODE`.
 *
 * @param networkName - The network name (string) to be converted
 * @returns A `string` representing the CAIP chain id for the provided network name
 * @example
 * ```ts
 * const previewnetChainId = networkNameToCAIPChainId('previewnet')
 * console.log(previewnetChainId) // HederaChainId.Previewnet
 * const devnetChainId = networkNameToCAIPChainId('devnet')
 * console.log(devnetChainId) // HederaChainId.Devnet
 * ```
 */
export function networkNameToCAIPChainId(networkName: string): string {
    const ledgerId = LedgerId.fromString(networkName.toLowerCase())
    const chainId = ledgerIdToCAIPChainId(ledgerId)
    return chainId
}

/**
 * Create a `ProposalTypes.RequiredNamespaces` object for a given ledgerId.
 *
 * @param ledgerId - The `LedgerId` for which the namespaces are created
 * @param methods - An array of strings representing methods
 * @param events - An array of strings representing events
 * @returns A `ProposalTypes.RequiredNamespaces` object
 */
export const networkNamespaces = (
    ledgerId: LedgerId,
    methods: string[],
    events: string[],
): ProposalTypes.RequiredNamespaces => ({
    hedera: {
        chains: [ledgerIdToCAIPChainId(ledgerId)],
        methods,
        events,
    },
})

/**
 * Get the account and ledger from a `SessionTypes.Struct` object.
 *
 * @param session - The `SessionTypes.Struct` object containing namespaces
 * @returns `ProposalTypes.RequiredNamespaces` - an array of objects containing network (LedgerId) and account (AccountId)
 */
export const accountAndLedgerFromSession = (
    session: SessionTypes.Struct,
): { network: LedgerId; account: AccountId }[] => {
    const hederaNamespace = session.namespaces.hedera
    if (!hederaNamespace) throw new Error('No hedera namespace found')

    return hederaNamespace.accounts.map((account) => {
        const [chain, network, acc] = account.split(':')
        return {
            network: CAIPChainIdToLedgerId(chain + ':' + network),
            account: AccountId.fromString(acc),
        }
    })
}


const MIRROR_BASE = process.env.HEDERA_MIRROR_NODE_URL

type CountOpts = {
    excludeAccounts?: string[];
    timeoutMs?: number;
};

/**
 * Count token holders with positive balance (paginated).
 * Accepts either 0.0.x tokenId or EVM 0x... token address.
 */
export async function countTokenHolders(
    tokenIdOrEvm: string,
    opts: CountOpts = {}
): Promise<number> {
    const { excludeAccounts = [], timeoutMs = 7000 } = opts;

    let url = `${MIRROR_BASE}/v1/tokens/${tokenIdOrEvm}/balances`;
    let count = 0;
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);

    try {
        while (url) {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) {
                if (res.status === 404) return 0;
                throw new Error(`Mirror error ${res.status}`);
            }

            const json = await res.json();
            const balances: Array<{ account?: string; account_id?: string; balance: number }> =
                json?.balances ?? [];

            for (const b of balances) {
                const acct = (b.account_id || b.account || "").toString();
                if (b.balance > 0 && (!acct || !excludeAccounts.includes(acct))) {
                    count++;
                }
            }

            const next = json?.links?.next as string | undefined;
            url = next ? `${MIRROR_BASE}${next}` : "";
        }

        return count;
    } catch (_err) {
        // Fail soft: on errors / timeouts, return 0 so the endpoint still responds.
        return 0;
    } finally {
        clearTimeout(to);
    }
}

export const normalizeTxId = (id: string) => {
    const m = id.match(/^(\d+\.\d+\.\d+)@(\d+)\.(\d{1,9})$/);
    if (!m) return id;
    const [, acct, s, n] = m;
    return `${acct}-${s}-${n.padStart(9, "0")}`;
}


export const idToEvmAddress = (id: string) => {
    if (id.startsWith("0x")) return ethers.getAddress(id);
    const [shardStr, realmStr, numStr] = id.split(".");
    const hex =
        BigInt(shardStr).toString(16).padStart(8, "0") +
        BigInt(realmStr).toString(16).padStart(16, "0") +
        BigInt(numStr).toString(16).padStart(16, "0");
    return ethers.getAddress("0x" + hex);
}

export const compactTokenMeta = (inv: any): string => {
    const MAX = 100;
    const meta: any = { i: String(inv.invoiceNumber), a: Number(inv.amount), u: (inv.blobUrl ?? "").slice(0, 40) };
    let s = JSON.stringify(meta);
    while (Buffer.byteLength(s, "utf8") > MAX && meta.u.length > 0) {
        meta.u = meta.u.slice(0, meta.u.length - 5);
        s = JSON.stringify(meta);
    }
    if (Buffer.byteLength(s, "utf8") > MAX) {
        delete meta.a;
        s = JSON.stringify(meta);
    }
    if (Buffer.byteLength(s, "utf8") > MAX) {
        delete meta.u;
        s = JSON.stringify(meta);
    }
    return s;
}