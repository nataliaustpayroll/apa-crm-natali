// Shared admin constants. Kept out of actions.js because a "use server" file
// may only export async functions.

export const CONTACT_STATUSES = [
  'new_lead',
  'contacted',
  'discovery_call',
  'proposal',
  'won',
  'lost',
];

export const ORDER_STATUSES = ['pending', 'paid', 'refunded', 'cancelled'];
