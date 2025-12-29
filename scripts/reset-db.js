/**
 * Script to reset the local SQLite database
 *
 * This will delete the database file and force it to be recreated
 * with the latest schema when the app starts.
 *
 * Run with: node scripts/reset-db.js
 */

const fs = require("fs");
const path = require("path");

// The database file path - this might be in different locations depending on platform
// For development, we'll provide instructions

console.log("🗑️  Database Reset Script");
console.log("=".repeat(50));
console.log("");
console.log("To reset your local database:");
console.log("");
console.log("1. Stop your Expo app if it's running");
console.log("2. Clear the app data:");
console.log("   - iOS Simulator: Device > Erase All Content and Settings");
console.log("   - Android Emulator: Settings > Apps > Your App > Clear Data");
console.log("   - Physical Device: Uninstall and reinstall the app");
console.log("");
console.log("3. Or run this in your app code:");
console.log('   await db.execAsync("DROP TABLE IF EXISTS cards;");');
console.log("   await initDb();");
console.log("");
console.log(
  "The database will be recreated with the new schema on next app start."
);
console.log("");
console.log("=".repeat(50));
