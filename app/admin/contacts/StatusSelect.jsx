'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updateContactStatus } from '../actions';
import { CONTACT_STATUSES } from '../constants';

const LABELS = {
  new_lead: 'New lead',
  contacted: 'Contacted',
  discovery_call: 'Discovery call',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

// A per-inquiry stage picker. Changing the select submits immediately and
// writes an activity_log row server-side.
export default function StatusSelect({ contactId, status }) {
  const [state, formAction, pending] = useActionState(updateContactStatus, {
    ok: false,
    error: null,
  });
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.error) {
      // Keep the UI honest if the server rejected the change.
      // eslint-disable-next-line no-alert
      alert(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="status-select-form">
      <input type="hidden" name="contact_id" value={contactId} />
      <select
        name="to_status"
        defaultValue={status}
        disabled={pending}
        aria-label="Move to stage"
        onChange={(e) => {
          if (e.target.value !== status) formRef.current?.requestSubmit();
        }}
        className="status-select"
      >
        {CONTACT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
