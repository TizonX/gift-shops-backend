const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Get user profile with cart information
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      select: "title images price stock",
    });

    const userResponse = user.toObject();
    userResponse.cart = {
      items: cart ? cart.items : [],
      totalItems: cart ? cart.totalItems : 0,
      totalAmount: cart ? cart.totalAmount : 0,
    };

    res.status(200).json({
      status: 1,
      data: userResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Error fetching user profile",
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;

    const updatedUser = await user.save();

    res.status(200).json({
      status: 1,
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Error updating user profile",
    });
  }
};

// Get cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      select: "title images price stock",
    });

    if (!cart) {
      return res.status(200).json({
        status: 1,
        data: {
          items: [],
          totalItems: 0,
          totalAmount: 0,
        },
      });
    }

    res.status(200).json({
      status: 1,
      data: cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Error fetching cart",
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, customization = {} } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 0,
        message: "Product not found",
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        status: 0,
        message: "Not enough stock available",
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].customization = customization;
    } else {
      // Add new item if product doesn't exist
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        customization,
      });
    }

    await cart.save();

    // Populate product details before sending response
    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "title images price stock",
    });

    res.status(200).json({
      status: 1,
      data: populatedCart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Error adding item to cart",
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        status: 0,
        message: "Cart not found",
      });
    }
    // Find the item index
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        status: 0,
        message: "Item not found in cart",
      });
    }

    // Remove the item using splice
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate product details before sending response
    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "title images price stock",
    });

    res.status(200).json({
      status: 1,
      data: populatedCart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Error removing item from cart",
    });
  }
};

// Update cart item quantity
const updateCartItemQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        status: 0,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        status: 0,
        message: "Cart not found",
      });
    }

    const cartItem = cart.items.find(
      (item) => item.product.toString() === itemId
    );

    if (!cartItem) {
      return res.status(404).json({
        status: 0,
        message: "Cart item not found",
      });
    }

    // Check product stock
    const product = await Product.findById(cartItem.product);
    if (!product || product.stock < quantity) {
      return res.status(400).json({
        status: 0,
        message: "Not enough stock available",
      });
    }

    cartItem.quantity = quantity;
    await cart.save();

    // Populate product details before sending response
    const populatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "title images price stock",
    });

    res.status(200).json({
      status: 1,
      data: populatedCart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Error updating cart item quantity",
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
};
