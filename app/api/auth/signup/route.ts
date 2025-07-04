import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateUserId, generateToken, sanitizeUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Create new user
    const userId = generateUserId()
    const hashedPassword = await hashPassword(password)

    const newUser = {
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isOnboarded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)

    if (!result.insertedId) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Generate token
    const token = generateToken(userId)

    // Get the created user (without password)
    const createdUser = await usersCollection.findOne({ _id: result.insertedId })
    if (!createdUser) {
      return NextResponse.json({ error: "User created but could not retrieve user data" }, { status: 500 })
    }

    const userResponse = sanitizeUser({
      ...createdUser,
      _id: createdUser._id.toString(),
    })

    return NextResponse.json({
      message: "User created successfully",
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
