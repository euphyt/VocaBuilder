import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase.ts";
async function migrateZipfField() {
    const snapshot = await getDocs(collection(db, "vocab_words"));
    console.log("Total docs:", snapshot.docs.length);
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const docRef = doc(db, "vocab_words", docSnap.id);
        if (data["Zipf-value"] !== undefined) {
            await updateDoc(docRef, {
                zipf: data["Zipf-value"],
                "Zipf-value": null, // optional: removes old field
            });
            console.log(`Updated: ${docSnap.id}`);
        }
    }
    console.log("Migration complete.");
}
migrateZipfField().catch(console.error);
