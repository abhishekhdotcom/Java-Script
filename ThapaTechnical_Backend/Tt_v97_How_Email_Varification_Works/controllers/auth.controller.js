import {
  createUser,
  getUserByEmail,
  getUserById,
  hashPassword,
  comparePassword,
  verifyAccessToken,
  authenticateUser,
} from "../services/auth.services.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "../validators/auth.validator.js";

// -------------------Render user Register page-------------------
export const registerPage = (req, res) => {
  let error = req.flash("error"); // Retrieve error flash messages

  let user = null;
  if (req.cookies?.accessToken) {
    const decoded = verifyAccessToken(req.cookies.accessToken);
    user = decoded;
  }

  res.render("userRegister", { user, error });
};

// ----------------Register user----------------
export const registerUser = async (req, res) => {
  // Zod validation
  const { data, error } = registerUserSchema.safeParse(req.body);

  if (error) {
    const errors = error.issues[0].message;
    req.flash("error", errors);
    return res.redirect("/api/v1/auth/register");
  }

  // Get user details from frontend
  const { name, age, email, password } = data;

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
  const [userId] = await createUser({
    name,
    age,
    email,
    password: hashedPassword, // Store hashed password in DB
  });

  // Fetched user by Id
  const user = await getUserById(userId.id);

  // Create Session, AccessToke, RefreshToken & Set Cookies
  await authenticateUser({ user, req, res });

  // return API response if user created successfully
  return res.redirect("/api/v1/auth/profile");
};

// -------------------Render user Login page-------------------
export const loginPage = (req, res) => {
  let error = req.flash("error"); // Retrieve error flash messages

  let user = null;
  if (req.cookies?.accessToken) {
    const decoded = verifyAccessToken(req.cookies.accessToken);
    user = decoded;
  }

  res.render("userLogin", { user, error });
};

// ----------------Login user----------------
export const loginUser = async (req, res) => {
  // Zod validation
  const { data, error } = loginUserSchema.safeParse(req.body);

  if (error) {
    const errors = error.issues[0].message;
    req.flash("error", errors);
    return res.redirect("/api/v1/auth/login");
  }

  // Get user details from frontend (email, password)
  const { email, password } = data;

  // Check user Already exists or not
  const user = await getUserByEmail(email);

  // Show flash message when Not Found User & Not match Password
  if (!user || !(await comparePassword(password, user.password))) {
    req.flash("error", "Invalid Email or Password!");
    return res.redirect("/api/v1/auth/login");
  }

  // Create Session, AccessToke, RefreshToken & Set Cookies
  await authenticateUser({ user, req, res });

  // send response Logged In Successfully!
  return res.redirect("/api/v1/auth/profile");
};

// -------------------Render user Profile page-------------------
export const profilePage = (req, res) => {
  res.render("profile", { user: req.user });
};
