import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

const ME = gql`
  query Me {
    me {
      id
      name
    }
  }
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [login, { loading, error }] = useMutation(LOGIN);
  const me = useQuery(ME, { skip: !token });

  async function submit(event) {
    event.preventDefault();
    const { data } = await login({ variables: { email, password } });
    localStorage.setItem('token', data.login.token);
    setToken(data.login.token);
  }

  if (me.data?.me) return <p>Connecté : {me.data.me.name}</p>;
  return (
    <form onSubmit={submit}>
      <label>
        E-mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Mot de passe
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button type="submit" disabled={loading}>
        Se connecter
      </button>
      {error && <p>Erreur : {error.message}</p>}
    </form>
  );
}
