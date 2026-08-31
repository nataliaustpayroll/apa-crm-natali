'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendConfirmationEmail, sendAdminNotification } from '@/lib/email';

const INQUIRY_TYPES = ['consulting', 'membership', 'training', 'general'];
const ORG_SIZES = ['1–50', '51–200', '201–1000', '1000+'];

function clean(v) {
  return typeof v === 'string' ? v.trim() : '';
}

// Server action for the public contact form.
// Upserts one People row (deduped by email) and inserts one linked Contacts row.
export async function submitLead(_prevState, formData) {
  const name = clean(formData.get('name'));
  const email = clean(formData.get('email')).toLowerCase();
  const phone = clean(formData.get('phone'));
  const company = clean(formData.get('company'));
  const role = clean(formData.get('role'));
  const type = clean(formData.get('type'));
  const subject = clean(formData.get('subject'));
  const message = clean(formData.get('message'));
  const okToContact = formData.get('ok_to_contact') === 'on';

  const orgSize = clean(formData.get('org_size'));
  const payrollSystem = clean(formData.get('payroll_system'));
  const timeSystem = clean(formData.get('time_attendance_system'));

  // Validation
  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: 'Please enter a valid email address.' };
  if (!INQUIRY_TYPES.includes(type))
    return { ok: false, error: 'Please choose an inquiry type.' };
  if (orgSize && !ORG_SIZES.includes(orgSize))
    return { ok: false, error: 'Invalid organisation size.' };

  // Custom attributes (only store the ones provided)
  const attributes = {};
  if (orgSize) attributes.org_size = orgSize;
  if (payrollSystem) attributes.payroll_system = payrollSystem;
  if (timeSystem) attributes.time_attendance_system = timeSystem;

  const sourceSite = process.env.NEXT_PUBLIC_SITE_URL || 'marketing_site';
  const supabase = supabaseAdmin();

  try {
    // Dedupe by email: find existing person first.
    const { data: existing, error: findErr } = await supabase
      .from('people')
      .select('id, attributes')
      .eq('email', email)
      .maybeSingle();
    if (findErr) throw findErr;

    let personId;
    if (existing) {
      // Merge new non-empty attributes over the existing set.
      const mergedAttributes = { ...(existing.attributes || {}), ...attributes };
      const patch = { attributes: mergedAttributes };
      if (name) patch.name = name;
      if (phone) patch.phone = phone;
      if (company) patch.company = company;
      if (role) patch.role = role;
      if (okToContact) patch.ok_to_contact = true;

      const { error: updErr } = await supabase
        .from('people')
        .update(patch)
        .eq('id', existing.id);
      if (updErr) throw updErr;
      personId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('people')
        .insert({
          email,
          name,
          phone: phone || null,
          company: company || null,
          role: role || null,
          source_site: sourceSite,
          ok_to_contact: okToContact,
          attributes,
        })
        .select('id')
        .single();
      if (insErr) throw insErr;
      personId = inserted.id;
    }

    // Always create a new inquiry row for this submission.
    const { error: contactErr } = await supabase.from('contacts').insert({
      person_id: personId,
      type,
      subject: subject || null,
      message: message || null,
      source: 'marketing_site',
      status: 'new_lead',
      metadata: {},
    });
    if (contactErr) throw contactErr;

    // Fire the confirmation + notification emails. These must never break the
    // submission, so failures are logged and swallowed.
    const lead = {
      name,
      email,
      phone,
      company,
      role,
      type,
      subject,
      message,
      ok_to_contact: okToContact,
      attributes,
    };
    const results = await Promise.allSettled([
      sendConfirmationEmail(lead),
      sendAdminNotification(lead),
    ]);
    results.forEach((r, i) => {
      const which = i === 0 ? 'confirmation' : 'admin notification';
      if (r.status === 'rejected') {
        console.error(`submitLead: ${which} email threw:`, r.reason);
      } else if (!r.value?.ok) {
        console.error(`submitLead: ${which} email failed:`, r.value?.error);
      }
    });

    return { ok: true, error: null };
  } catch (err) {
    console.error('submitLead failed:', err);
    return {
      ok: false,
      error: 'Something went wrong saving your inquiry. Please try again.',
    };
  }
}
