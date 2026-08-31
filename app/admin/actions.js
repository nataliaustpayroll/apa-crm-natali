'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { CONTACT_STATUSES, ORDER_STATUSES } from './constants';

// Who is performing the action — recorded as activity_log.actor.
async function actorEmail() {
  try {
    const auth = await supabaseServer();
    const {
      data: { user },
    } = await auth.auth.getUser();
    return user?.email || 'admin';
  } catch {
    return 'admin';
  }
}

// Move a Contacts row to a new stage and record it in activity_log.
export async function updateContactStatus(_prevState, formData) {
  const contactId = String(formData.get('contact_id') || '');
  const toStatus = String(formData.get('to_status') || '');
  const note = String(formData.get('note') || '').trim();

  if (!contactId) return { ok: false, error: 'Missing inquiry id.' };
  if (!CONTACT_STATUSES.includes(toStatus))
    return { ok: false, error: 'Invalid status.' };

  const supabase = supabaseAdmin();

  try {
    const { data: current, error: readErr } = await supabase
      .from('contacts')
      .select('id, status, person_id')
      .eq('id', contactId)
      .single();
    if (readErr) throw readErr;

    // No-op if the stage didn't change — don't write a noise row.
    if (current.status === toStatus) {
      return { ok: true, error: null, unchanged: true };
    }

    const { error: updErr } = await supabase
      .from('contacts')
      .update({ status: toStatus })
      .eq('id', contactId);
    if (updErr) throw updErr;

    const { error: logErr } = await supabase.from('activity_log').insert({
      contact_id: contactId,
      person_id: current.person_id,
      from_status: current.status,
      to_status: toStatus,
      actor: await actorEmail(),
      note: note || null,
    });
    if (logErr) throw logErr;

    revalidatePath('/admin');
    revalidatePath('/admin/contacts');
    revalidatePath(`/admin/people/${current.person_id}`);
    return { ok: true, error: null };
  } catch (err) {
    console.error('updateContactStatus failed:', err);
    return { ok: false, error: 'Could not update the inquiry.' };
  }
}

// Add an order against a person.
export async function addOrder(_prevState, formData) {
  const personId = String(formData.get('person_id') || '');
  const productName = String(formData.get('product_name') || '').trim();
  const amountRaw = String(formData.get('amount') || '').trim();
  const currency = (String(formData.get('currency') || 'AUD').trim() || 'AUD').toUpperCase();
  const status = String(formData.get('status') || 'pending');

  if (!personId) return { ok: false, error: 'Missing person.' };
  if (!productName) return { ok: false, error: 'Enter a product or service name.' };
  if (!ORDER_STATUSES.includes(status))
    return { ok: false, error: 'Invalid order status.' };

  const amount = Number(amountRaw || '0');
  if (Number.isNaN(amount) || amount < 0)
    return { ok: false, error: 'Enter a valid amount.' };
  const amountCents = Math.round(amount * 100);

  const supabase = supabaseAdmin();
  try {
    const { error } = await supabase.from('orders').insert({
      person_id: personId,
      product_name: productName,
      amount_cents: amountCents,
      currency,
      status,
    });
    if (error) throw error;

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/people/${personId}`);
    return { ok: true, error: null };
  } catch (err) {
    console.error('addOrder failed:', err);
    return { ok: false, error: 'Could not add the order.' };
  }
}

// Add or remove a person from the newsletter (ok_to_contact).
export async function setOkToContact(_prevState, formData) {
  const personId = String(formData.get('person_id') || '');
  const value = String(formData.get('value') || '') === 'true';
  if (!personId) return { ok: false, error: 'Missing person.' };

  const supabase = supabaseAdmin();
  try {
    const { error } = await supabase
      .from('people')
      .update({ ok_to_contact: value })
      .eq('id', personId);
    if (error) throw error;

    revalidatePath('/admin/newsletter');
    revalidatePath(`/admin/people/${personId}`);
    return { ok: true, error: null };
  } catch (err) {
    console.error('setOkToContact failed:', err);
    return { ok: false, error: 'Could not update the newsletter list.' };
  }
}
