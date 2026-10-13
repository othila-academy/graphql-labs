import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const PAGE_SIZE = 10;

const EVENTS_LIST = gql`
  query EventsList($offset: Int!, $limit: Int!) {
    events(offset: $offset, limit: $limit) {
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
    eventsCount
  }
`;

export default function EventsList() {
  const { data, loading, error, fetchMore } = useQuery(EVENTS_LIST, {
    variables: { offset: 0, limit: PAGE_SIZE }
  });
  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {error.message}</p>;
  return (
    <>
      <ul>
        {data.events.map((event) => (
          <li key={event.id}>
            {event.title} · {event.period.start} · {event.organizer?.name ?? 'organisateur inconnu'}
          </li>
        ))}
      </ul>
      {data.events.length < data.eventsCount && (
        <button onClick={() => fetchMore({ variables: { offset: data.events.length } })}>
          Voir plus
        </button>
      )}
    </>
  );
}
