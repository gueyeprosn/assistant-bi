export function ficheCompleteness(b: {
  name: string;
  category: string;
  address: string;
  neighborhood: string;
  hoursJson: string;
  greetingFr: string;
  greetingWo: string;
  serviceCount: number;
}) {
  const checks = [
    Boolean(b.name.trim()),
    Boolean(b.category.trim()),
    Boolean(b.address.trim()),
    Boolean(b.neighborhood.trim()),
    Boolean(b.hoursJson && b.hoursJson !== "{}"),
    b.greetingFr.trim().length >= 20,
    b.greetingWo.trim().length >= 20,
    b.serviceCount >= 1,
  ];
  const done = checks.filter(Boolean).length;
  return {
    done,
    total: checks.length,
    percent: Math.round((done / checks.length) * 100),
  };
}
