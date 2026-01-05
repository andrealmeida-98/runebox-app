const fs = require("fs");
const https = require("https");

const url =
  "https://api.dotgg.gg/cgfw/getcards?game=riftbound&mode=indexed&cache=3275";
const outputFile = "cards.json";

https
  .get(url, (res) => {
    let data = "";

    // Collect data chunks
    res.on("data", (chunk) => {
      data += chunk;
    });

    // Handle response end
    res.on("end", () => {
      try {
        // Parse to verify it's valid JSON
        const jsonData = JSON.parse(data);

        // Write to file with pretty formatting
        fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));

        console.log(`✓ Successfully saved data to ${outputFile}`);
        console.log(`✓ File size: ${(data.length / 1024).toFixed(2)} KB`);
      } catch (err) {
        console.error("✗ Error parsing JSON:", err.message);
        // Save raw data anyway
        fs.writeFileSync(outputFile, data);
        console.log(`✓ Saved raw response to ${outputFile}`);
      }
    });
  })
  .on("error", (err) => {
    console.error("✗ Error fetching data:", err.message);
  });
