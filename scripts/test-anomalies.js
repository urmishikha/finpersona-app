// Test different anomaly scenarios
// Usage: node scripts/test-anomalies.js

const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/"
const TEST_USER_ID = "user_test_123" // Replace with your actual user ID

async function testAnomalies() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db("finpersona")
    const transactionsCollection = db.collection("transactions")

    console.log("🧪 Testing Anomaly Detection Scenarios...\n")

    // Test Scenario 1: 4x Food Spending Spike (Your exact example!)
    console.log("📈 Test 1: 4x Food Spending Spike")
    const foodAnomalyTransactions = [
      {
        userId: TEST_USER_ID,
        amount: 15000,
        category: "Food & Dining",
        description: "Expensive restaurant celebration",
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        createdAt: new Date(),
        processedAt: new Date(),
        anomalyChecked: false,
      },
      {
        userId: TEST_USER_ID,
        amount: 8000,
        category: "Food & Dining",
        description: "Catering for party",
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        createdAt: new Date(),
        processedAt: new Date(),
        anomalyChecked: false,
      },
    ]

    await transactionsCollection.insertMany(foodAnomalyTransactions)
    console.log("✅ Added high food spending transactions (₹23,000 total)")

    // Test Scenario 2: Large Single Transaction
    console.log("\n💳 Test 2: Large Single Transaction")
    const largeTransactionAnomaly = {
      userId: TEST_USER_ID,
      amount: 25000,
      category: "Shopping",
      description: "New laptop purchase",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      createdAt: new Date(),
      processedAt: new Date(),
      anomalyChecked: false,
    }

    await transactionsCollection.insertOne(largeTransactionAnomaly)
    console.log("✅ Added large shopping transaction (₹25,000)")

    // Test Scenario 3: Transportation Spike
    console.log("\n🚗 Test 3: Transportation Spending Spike")
    const transportAnomalies = [
      {
        userId: TEST_USER_ID,
        amount: 12000,
        category: "Transportation",
        description: "Long distance taxi",
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        createdAt: new Date(),
        processedAt: new Date(),
        anomalyChecked: false,
      },
    ]

    await transactionsCollection.insertMany(transportAnomalies)
    console.log("✅ Added transportation anomaly (₹12,000)")

    console.log("\n🎯 Test data ready! Now trigger anomaly detection...")
  } catch (error) {
    console.error("Error creating test anomalies:", error)
  } finally {
    await client.close()
  }
}

testAnomalies()
