export default function CgvPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Conditions générales de vente</h1>
      <p className="text-muted">Essai 7 jours · Micro 1 500 F · Standard 3 000 F · Pro 6 000 F / mois.</p>
      <h2 className="text-xl font-bold pt-4">Paiement</h2>
      <p>
        Wave ou Orange Money manuel. Le plan s’active seulement après confirmation par l’équipe
        Assistant Bi.
      </p>
      <h2 className="text-xl font-bold pt-4">Essai</h2>
      <p>La date de fin est calculée côté serveur, pas sur le téléphone.</p>
      <p className="text-muted text-sm pt-6">Référence : docs/legal/cgv.md</p>
    </>
  );
}
