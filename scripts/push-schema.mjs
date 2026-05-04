// Push schema directly using mysql2 with SSL
import mysql from "mysql2/promise";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

async function main() {
  console.log("Connecting to database...");

  // First connect without database to create it if needed
  const url = new URL(connectionString);
  const dbName = url.pathname.replace("/", "");
  url.pathname = ""; // Remove database name
  const baseUrl = url.toString().replace(/\/$/, "");

  const tempConn = await mysql.createConnection({
    uri: baseUrl,
    ssl: { rejectUnauthorized: true },
  });

  // Create database if it doesn't exist
  await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  console.log(`  ✓ Database '${dbName}' ensured`);
  await tempConn.end();

  // Now connect to the actual database
  const connection = await mysql.createConnection({
    uri: connectionString,
    ssl: { rejectUnauthorized: true },
  });

  console.log("Creating tables...");

  // Users table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✓ users table created");

  // Searches table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS searches (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      product_query VARCHAR(500) NOT NULL,
      ip_address VARCHAR(100),
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✓ searches table created");

  // Settings table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(100) NOT NULL UNIQUE,
      \`value\` TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✓ settings table created");

  // Generated images table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS generated_images (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_image_url TEXT NOT NULL,
      theme_title VARCHAR(200) NOT NULL,
      prompt TEXT NOT NULL,
      result_image_url TEXT,
      overlay_text VARCHAR(500),
      overlay_settings JSON,
      final_image_url TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✓ generated_images table created");

  // Chat messages table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      user_name VARCHAR(100) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("  ✓ chat_messages table created");

  await connection.end();
  console.log("\n✅ All tables created successfully!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
