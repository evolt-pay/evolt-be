import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { KeyClient, CryptographyClient, KeyVaultKey } from "@azure/keyvault-keys";

const credential = new DefaultAzureCredential();
const vaultUrl = process.env.AZURE_KEY_VAULT_URI!;
export const secretClient = new SecretClient(vaultUrl, credential);
export const keyClient = new KeyClient(vaultUrl, credential);

export async function getCrypto(): Promise<CryptographyClient> {
    const keyName = process.env.KV_WRAP_KEY_NAME!;
    let key: KeyVaultKey;
    try {
        key = await keyClient.getKey(keyName);
    } catch {
        key = await keyClient.createRsaKey(keyName, {
            keySize: 3072,
            publicExponent: 65537
        });
    }
    return new CryptographyClient(key.id!, credential);
}