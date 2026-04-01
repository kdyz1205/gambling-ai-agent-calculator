"use client";

import { useMemo, useState } from "react";
import {
  computePricingSnapshot,
  defaultPricingInputs,
  type PricingInputs,
} from "@/lib/pricing-model";

function fmtUsd(n: number): string {
  return `$${n.toFixed(4)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function NumField({
  label,
  hint,
  value,
  onChange,
  step = 1,
  min,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      {hint ? <span className="text-xs text-[var(--muted)]">{hint}</span> : null}
      <input
        type="number"
        step={step}
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30"
      />
    </label>
  );
}

function Section({
  n,
  title,
  subtitle,
  children,
}: {
  n: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-sm font-semibold text-[var(--accent)]">
          {n}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function MarginBar({ pct }: { pct: number }) {
  const w = Math.max(0, Math.min(100, pct));
  const color = w >= 50 ? "var(--good)" : w >= 20 ? "var(--warn)" : "#f87171";
  return (
    <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

export function PricingCalculator() {
  const [inputs, setInputs] = useState<PricingInputs>(() => defaultPricingInputs());
  const snap = useMemo(() => computePricingSnapshot(inputs), [inputs]);

  const set = <K extends keyof PricingInputs>(key: K, v: PricingInputs[K]) =>
    setInputs((s) => ({ ...s, [key]: v }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">Gamble AI</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">毛利 / 回本计算器</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          按步骤改左边参数，右边会即时算出「单次 Parse / Judge 的毛利」和「一批用户下的总收入、API 成本、贡献毛利、扣固定费后利润、回本用户数」。
        </p>
      </header>

      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6">
        <h3 className="text-sm font-semibold text-[var(--text)]">怎么读结果</h3>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[var(--muted)]">
          <li>
            <strong className="text-[var(--text)]">标价收入</strong>：用户付的 credits 按「多少 credits = 1 USDC」折成美元（列表价，未扣支付手续费）。
          </li>
          <li>
            <strong className="text-[var(--text)]">API 成本</strong>：按你填的 token 用量 × Anthropic $/MTok（Haiku / Sonnet）估算。
          </li>
          <li>
            <strong className="text-[var(--text)]">产品档 → 模型档</strong>：Tier1 用 Haiku；Tier2 / Tier3 用 Sonnet（与主站逻辑一致）。
          </li>
          <li>
            <strong className="text-[var(--text)]">回本用户数</strong>：在「月度场景」里，每个用户贡献的毛利能覆盖「月固定成本」时，至少需要多少活跃用户（向上取整）。
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-6">
        <Section
          n={1}
          title="定价与赠送"
          subtitle="Credits 与美元换算、注册赠送、三档产品各扣多少 credits。"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumField
              label="多少 credits = 1 USDC"
              hint="例：100 表示 1 credit ≈ $0.01 列表价"
              value={inputs.creditsPerUsdc}
              onChange={(v) => set("creditsPerUsdc", v)}
              min={1}
            />
            <NumField
              label="注册赠送 credits"
              value={inputs.signupBonusCredits}
              onChange={(v) => set("signupBonusCredits", v)}
              min={0}
            />
            <NumField label="Tier1 扣 credits" value={inputs.tier1Credits} onChange={(v) => set("tier1Credits", v)} min={0} />
            <NumField label="Tier2 扣 credits" value={inputs.tier2Credits} onChange={(v) => set("tier2Credits", v)} min={0} />
            <NumField label="Tier3 扣 credits" value={inputs.tier3Credits} onChange={(v) => set("tier3Credits", v)} min={0} />
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            列表价 1 credit = <strong className="text-[var(--text)]">{fmtUsd(snap.usdPerCredit)}</strong>
            ；注册赠送列表价值{" "}
            <strong className="text-[var(--text)]">{fmtUsd(snap.signupBonusListUsd)}</strong>
            ；若全用来 Haiku Parse，API 成本约{" "}
            <strong className="text-[var(--text)]">{fmtUsd(snap.signupBurnHaikuParseUsd)}</strong>。
          </p>
        </Section>

        <Section
          n={2}
          title="单次调用的 token 用量"
          subtitle="Parse（截图 → 结构化）与 Judge（裁决）各用多少 input / output tokens；可按实测微调。"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumField label="Parse input tokens" value={inputs.parseIn} onChange={(v) => set("parseIn", v)} min={0} />
            <NumField label="Parse output tokens" value={inputs.parseOut} onChange={(v) => set("parseOut", v)} min={0} />
            <NumField label="Judge input tokens" value={inputs.judgeIn} onChange={(v) => set("judgeIn", v)} min={0} />
            <NumField label="Judge output tokens" value={inputs.judgeOut} onChange={(v) => set("judgeOut", v)} min={0} />
          </div>
        </Section>

        <Section
          n={3}
          title="Anthropic API 单价（$/百万 tokens）"
          subtitle="对照官方定价页更新；Haiku 给 Tier1，Sonnet 给 Tier2/3。"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Haiku</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumField label="Input $/MTok" value={inputs.haikuInPerM} onChange={(v) => set("haikuInPerM", v)} step={0.01} min={0} />
                <NumField label="Output $/MTok" value={inputs.haikuOutPerM} onChange={(v) => set("haikuOutPerM", v)} step={0.01} min={0} />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Sonnet</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumField label="Input $/MTok" value={inputs.sonnetInPerM} onChange={(v) => set("sonnetInPerM", v)} step={0.01} min={0} />
                <NumField label="Output $/MTok" value={inputs.sonnetOutPerM} onChange={(v) => set("sonnetOutPerM", v)} step={0.01} min={0} />
              </div>
            </div>
          </div>
        </Section>

        <Section
          n={4}
          title="月度场景（粗算）"
          subtitle="假设每人每月 Parse / Judge 次数相同，用同一产品档；用于看总量与回本用户数。"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumField label="活跃用户数" value={inputs.scenarioUsers} onChange={(v) => set("scenarioUsers", v)} min={0} />
            <NumField label="每人 Parse 次数 / 月" value={inputs.scenarioParsesPerUser} onChange={(v) => set("scenarioParsesPerUser", v)} min={0} />
            <NumField label="每人 Judge 次数 / 月" value={inputs.scenarioJudgesPerUser} onChange={(v) => set("scenarioJudgesPerUser", v)} min={0} />
            <NumField
              label="月固定成本 (USD)"
              hint="服务器、人工、其他与调用量无关的开支"
              value={inputs.monthlyFixedUsd}
              onChange={(v) => set("monthlyFixedUsd", v)}
              step={10}
              min={0}
            />
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium text-[var(--text)]">场景里的产品档</span>
              <span className="text-xs text-[var(--muted)]">决定用 Haiku 还是 Sonnet 算 API 成本</span>
              <select
                value={inputs.scenarioProductTier}
                onChange={(e) => set("scenarioProductTier", Number(e.target.value) as 1 | 2 | 3)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]/50"
              >
                <option value={1}>Tier 1（Haiku）</option>
                <option value={2}>Tier 2（Sonnet）</option>
                <option value={3}>Tier 3（Sonnet）</option>
              </select>
            </label>
          </div>
        </Section>
      </div>

      <div className="mt-10 space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">单次调用：三档产品对比</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">同一档扣费相同；API 模型随 Tier 变化。</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-white/[0.03] text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">产品档</th>
                  <th className="px-4 py-3">扣 credits</th>
                  <th className="px-4 py-3">API</th>
                  <th className="px-4 py-3">Parse</th>
                  <th className="px-4 py-3">毛利</th>
                  <th className="px-4 py-3">Judge</th>
                  <th className="px-4 py-3">毛利</th>
                </tr>
              </thead>
              <tbody>
                {snap.tiers.map((row) => (
                  <tr key={row.productTier} className="border-b border-[var(--border)]/60 last:border-0">
                    <td className="px-4 py-3 font-medium">Tier {row.productTier}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{row.creditsCharged}</td>
                    <td className="px-4 py-3 capitalize text-[var(--muted)]">{row.apiTier}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-[var(--muted)]">成本 {fmtUsd(row.parseCogsUsd)}</div>
                      <div>收入 {fmtUsd(row.parseRevUsd)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={row.parseMarginPct >= 0 ? "text-[var(--good)]" : "text-red-400"}>
                          {fmtPct(row.parseMarginPct)}
                        </span>
                        <MarginBar pct={row.parseMarginPct} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-[var(--muted)]">成本 {fmtUsd(row.judgeCogsUsd)}</div>
                      <div>收入 {fmtUsd(row.judgeRevUsd)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={row.judgeMarginPct >= 0 ? "text-[var(--good)]" : "text-red-400"}>
                          {fmtPct(row.judgeMarginPct)}
                        </span>
                        <MarginBar pct={row.judgeMarginPct} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--text)]">月度场景汇总</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            产品档 {inputs.scenarioProductTier}（{snap.tiers.find((t) => t.productTier === inputs.scenarioProductTier)?.apiTier}），
            {inputs.scenarioUsers} 用户 ×（{inputs.scenarioParsesPerUser} Parse + {inputs.scenarioJudgesPerUser} Judge）/ 人·月
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)]/80 bg-white/[0.02] p-4">
              <dt className="text-xs text-[var(--muted)]">总 Parse / Judge 次数</dt>
              <dd className="mt-1 text-lg font-semibold">
                {snap.scenario.totalParses} / {snap.scenario.totalJudges}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--border)]/80 bg-white/[0.02] p-4">
              <dt className="text-xs text-[var(--muted)]">标价总收入</dt>
              <dd className="mt-1 text-lg font-semibold text-[var(--good)]">{fmtUsd(snap.scenario.totalListRevUsd)}</dd>
            </div>
            <div className="rounded-xl border border-[var(--border)]/80 bg-white/[0.02] p-4">
              <dt className="text-xs text-[var(--muted)]">API 总成本</dt>
              <dd className="mt-1 text-lg font-semibold text-red-300">{fmtUsd(snap.scenario.totalCogsUsd)}</dd>
            </div>
            <div className="rounded-xl border border-[var(--border)]/80 bg-white/[0.02] p-4">
              <dt className="text-xs text-[var(--muted)]">贡献毛利（收入 − API）</dt>
              <dd
                className={`mt-1 text-lg font-semibold ${snap.scenario.contributionUsd >= 0 ? "text-[var(--good)]" : "text-red-400"}`}
              >
                {fmtUsd(snap.scenario.contributionUsd)}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--border)]/80 bg-white/[0.02] p-4">
              <dt className="text-xs text-[var(--muted)]">扣固定费后利润</dt>
              <dd
                className={`mt-1 text-lg font-semibold ${snap.scenario.profitAfterFixedUsd >= 0 ? "text-[var(--good)]" : "text-red-400"}`}
              >
                {fmtUsd(snap.scenario.profitAfterFixedUsd)}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--border)]/80 bg-white/[0.02] p-4">
              <dt className="text-xs text-[var(--muted)]">回本用户数（覆盖月固定成本）</dt>
              <dd className="mt-1 text-lg font-semibold">
                {snap.scenario.breakEvenUsers === null
                  ? "无法回本（人均毛利 ≤ 0）"
                  : snap.scenario.breakEvenUsers === 0
                    ? "无固定成本"
                    : `${snap.scenario.breakEvenUsers} 人`}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <footer className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-[var(--muted)]">
        独立小工具 · 数字均为估算 · API 价以 Anthropic 官方为准
      </footer>
    </div>
  );
}
