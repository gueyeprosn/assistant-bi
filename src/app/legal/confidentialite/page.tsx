export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
      <p className="text-muted">Loi sénégalaise n° 2008-12 · CDP. Modèle MVP à faire relire par un juriste.</p>
      <h2 className="text-xl font-bold pt-4">Données</h2>
      <p>
        Téléphones, noms, messages, rendez-vous et paiements d’abonnement. Finalité : faire
        fonctionner la secrétaire WhatsApp. Pas de revente.
      </p>
      <h2 className="text-xl font-bold pt-4">Durées</h2>
      <p>Conversations 12 mois · paiements 5 ans · audit 24 mois · compte résilié 30 jours puis purge.</p>
      <h2 className="text-xl font-bold pt-4">Droits</h2>
      <p>
        Accès, rectification, suppression via l’espace pro ou le support WhatsApp Assistant Bi.
      </p>
      <p className="text-muted text-sm pt-6">Texte de référence : docs/legal/politique-confidentialite.md</p>
    </>
  );
}
