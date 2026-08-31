import fs from "fs";
// @ts-ignore
import csv from "csv-parser";
const LEVELS = {
    beginner: [2.5, 3.5],
    intermediate: [1.8, 2.5],
    advanced: [1.1, 1.7],
};
const grouped = {
    beginner: [],
    intermediate: [],
    advanced: [],
};
fs.createReadStream("subtlex.csv")
    .pipe(csv())
    .on("data", (row) => {
    const word = row["Word"]?.trim();
    const zipfRaw = row["ZipfValue"];
    const zipf = zipfRaw ? parseFloat(zipfRaw) : NaN;
    const partOfSpeech = row["PoS"]?.trim();
    const tag = row["Tag"]?.trim();
    if (!word || isNaN(zipf))
        return;
    for (const level in LEVELS) {
        const [min, max] = LEVELS[level];
        if (zipf >= min && zipf < max) {
            grouped[level].push({ word, zipf, partOfSpeech, tag });
            break;
        }
    }
})
    .on("end", () => {
    fs.writeFileSync("groupedWords.json", JSON.stringify(grouped, null, 2));
    console.log("✅ Grouped words saved to groupedWords.json");
});
