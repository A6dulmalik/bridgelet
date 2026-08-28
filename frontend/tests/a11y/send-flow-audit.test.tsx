import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { runAxe, summarizeViolations } from './axe';
import { SendPageClient } from '@/components/send-page-client';
import { BatchSendForm } from '@/components/batch-send-form';

/**
 * WCAG 2.1 AA automated audit for the send flow (Issue #465).
 *
 * Runs axe-core against the renderable send-flow components in jsdom.
 * This is an *informational* audit: findings should be filed as separate
 * follow-up issues rather than silently fixed here.
 */

describe('WCAG 2.1 AA audit — send flow', () => {
  it('reports zero critical/serious violations on the send mode toggle wrapper', async () => {
    const { container } = render(<SendPageClient />);

    const results = await runAxe(container);

    // Do not hard-fail the build: coverage is informational until the
    // audit is formalized. Log violations for triage.
    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    const summary = summarizeViolations(results);
    // eslint-disable-next-line no-console
    console.log(`[send-flow audit]\n${summary}`);

    expect(results.violations).toEqual([]);
    expect(criticalOrSerious).toEqual([]);
  });

  it('checks labels and form semantics on the batch send form', async () => {
    const { container } = render(<BatchSendForm />);

    const results = await runAxe(container);
    const labelIssues = results.violations.filter(
      (v) => v.id === 'label' || v.id === 'button-name' || v.id === 'select-name',
    );

    // eslint-disable-next-line no-console
    console.log(`[batch-send audit]\n${summarizeViolations(results)}`);

    expect(labelIssues).toEqual([]);
  });
});
