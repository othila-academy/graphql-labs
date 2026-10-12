import { Event } from './event.js';
import { Mutation } from './mutation.js';
import { Node } from './node.js';
import { Query } from './query.js';
import { SearchResult } from './search.js';
import { User } from './user.js';

export const resolvers = { Query, Mutation, Node, SearchResult, Event, User };
