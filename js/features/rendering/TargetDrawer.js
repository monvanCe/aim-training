/**
 * Draws current (solid) and next (ghost) targets on canvas (Single Responsibility).
 */
export class TargetDrawer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ x: number, y: number }} target
   * @param {'current' | 'next'} role
   * @param {number} radius
   */
  draw(ctx, target, role, radius) {
    if (!target) return;

    const { x, y } = target;
    const isCurrent = role === 'current';

    if (isCurrent) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius + 12, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius + 14);
      glow.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
      glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (isCurrent) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#67e8f9';
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - radius - 4, y);
      ctx.lineTo(x + radius + 4, y);
      ctx.moveTo(x, y - radius - 4);
      ctx.lineTo(x, y + radius + 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
      ctx.fill();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.fill();
    }

    ctx.restore();
  }
}
