import { Event } from './event.js';
import { Mutation } from './mutation.js';
import { Node } from './node.js';
import { Query } from './query.js';
import { SearchResult } from './search.js';
import { Subscription } from './subscription.js';
import { User } from './user.js';

export const resolvers = { Query, Mutation, Subscription, Node, SearchResult, Event, User };
