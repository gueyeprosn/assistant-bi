import { prisma } from "../src/lib/db";
import { handleInbound } from "../src/lib/bot/engine";

async function main() {
  const b = await prisma.business.findUnique({ where: { slug: "garage-touba" } });
  if (!b) throw new Error("no garage");
  const r = await handleInbound({
    businessId: b.id,
    customerPhone: "+221779999002",
    text: "Ma voiture a un probleme de demarrage",
  });
  console.log(r.replies.join("\n"));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
