import { db } from "./db";
import { tables, menuItems, menuCollections } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database...");

  // Check if tables already exist
  const existingTables = await db.select().from(tables);
  
  if (existingTables.length === 0) {
    const regularTables = Array.from({ length: 16 }, (_, i) => ({
      name: `Bàn ${i + 1}`,
      type: 'regular' as const,
      status: 'available' as const,
    }));
    const specialTables = [
      { name: 'Mang về', type: 'special' as const, status: 'available' as const },
    ];
    const allTables = [...regularTables, ...specialTables];
    await db.insert(tables).values(allTables);
    console.log(`Inserted ${allTables.length} tables`);
  }

  // Check if menu collections already exist
  const existingMenuCollections = await db.select().from(menuCollections);
  let defaultCollectionId = 1;

  if (existingMenuCollections.length === 0) {
    console.log("Seeding menu collections...");
    const defaultCollectionData = {
      name: "Thực đơn chính",
      description: "Các món ăn và đồ uống thông thường",
      isActive: 1,
    };
    const insertedCollections = await db.insert(menuCollections).values(defaultCollectionData).returning({ insertedId: menuCollections.id });
    if (insertedCollections.length > 0 && insertedCollections[0].insertedId) {
        defaultCollectionId = insertedCollections[0].insertedId;
        console.log(`Inserted default menu collection with ID: ${defaultCollectionId}`);
    } else {
        console.error("Failed to insert default menu collection or retrieve its ID.");
    }
  } else {
    const firstActiveCollection = existingMenuCollections.find(col => col.isActive === 1);
    if (firstActiveCollection) {
        defaultCollectionId = firstActiveCollection.id;
    } else if (existingMenuCollections.length > 0) {
        defaultCollectionId = existingMenuCollections[0].id;
    }
    console.log(`Using existing menu collection with ID: ${defaultCollectionId} for menu items.`);
  }

  // Check if menu items already exist
  const existingMenuItems = await db.select().from(menuItems);
  
  if (existingMenuItems.length === 0) {
    console.log("Seeding menu items...");
    const menuItemsData = [
      { name: 'Bạc Xỉu', price: 25000, category: 'Cà phê', imageUrl:'https://via.placeholder.com/300x200' , available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Bạc Xỉu Kẹo Đường', price: 35000, category: 'Cà phê', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Bạc Xỉu Muối', price: 28000, category: 'Cà phê', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Bánh', price: 20000, category: 'Toping', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Bò Húc', price: 28000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Cà Phê Đen', price: 18000, category: 'Cà phê', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Cà Phê Đen Sài Gòn', price: 22000, category: 'Cà phê', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Cà Phê Kẹo Đường', price: 35000, category: 'Cà phê', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Cà Phê Muối', price: 28000, category: 'Cà phê', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Cà Phê Sữa', price: 20000, category: 'Cà phê', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Cà Phê Sữa Sài Gòn', price: 25000, category: 'Cà phê', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Cacao', price: 30000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollections: defaultCollectionId },
      { name: 'Coca', price: 30000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Coca Xí Muội', price: 25000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Đá Me', price: 28000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Hướng Dương', price: 15000, category: 'Toping', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Ken Béo', price: 8000, category: 'Toping', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Kẹo Đường', price: 8000, category: 'Toping', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Nước Cam', price: 30000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Nước Chanh', price: 25000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Nước Chanh Sả Tắc', price: 25000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Nước Chanh Xí Muội', price: 28000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Sâm Dứa Sữa', price: 25000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Sữa Chua Dâu', price: 28000, category: 'Sữa chua', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Sữa Chua Đá', price: 22000, category: 'Sữa chua', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Sữa Chua Đào', price: 28000, category: 'Sữa chua', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Sữa Chua Việt Quất', price: 28000, category: 'Sữa chua', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Sữa Tươi Kẹo Đường', price: 35000, category: 'Khác', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Thuốc Mèo', price: 20000, category: 'Toping', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Cam Quế', price: 28000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Chanh Dây', price: 25000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Chanh Dây Bạc Hà', price: 30000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Chanh Dây Xí Muội', price: 30000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Chanh Sả Tắc', price: 28000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Chanh Xí Muội', price: 28000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Đào', price: 30000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Đào Bạc Hà', price: 35000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Đào Cam Sả', price: 35000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Đào Kem Béo', price: 35000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Gừng', price: 25000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Sữa Kẹo Đường', price: 35000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Vải', price: 30000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Vải Bạc Hà', price: 35000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
      { name: 'Trà Vải Kem Béo', price: 35000, category: 'Trà', imageUrl: 'https://via.placeholder.com/300x200', available: 1, menuCollectionId: defaultCollectionId },
    ];

    await db.insert(menuItems).values(menuItemsData);
    console.log(`Inserted ${menuItemsData.length} menu items`);
  }

  console.log("Database seeding completed!");
}

seedDatabase().catch(error => {
  console.error("Seeding failed:", error);
  process.exit(1);
});

export { seedDatabase };