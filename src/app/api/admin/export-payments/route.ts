import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await prisma.subscriptionPayment.findMany({
    include: {
      business: { select: { name: true, ownerPhone: true, plan: true } },
      confirmedBy: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "ID",
    "Date",
    "Commerce",
    "Téléphone Patron",
    "Formule",
    "Montant FCFA",
    "Opérateur",
    "Référence / Preuve",
    "Statut",
    "Période Début",
    "Période Fin",
    "Validé Par",
    "Date Confirmation",
  ];

  const escapeCsv = (val: unknown) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = payments.map((p) => [
    p.id,
    p.createdAt.toISOString().replace("T", " ").slice(0, 19),
    p.business.name,
    p.business.ownerPhone,
    p.planId,
    p.amountFcfa,
    p.channel === "orange_money" ? "Orange Money" : "Wave",
    p.reference || p.proof || "",
    p.status,
    p.periodStart.toISOString().slice(0, 10),
    p.periodEnd.toISOString().slice(0, 10),
    p.confirmedBy?.name || p.confirmedBy?.phone || "",
    p.confirmedAt ? p.confirmedAt.toISOString().replace("T", " ").slice(0, 19) : "",
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.map(escapeCsv).join(";"))].join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="assistant-bi-paiements-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
