import jwt from 'jsonwebtoken';
import { users } from '../data/users.js';

// En production, JWT_SECRET vient de l'environnement ; la valeur par défaut ne sert qu'en développement.
const SECRET = process.env.JWT_SECRET ?? 'secret-de-developpement-a-changer-en-production';

export const sign = (user) => jwt.sign({ sub: user.id }, SECRET, { expiresIn: '2h' });

// L'utilisateur que désigne l'en-tête Authorization: Bearer <jeton>, ou null.
export function userFromHeader(header) {
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, SECRET);
    return users.find((user) => user.id === sub) ?? null;
  } catch {
    // jeton expiré, falsifié ou illisible : personne n'est connecté
    return null;
  }
}
