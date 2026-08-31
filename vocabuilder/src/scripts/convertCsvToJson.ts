import csv from "csvtojson";
import fs from "fs";

const inputPath = "./src/scripts/subtlex.csv";
const outputPath = "./src/scripts/subtlexWords.json";


async function convertCsvToJson() {
  try {
    const jsonArray = await csv().fromFile(inputPath);
    fs.writeFileSync(outputPath, JSON.stringify(jsonArray, null, 2));
    console.log("✅ CSV converted to JSON and saved to", outputPath);
  } catch (err) {
    console.error("❌ Conversion failed:", err);
  }
}

convertCsvToJson();
