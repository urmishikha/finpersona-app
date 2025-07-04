// Run this script to populate test data for anomaly detection
// Usage: node scripts/seed-test-data.js

const { MongoClient } = require("mongodb")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/"
const TEST_USER_ID = "user_test_123" // Replace with your actual user ID

async function seedTestData() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db("finpersona")
    const transactionsCollection = db.collection("transactions")

    // Clear existing test data
    await transactionsCollection.deleteMany({ userId: TEST_USER_ID })

    console.log("🗑️  Cleared existing test data")

    // Generate 3 months of normal spending data
    const testTransactions = []
    const categories = ["Food & Dining", "Transportation", "Shopping", "Entertainment", "Utilities"]
    const normalSpending = {
      "Food & Dining": { min: 4000, max: 8000 },
      Transportation: { min: 2000, max: 4000 },
      Shopping: { min: 3000, max: 6000 },
      Entertainment: { min: 1000, max: 3000 },
      Utilities: { min: 2000, max: 3000 },
    }

    // Generate historical data (last 12 weeks)
    for (let week = 12; week >= 1; week--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - week * 7)

      categories.forEach((category) => {
        const range = normalSpending[category]
        const weeklySpend = Math.random() * (range.max - range.min) + range.min

        // Split weekly spending into 2-4 transactions
        const numTransactions = Math.floor(Math.random() * 3) + 2
        const transactionAmounts = []
        let remaining = weeklySpend

        for (let i = 0; i < numTransactions - 1; i++) {
          const amount = Math.random() * (remaining * 0.6)
          transactionAmounts.push(amount)
          remaining -= amount
        }
        transactionAmounts.push(remaining)

        transactionAmounts.forEach((amount, index) => {
          const transactionDate = new Date(weekStart)
          transactionDate.setDate(transactionDate.getDate() + index)

          testTransactions.push({
            userId: TEST_USER_ID,
            amount: Math.round(amount),
            category,
            description: getRandomDescription(category),
            date: transactionDate.toISOString().split("T")[0],
            type: "expense",
            createdAt: transactionDate,
            processedAt: transactionDate,
            anomalyChecked: true,
          })
        })
      })
    }

    await transactionsCollection.insertMany(testTransactions)
    console.log(`✅ Inserted ${testTransactions.length} historical transactions`)

    // Show spending summary
    const summary = {}
    testTransactions.forEach((t) => {
      if (!summary[t.category]) summary[t.category] = 0
      summary[t.category] += t.amount
    })

    console.log("\n📊 Historical Spending Summary (12 weeks):")
    Object.entries(summary).forEach(([category, total]) => {
      console.log(
        `${category}: ₹${Math.round(total).toLocaleString()} (avg ₹${Math.round(total / 12).toLocaleString()}/week)`,
      )
    })
  } catch (error) {
    console.error("Error seeding test data:", error)
  } finally {
    await client.close()
  }
}

function getRandomDescription(category) {
  const descriptions = {
    "Food & Dining": ["Restaurant dinner", "Grocery shopping", "Coffee shop", "Food delivery", "Lunch"],
    Transportation: ["Uber ride", "Petrol", "Bus pass", "Auto rickshaw", "Parking"],
    Shopping: ["Clothing", "Electronics", "Books", "Home items", "Online shopping"],
    Entertainment: ["Movie tickets", "Concert", "Games", "Streaming service", "Sports"],
    Utilities: ["Electricity bill", "Internet bill", "Phone bill", "Water bill", "Gas bill"],
  }

  const categoryDescriptions = descriptions[category] || ["Miscellaneous"]
  return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)]
}

seedTestData()
