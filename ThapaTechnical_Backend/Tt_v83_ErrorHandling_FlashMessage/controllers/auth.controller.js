import {
  createUser,
  getUserByEmail,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from "../services/auth.services.js";

// -------------------Render user Register page-------------------
export const registerPage = (req, res) => {
  let error = req.flash("error"); // Retrieve error flash messages

  let user = null;
  if (req.cookies?.accessToken) {
    const decoded = verifyToken(req.cookies.accessToken);
    user = decoded;
  }

  res.render("userRegister", { user, error });
};

// ----------------Register user----------------
export const registerUser = async (req, res) => {
  // Get user details from frontend
  const { name, age, email, password } = req.body;

  // Check user Already exists or not
  const userExists = await getUserByEmail(email);

  // Show Flash Messages
  if (userExists) {
    req.flash("error", "User already exists!");
    return res.redirect("/api/v1/auth/register");
  }

  // Password Hashing
  const hashedPassword = await hashPassword(password);

  // Create new user in db
  const [user] = await createUser({
    name,
    age,
    email,
    password: hashedPassword, // Store hashed password in DB
  });

  // return API response if user created successfully
  return res.redirect("/api/v1/auth/login");
};

// -------------------Render user Login page-------------------
export const loginPage = (req, res) => {
  let error = req.flash("error"); // Retrieve error flash messages

  let user = null;
  if (req.cookies?.accessToken) {
    const decoded = verifyToken(req.cookies.accessToken);
    user = decoded;
  }

  res.render("userLogin", { user, error });
};

// ----------------Login user----------------
export const loginUser = async (req, res) => {
  // Get user details from frontend (email, password)
  const { email, password } = req.body;

  // Check user Already exists or not
  const user = await getUserByEmail(email);

  // Show flash message
  if (!user) {
    req.flash("error", "Invalid Email or Password!");
    return res.redirect("/api/v1/auth/login");
  }

  // Compare Password
  const isPasswordValid = await comparePassword(password, user.password);

  // Show flash message
  if (!isPasswordValid) {
    req.flash("error", "Invalid Email or Password!");
    return res.redirect("/api/v1/auth/login");
  }

  // Create JWT payload
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  // Generate JWT token
  const token = generateToken(payload);

  // set token in cookie
  res.cookie("accessToken", token);

  // send response Logged In Successfully!
  return res.redirect("/api/v1/auth/profile");
};

// -------------------Render user Profile page-------------------
export const profilePage = (req, res) => {
  res.render("profile", { user: req.user });
};
