import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },

    password: {
      type: String,
      required: true,
    },

    skills: {
      type: [String],
      default: [],
      set: (skills) => skills.map((s) => s.toLowerCase()),
    },

    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return ;

  const salt = await bcrypt.genSalt(
    Number(process.env.SALT_ROUNDS) || 10
  );

  this.password = await bcrypt.hash(this.password, salt);

  ; 
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);