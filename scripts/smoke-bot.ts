import { prisma } from "../src/lib/db";
import { handleInbound } from "../src/lib/bot/engine";

async function main() {
  const b = await prisma.business.findUnique({ where: { slug: "salon-awa" } });
  if (!b) throw new Error("no salon");
  const phone = "+221779999001";
  const msgs = [
    "Bonjour",
    "Combien coutent les braids longues ?",
    "Fan ngeen nekk ?",
    "Je veux un rendez-vous demain a 14h",
    "Je veux parler au patron",
  ];
  for (const text of msgs) {
    const r = await handleInbound({ businessId: b.id, customerPhone: phone, text });
    console.log("\n>", text);
    console.log(r.replies.join("\n"));
    console.log("handoff=", r.handoff);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
