class SnowStorm {
  constructor(options) {
    this.opt = options;
    this.flakes = [];
    this.setDrift(0);
  }

  setDrift(n) {
    this.drift = n;
  }

  makeFlake() {
    return {
      x: Math.random(),
      y: 0,
      v: (1 + Math.random()) / 200,
      r: Math.random() * Math.random() * 2 + 2
    };
  }

  update() {
    const flakes = [];

    for (const flake of this.flakes) {
      flake.y += flake.v / flake.r;
      if (flake.y >= 1.0) continue;
      flake.x += this.drift / 20 / flake.r;
      if (flake.x < 0) flake.x += 1.0;
      if (flake.x > 1.0) flake.x -= 1.0;
      flake.v *= this.opt.gravity;
      flakes.push(flake);
    }

    const need = Math.min(this.opt.birthRate, this.opt.flakes - flakes.length);
    for (let i = 0; i < need; i++) {
      flakes.push(this.makeFlake());
    }

    this.flakes = flakes;
  }

  redraw(ctx) {
    this.update();

    const flakes = this.flakes;
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    for (const flake of flakes) {
      ctx.beginPath();
      ctx.arc(flake.x * cw, flake.y * ch, flake.r, 0, 2 * Math.PI, false);
      ctx.fill();
    }

    ctx.restore();
  }
}
