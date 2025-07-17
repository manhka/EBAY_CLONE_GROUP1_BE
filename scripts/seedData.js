const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import all models
const User = require("../models/User");
const UserInformation = require("../models/UserInformation");
const Address = require("../models/Address");
const Category = require("../models/Category");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const ShippingInfo = require("../models/ShippingInfo");
const ReturnRequest = require("../models/ReturnRequest");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Clear all collections
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await UserInformation.deleteMany({});
    await Address.deleteMany({});
    await Category.deleteMany({});
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    await ShippingInfo.deleteMany({});
    await ReturnRequest.deleteMany({});
    console.log("🗑️ Database cleared");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  }
};

// Seed Users
const seedUsers = async () => {
  const users = [
    {
      username: "admin1",
      email: "admin@ebay.com",
      password: "123456",
      role: "admin",
      isVerified: true,
      verifiedAt: new Date(),
    },
    {
      username: "seller1",
      email: "seller1@gmail.com",
      password: "12345678",
      role: "user",
      isVerified: true,
      verifiedAt: new Date(),
    },
    {
      username: "seller2",
      email: "seller2@gmail.com",
      password: "12345678",
      role: "user",
      isVerified: true,
      verifiedAt: new Date(),
    },
    {
      username: "buyer1",
      email: "buyer1@gmail.com",
      password: "12345678",
      role: "user",
      isVerified: true,
      verifiedAt: new Date(),
    },
    {
      username: "buyer2",
      email: "buyer2@gmail.com",
      password: "12345678",
      role: "user",
      isVerified: true,
      verifiedAt: new Date(),
    },
  ];

  const createdUsers = await User.insertMany(users);
  console.log("👥 Users created:", createdUsers.length);
  return createdUsers;
};

// Seed UserInformation
const seedUserInformation = async (users) => {
  const userInfos = [
    {
      user: users[0]._id,
      fullName: "Admin User",
      phone: "+84123456789",
      street: "100 Admin Street",
      city: "Ho Chi Minh City",
      state: "Ho Chi Minh",
      country: "Vietnam",
      birthday: new Date("1990-01-01"),
      isDefault: true,
    },
    {
      user: users[1]._id,
      fullName: "Nguyen Van Seller",
      phone: "+84987654321",
      street: "200 Seller Boulevard",
      city: "Hanoi",
      state: "Hanoi",
      country: "Vietnam",
      birthday: new Date("1985-05-15"),
      isDefault: true,
    },
    {
      user: users[2]._id,
      fullName: "Tran Thi Store",
      phone: "+84912345678",
      street: "300 Store Avenue",
      city: "Da Nang",
      state: "Da Nang",
      country: "Vietnam",
      birthday: new Date("1988-08-20"),
      isDefault: true,
    },
    {
      user: users[3]._id,
      fullName: "Le Van Buyer",
      phone: "+84901234567",
      street: "400 Buyer Lane",
      city: "Can Tho",
      state: "Can Tho",
      country: "Vietnam",
      birthday: new Date("1992-03-10"),
      isDefault: true,
    },
    {
      user: users[4]._id,
      fullName: "Pham Thi Customer",
      phone: "+84898765432",
      street: "500 Customer Road",
      city: "Hai Phong",
      state: "Hai Phong",
      country: "Vietnam",
      birthday: new Date("1995-12-25"),
      isDefault: true,
    },
  ];

  const createdUserInfos = await UserInformation.insertMany(userInfos);
  console.log("📋 User Information created:", createdUserInfos.length);
  return createdUserInfos;
};

// Seed Addresses
const seedAddresses = async (users) => {
  const addresses = [
    {
      userId: users[3]._id,
      fullName: "Le Van Buyer",
      phone: "+84901234567",
      street: "123 Nguyen Trai Street",
      city: "Ho Chi Minh City",
      state: "Ho Chi Minh",
      country: "Vietnam",
      isDefault: true,
    },
    {
      userId: users[4]._id,
      fullName: "Pham Thi Customer",
      phone: "+84898765432",
      street: "456 Le Loi Boulevard",
      city: "Hanoi",
      state: "Hanoi",
      country: "Vietnam",
      isDefault: true,
    },
    {
      userId: users[3]._id,
      fullName: "Le Van Buyer",
      phone: "+84901234567",
      street: "789 Tran Hung Dao Street",
      city: "Da Nang",
      state: "Da Nang",
      country: "Vietnam",
      isDefault: false,
    },
  ];

  const createdAddresses = await Address.insertMany(addresses);
  console.log("🏠 Addresses created:", createdAddresses.length);
  return createdAddresses;
};

