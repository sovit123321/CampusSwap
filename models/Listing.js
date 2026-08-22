const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  category: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    required: true,
  },

  sellerName: {
    type: String,
    required: true,
  },

  sellerContact: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "https://via.placeholder.com/300",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
}
});
const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
