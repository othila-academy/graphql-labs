import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const EVENTS_LIST = gql`
  query EventsList {
    events {
      id
      title
      period {
        start
      }
      organizer {
        id
        name
      }
    }
  }
`;

export default function EventsList() {
  const { data, loading, error } = useQuery(EVENTS_LIST);
  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {error.message}</p>;
  return (
    <ul>
      {data.events.map((event) => (
        <li key={event.id}>
          {event.title} · {event.period.start} · {event.organizer?.name ?? 'organisateur inconnu'}
        </li>
      ))}
    </ul>
  );
}
