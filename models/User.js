import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, required: true },
    city: { type: String, default: '' },

    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    
    fcmToken: { type: String, default: null },

    role: {
      type: String,
      enum: ['user', 'admin', 'doctor'],
      default: 'user',
    },

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
)


// ✅ Mongoose v8 pre-save hook (NO next())
userSchema.pre('save', async function () {
  // password change nahi hua → hashing skip
  if (!this.isModified('password')) return

  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})


// ✅ password compare method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)