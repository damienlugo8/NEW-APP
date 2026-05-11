"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileState } from "./actions";

const initial: ProfileState = {};

type Profile = {
  full_legal_name?: string | null;
  business_name?: string | null;
  phone?: string | null;
  commission_state?: string | null;
  commission_expires_at?: string | null;
  notary_id_number?: string | null;
};

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Input
        name="full_legal_name"
        label="Full legal name"
        defaultValue={profile?.full_legal_name ?? ""}
        error={state.fieldErrors?.full_legal_name}
        className="sm:col-span-2"
      />
      <Input
        name="business_name"
        label="Business name (optional)"
        defaultValue={profile?.business_name ?? ""}
        className="sm:col-span-2"
      />
      <Input
        name="phone"
        label="Phone"
        type="tel"
        defaultValue={profile?.phone ?? ""}
        error={state.fieldErrors?.phone}
      />
      <Input
        name="commission_state"
        label="State"
        maxLength={2}
        defaultValue={profile?.commission_state ?? ""}
        error={state.fieldErrors?.commission_state}
      />
      <Input
        name="notary_id_number"
        label="Notary ID number"
        defaultValue={profile?.notary_id_number ?? ""}
        error={state.fieldErrors?.notary_id_number}
      />
      <Input
        name="commission_expires_at"
        label="Commission expires"
        type="date"
        defaultValue={profile?.commission_expires_at ?? ""}
        error={state.fieldErrors?.commission_expires_at}
      />
      <div className="sm:col-span-2 flex items-center justify-between mt-2">
        <p className="text-sm text-[var(--text-muted)]">
          {state.ok && "Saved."}
          {state.error && <span className="text-[var(--danger)]">{state.error}</span>}
        </p>
        <Button type="submit" loading={pending}>Save changes</Button>
      </div>
    </form>
  );
}
