import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALON_HOURS = JSON.stringify({
  sun: [["10:00", "16:00"]],
  mon: [],
  tue: [["09:00", "19:00"]],
  wed: [["09:00", "19:00"]],
  thu: [["09:00", "19:00"]],
  fri: [["09:00", "19:00"]],
  sat: [["09:00", "19:00"]],
});

const GARAGE_HOURS = JSON.stringify({
  sun: [],
  mon: [["08:00", "18:00"]],
  tue: [["08:00", "18:00"]],
  wed: [["08:00", "18:00"]],
  thu: [["08:00", "18:00"]],
  fri: [["08:00", "18:00"]],
  sat: [["08:00", "18:00"]],
});

const SHOP_HOURS = JSON.stringify({
  sun: [["10:00", "18:00"]],
  mon: [["09:00", "20:00"]],
  tue: [["09:00", "20:00"]],
  wed: [["09:00", "20:00"]],
  thu: [["09:00", "20:00"]],
  fri: [["09:00", "20:00"]],
  sat: [["09:00", "21:00"]],
});

function at(daysFromNow: number, hour: number, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, min, 0, 0);
  return d;
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscriptionEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.impersonationSession.deleteMany();
  await prisma.session.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const pinOwner = await bcrypt.hash("1234", 10);
  const pinAdmin = await bcrypt.hash("0000", 10);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 7);

  const salon = await prisma.business.create({
    data: {
      name: "Salon Awa Braids",
      slug: "salon-awa",
      category: "salon",
      neighborhood: "Médina",
      address: "Rue 6, Médina, Dakar",
      hoursJson: SALON_HOURS,
      greetingFr:
        "Bonjour, ici le salon Awa Braids à la Médina. Je suis Assistant Bi. Je peux vous donner les horaires, les tarifs ou prendre rendez-vous.",
      greetingWo:
        "Asalaam aleekum, salon Awa Braids la, Médina. Man Assistant Bi laa. Mën naa la wax ci waxtu, tarif, walla jëlal rendez-vous.",
      defaultLang: "fr",
      plan: "trial",
      status: "trial",
      trialEndsAt: trialEnds,
      ownerPhone: "+221771111111",
      waveNumber: "77 111 11 11",
      orangeMoneyNumber: "77 111 11 11",
      users: {
        create: {
          phone: "+221771111111",
          pinHash: pinOwner,
          pinAlgo: "bcrypt",
          name: "Awa Diop",
          role: "owner",
        },
      },
      services: {
        create: [
          {
            name: "Tresses collées",
            durationMin: 90,
            priceFcfa: 15000,
            description: "Tresses collées, cheveux naturels",
            keywordsJson: JSON.stringify(["tresse", "collée", "colles", "naturel"]),
            sortOrder: 1,
          },
          {
            name: "Braids longues",
            durationMin: 180,
            priceFcfa: 35000,
            description: "Braids longues avec mèches",
            keywordsJson: JSON.stringify(["braid", "braids", "longue", "mèches", "meches"]),
            sortOrder: 2,
          },
          {
            name: "Locking",
            durationMin: 120,
            priceFcfa: 25000,
            description: "Retwist / locking",
            keywordsJson: JSON.stringify(["lock", "locking", "retwist", "dread"]),
            sortOrder: 3,
          },
          {
            name: "Lissage",
            durationMin: 75,
            priceFcfa: 12000,
            description: "Lissage brésilien express",
            keywordsJson: JSON.stringify(["lissage", "lisser", "brésilien"]),
            sortOrder: 4,
          },
        ],
      },
    },
    include: { services: true, users: true },
  });

  const garage = await prisma.business.create({
    data: {
      name: "Garage Touba Auto",
      slug: "garage-touba",
      category: "garage",
      neighborhood: "Pikine",
      address: "Route des Niayes, Pikine",
      hoursJson: GARAGE_HOURS,
      greetingFr:
        "Bonjour, Garage Touba Auto à Pikine. Assistant Bi à votre service : horaires, tarifs, rendez-vous et devis.",
      greetingWo:
        "Asalaam aleekum, Garage Touba Auto, Pikine. Man Assistant Bi. Waxtu, tarif, rendez-vous, devis — mën naa la dimbali.",
      defaultLang: "fr",
      plan: "standard",
      status: "active",
      ownerPhone: "+221772222222",
      waveNumber: "77 222 22 22",
      orangeMoneyNumber: "77 222 22 22",
      users: {
        create: {
          phone: "+221772222222",
          pinHash: pinOwner,
          pinAlgo: "bcrypt",
          name: "Mamadou Ndiaye",
          role: "owner",
        },
      },
      services: {
        create: [
          {
            name: "Vidange",
            durationMin: 45,
            priceFcfa: 25000,
            description: "Vidange + filtre",
            keywordsJson: JSON.stringify(["vidange", "huile", "filtre"]),
            sortOrder: 1,
          },
          {
            name: "Diagnostic moteur",
            durationMin: 30,
            priceFcfa: 10000,
            description: "Valise diagnostic",
            keywordsJson: JSON.stringify(["diagnostic", "valise", "moteur", "panne"]),
            sortOrder: 2,
          },
          {
            name: "Réparation démarreur",
            durationMin: 120,
            priceFcfa: 45000,
            description: "Démarreur qui ne tourne pas",
            keywordsJson: JSON.stringify(["démarr", "demarr", "starter", "tourner"]),
            sortOrder: 3,
          },
          {
            name: "Pneus (la paire)",
            durationMin: 40,
            priceFcfa: 40000,
            description: "Pose 2 pneus",
            keywordsJson: JSON.stringify(["pneu", "pneus", "roue"]),
            sortOrder: 4,
          },
        ],
      },
    },
    include: { services: true },
  });

  const shop = await prisma.business.create({
    data: {
      name: "Remchou Shop",
      slug: "remchou-shop",
      category: "boutique",
      neighborhood: "Livraison",
      address: "Vente en ligne — livraison à domicile",
      hoursJson: SHOP_HOURS,
      greetingFr:
        "Bonjour, ici Remchou Shop. Je suis Assistant Bi. Maison, beauté et divers : je donne les prix, la dispo et je prépare un devis WhatsApp.",
      greetingWo:
        "Asalaam aleekum, Remchou Shop la. Man Assistant Bi laa. Maison, beauté, divers : prijs, dispo, devis WhatsApp.",
      defaultLang: "fr",
      plan: "standard",
      status: "active",
      ownerPhone: "+221776666666",
      waveNumber: "77 666 66 66",
      orangeMoneyNumber: "77 666 66 66",
      holidayPolicy: "special",
      holidayHoursNote: "Livraison possible les jours fériés, délai +1 jour.",
      confirmationMessage: "Commande notée. On vous confirme la livraison sur WhatsApp.",
      faqJson: JSON.stringify([
        {
          q: "Vous livrez ?",
          r: "Oui, livraison à domicile. Les frais dépendent du quartier. Demandez un devis pour le total articles + livraison.",
        },
        {
          q: "Comment payer ?",
          r: "Wave, Orange Money, ou paiement à la livraison.",
        },
        {
          q: "Je peux échanger ?",
          r: "Échange sous 7 jours si l’article n’a pas été utilisé et que l’emballage est intact.",
        },
      ]),
      users: {
        create: {
          phone: "+221776666666",
          pinHash: pinOwner,
          pinAlgo: "bcrypt",
          name: "Remchou",
          role: "owner",
        },
      },
      services: {
        create: [
          {
            name: "Maison · Set de draps 2 places",
            durationMin: 15,
            priceFcfa: 12500,
            description: "Coton, 2 places",
            keywordsJson: JSON.stringify(["draps", "drap", "lit", "chambre", "maison", "linge"]),
            sortOrder: 1,
          },
          {
            name: "Maison · Coussin décoratif",
            durationMin: 15,
            priceFcfa: 4500,
            description: "Coussin salon",
            keywordsJson: JSON.stringify(["coussin", "déco", "deco", "maison", "salon"]),
            sortOrder: 2,
          },
          {
            name: "Maison · Panier de rangement",
            durationMin: 15,
            priceFcfa: 6000,
            description: "Panier tressé",
            keywordsJson: JSON.stringify(["panier", "rangement", "maison", "organisation"]),
            sortOrder: 3,
          },
          {
            name: "Beauté · Crème hydratante",
            durationMin: 15,
            priceFcfa: 7500,
            description: "Crème visage et corps",
            keywordsJson: JSON.stringify(["crème", "creme", "hydratante", "beauté", "beaute", "soin"]),
            sortOrder: 4,
          },
          {
            name: "Beauté · Huile de coco",
            durationMin: 15,
            priceFcfa: 3500,
            description: "Huile capillaire et corps",
            keywordsJson: JSON.stringify(["huile", "coco", "beauté", "beaute", "cheveux"]),
            sortOrder: 5,
          },
          {
            name: "Beauté · Parfum",
            durationMin: 15,
            priceFcfa: 15000,
            description: "Eau de parfum 50 ml",
            keywordsJson: JSON.stringify(["parfum", "odeur", "beauté", "beaute"]),
            sortOrder: 6,
          },
          {
            name: "Divers · Chargeur USB",
            durationMin: 15,
            priceFcfa: 4000,
            description: "Chargeur téléphone",
            keywordsJson: JSON.stringify(["chargeur", "usb", "téléphone", "telephone", "divers"]),
            sortOrder: 7,
          },
          {
            name: "Divers · Sac cabas",
            durationMin: 15,
            priceFcfa: 5500,
            description: "Sac courses",
            keywordsJson: JSON.stringify(["sac", "cabas", "divers", "courses"]),
            sortOrder: 8,
          },
          {
            name: "Divers · Gourde",
            durationMin: 15,
            priceFcfa: 4500,
            description: "Gourde 750 ml",
            keywordsJson: JSON.stringify(["gourde", "bouteille", "eau", "divers"]),
            sortOrder: 9,
          },
        ],
      },
    },
    include: { services: true },
  });

  await prisma.user.create({
    data: {
      phone: "+221770000000",
      pinHash: pinAdmin,
      pinAlgo: "bcrypt",
      name: "Admin Assistant Bi",
      role: "admin",
    },
  });

  const fatou = await prisma.customer.create({
    data: {
      businessId: salon.id,
      phone: "+221773333333",
      name: "Fatou Sarr",
      language: "fr",
    },
  });
  const aissatou = await prisma.customer.create({
    data: {
      businessId: salon.id,
      phone: "+221774444444",
      name: "Aissatou Ba",
      language: "wo",
    },
  });
  const ibrahima = await prisma.customer.create({
    data: {
      businessId: garage.id,
      phone: "+221775555555",
      name: "Ibrahima Fall",
      language: "fr",
    },
  });
  const aminata = await prisma.customer.create({
    data: {
      businessId: shop.id,
      phone: "+221777777777",
      name: "Aminata Dieng",
      language: "fr",
    },
  });

  const braid = salon.services.find((s) => s.name.includes("Braids"))!;
  const tresse = salon.services.find((s) => s.name.includes("Tresses"))!;
  const diag = garage.services.find((s) => s.name.includes("Diagnostic"))!;
  const start = garage.services.find((s) => s.name.includes("démarreur"))!;

  await prisma.appointment.createMany({
    data: [
      {
        businessId: salon.id,
        customerId: fatou.id,
        serviceId: braid.id,
        startsAt: at(1, 10, 0),
        endsAt: at(1, 13, 0),
        status: "booked",
        notes: "Braids longues",
      },
      {
        businessId: salon.id,
        customerId: aissatou.id,
        serviceId: tresse.id,
        startsAt: at(0, 15, 0),
        endsAt: at(0, 16, 30),
        status: "booked",
        notes: "Tresses collées",
      },
      {
        businessId: garage.id,
        customerId: ibrahima.id,
        serviceId: diag.id,
        startsAt: at(1, 9, 0),
        endsAt: at(1, 9, 30),
        status: "booked",
        notes: "Diagnostic",
      },
    ],
  });

  await prisma.blockedSlot.create({
    data: {
      businessId: salon.id,
      startsAt: at(3, 9, 0),
      endsAt: at(3, 19, 0),
      reason: "Tabaski — salon fermé",
    },
  });

  const conv = await prisma.conversation.create({
    data: {
      businessId: salon.id,
      customerId: fatou.id,
      status: "handoff",
      summary:
        "Fatou demande une coloration en plus des braids — hors fiche tarifaire. Transfert demandé.",
      messages: {
        create: [
          {
            direction: "inbound",
            text: "Bonjour, je veux des braids longues et aussi une coloration",
            language: "fr",
            createdAt: at(0, 9, 12),
          },
          {
            direction: "outbound",
            text: "Les braids longues sont à 35 000 F (3 h). Pour la coloration, je transmets à Awa.",
            language: "fr",
            createdAt: at(0, 9, 13),
          },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      businessId: garage.id,
      customerId: ibrahima.id,
      linesJson: JSON.stringify([
        { name: "Diagnostic moteur", qty: 1, priceFcfa: 10000 },
        { name: "Réparation démarreur", qty: 1, priceFcfa: 45000 },
      ]),
      totalFcfa: 55000,
      status: "sent",
      textBody: `Devis — Garage Touba Auto\nClient : Ibrahima Fall\n———\n• Diagnostic moteur × 1 — 10 000 F\n• Réparation démarreur × 1 — 45 000 F\n———\nTotal : 55 000 F`,
    },
  });

  const draps = shop.services.find((s) => s.name.includes("draps"))!;
  const creme = shop.services.find((s) => s.name.includes("Crème"))!;
  const huile = shop.services.find((s) => s.name.includes("coco"))!;
  await prisma.quote.create({
    data: {
      businessId: shop.id,
      customerId: aminata.id,
      linesJson: JSON.stringify([
        { name: draps.name, qty: 1, priceFcfa: draps.priceFcfa },
        { name: creme.name, qty: 1, priceFcfa: creme.priceFcfa },
        { name: huile.name, qty: 2, priceFcfa: huile.priceFcfa },
      ]),
      totalFcfa: draps.priceFcfa + creme.priceFcfa + huile.priceFcfa * 2,
      status: "sent",
      textBody: `Devis — Remchou Shop\nClient : Aminata Dieng\n———\n• ${draps.name} — 12 500 F\n• ${creme.name} — 7 500 F\n• ${huile.name} × 2 — 7 000 F\n———\nTotal : 27 000 F\nValable 7 jours.`,
    },
  });

  await prisma.subscriptionPayment.create({
    data: {
      businessId: garage.id,
      amountFcfa: 3000,
      channel: "wave",
      proof: "Reçu Wave démo",
      periodStart: new Date(),
      periodEnd: at(30, 0),
      status: "confirmed",
      confirmedAt: new Date(),
    },
  });

  void conv;
  void start;

  console.log("Seed OK");
  console.log("Salon Awa Braids  → +221 77 111 11 11  PIN 1234");
  console.log("Garage Touba Auto → +221 77 222 22 22  PIN 1234");
  console.log("Remchou Shop      → +221 77 666 66 66  PIN 1234");
  console.log("Admin Assistant Bi → +221 77 000 00 00  PIN 0000");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
