"use client";

import { useMemo, useState } from "react";
import {
  computePricingSnapshot,
  defaultPricingInputs,
  JUDGE_USAGE_PRESETS,
  PARSE_USAGE_PRESETS,
  type JudgeUsagePresetId,
  type ParseUsagePresetId,
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
        className="rounded-lg border border-[var(--border)] bg-[#0c0d14] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30"
      />
    </label>
  );
}

function Panel({
  letter,
  title,
  subtitle,
  children,
}: {
  letter: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <span className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-[var(--accent)]/20 px-2 text-sm font-bold text-[var(--accent)]">
          {letter}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{subtitle}</p> : null}
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

const STEPS = [
  { k: "A", t: "定价", d: "credits 怎么换美元、扣多少" },
  { k: "B", t: "用量", d: "Parse / Judge 各用多少 token" },
  { k: "C", t: "API 价", d: "Haiku / Sonnet $/MTok" },
  { k: "D", t: "月场景", d: "人数 × 次数 + 固定成本" },
  { k: "→", t: "结果", d: "下面表格 + 右侧摘要" },
];

export function PricingCalculator() {
  const [inputs, setInputs] = useState<PricingInputs>(() => defaultPricingInputs());
  const [parsePreset, setParsePreset] = useState<ParseUsagePresetId | null>("single");
  const [judgePreset, setJudgePreset] = useState<JudgeUsagePresetId | null>("standard");

  const snap = useMemo(() => computePricingSnapshot(inputs), [inputs]);

  const set = <K extends keyof PricingInputs>(key: K, v: PricingInputs[K]) =>
    setInputs((s) => ({ ...s, [key]: v }));

  const scenarioRow = snap.tiers.find((t) => t.productTier === inputs.scenarioProductTier)!;

  const applyParsePreset = (id: ParseUsagePresetId) => {
    const p = PARSE_USAGE_PRESETS.find((x) => x.id === id)!;
    setParsePreset(id);
    setInputs((s) => ({ ...s, parseIn: p.parseIn, parseOut: p.parseOut }));
  };

  const applyJudgePreset = (id: JudgeUsagePresetId) => {
    const p = JUDGE_USAGE_PRESETS.find((x) => x.id === id)!;
    setJudgePreset(id);
    setInputs((s) => ({ ...s, judgeIn: p.judgeIn, judgeOut: p.judgeOut }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">Gamble AI</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">毛利 / 回本计算器</h1>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">
          下面按 <strong className="text-[var(--text)]">A→D</strong>{" "}
          改参数即可。Parse / Judge 的 token 可先选「典型场景」再微调；表格与右侧摘要会跟着变。
        </p>
      </header>

      {/* 流程一览 */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">参数从哪填起</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-stretch md:justify-between md:gap-2">
          {STEPS.map((s, i) => (
            <div key={s.k} className="flex items-start gap-2 md:flex-1 md:min-w-[140px]">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-[var(--text)]">
                {s.k}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{s.t}</p>
                <p className="text-xs text-[var(--muted)]">{s.d}</p>
              </div>
              {i < STEPS.length - 1 ? (
                <span className="hidden self-center px-1 text-[var(--muted)] md:inline">→</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8">
        {/* ——— 主参数列：宽屏在左，窄屏在摘要下方 ——— */}
        <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6">
            <h3 className="text-sm font-semibold text-[var(--text)]">怎么读结果</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li>
                <span className="font-medium text-[var(--text)]">标价收入</span>：credits ÷「多少 credits = 1 USDC」→
                美元列表价（未扣支付手续费）。
              </li>
              <li>
                <span className="font-medium text-[var(--text)]">API 成本</span>：本页填的 token × 对应模型的 $/MTok（与{" "}
                <a
                  className="text-[var(--accent)] underline-offset-2 hover:underline"
                  href="https://docs.anthropic.com/en/about-claude/pricing"
                  target="_blank"
                  rel="noreferrer"
                >
                  Anthropic 定价
                </a>
                对齐）。
              </li>
              <li>
                <span className="font-medium text-[var(--text)]">产品档 → 模型</span>：Tier1 用 Haiku；Tier2 / Tier3 用
                Sonnet（与主站一致）。
              </li>
              <li>
                <span className="font-medium text-[var(--text)]">回本用户</span>：每人每月贡献的（收入−API）毛利，要盖住「月固定成本」至少需要多少人（向上取整）。
              </li>
            </ul>
          </div>

          <Panel letter="A" title="定价与赠送" subtitle="先定「钱怎么换 credits、每局扣多少」；后面所有收入都从这里换算。">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumField
                label="多少 credits = 1 USDC"
                hint="例：100 → 1 credit 列表价 $0.01"
                value={inputs.creditsPerUsdc}
                onChange={(v) => set("creditsPerUsdc", v)}
                min={1}
              />
              <NumField label="注册赠送 credits" value={inputs.signupBonusCredits} onChange={(v) => set("signupBonusCredits", v)} min={0} />
              <NumField label="Tier1 每局扣 credits" value={inputs.tier1Credits} onChange={(v) => set("tier1Credits", v)} min={0} />
              <NumField label="Tier2 每局扣 credits" value={inputs.tier2Credits} onChange={(v) => set("tier2Credits", v)} min={0} />
              <NumField label="Tier3 每局扣 credits" value={inputs.tier3Credits} onChange={(v) => set("tier3Credits", v)} min={0} />
            </div>
            <p className="mt-4 rounded-xl border border-[var(--border)]/60 bg-[#0c0d14]/80 p-3 text-xs leading-relaxed text-[var(--muted)]">
              列表价 1 credit = <strong className="text-[var(--text)]">{fmtUsd(snap.usdPerCredit)}</strong>
              ；注册赠送列表价值 <strong className="text-[var(--text)]">{fmtUsd(snap.signupBonusListUsd)}</strong>
              ；若全用来 Haiku Parse（当前 Parse token），API 成本约{" "}
              <strong className="text-[var(--text)]">{fmtUsd(snap.signupBurnHaikuParseUsd)}</strong>。
            </p>
          </Panel>

          <Panel
            letter="B"
            title="单次调用的 token 用量"
            subtitle="Parse = 读图/读帧并结构化；Judge = 根据规则裁决。下面分两块：先点「典型场景」填大概值，再在数字框里按 Anthropic 用量导出微调。"
          >
            {/* Parse */}
            <div className="rounded-xl border border-[var(--border)] bg-[#0c0d14]/50 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--text)]">Parse（读图 → 结构化）</h3>
                <span className="text-xs text-[var(--muted)]">Tier1 用 Haiku 计价 · 多图/视频 input 会暴涨</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                预设按「一次 API 里塞进多少像素/帧」粗略估算；真实以 vision token 与提示长度为准。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PARSE_USAGE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyParsePreset(p.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors md:text-sm ${
                      parsePreset === p.id
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text)]"
                        : "border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-white/20 hover:text-[var(--text)]"
                    }`}
                  >
                    <span className="font-medium text-[var(--text)]">{p.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted)]">{p.blurb}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <NumField
                  label="Parse · input tokens"
                  hint="手动改会取消预设高亮"
                  value={inputs.parseIn}
                  onChange={(v) => {
                    setParsePreset(null);
                    set("parseIn", v);
                  }}
                  min={0}
                />
                <NumField
                  label="Parse · output tokens"
                  value={inputs.parseOut}
                  onChange={(v) => {
                    setParsePreset(null);
                    set("parseOut", v);
                  }}
                  min={0}
                />
              </div>
            </div>

            {/* Judge */}
            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[#0c0d14]/50 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--text)]">Judge（裁决）</h3>
                <span className="text-xs text-[var(--muted)]">随产品档走 Haiku 或 Sonnet</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                多图结论、视频摘要写进 prompt 时，input 用「重度」更接近现实。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {JUDGE_USAGE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyJudgePreset(p.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors md:text-sm ${
                      judgePreset === p.id
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text)]"
                        : "border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-white/20 hover:text-[var(--text)]"
                    }`}
                  >
                    <span className="font-medium text-[var(--text)]">{p.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted)]">{p.blurb}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <NumField
                  label="Judge · input tokens"
                  value={inputs.judgeIn}
                  onChange={(v) => {
                    setJudgePreset(null);
                    set("judgeIn", v);
                  }}
                  min={0}
                />
                <NumField
                  label="Judge · output tokens"
                  value={inputs.judgeOut}
                  onChange={(v) => {
                    setJudgePreset(null);
                    set("judgeOut", v);
                  }}
                  min={0}
                />
              </div>
            </div>
          </Panel>

          <Panel
            letter="C"
            title="Anthropic API 单价（$/百万 tokens）"
            subtitle="与官方页保持一致；改这里 = 假设全平台模型涨价/降价。"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-[var(--border)]/80 bg-[#0c0d14]/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Haiku（Tier1）</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumField label="Input $/MTok" value={inputs.haikuInPerM} onChange={(v) => set("haikuInPerM", v)} step={0.01} min={0} />
                  <NumField label="Output $/MTok" value={inputs.haikuOutPerM} onChange={(v) => set("haikuOutPerM", v)} step={0.01} min={0} />
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-[var(--border)]/80 bg-[#0c0d14]/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Sonnet（Tier2 / Tier3）</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumField label="Input $/MTok" value={inputs.sonnetInPerM} onChange={(v) => set("sonnetInPerM", v)} step={0.01} min={0} />
                  <NumField
                    label="Output $/MTok"
                    value={inputs.sonnetOutPerM}
                    onChange={(v) => set("sonnetOutPerM", v)}
                    step={0.01}
                    min={0}
                  />
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            letter="D"
            title="月度场景（粗算）"
            subtitle="用「每人每月几次 Parse、几次 Judge」乘人数；产品档决定按 Haiku 还是 Sonnet 算 API 成本。"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumField label="活跃用户数" value={inputs.scenarioUsers} onChange={(v) => set("scenarioUsers", v)} min={0} />
              <NumField label="每人 Parse 次数 / 月" value={inputs.scenarioParsesPerUser} onChange={(v) => set("scenarioParsesPerUser", v)} min={0} />
              <NumField label="每人 Judge 次数 / 月" value={inputs.scenarioJudgesPerUser} onChange={(v) => set("scenarioJudgesPerUser", v)} min={0} />
              <NumField
                label="月固定成本 (USD)"
                hint="与调用量无关：服务器、人工等"
                value={inputs.monthlyFixedUsd}
                onChange={(v) => set("monthlyFixedUsd", v)}
                step={10}
                min={0}
              />
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm font-medium text-[var(--text)]">场景里的产品档</span>
                <span className="text-xs text-[var(--muted)]">决定本场景 API 用 Haiku 还是 Sonnet</span>
                <select
                  value={inputs.scenarioProductTier}
                  onChange={(e) => set("scenarioProductTier", Number(e.target.value) as 1 | 2 | 3)}
                  className="rounded-lg border border-[var(--border)] bg-[#0c0d14] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]/50"
                >
                  <option value={1}>Tier 1（Haiku）</option>
                  <option value={2}>Tier 2（Sonnet）</option>
                  <option value={3}>Tier 3（Sonnet）</option>
                </select>
              </label>
            </div>
          </Panel>

          {/* 宽屏下表格在左栏底部 */}
          <div className="space-y-8 lg:block">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)]">单次调用 · 三档产品对比</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">同一档扣费相同；API 模型随 Tier 变；毛利 =（标价收入 − API）/ 标价。</p>
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
                            <span className={row.parseMarginPct >= 0 ? "text-[var(--good)]" : "text-red-400"}>{fmtPct(row.parseMarginPct)}</span>
                            <MarginBar pct={row.parseMarginPct} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-[var(--muted)]">成本 {fmtUsd(row.judgeCogsUsd)}</div>
                          <div>收入 {fmtUsd(row.judgeRevUsd)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={row.judgeMarginPct >= 0 ? "text-[var(--good)]" : "text-red-400"}>{fmtPct(row.judgeMarginPct)}</span>
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
                产品档 {inputs.scenarioProductTier}（{scenarioRow.apiTier}），{inputs.scenarioUsers} 用户 ×（{inputs.scenarioParsesPerUser}{" "}
                Parse + {inputs.scenarioJudgesPerUser} Judge）/ 人·月
              </p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)]/80 bg-[#0c0d14]/40 p-4">
                  <dt className="text-xs text-[var(--muted)]">总 Parse / Judge 次数</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {snap.scenario.totalParses} / {snap.scenario.totalJudges}
                  </dd>
                </div>
                <div className="rounded-xl border border-[var(--border)]/80 bg-[#0c0d14]/40 p-4">
                  <dt className="text-xs text-[var(--muted)]">标价总收入</dt>
                  <dd className="mt-1 text-lg font-semibold text-[var(--good)]">{fmtUsd(snap.scenario.totalListRevUsd)}</dd>
                </div>
                <div className="rounded-xl border border-[var(--border)]/80 bg-[#0c0d14]/40 p-4">
                  <dt className="text-xs text-[var(--muted)]">API 总成本</dt>
                  <dd className="mt-1 text-lg font-semibold text-red-300">{fmtUsd(snap.scenario.totalCogsUsd)}</dd>
                </div>
                <div className="rounded-xl border border-[var(--border)]/80 bg-[#0c0d14]/40 p-4">
                  <dt className="text-xs text-[var(--muted)]">贡献毛利</dt>
                  <dd
                    className={`mt-1 text-lg font-semibold ${snap.scenario.contributionUsd >= 0 ? "text-[var(--good)]" : "text-red-400"}`}
                  >
                    {fmtUsd(snap.scenario.contributionUsd)}
                  </dd>
                </div>
                <div className="rounded-xl border border-[var(--border)]/80 bg-[#0c0d14]/40 p-4">
                  <dt className="text-xs text-[var(--muted)]">扣固定费后利润</dt>
                  <dd
                    className={`mt-1 text-lg font-semibold ${snap.scenario.profitAfterFixedUsd >= 0 ? "text-[var(--good)]" : "text-red-400"}`}
                  >
                    {fmtUsd(snap.scenario.profitAfterFixedUsd)}
                  </dd>
                </div>
                <div className="rounded-xl border border-[var(--border)]/80 bg-[#0c0d14]/40 p-4">
                  <dt className="text-xs text-[var(--muted)]">回本用户数</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {snap.scenario.breakEvenUsers === null
                      ? "无法回本"
                      : snap.scenario.breakEvenUsers === 0
                        ? "无固定成本"
                        : `${snap.scenario.breakEvenUsers} 人`}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* ——— 摘要：窄屏置顶，宽屏右侧 sticky ——— */}
        <aside className="order-1 mb-6 lg:sticky lg:top-6 lg:order-2 lg:mb-0">
          <div className="rounded-2xl border border-[var(--accent)]/25 bg-[var(--surface)] p-5 shadow-[0_0_0_1px_rgba(124,92,255,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">即时摘要</p>
            <p className="mt-1 text-xs text-[var(--muted)]">对应当前「D 场景」产品档：Tier {inputs.scenarioProductTier}（{scenarioRow.apiTier}）</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-2 border-b border-[var(--border)]/50 pb-3">
                <dt className="text-[var(--muted)]">1 credit 列表价</dt>
                <dd className="font-medium tabular-nums text-[var(--text)]">{fmtUsd(snap.usdPerCredit)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-[var(--border)]/50 pb-3">
                <dt className="text-[var(--muted)]">单次 Parse API</dt>
                <dd className="font-medium tabular-nums text-[var(--text)]">{fmtUsd(scenarioRow.parseCogsUsd)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-[var(--border)]/50 pb-3">
                <dt className="text-[var(--muted)]">单次 Judge API</dt>
                <dd className="font-medium tabular-nums text-[var(--text)]">{fmtUsd(scenarioRow.judgeCogsUsd)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-[var(--border)]/50 pb-3">
                <dt className="text-[var(--muted)]">Parse 毛利率</dt>
                <dd className={`font-medium tabular-nums ${scenarioRow.parseMarginPct >= 0 ? "text-[var(--good)]" : "text-red-400"}`}>
                  {fmtPct(scenarioRow.parseMarginPct)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-[var(--border)]/50 pb-3">
                <dt className="text-[var(--muted)]">Judge 毛利率</dt>
                <dd className={`font-medium tabular-nums ${scenarioRow.judgeMarginPct >= 0 ? "text-[var(--good)]" : "text-red-400"}`}>
                  {fmtPct(scenarioRow.judgeMarginPct)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-[var(--border)]/50 pb-3">
                <dt className="text-[var(--muted)]">月贡献毛利</dt>
                <dd className={`font-medium tabular-nums ${snap.scenario.contributionUsd >= 0 ? "text-[var(--good)]" : "text-red-400"}`}>
                  {fmtUsd(snap.scenario.contributionUsd)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--muted)]">回本用户</dt>
                <dd className="max-w-[140px] text-right font-semibold text-[var(--text)]">
                  {snap.scenario.breakEvenUsers === null
                    ? "—"
                    : snap.scenario.breakEvenUsers === 0
                      ? "0"
                      : `${snap.scenario.breakEvenUsers} 人`}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <footer className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-[var(--muted)]">
        独立小工具 · 用量预设为估算 · 以 Anthropic 用量导出与{" "}
        <a className="text-[var(--accent)] underline-offset-2 hover:underline" href="https://docs.anthropic.com/en/about-claude/pricing" target="_blank" rel="noreferrer">
          官方定价
        </a>{" "}
        为准
      </footer>
    </div>
  );
}