// Seed Categories
const seedCategories = async () => {
  const categories = [
    { name: "Electronics" },
    { name: "Fashion" },
    { name: "Home & Garden" },
    { name: "Sports & Outdoors" },
    { name: "Books" },
    { name: "Toys & Games" },
    { name: "Automotive" },
    { name: "Beauty & Health" },
  ];

  const createdCategories = await Category.insertMany(categories);
  console.log("🏷️ Categories created:", createdCategories.length);
  return createdCategories;
};

// Seed Stores
const seedStores = async (users) => {
  const stores = [
    {
      sellerId: users[1]._id,
      storeName: "Tech Paradise",
      description: "Your one-stop shop for all electronic devices and gadgets",
      bannerImageURL: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop",
    },
    {
      sellerId: users[2]._id,
      storeName: "Fashion Hub",
      description: "Latest fashion trends and stylish clothing for everyone",
      bannerImageURL: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
    },
  ];

  const createdStores = await Store.insertMany(stores);
  console.log("🏪 Stores created:", createdStores.length);
  return createdStores;
};

// Seed Products
const seedProducts = async (categories, stores) => {
  const products = [
    {
      title: "iPhone 15 Pro Max",
      description: "Latest Apple iPhone with advanced camera system and A17 Pro chip",
      price: 1199,
      images: [
        "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop",
      ],
      categoryId: categories[0]._id,
      sellerId: stores[0]._id,
      isAuction: false,
    },
    {
      title: "Samsung Galaxy S24 Ultra",
      description: "Premium Android smartphone with S Pen and exceptional photography",
      price: 1099,
      images: [
        "https://images.unsplash.com/photo-1610792516307-7d57724e2997?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1605236453806-b632ea3f4122?w=500&h=500&fit=crop",
      ],
      categoryId: categories[0]._id,
      sellerId: stores[0]._id,
      isAuction: true,
      auctionEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      title: "Nike Air Max 270",
      description: "Comfortable running shoes with Air Max technology",
      price: 150,
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop",
      ],
      categoryId: categories[1]._id,
      sellerId: stores[1]._id,
      isAuction: false,
    },
    {
      title: "MacBook Pro M3",
      description: "Professional laptop with M3 chip for ultimate performance",
      price: 1999,
      images: [
        "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop",
      ],
      categoryId: categories[0]._id,
      sellerId: stores[0]._id,
      isAuction: false,
    },
    {
      title: "Adidas Ultraboost 22",
      description: "Premium running shoes with Boost technology",
      price: 180,
      images: [
        "https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=500&h=500&fit=crop",
        "https://images.unsplash.com/photo-1448387473223-5c37445527e7?w=500&h=500&fit=crop",
      ],
      categoryId: categories[1]._id,
      sellerId: stores[1]._id,
      isAuction: true,
      auctionEndTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
  ];

  const createdProducts = await Product.insertMany(products);
  console.log("📱 Products created:", createdProducts.length);
  return createdProducts;
};

// Seed Orders
const seedOrders = async (users, addresses) => {
  const orders = [
    // === ORDERS FOR buyer1@gmail.com (users[3]) - FOR TESTING RETURN REQUESTS ===
    
    // 1. Đơn hàng pending - không thể hoàn trả
    {
      buyerId: users[3]._id,
      addressId: addresses[0]._id,
      orderDate: new Date(),
      totalPrice: 1199,
      status: "pending",
    },
    
    // 2. Đơn hàng delivered - có thể hoàn trả (chưa có return request)
    {
      buyerId: users[3]._id,
      addressId: addresses[0]._id,
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 ngày trước
      totalPrice: 330,
      status: "delivered",
    },
    
    // 3. Đơn hàng shipped - có thể hoàn trả (chưa có return request)
    {
      buyerId: users[3]._id,
      addressId: addresses[2]._id,
      orderDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 ngày trước
      totalPrice: 1999,
      status: "shipped",
    },
    
    // 4. Đơn hàng delivered - đã có return request pending
    {
      buyerId: users[3]._id,
      addressId: addresses[0]._id,
      orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
      totalPrice: 1499,
      status: "delivered",
    },
    
    // 5. Đơn hàng delivered - đã có return request approved
    {
      buyerId: users[3]._id,
      addressId: addresses[2]._id,
      orderDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 ngày trước
      totalPrice: 2179,
      status: "delivered",
    },
    
    // 6. Đơn hàng shipped - đã có return request completed
    {
      buyerId: users[3]._id,
      addressId: addresses[0]._id,
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 ngày trước
      totalPrice: 180,
      status: "shipped",
    },
    
    // 7. Đơn hàng delivered - đã có return request rejected
    {
      buyerId: users[3]._id,
      addressId: addresses[2]._id,
      orderDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 ngày trước
      totalPrice: 1099,
      status: "delivered",
    },
    
    // === ORDERS FOR OTHER USERS ===
    
    // Đơn hàng confirmed (buyer2)
    {
      buyerId: users[4]._id,
      addressId: addresses[1]._id,
      orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 ngày trước
      totalPrice: 330,
      status: "confirmed",
    },
    
    // Đơn hàng cancelled (buyer2)
    {
      buyerId: users[4]._id,
      addressId: addresses[1]._id,
      orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày trước
      totalPrice: 1099,
      status: "cancelled",
    },
    
    // Đơn hàng processing (buyer2)
    {
      buyerId: users[4]._id,
      addressId: addresses[1]._id,
      orderDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 giờ trước
      totalPrice: 150,
      status: "processing",
    },
  ];

  const createdOrders = await Order.insertMany(orders);
  console.log("📦 Orders created:", createdOrders.length);
  return createdOrders;
};

