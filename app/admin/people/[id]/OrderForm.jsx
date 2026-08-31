'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addOrder } from '../../actions';

const initial = { ok: false, error: null };

export default function OrderForm({ personId }) {
  const [state, formAction, pending] = useActionState(addOrder, initial);
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="order-form">
      <input type="hidden" name="person_id" value={personId} />
      {state?.error && (
        <div className="notice error" role="alert">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="notice success" role="status">
          Order added.
        </div>
      )}
      <div className="grid-2">
        <div className="field">
          <label htmlFor="product_name">
            Product / service <span className="req">*</span>
          </label>
          <input id="product_name" name="product_name" type="text" required />
        </div>
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="currency">Currency</label>
          <input id="currency" name="currency" type="text" defaultValue="AUD" maxLength={3} />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue="pending">
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add order'}
      </button>
    </form>
  );
}
