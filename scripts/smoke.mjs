// Usage : npm run smoke [-- url] (défaut : http://localhost:4000/graphql)
// Vérifie que le serveur du cours répond à { hello } ; code 0 si oui, 1 sinon.

const url = process.argv[2] ?? 'http://localhost:4000/graphql';

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ hello }' })
  });

  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  if (typeof data?.hello !== 'string' || data.hello === '')
    throw new Error('hello ne rend pas de texte');
  console.log(`smoke ok : ${url} répond « ${data.hello} »`);
} catch (error) {
  console.error(`smoke en échec sur ${url} : ${error.message}`);
  console.error('Le serveur est-il lancé ? npm run start:server-js');
  process.exit(1);
}
