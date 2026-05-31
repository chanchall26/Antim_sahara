"use client";

import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { INDIAN_STATES } from "@/lib/constants";
import { estimateCourtFee } from "@/lib/succession/courtFees";
import { formatINR } from "@/lib/utils";

/** Estimate succession/probate court fees by state (guidance only). */
export function CourtFeeEstimator({ defaultState, defaultValue }: { defaultState?: string; defaultValue?: number }) {
  const [state, setState] = useState(defaultState && INDIAN_STATES.includes(defaultState) ? defaultState : "Maharashtra");
  const [value, setValue] = useState(String(defaultValue ?? 600000));

  const { fee, rule } = useMemo(() => estimateCourtFee(Number(value) || 0, state), [value, state]);

  return (
    <div className="rounded-2xl border border-info/25 bg-info-soft/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-info" />
        <h3 className="text-sm font-semibold">Court-fee estimator</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">State</Label>
          <Select value={state} onChange={(e) => setState(e.target.value)}>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Value of debts / securities (₹)</Label>
          <Input
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between rounded-xl bg-card p-4">
        <div>
          <p className="text-xs text-muted-foreground">Estimated court fee</p>
          <p className="font-serif text-2xl font-bold text-info">{formatINR(fee)}</p>
        </div>
        <Badge variant="info">
          {rule.percent}%{rule.cap ? ` · cap ${formatINR(rule.cap)}` : ""}
        </Badge>
      </div>

      {rule.note && (
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {rule.note} Verify against your state&apos;s amended Court-Fees Act.
        </p>
      )}
    </div>
  );
}
