const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());


// Serve frontend files
app.use(express.static(path.join(__dirname, "front")));

// Default route → user.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "front", "user.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "front", "admin.html"));
});

// ✅ Use your connection URL
const MONGO_URI = "mongodb+srv://shubhsoni180:Shubh180@cluster0.blftzf5.mongodb.net/orderDB?retryWrites=true&w=majority&appName=Cluster0";

// ✅ Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// ✅ Schema for Orders
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: String,
  from: String,
  to: String,
  bookedOn: Date,
  payment: { type: String, default: "", trim: true }, // e.g. "COD", "Online"
  status: { type: String, default: "Pending", trim: true }, // e.g. "Pending", "Shipped"
  eta: { type: Date, default: null },
});

const Order = mongoose.model("Order", orderSchema);

// ---------------- API Routes ----------------

// Add new order
app.post("/api/orders", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ message: "Order added successfully", order });
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

// Get all orders (for admin dashboard if needed later)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Update order (status, payment, eta, etc.)
app.put("/api/orders/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: req.params.id },   // match by orderId
      req.body,                     // update with values from frontend
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order updated successfully", order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order by ID (optional)
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const deleted = await Order.findOneAndDelete({ orderId: req.params.id });
    if (!deleted) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted", deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
