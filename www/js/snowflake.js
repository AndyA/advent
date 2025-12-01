class SnowFlake {
  constructor(options = {}) {
    this.opt = {
      minLength: 0.05,
      branchiness: 6,
      oneBranch: false,
      ...options
    };

    this.rotate = 0;
    this.scaleAngle = 0;
    this.branches = this.makeBranch(1, 1, 1);

    console.log(this.branches);
  }

  static around(centre, spread, rolloff) {
    const rand = spread * Math.pow(Math.random(), rolloff);
    return Math.random() < 0.5 ? centre + rand : centre - rand;
  }

  spinBy(angle) {
    this.rotate += angle;
    if (this.rotate > 2 * Math.PI) {
      this.rotate -= 2 * Math.PI;
    }
    this.scaleAngle += angle * 4;
    if (this.scaleAngle > 2 * Math.PI) {
      this.scaleAngle -= 2 * Math.PI;
    }
  }

  makeBranch(depth, minLength, maxLength) {
    const length = Math.random() * (maxLength - minLength) + minLength;
    if (length < this.opt.minLength) return;

    const nBranch = Math.floor(
      1 + (Math.random() * this.opt.branchiness) / depth
    );
    const branches = [];

    for (let b = 0; b < nBranch; b++) {
      const br = this.makeBranch(depth + 1, length / 4, length / 1.5);
      if (br) {
        branches.push({ branch: br });
      }
    }

    for (let i = 0; i < branches.length; i++) {
      const br = branches[i];
      const step = length / (branches.length + 1);
      br.pos = SnowFlake.around(step * (i + 1), step / 3, 2);
      br.angle = SnowFlake.around(Math.PI / 4, Math.PI / 6, 1);
    }

    return {
      length,
      branches,
      depth
    };
  }

  renderBranch(ctx, branch) {
    ctx.save();

    ctx.lineWidth = branch.length / 30;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(branch.length, 0);
    ctx.stroke();

    for (const br of branch.branches) {
      ctx.save();
      ctx.translate(br.pos, 0);

      ctx.save();
      ctx.rotate(br.angle);
      this.renderBranch(ctx, br.branch);
      ctx.restore();

      if (!this.opt.oneBranch) {
        ctx.save();
        ctx.rotate(-br.angle);
        this.renderBranch(ctx, br.branch);
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  render(ctx) {
    // Render the snowflake
    ctx.save();
    ctx.lineCap = "round";
    ctx.rotate(this.rotate);
    const scale = 0.95 + 0.1 * Math.sin(this.scaleAngle);
    ctx.scale(scale, scale);
    const rep = this.opt.oneBranch ? 1 : 6;
    for (let i = 0; i < rep; i++) {
      this.renderBranch(ctx, this.branches);
      ctx.rotate(Math.PI / 3);
    }
    ctx.restore();
  }
}
