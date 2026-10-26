"use client";

import { useState } from "react";
import { RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import {
  useSettings,
  useSaveSettings,
  useResetSetting,
  type Setting,
} from "@/lib/queries";
import { getApiError } from "@/lib/errors";
import { PageHeader } from "@/components/page-header";
import { ErrorBanner } from "@/components/error-banner";
import { Skeleton } from "@/components/skeleton";
import { RoleGuard } from "@/components/role-guard";
import { Role } from "@/lib/constants";

function SettingRow({
  setting,
  draft,
  onChange,
  onReset,
}: {
  setting: Setting;
  draft: string | undefined;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const value = draft ?? setting.value;
  const dirty = draft !== undefined && draft !== setting.value;

  const num = Number(value);
  const outOfRange =
    (setting.minValue !== null && num < setting.minValue) ||
    (setting.maxValue !== null && num > setting.maxValue);

  return (
    <div className="flex items-start gap-6 px-6 py-4 transition-colors hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-medium">{setting.label}</p>
          {dirty && (
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
              e ndryshuar
            </span>
          )}
        </div>
        {setting.description && (
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            {setting.description}
          </p>
        )}
        <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
          {setting.key}
          {setting.minValue !== null &&
            ` · ${setting.minValue}–${setting.maxValue}`}
        </p>
      </div>

         <div className="flex shrink-0 items-center gap-1.5">
        <input
          type={setting.valueType === "Text" ? "text" : "number"}
          value={value}
          min={setting.minValue ?? undefined}
          max={setting.maxValue ?? undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`no-spinner h-9 w-24 rounded-md border bg-background px-3 text-right font-mono text-[13px] tabular-nums transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
            outOfRange
              ? "border-[var(--status-warning)]"
              : dirty
                ? "border-primary"
                : ""
          }`}
        />

        <span className="w-9 shrink-0 font-mono text-[11px] text-muted-foreground">
          {setting.unit ?? ""}
        </span>

        <button
          onClick={onReset}
          disabled={!setting.isModified && !dirty}
          title={`Rikthe te ${setting.defaultValue}`}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-25"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const save = useSaveSettings();
  const reset = useResetSetting();

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const all = data?.flatMap((g) => g.settings) ?? [];
  const changed = Object.entries(draft).filter(([k, v]) => {
    const original = all.find((s) => s.key === k);
    return original && original.value !== v;
  });

  function submit() {
    setError(null);
    setSaved(false);
    save.mutate(Object.fromEntries(changed), {
      onSuccess: () => {
        setDraft({});
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      },
      onError: (e) => setError(getApiError(e, "Ruajtja dështoi.")),
    });
  }

  return (
    <RoleGuard roles={[Role.Admin, Role.FleetManager]}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Cilësimet">
          {saved && (
            <span className="text-[13px] text-[var(--status-clear)]">
              U ruajtën
            </span>
          )}
          {changed.length > 0 && (
            <>
              <button
                onClick={() => setDraft({})}
                className="cursor-pointer px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Anulo
              </button>
              <button
                onClick={submit}
                disabled={save.isPending}
                className="flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" strokeWidth={2} />
                {save.isPending
                  ? "Duke ruajtur..."
                  : `Ruaj ${changed.length} ndryshime`}
              </button>
            </>
          )}
        </PageHeader>

        <div className="flex items-start gap-3 rounded-lg border bg-card px-6 py-4">
          <SlidersHorizontal
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Këto vlera ndikojnë menjëherë te alarmet dhe kontrollet e sigurisë,
            pa pasur nevojë për rinisje. Çdo ndryshim regjistrohet te regjistri i
            auditimit.
          </p>
        </div>

        <ErrorBanner message={error} />

        {isLoading && <Skeleton className="h-96 w-full" />}

        {data?.map((group) => (
          <section
            key={group.category}
            className="overflow-hidden rounded-lg border bg-card"
          >
            <div className="border-b bg-muted/40 px-6 py-3">
              <h2 className="font-heading text-sm font-semibold">
                {group.category}
              </h2>
            </div>
            <div className="divide-y">
              {group.settings.map((s) => (
                <SettingRow
                  key={s.key}
                  setting={s}
                  draft={draft[s.key]}
                  onChange={(v) => setDraft((p) => ({ ...p, [s.key]: v }))}
                  onReset={() => {
                    setDraft((p) => {
                      const next = { ...p };
                      delete next[s.key];
                      return next;
                    });
                    if (s.isModified) reset.mutate(s.key);
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </RoleGuard>
  );
}