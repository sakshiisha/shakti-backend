import User from '../models/User.js'
import { generateToken } from '../config/jwt.js'

export const register = async (req, res) => {
  try {
    console.log('Register request body:', req.body) // ← YEH ADD KARO

    const { fullName, email, password, phone, city, emergencyContact } = req.body

    // Check karo sab fields aa rahi hain
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        message: 'Missing required fields',
        received: { fullName, email, phone, hasPassword: !!password }
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      city,
      emergencyContact,
    })

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token,
      user: {
        id:               user._id,
        fullName:         user.fullName,
        email:            user.email,
        phone:            user.phone,
        city:             user.city,
        emergencyContact: user.emergencyContact,
        role:             user.role,
      },
    })
  } catch (error) {
    console.error('Register error:', error) // ← YEH ALREADY HONA CHAHIYE
    res.status(500).json({ message: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        emergencyContact: user.emergencyContact,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, city, emergencyContact } = req.body
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, city, emergencyContact },
      { new: true, runValidators: true }
    )
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}