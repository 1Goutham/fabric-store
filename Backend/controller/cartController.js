import Cart from "../model/cartModel.js";
import Product from "../model/productModel.js";

// GET /api/cart
export const getUserCart = async (req, res) => {
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    return res.status(200).json({ items: [] });
  }

  res.status(200).json({ items: cart.items });
};

// POST /api/cart
export const addOrUpdateCartItem = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }]
      });
    } else {
      const existingItem = cart.items.find(item => item.product.toString() === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();

    // 🔥 Populate product details in response
    const populatedCart = await cart.populate("items.product");

    res.status(200).json({
      message: "Cart updated",
      cart: populatedCart
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/cart/remove
export const removeCartItem = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  let cart = await Cart.findOne({ user: userId });
  if (!cart) return res.status(400).json({ message: "Cart not found" });

  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save();

  res.status(200).json({ message: "Item removed", cart });
};

// POST /api/cart/clear
export const clearCart = async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user.id });
  res.status(200).json({ message: "Cart cleared" });
};