const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Listing = require("./models/Listing");
const OpenAI = require("openai");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const session = require("express-session");

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

const PORT = process.env.PORT || 3000;
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "campusswap-secret-key",
    resave: false,
    saveUninitialized: false,
  }),
);
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  next();
}

app.use((req, res, next) => {
  res.locals.user = req.session.userId
    ? {
        id: req.session.userId,
        name: req.session.userName,
      }
    : null;

  next();
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

app.get("/", (req, res) => {
  res.render("index");
});

// Browse listings
app.get("/listings", async (req, res) => {
  const { search, category } = req.query;

  let filter = {};

  // Search in title OR category
  if (search) {
    filter.$or = [
      {
        title: {
          $regex: search,
          $options: "i",
        },
      },
      {
        category: {
          $regex: search,
          $options: "i",
        },
      },
      {
        description: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  const listings = await Listing.find(filter);

  res.render("listings", {
    listings,
    search: search || "",
    category: category || "",
  });
});
//new
app.get("/listings/new", requireLogin, (req, res) => {
  res.render("new");
});

// Edit listing page

app.get("/listings/:id/edit", requireLogin, async (req, res) => {

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).send("Listing not found.");
    }

    if (listing.user.toString() !== req.session.userId.toString()) {
        return res.status(403).send("You are not allowed to edit this listing.");
    }

    res.render("edit", { listing });

});

// Delete listing

app.post("/listings/:id/delete", requireLogin, async (req, res) => {

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).send("Listing not found.");
    }

    if (listing.user.toString() !== req.session.userId.toString()) {
        return res.status(403).send("You are not allowed to delete this listing.");
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.redirect("/listings");

});

// Update listing

app.post("/listings/:id/edit", requireLogin, async (req, res) => {

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).send("Listing not found.");
    }

    if (listing.user.toString() !== req.session.userId.toString()) {
        return res.status(403).send("You are not allowed to edit this listing.");
    }

    await Listing.findByIdAndUpdate(
        req.params.id,
        req.body
    );

    res.redirect("/listings/" + req.params.id);

});
// Product details

app.get("/listings/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id);

  res.render("show", { listing });
});

app.post("/listings", requireLogin, async (req, res) => {
  const listing = new Listing({
    ...req.body,
    user: req.session.userId,
  });

  await listing.save();

  console.log("Listing saved:", listing);

  res.redirect("/listings");
});
// chatbot
app.get("/chatbot", (req, res) => {
  res.render("chatbot");
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await openai.responses.create({
      model: "gpt-5.6",
      instructions: `
                You are the CampusSwap Assistant.

                CampusSwap is a college marketplace where
                students can buy, sell, exchange and donate items.

                Answer questions about CampusSwap clearly and briefly.
                If the question is unrelated to CampusSwap,
                politely say that you are designed to help with CampusSwap.
            `,
      input: message,
    });

    res.json({
      answer: response.output_text,
    });
  } catch (error) {
    console.log("AI service unavailable. Using FAQ fallback.");

    res.status(500).json({
      error: "AI service unavailable",
    });
  }
});

// Signup page

app.get("/signup", (req, res) => {
  res.render("signup");
});

// Create account

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.send("Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    console.log("User registered:", email);

    res.redirect("/login");
  } catch (error) {
    console.log(error);

    res.status(500).send("Signup failed.");
  }
});
// Login page

app.get("/login", (req, res) => {
  res.render("login");
});

// Login

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.send("Invalid email or password.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.send("Invalid email or password.");
    }

    req.session.userId = user._id;
    req.session.userName = user.name;

    res.redirect("/");
  } catch (error) {
    console.log(error);

    res.status(500).send("Login failed.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Logout failed.");
    }

    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
