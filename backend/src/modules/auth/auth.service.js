const bcrypt = require("bcryptjs");
const { User, toPublicJSON } = require("../users/user.model");
const { AppError } = require("../../utils/AppError");
const { signAccessToken } = require("../../utils/jwt");

const SALT_ROUNDS = 12;

async function registerUser(input, jwtSecret, jwtExpiresIn) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError("Email already registered", 409, "EMAIL_IN_USE");
  }

  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    name: input.name,
    companyName: input.companyName,
    email: input.email,
    password: hashed,
    role: input.role ?? "material_provider",
    industryType: input.industryType ?? "",
    materialTypes: input.materialTypes ?? [],
    location: input.location ?? "",
  });

  const accessToken = signAccessToken(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    jwtExpiresIn
  );

  return { user: toPublicJSON(user), accessToken };
}

async function loginUser({ email, password }, jwtSecret, jwtExpiresIn) {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const accessToken = signAccessToken(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    jwtExpiresIn
  );

  return { user: toPublicJSON(user), accessToken };
}

module.exports = { registerUser, loginUser };
