// seeder.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product'); // Đảm bảo đường dẫn đúng

dotenv.config(); // Để đọc biến môi trường từ file .env

// Dữ liệu mẫu cho Product
const seedProducts = [
  // Tech
  {
    _id: "6804bba65228536e85df02ce",
    title: "Modern Laptop",
    description: "High-performance laptop with sleek design and long battery life.",
    price: 4500,
    images: ["https://i.ebayimg.com/images/g/1n4AAOSw~-Nk-2Cs/s-l200.webp"],
    categoryId: "68682a7598bfd927e326be35", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: false,
    quantity: 9,
    status: "available"
  },
  {
    _id: "6804bba65228536e85df02cd",
    title: "Vintage Camera",
    description: "Classic film camera with manual focus and exposure controls.",
    price: 1800,
    images: ["https://i.ebayimg.com/images/g/hVMAAOSwYollU5Na/s-l500.jpg"],
    categoryId: "68682a7598bfd927e326be35", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: true,
    auctionEndTime: new Date("2025-07-15T15:00:00Z"),
    quantity: 24,
    status: "available"
  },
  {
    _id: "6804bba65228536e85df02cf",
    title: "Wireless Headphones",
    description: "Noise-cancelling headphones with premium sound quality.",
    price: 1200,
    images: ["https://i.ebayimg.com/images/g/G~4AAOSwJ~Rk-2C0/s-l500.jpg"],
    categoryId: "68682a7598bfd927e326be35", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: false,
    quantity: 50,
    status: "available"
  },
  {
    _id: "6804bba65228536e85df02d3",
    title: "Portable Speaker",
    description: "Waterproof Bluetooth speaker with 360-degree sound.",
    price: 880,
    images: ["https://i.ebayimg.com/images/g/gkoAAOSw54Zk-2DA/s-l500.jpg"],
    categoryId: "68682a7598bfd927e326be35", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: false,
    quantity: 46,
    status: "available"
  },

  // Home and garden
  {
    _id: "6804bba65228536e85df02d1",
    title: "Desk Lamp",
    description: "Adjustable LED desk lamp with multiple brightness levels.",
    price: 750,
    images: ["https://i.ebayimg.com/images/g/yqgAAOSwnb1l3i7W/s-l500.jpg"],
    categoryId: "68682a7598bfd927e326be36", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: true,
    auctionEndTime: new Date("2025-07-18T10:30:00Z"),
    quantity: 55,
    status: "available"
  },
  {
    _id: "6804bba65228536e85df02d0",
    title: "Ceramic Coffee Mug",
    description: "Handmade ceramic mug with artistic design and comfortable handle.",
    price: 350,
    images: ["https://i.ebayimg.com/images/g/o0MAAOSw23tk-2C1/s-l500.jpg"],
    categoryId: "68682a7598bfd927e326be36", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: false,
    quantity: 98,
    status: "available"
  },

  // Men's fashion
  {
    _id: "6804bba65228536e85df02d4",
    title: "Leather Wallet",
    description: "Slim leather wallet with RFID protection and multiple card slots.",
    price: 450,
    images: ["https://i.ebayimg.com/images/g/YyMAAOSwYpVk-2C6/s-l500.jpg"],
    categoryId: "68682a7598bfd927e326be39", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: false,
    quantity: 80,
    status: "available"
  },
  {
    _id: "6804bba65228536e85df02d5",
    title: "Denim Jacket",
    description: "Stylish street fashion denim jacket.",
    price: 1200,
    images: ["https://i.ebayimg.com/images/g/K6gAAOSw0~Fk-2C7/s-l200.webp"],
    categoryId: "68682a7598bfd927e326be39", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: false,
    quantity: 40,
    status: "available"
  },
  {
    _id: "6804bba65228536e85df02cc",
    title: "Brown Leather Bag",
    description: "Handcrafted genuine leather bag with premium stitching.",
    price: 2500,
    images: ["https://i.ebayimg.com/images/g/0~IAAOSwX~lU5Nb/s-l500.jpg"],
    categoryId: "68682a7598bfd927e326be38", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: true,
    auctionEndTime: new Date("2025-07-20T12:00:00Z"),
    quantity: 30,
    status: "available"
  },

  // Watches
  {
    _id: "6804bba65228536e85df02d2",
    title: "Fitness Watch",
    description: "Smart fitness tracker with heart rate monitor and sleep tracking.",
    price: 950,
    images: ["https://i.ebayimg.com/images/g/sX0AAOSw2MRk-2C9/s-l200.webp"],
    categoryId: "68682a7598bfd927e326be3a", // Thay thế ID này
    sellerId: "661f8f40fcd1c4aabd001111",
    isAuction: false,
    quantity: 43,
    status: "available"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected...');

    // Xóa tất cả sản phẩm cũ
    await Product.deleteMany({});
    console.log('Old products removed!');

    // Thêm các sản phẩm mới
    await Product.insertMany(seedProducts.map(p => ({...p, _id: new mongoose.Types.ObjectId(p._id)})));
    console.log('New products seeded!');

    process.exit();
  } catch (error) {
    console.error(`Error seeding database: ${error}`);
    process.exit(1);
  }
};

// Gọi hàm seed
seedDB();