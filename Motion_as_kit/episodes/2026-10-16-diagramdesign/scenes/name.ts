// 06 NAME: "This is Diagram Design, a free, open-source skill for AI coding agents, with over 49,000 GitHub stars."
// Diagram Design rises in serif; FREE · OPEN SOURCE · MIT as tags; "a skill for AI coding agents" draws as a little
// diagram of its own (SKILL → YOUR AGENT, coral to hairline); the star count races up to 49,421 in mono under it.
import type { Cam } from '@kit/_vo';
import { Dgm, serif, chip, node, edge, mono, CORAL, TEXT, MUTED, clamp, ob, countUp, fmt } from '@ep/dgm';

export default class Name extends Dgm {
  build() {
    this.take('This is Diagram Design', ['Diagram', 'Design,', 'free,', 'open-source', 'skill', 'AI', 'coding', 'agents,', '49,000', 'GitHub', 'stars.']);
    this.frame(0, 0, 1, { from: [-900, 0, 1], to: [0, -700, 1], drift: 0.04 });
  }

  override stage(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    // the skill, as a diagram of itself
    const sk = clamp((t - this.s('skill') + 0.1) / 0.5);
    node(ctx, c, -230, 70, 260, 100, { k: sk, title: 'diagram-design', sub: 'agent skill', tag: 'SKILL', accent: true, glow: 0.4 });
    edge(ctx, c, [[-100, 70], [100, 70]], clamp((t - this.s('ai') + 0.05) / 0.4), { col: CORAL, label: 'INSTALLS INTO' });
    node(ctx, c, 230, 70, 260, 100, { k: clamp((t - this.s('coding')) / 0.5), title: 'your agent', sub: 'claude · codex · copilot', tag: 'HOST' });
  }

  override top(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    serif(ctx, c, 'Diagram Design', 0, -170, 150, t, this.s('diagram') - 0.15, { glow: 'rgba(255,106,69,0.25)' });
    const tags = [['FREE', 'free'], ['OPEN SOURCE', 'opensource'], ['MIT LICENCE', 'opensource']];
    tags.forEach(([lab, key], i) => chip(ctx, c, lab!, -230 + i * 230, -60, { a: clamp((t - this.s(key!) - i * 0.1) / 0.25), scale: 0.85 + 0.15 * ob(clamp((t - this.s(key!) - i * 0.1) / 0.3)), size: 18 }));
    // the stars
    const st = clamp((t - this.s('49000') + 0.1) / 0.2);
    if (st > 0) {
      const v = countUp(49421, t, this.s('49000') - 0.1, 1.1);
      serif(ctx, c, `★ ${fmt(v)}`, 0, 300, 120, t, this.s('49000') - 0.15, { col: CORAL, dur: 0.4 });
      mono(ctx, c, 'GITHUB STARS · CREATED APRIL 2026 · 3.1K FORKS', 0, 350, { a: clamp((t - this.s('github')) / 0.3), align: 'center', size: 17, track: 2, col: MUTED });
    }
    void TEXT;
  }

  override pfx(t: number) { return { zoom: this.punch(t, this.s('49000'), 0.015) }; }
}
