import { Client, TopicCreateTransaction } from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

async function createTopic() {
    try {
        // ✅ Connect to Hedera Testnet using your Operator credentials
        const client = Client.forTestnet().setOperator(
            process.env.HEDERA_OPERATOR_ID!,
            process.env.HEDERA_OPERATOR_KEY!
        );

        console.log("🚀 Creating new topic on Hedera Testnet...");

        // ✅ Create a new HCS topic
        const txResponse = await new TopicCreateTransaction().execute(client);

        // ✅ Wait for receipt (confirmation)
        const receipt = await txResponse.getReceipt(client);

        // ✅ Output the new Topic ID
        console.log("✅ Topic created successfully!");
        console.log("🆔 Your HCS_TOPIC_ID:", receipt?.topicId?.toString());
    } catch (err) {
        console.error("❌ Failed to create topic:", err);
    }
}

createTopic();