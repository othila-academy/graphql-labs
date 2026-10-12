// La connexion telle que l'attend loginAs de @othila-academy/lab : un jeton, et l'utilisateur.
export const LOGIN = `mutation ($email: String!, $password: String!) {
  login(email: $email, password: $password) { token user { id name role } }
}`;

export const login = (gql, email, password = 'password123') =>
  gql(LOGIN, { variables: { email, password } });
