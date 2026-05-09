import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getDb, collections } from "../src/lib/firebase/admin";

/**
 * Clears all data from Firestore collections to allow re-scraping.
 * Run with: npx tsx scripts/clear-firestore.ts
 */
async function main() {
  console.log("=== Clearing Firestore data ===\n");

  // Delete all informes (and their subcollections)
  const informesSnap = await collections.informes().get();
  console.log(`Found ${informesSnap.size} informes to delete...`);

  for (const doc of informesSnap.docs) {
    // Delete subcollections first
    const postsSnap = await collections.posts(doc.id).get();
    for (const postDoc of postsSnap.docs) {
      await postDoc.ref.delete();
    }

    const pdfsSnap = await collections.pdfs(doc.id).get();
    for (const pdfDoc of pdfsSnap.docs) {
      await pdfDoc.ref.delete();
    }

    await doc.ref.delete();
    console.log(`  Deleted informe ${doc.data().numero}`);
  }

  // Delete all crasStatus
  const crasSnap = await collections.crasStatus().get();
  console.log(`\nFound ${crasSnap.size} CRAS status entries to delete...`);
  for (const doc of crasSnap.docs) {
    await doc.ref.delete();
  }

  console.log("\n=== Firestore cleared ===");
}

main().catch(console.error);
