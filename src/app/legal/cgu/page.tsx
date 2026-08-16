export default function CguPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Conditions générales d’utilisation</h1>
      <p className="text-muted">Assistant Bi — secrétaire WhatsApp pour professionnels. Modèle MVP.</p>
      <h2 className="text-xl font-bold pt-4">Compte</h2>
      <p>Numéro WhatsApp + PIN. Un compte = un commerce. Le PIN n’est jamais stocké en clair.</p>
      <h2 className="text-xl font-bold pt-4">WhatsApp</h2>
      <p>
        Le client écrit sur WhatsApp du professionnel. En cas d’information manquante, le bot
        transmet au patron au lieu d’inventer.
      </p>
      <h2 className="text-xl font-bold pt-4">Résiliation</h2>
      <p>Accès coupé tout de suite, données 30 jours, puis suppression hors paiements légaux.</p>
      <p className="text-muted text-sm pt-6">Référence : docs/legal/cgu.md</p>
    </>
  );
}
