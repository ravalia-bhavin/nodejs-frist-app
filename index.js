import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// conect to database
mongoose
  .connect("mongodb://127.0.0.1:27017", { dbName: "backend" })
  .then(() => console.log("📦 Database Connected 🔗"))
  .catch((e) => console.log(e));

// schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// now create record e.x message | creating model
const User = mongoose.model("User", userSchema);

const app = express();

// const users = [];

// usind middlewares :

// express.static(pathofStaticFile)
app.use(express.static(path.join(path.resolve(), "public")));

// middleware through which we can access data form the `form` STEP : 1️⃣
app.use(express.urlencoded({ extended: true }));

// cookier parser middleware
app.use(cookieParser());

app.get("/", async (req, res) => {
  const { token } = req.cookies;

  // token existe -- menans already login -- so -- show logout page
  if (token) {
    const decoded = jwt.verify(token, "ABC");
    // store filled form user info in req.user
    req.user = await User.findById(decoded._id);
    console.log(req.user);
    res.render("logout.ejs", { name: req.user.name });
  }
  // token not existe -- so - show login page
  else {
    res.render("login.ejs");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });

  // if not user then do registration first
  if (!user) return res.redirect("/register");

  const isMatch = user.password === password;
  if (!isMatch)
    return res.render("login.ejs", { message: "Incorrect Password ❌" });

  const token = jwt.sign({ _id: user._id }, "ABC");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  // if user eixt : go to login page
  if (user) {
    return res.redirect("/login");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  // user not eixt : create user
  user = await User.create({
    name,
    email,
    password,
  });

  // create token ( modifty the user id : not send actual id, add some ecnrytping with id)
  const token = jwt.sign({ _id: user._id }, "ABC");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.redirect("/");
});

app.listen(5000, () => {
  console.log("server is working ✅");
});