// Seed OrderItems
const seedOrderItems = async (orders, products) => {
  const orderItems = [
    // === ORDER ITEMS FOR buyer1@gmail.com ===
    
    // Order 0 (pending): iPhone 15 Pro Max
    {
      orderId: orders[0]._id,
      productId: products[0]._id,
      quantity: 1,
      unitPrice: 1199,
    },
    
    // Order 1 (delivered - no return): Nike shoes + Adidas shoes
    {
      orderId: orders[1]._id,
      productId: products[2]._id,
      quantity: 2,
      unitPrice: 150,
    },
    {
      orderId: orders[1]._id,
      productId: products[4]._id,
      quantity: 1,
      unitPrice: 30, // Adjusted to match total 330
    },
    
    // Order 2 (shipped - no return): MacBook Pro M3
    {
      orderId: orders[2]._id,
      productId: products[3]._id,
      quantity: 1,
      unitPrice: 1999,
    },
    
    // Order 3 (delivered - pending return): iPhone + Nike shoes
    {
      orderId: orders[3]._id,
      productId: products[0]._id,
      quantity: 1,
      unitPrice: 1199,
    },
    {
      orderId: orders[3]._id,
      productId: products[2]._id,
      quantity: 2,
      unitPrice: 150,
    },
    
    // Order 4 (delivered - approved return): MacBook + Adidas
    {
      orderId: orders[4]._id,
      productId: products[3]._id,
      quantity: 1,
      unitPrice: 1999,
    },
    {
      orderId: orders[4]._id,
      productId: products[4]._id,
      quantity: 1,
      unitPrice: 180,
    },
    
    // Order 5 (shipped - completed return): Adidas shoes
    {
      orderId: orders[5]._id,
      productId: products[4]._id,
      quantity: 1,
      unitPrice: 180,
    },
    
    // Order 6 (delivered - rejected return): Samsung Galaxy
    {
      orderId: orders[6]._id,
      productId: products[1]._id,
      quantity: 1,
      unitPrice: 1099,
    },
    
    // === ORDER ITEMS FOR OTHER USERS ===
    
    // Order 7 (confirmed - buyer2): Nike + Adidas
    {
      orderId: orders[7]._id,
      productId: products[2]._id,
      quantity: 2,
      unitPrice: 150,
    },
    {
      orderId: orders[7]._id,
      productId: products[4]._id,
      quantity: 1,
      unitPrice: 30,
    },
    
    // Order 8 (cancelled - buyer2): Samsung Galaxy
    {
      orderId: orders[8]._id,
      productId: products[1]._id,
      quantity: 1,
      unitPrice: 1099,
    },
    
    // Order 9 (processing - buyer2): Nike shoes
    {
      orderId: orders[9]._id,
      productId: products[2]._id,
      quantity: 1,
      unitPrice: 150,
    },
  ];

  const createdOrderItems = await OrderItem.insertMany(orderItems);
  console.log("📋 Order Items created:", createdOrderItems.length);
  return createdOrderItems;
};

