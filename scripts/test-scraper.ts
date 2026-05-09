import { scrapeInformesList } from "../src/lib/scraper/mds-scraper";

async function test() {
  console.log("Testing scraper...\n");
  const informes = await scrapeInformesList();
  console.log(`Found ${informes.length} informes\n`);
  informes.slice(0, 10).forEach((inf, i) => {
    console.log(`${i + 1}. ${inf.numero}: ${inf.titulo}`);
    console.log(`   URL: ${inf.url}\n`);
  });
}

test().catch(console.error);
