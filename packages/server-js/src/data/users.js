// Mot de passe password123 pour tous, chiffré avec bcryptjs : seul le hash est gardé.
export const users = [
  {
    id: 'u1',
    name: 'Alice',
    email: 'alice@othila.test',
    role: 'ADMIN',
    passwordHash: '$2b$10$MmVBHJQhUnVymwc5tac.VutHl6RMOUC6Sgac8Q/ySbnFPn./o8nfm'
  },
  {
    id: 'u2',
    name: 'Bilal',
    email: 'bilal@othila.test',
    role: 'MEMBER',
    passwordHash: '$2b$10$DvYDlnBmTg4.yVc7i.ylA.jAARK1RYexQ.V3zxIS4ko6MZrKp2wte'
  },
  {
    id: 'u3',
    name: 'Chloé',
    email: 'chloe@othila.test',
    role: 'MEMBER',
    passwordHash: '$2b$10$OhgUnsAfY9Aqvhy3/SzvnOG4btT4AAJDt8t35Ke1Wl6uzDgizw2BC'
  }
];