// Seed ShippingInfo
const seedShippingInfo = async (orders) => {
  const shippingInfos = [
    // === SHIPPING INFO FOR buyer1@gmail.com ===
    
    // Order 1 (delivered - no return)
    {
      orderId: orders[1]._id,
      carrier: "Giao Hang Nhanh",
      trackingNumber: "GHN123456789",
      status: "delivered",
      estimatedArrival: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Đã giao
    },
    
    // Order 2 (shipped - no return)
    {
      orderId: orders[2]._id,
      carrier: "Viettel Post",
      trackingNumber: "VTP987654321",
      status: "shipped",
      estimatedArrival: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 ngày tới
    },
    
    // Order 3 (delivered - pending return)
    {
      orderId: orders[3]._id,
      carrier: "J&T Express",
      trackingNumber: "JT123456789",
      status: "delivered",
      estimatedArrival: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Đã giao
    },
    
    // Order 4 (delivered - approved return)
    {
      orderId: orders[4]._id,
      carrier: "Best Express",
      trackingNumber: "BEST987654321",
      status: "delivered",
      estimatedArrival: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Đã giao
    },
    
    // Order 5 (shipped - completed return)
    {
      orderId: orders[5]._id,
      carrier: "Ninja Van",
      trackingNumber: "NV456789123",
      status: "shipped",
      estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ngày tới
    },
    
    // Order 6 (delivered - rejected return)
    {
      orderId: orders[6]._id,
      carrier: "Kerry Express",
      trackingNumber: "KERRY789123456",
      status: "delivered",
      estimatedArrival: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Đã giao
    },
    
    // === SHIPPING INFO FOR OTHER USERS ===
    
    // Order 7 (confirmed - buyer2)
    {
      orderId: orders[7]._id,
      carrier: "Giao Hang Nhanh",
      trackingNumber: "GHN555666777",
      status: "in_transit",
      estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ngày tới
    },
    
    // Order 9 (processing - buyer2)
    {
      orderId: orders[9]._id,
      carrier: "Shopee Express",
      trackingNumber: "SPX456789123",
      status: "preparing",
      estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ngày tới
    },
    
    // Orders 0 (pending) và 8 (cancelled) không có shipping info
  ];

  const createdShippingInfos = await ShippingInfo.insertMany(shippingInfos);
  console.log("🚚 Shipping Info created:", createdShippingInfos.length);
  return createdShippingInfos;
};

// Seed ReturnRequests
const seedReturnRequests = async (orders, users) => {
  const returnRequests = [
    // === RETURN REQUESTS FOR buyer1@gmail.com - TESTING DIFFERENT STATUSES ===
    
    // Return request PENDING for order 3 (delivered)
    {
      orderId: orders[3]._id, // Order 3: delivered with iPhone + Nike shoes
      userId: users[3]._id,   // buyer1
      reason: "iPhone không đúng như mô tả, màu sắc khác so với hình ảnh",
      status: "pending",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 giờ trước
    },
    
    // Return request APPROVED for order 4 (delivered)
    {
      orderId: orders[4]._id, // Order 4: delivered with MacBook + Adidas
      userId: users[3]._id,   // buyer1
      reason: "MacBook bị lỗi màn hình, có vệt đen ở góc trái",
      status: "approved",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 ngày trước
    },
    
    // Return request COMPLETED for order 5 (shipped)
    {
      orderId: orders[5]._id, // Order 5: shipped with Adidas shoes
      userId: users[3]._id,   // buyer1
      reason: "Giày Adidas không vừa size, cần đổi size khác",
      status: "completed",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày trước
    },
    
    // Return request REJECTED for order 6 (delivered)
    {
      orderId: orders[6]._id, // Order 6: delivered with Samsung Galaxy
      userId: users[3]._id,   // buyer1
      reason: "Muốn đổi sang iPhone vì thích hơn",
      status: "rejected",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 giờ trước
    },
    
    // === RETURN REQUEST FOR OTHER USERS ===
    
    // Return request for buyer2
    {
      orderId: orders[7]._id, // Order 7: confirmed (buyer2)
      userId: users[4]._id,   // buyer2
      reason: "Muốn hủy đơn hàng vì tìm được giá rẻ hơn ở nơi khác",
      status: "rejected",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 giờ trước
    },
  ];

  const createdReturnRequests = await ReturnRequest.insertMany(returnRequests);
  console.log("↩️ Return Requests created:", createdReturnRequests.length);
  return createdReturnRequests;
};

// Main seed function
const seedDatabase = async () => {
  try {
    await connectDB();
    await clearDatabase();

    console.log("🌱 Starting to seed database...");

    const users = await seedUsers();
    const userInfos = await seedUserInformation(users);
    const addresses = await seedAddresses(users);
    const categories = await seedCategories();
    const stores = await seedStores(users);
    const products = await seedProducts(categories, stores);
    const orders = await seedOrders(users, addresses);
    const orderItems = await seedOrderItems(orders, products);
    const shippingInfos = await seedShippingInfo(orders);
    const returnRequests = await seedReturnRequests(orders, users);

    console.log("\n🎉 Database seeded successfully!");
    console.log("📊 Summary:");
    console.log(`👥 Users: ${users.length}`);
    console.log(`📋 User Information: ${userInfos.length}`);
    console.log(`🏠 Addresses: ${addresses.length}`);
    console.log(`🏷️ Categories: ${categories.length}`);
    console.log(`🏪 Stores: ${stores.length}`);
    console.log(`📱 Products: ${products.length}`);
    console.log(`📦 Orders: ${orders.length}`);
    console.log(`📋 Order Items: ${orderItems.length}`);
    console.log(`🚚 Shipping Info: ${shippingInfos.length}`);
    console.log(`↩️ Return Requests: ${returnRequests.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 