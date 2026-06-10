"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  changeMemberRoleAction,
  removeProjectMemberAction,
  setProjectMemberAction,
} from "../actions";
import { PROJECT_ROLES, ROLE_LABEL_KEY, type ProjectMember } from "../types";

const inputCls =
  "bg-bg-inset border-line-1 focus:border-line-blue text-text placeholder:text-text-3 h-9 rounded-md border px-3 text-[13px] outline-none";

/** The per-project People panel — PM/superadmin only (the page renders it only for them). */
export function PeoplePanel({
  projectId,
  members,
}: {
  projectId: string;
  members: ProjectMember[];
}) {
  const t = useTranslations("people");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setError(null);
    setFieldErrors({});
    start(async () => {
      const res = await setProjectMemberAction(projectId, {
        email: fd.get("email"),
        role: fd.get("role"),
      });
      if (!res.ok) {
        setError(res.fieldErrors ? null : res.error);
        setFieldErrors(res.fieldErrors ?? {});
      } else {
        form.reset();
      }
    });
  }

  function onChangeRole(userId: string, role: string) {
    setError(null);
    start(async () => {
      const res = await changeMemberRoleAction(projectId, { userId, role });
      if (!res.ok) setError(res.error);
    });
  }

  function onRemove(member: ProjectMember) {
    if (!window.confirm(t("confirmRemove", { name: member.email ?? member.display_name ?? "" })))
      return;
    setError(null);
    start(async () => {
      const res = await removeProjectMemberAction(projectId, member.user_id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6">
      <div className="border-line-1 rounded-xl border">
        <div className="border-line border-b px-4 py-3">
          <h2 className="text-text text-[15px] font-semibold">{t("title")}</h2>
          <p className="text-text-3 text-[12px]">{t("subtitle")}</p>
        </div>

        <ul className="divide-line/60 divide-y">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-text truncate text-[13px] font-medium">
                  {member.display_name ?? member.email}
                </p>
                {member.display_name && member.email && (
                  <p className="text-text-3 truncate text-[11px]">{member.email}</p>
                )}
              </div>
              <div className="flex flex-none items-center gap-1.5">
                <select
                  value={member.role}
                  aria-label={t("roleFor", { name: member.email ?? member.display_name ?? "" })}
                  disabled={pending}
                  onChange={(e) => onChangeRole(member.user_id, e.target.value)}
                  className="border-line-1 bg-bg-inset text-text-1 h-8 rounded-md border px-2 text-[12px] disabled:opacity-60"
                >
                  {PROJECT_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t(ROLE_LABEL_KEY[role])}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onRemove(member)}
                  aria-label={t("removeMember", {
                    name: member.email ?? member.display_name ?? "",
                  })}
                  className="border-line-1 text-text-2 hover:bg-bg-3 hover:text-text h-8 rounded-md border px-2.5 text-[12px] font-medium transition-colors disabled:opacity-60"
                >
                  {t("remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form
          onSubmit={onAdd}
          className="border-line flex flex-wrap items-start gap-2 border-t px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <input
              name="email"
              type="email"
              required
              placeholder={t("emailPlaceholder")}
              aria-label={t("emailLabel")}
              aria-describedby={fieldErrors.email ? "people-email-error" : undefined}
              aria-invalid={fieldErrors.email ? true : undefined}
              className={`${inputCls} w-full`}
            />
            {fieldErrors.email && (
              <p id="people-email-error" role="alert" className="text-red-text mt-1 text-[11px]">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <select
            name="role"
            defaultValue="developer"
            aria-label={t("roleLabel")}
            className={inputCls}
          >
            {PROJECT_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(ROLE_LABEL_KEY[role])}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="bg-blue text-primary-foreground hover:bg-blue-hover h-9 rounded-md px-3.5 text-[13px] font-medium transition-colors disabled:opacity-60"
          >
            {t("add")}
          </button>
        </form>
        {error && (
          <p role="alert" className="text-red-text px-4 pb-3 text-[12px]">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
