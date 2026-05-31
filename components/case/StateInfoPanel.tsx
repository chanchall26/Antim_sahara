"use client";

import { Building2, ExternalLink, Landmark, MapPin, ScrollText } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getStateInfo, type MapPlace } from "@/lib/states/stateInfo";

/** Local court + portal micro-details for the case's home state (Hindi-aware, with maps). */
export function StateInfoPanel({ state }: { state?: string }) {
  const { locale } = useI18n();
  const info = getStateInfo(state);
  if (!info) return null;
  const hi = locale === "hi";

  const stateName = hi ? info.stateHi : info.state;
  const title = hi ? `${stateName} — स्थानीय जानकारी` : `Local information — ${stateName}`;
  const courtsLabel = hi ? "जिला न्यायालय" : "District courts";
  const portalsLabel = hi ? "उपयोगी पोर्टल" : "Useful portals";
  const openMap = hi ? "नक्शे पर खोलें" : "Open in Maps";

  return (
    <div className="card-craft overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2.5 border-b border-border bg-info-soft/50 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-soft text-info">
          <Landmark className="h-5 w-5" />
        </span>
        <h3 className="text-sm font-semibold leading-tight">{title}</h3>
      </div>

      <div className="space-y-4 p-4">
        {/* High Court */}
        <div>
          <p className="tracked-label mb-2 text-muted-foreground">{hi ? info.highCourt.nameHi : info.highCourt.name}</p>
          <MapRow place={info.highCourt.seat} hi={hi} openMap={openMap} primary />
          <div className="mt-2 space-y-2">
            {info.highCourt.benches.map((b) => (
              <MapRow key={b.label} place={b} hi={hi} openMap={openMap} />
            ))}
          </div>
        </div>

        {/* District courts */}
        <div>
          <p className="tracked-label mb-2 flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {courtsLabel}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {info.districtCourts.map((c) => (
              <a
                key={c.label}
                href={c.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground/85 transition-colors hover:bg-muted hover:text-foreground"
              >
                <MapPin className="h-3 w-3 text-info" />
                {(hi ? c.labelHi : c.label).replace(/^(District Court, |जिला न्यायालय, )/, "")}
              </a>
            ))}
          </div>
        </div>

        {/* Portals */}
        <div>
          <p className="tracked-label mb-2 text-muted-foreground">{portalsLabel}</p>
          <div className="space-y-1.5">
            {info.portals.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 rounded-xl border border-border bg-card/60 p-2.5 transition-colors hover:bg-muted"
              >
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-foreground">{hi ? p.labelHi : p.label}</span>
                  <span className="block text-[11px] leading-snug text-muted-foreground">
                    {hi ? p.descHi : p.desc}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 border-t border-border pt-3">
          {info.notes.map((n, i) => (
            <p key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-muted-foreground">
              <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              {hi ? n.hi : n.en}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapRow({
  place,
  hi,
  openMap,
  primary,
}: {
  place: MapPlace;
  hi: boolean;
  openMap: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${
        primary ? "bg-primary-soft/50" : "bg-muted/40"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{hi ? place.labelHi : place.label}</p>
        {(place.address || place.addressHi) && (
          <p className="truncate text-[10.5px] text-muted-foreground">{hi ? place.addressHi : place.address}</p>
        )}
      </div>
      <a
        href={place.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={openMap}
        aria-label={openMap}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-info px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
      >
        <MapPin className="h-3.5 w-3.5" />
        {openMap}
      </a>
    </div>
  );
}
