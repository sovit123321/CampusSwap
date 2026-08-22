const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// Static FAQ fallback
const faqs = [
  {
    keywords: [
      "campusswap",
      "campus swap",
      "campus",
      "what is campus",
      "about campus",
    ],
    answer:
      "CampusSwap is a student marketplace where students can buy, sell, exchange and donate useful items within their campus.",
  },

  {
    keywords: ["sell", "selling", "sell item", "post item"],
    answer:
      "To sell an item, go to the Sell Item page, enter the item name, category, price and description, then click Post Listing.",
  },

  {
    keywords: ["buy", "buying", "purchase", "want to buy"],
    answer:
      "To buy an item, go to Browse Listings, search for the item you need, open its details and contact the seller.",
  },

  {
    keywords: ["search", "find item", "find product", "look for"],
    answer:
      "Go to Browse Listings. You can search by item name and also filter listings by category.",
  },

  {
    keywords: ["category", "categories", "filter"],
    answer:
      "CampusSwap lets you filter listings by categories such as Books, Electronics, Furniture and other campus-related items.",
  },

  {
    keywords: ["listing", "create listing", "new listing"],
    answer:
      "To create a listing, open Sell Item, enter the required information and submit the form. Your listing will then appear in Browse Listings.",
  },

  {
    keywords: ["contact seller", "contact", "seller"],
    answer:
      "Open the item you are interested in from Browse Listings and use the available seller contact option.",
  },

  {
    keywords: ["books", "book"],
    answer:
      "You can find books by selecting the Books category or searching for the book name in Browse Listings.",
  },

  {
    keywords: ["electronics", "calculator", "laptop", "phone"],
    answer:
      "Electronics and other useful student items can be listed on CampusSwap. Use the Electronics category when creating your listing.",
  },

  {
    keywords: ["price", "cost", "change price"],
    answer:
      "The seller sets the price while creating a listing. Make sure to enter a clear and reasonable price.",
  },

  {
    keywords: ["delete listing", "remove listing"],
    answer:
      "Listing management can be added so sellers can remove items that are no longer available.",
  },

  {
    keywords: ["hello", "hi", "hey"],
    answer:
      "Hi! 👋 I'm the CampusSwap Assistant. Ask me about buying, selling, searching, listings or using CampusSwap.",
  },
];

// Find static FAQ answer
function getFallbackAnswer(question) {
  question = question.toLowerCase().trim();

  for (const faq of faqs) {
    for (const keyword of faq.keywords) {
      if (question.includes(keyword.toLowerCase())) {
        return faq.answer;
      }
    }
  }

  return "Sorry, I don't have an answer for that yet. Please try asking about buying, selling, listings, searching, or contacting a seller.";
}

// Add message to chat
function addMessage(message, className) {
  const messageDiv = document.createElement("div");

  messageDiv.className = className;

  messageDiv.textContent = message;

  chatBox.appendChild(messageDiv);

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message
chatForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const message = userInput.value.trim();

  if (!message) {
    return;
  }

  // Show user message
  addMessage(message, "user-message");

  userInput.value = "";

  try {
    // Send question to our backend
    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: message,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // AI response
      addMessage(data.answer, "bot-message");
    } else {
      // AI failed → static FAQ fallback
      const fallback = getFallbackAnswer(message);

      addMessage(fallback, "bot-message");
    }
  } catch (error) {
    console.log("Chatbot error:", error);

    // AI unavailable → static FAQ fallback
    const fallback = getFallbackAnswer(message);

    addMessage(fallback, "bot-message");
  }
});
