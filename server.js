const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Serve frontend files (static hosting from "front")
app.use(express.static(path.join(__dirname, "front")));

// Routes for frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "front", "user.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "front", "admin.html"));
});

// ✅ MongoDB connection
const MONGO_URI = process.env.MONGO_URI; // must be set in Render dashboard!

if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not defined in environment variables!");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// ✅ Schema for Orders
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, trim: true },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
    bookedOn: { type: Date, default: Date.now },
    payment: { type: String, default: "", trim: true },
    status: { type: String, default: "Pending", trim: true },
    eta: { type: Date, default: null },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

// ---------------- API Routes ----------------

// Add new order
app.post("/api/orders", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json({ message: "✅ Order added successfully", order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Fetch order by ID
app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (Admin dashboard)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order
app.put("/api/orders/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "✅ Order updated successfully", order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const deleted = await Order.findOneAndDelete({ orderId: req.params.id });
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "🗑️ Order deleted", deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Health check (for Render)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
