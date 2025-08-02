import { createUser, getUserByEmail } from "../services/auth.services.js";

// -------------------Render user Register page-------------------
export const registerPage = (req, res) => {
  res.render("userRegister");
};

// ----------------Register user----------------
export const registerUser = async (req, res) => {
  // Get user details from frontend
  const { name, age, email, password } = req.body;

  // Check user Already exists or not
  const userExists = await getUserByEmail(email);

  if (userExists) {
    return res.redirect("/api/v1/auth/register");
  }

  // Create new user in db
  const [user] = await createUser({ name, age, email, password });

  // return API response if user created successfully
  return res.redirect("/api/v1/auth/login");
};

// -------------------Render user Login page-------------------
export const loginPage = (req, res) => {
  res.render("userLogin");
};

// ----------------Login user----------------
export const loginUser = async (req, res) => {
  // Get user details from frontend (email, password)
  const { email, password } = req.body;

  // Check user Already exists or not
  const user = await getUserByEmail(email);

  if (!user) {
    return res.redirect("/api/v1/auth/login");
  }

  // validate password
  if (user.password !== password) {
    return res.redirect("/api/v1/auth/login");
  }

  // set cookies
  res.cookie("isLoggedIn", true);

  // send response Logged In Successfully!
  return res.redirect("/api/v1/dashboard");
};
