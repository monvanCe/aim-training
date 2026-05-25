import { TargetDrawer } from './TargetDrawer.js';

/**
 * Canvas background + target rendering (Single Responsibility).
 */
export class CanvasRenderer {
  #canvas;
  #ctx;
  #drawer;
  #dpr = 1;
  #logicalWidth = 0;
  #logicalHeight = 0;

  constructor(canvas) {
    this.#canvas = canvas;
    this.#ctx = canvas.getContext('2d');
    this.#drawer = new TargetDrawer();
  }

  resize(displayWidth, displayHeight) {
    this.#dpr = window.devicePixelRatio || 1;
    this.#canvas.width = displayWidth * this.#dpr;
    this.#canvas.height = displayHeight * this.#dpr;
    this.#canvas.style.width = `${displayWidth}px`;
    this.#canvas.style.height = `${displayHeight}px`;
    this.#ctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0);
    this.#logicalWidth = displayWidth;
    this.#logicalHeight = displayHeight;
    return { width: displayWidth, height: displayHeight };
  }

  get logicalSize() {
    return {
      width: this.#logicalWidth,
      height: this.#logicalHeight,
    };
  }

  /**
   * @param {{ current: object|null, next: object|null }} targets
   * @param {number} radius
   * @param {{ mouse?: { x: number, y: number } }} [overlay]
   */
  render(targets, radius, overlay) {
    const { width, height } = this.logicalSize;
    const ctx = this.#ctx;

    ctx.clearRect(0, 0, width, height);
    this.#drawGrid(ctx, width, height);

    if (targets.next) {
      this.#drawer.draw(ctx, targets.next, 'next', radius);
    }
    if (targets.current) {
      this.#drawer.draw(ctx, targets.current, 'current', radius);
    }

    if (overlay) {
      this.#drawReplayOverlay(ctx, overlay);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ mouse?: { x: number, y: number } }} overlay
   */
  #drawReplayOverlay(ctx, overlay) {
    const mouse = overlay.mouse;
    if (!mouse) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(250, 250, 250, 0.9)';
    ctx.lineWidth = 1.5;
    const size = 8;
    ctx.beginPath();
    ctx.moveTo(mouse.x - size, mouse.y);
    ctx.lineTo(mouse.x + size, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - size);
    ctx.lineTo(mouse.x, mouse.y + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250, 250, 250, 0.95)';
    ctx.fill();
    ctx.restore();
  }

  clear() {
    const { width, height } = this.logicalSize;
    this.#ctx.clearRect(0, 0, width, height);
    this.#drawGrid(this.#ctx, width, height);
  }

  #drawGrid(ctx, width, height) {
    const step = 40;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  /**
   * @param {number} clientX
   * @param {number} clientY
   */
  toCanvasCoords(clientX, clientY) {
    const rect = this.#canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return { x: 0, y: 0 };
    }
    const x = ((clientX - rect.left) / rect.width) * this.#logicalWidth;
    const y = ((clientY - rect.top) / rect.height) * this.#logicalHeight;
    return {
      x: Math.max(0, Math.min(this.#logicalWidth, x)),
      y: Math.max(0, Math.min(this.#logicalHeight, y)),
    };
  }
}
