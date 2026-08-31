'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitLead } from '@/app/actions/submitLead';

const initialState = { ok: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? 'Sending…' : 'Send inquiry'}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(submitLead, initialState);

  if (state.ok) {
    return (
      <div className="notice success" role="status">
        <strong>Thank you — your inquiry has been received.</strong>
        <br />
        A member of the Australian Payroll Association team will be in touch shortly.
      </div>
    );
  }

  return (
    <form action={formAction} noValidate>
      {state.error && (
        <div className="notice error" role="alert">
          {state.error}
        </div>
      )}

      <div className="grid-2">
        <div className="field">
          <label htmlFor="name">
            Name <span className="req">*</span>
          </label>
          <input id="name" name="name" type="text" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">
            Email <span className="req">*</span>
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" autoComplete="organization" />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="role">Role</label>
          <input id="role" name="role" type="text" autoComplete="organization-title" />
        </div>
        <div className="field">
          <label htmlFor="type">
            Inquiry type <span className="req">*</span>
          </label>
          <select id="type" name="type" required defaultValue="">
            <option value="" disabled>
              Choose one…
            </option>
            <option value="consulting">Consulting</option>
            <option value="membership">Membership</option>
            <option value="training">Training</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="subject">Subject</label>
        <input id="subject" name="subject" type="text" />
      </div>

      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="org_size">Organisation size</label>
          <select id="org_size" name="org_size" defaultValue="">
            <option value="">Prefer not to say</option>
            <option value="1–50">1–50</option>
            <option value="51–200">51–200</option>
            <option value="201–1000">201–1000</option>
            <option value="1000+">1000+</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="payroll_system">Payroll system</label>
          <input
            id="payroll_system"
            name="payroll_system"
            type="text"
            placeholder="e.g. MYOB, SAP, ADP"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="time_attendance_system">Time &amp; attendance system</label>
        <input
          id="time_attendance_system"
          name="time_attendance_system"
          type="text"
          placeholder="e.g. Kronos, Deputy"
        />
      </div>

      <div className="checkbox-row">
        <input id="ok_to_contact" name="ok_to_contact" type="checkbox" />
        <label htmlFor="ok_to_contact">
          Keep me informed about Australian Payroll Association news and updates.
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}
