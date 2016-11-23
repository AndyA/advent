$(function() {
  console.log("Let's go!");

  var bgImageURL = "i/background.jpg";
  var bgImage = null;
  var snowStorm = null;

  var images = {
    background: "i/background.jpg",
    redball: "i/red-ball.png",
    greenball: "i/green-ball.png",
  };

  var imageStore = {};

  function randomParticles(nodeCount, edgeCount) {
    var nodes = {};
    var edges = [];

    for (var n = 0; n < nodeCount; n++) {
      var name = "day" + (n + 1);
      nodes[name] = {
        icon: Math.random() > 0.5 ? "redball" : "greenball",
        r: 10 + Math.random() * 20
      };
    }

    for (var e = 0; e < edgeCount; e++) {
      var nd1 = Math.floor(Math.random() * nodeCount);
      var nd2 = Math.floor(Math.random() * nodeCount);
      if (nd1 == nd2) continue;
      var nm1 = "day" + (nd1 + 1);
      var nm2 = "day" + (nd2 + 1);
      edges.push({
        link: [nm1, nm2],
        length: Math.random() * 10 + 10
      });
    }

    return {
      nodes: nodes,
      edges: edges
    };
  }

  function initParticles(ps, data) {
    $.each(data.nodes, function(name, d) {
      ps.addNode(name, d);
    });
    $.each(data.edges, function(idx, d) {
      ps.addEdge(d.link[0], d.link[1], d);
    });
  }

  function SnowStorm(options) {
    this.opt = options;
    this.flakes = [];
    this.setDrift(0);
  }

  $.extend(SnowStorm.prototype, {
    setDrift: function(n) {
      this.drift = n;
    },

    makeFlake: function() {
      return {
        x: Math.random(),
        y: 0,
        v: (1 + Math.random()) / 200,
        r: Math.random() * Math.random() * 4 + 2
      };
    },

    update: function() {
      var flakes = [];

      for (var i = 0; i < this.flakes.length; i++) {
        var flake = this.flakes[i];
        flake.y += flake.v;
        if (flake.y >= 1.0) continue;
        flake.x += this.drift / 100;
        if (flake.x < 0) flake.x += 1.0;
        if (flake.x > 1.0) flake.x -= 1.0;
        flake.v *= this.opt.gravity;
        flakes.push(flake);
      }

      var need = Math.min(this.opt.birthRate, this.opt.flakes -
        flakes.length);
      for (var i = 0; i < need; i++) {
        flakes.push(this.makeFlake());
      }

      this.flakes = flakes;
    },

    redraw: function(ctx) {
      this.update();

      var flakes = this.flakes;
      var cw = ctx.canvas.width;
      var ch = ctx.canvas.height;

      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      for (var i = 0; i < flakes.length; i++) {
        var flake = flakes[i];
        ctx.beginPath();
        ctx.arc(flake.x * cw, flake.y * ch, flake.r, 0, 2 * Math.PI,
          false);
        ctx.fill();
      }


      ctx.restore();
    }
  });

  function fillBox(ctx, img) {
    var cw = ctx.canvas.width;
    var ch = ctx.canvas.height;
    var iw = img.width;
    var ih = img.height;

    if (cw / ch < iw / ih) {
      var sc = ch / ih;
      ctx.drawImage(img, (iw - cw / sc) / 2, 0, cw / sc, ih, 0, 0, cw, ch);
    } else {
      var sc = cw / iw;
      ctx.drawImage(img, 0, (ih - ch / sc) / 2, iw, ch / sc, 0, 0, cw, ch);
    }

  }

  var Renderer = function(canvas, click) {
    var textShadow = false;
    var ctx = canvas.getContext("2d");
    var ps;

    var that = {
      init: function(system) {
        ps = system;
        ps.screenSize(canvas.width, canvas.height);
        ps.screenPadding(80);
        that.initMouseHandling();
      },

      redraw: function() {
        ctx.save();


        if (0) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          if (imageStore.background) {
            fillBox(ctx, imageStore.background);
          } else {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          snowStorm.redraw(ctx);
        }

        ps.eachEdge(function(edge, pt1, pt2) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        })

        ps.eachNode(function(node, pt) {
          var img = imageStore[node.data.icon];
          if (!img) return;
          var nw = node.data.r;
          ctx.drawImage(img, pt.x - nw, pt.y - nw, nw * 2, nw * 2);
        })

        ctx.restore();
      },

      initMouseHandling: function() {
        $(canvas)
          .click(function(e) {
            var pos = $(this)
              .offset();
            var mp = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);
            var hit = ps.nearest(mp);
            if (hit) click(hit);
          });
      },

    }
    return that
  }

  function resize(cvs, ps) {
    cvs.width = $(window)
      .width();
    cvs.height = $(window)
      .height();
    ps.screenSize(cvs.width, cvs.height);
  }

  $("#advent")
    .each(function() {
      var cvs = this;

      snowStorm = new SnowStorm({
        flakes: 1000,
        gravity: 1.01,
        birthRate: 6
      });

      $.each(images, function(tag, url) {
        var img = $("<img>")
          .attr({
            src: url
          })
          .load(function() {
            imageStore[tag] = img[0];
          });
      });

      var ps = arbor.ParticleSystem(1000, 400, 1);
      ps.parameters({
        gravity: true
      });
      ps.renderer = Renderer(cvs, function(hit) {
        console.log("hit: ", hit);
      });

      $(window)
        .mousemove(function(ev) {
          var xp = (ev.pageX / cvs.width) - 0.5;
          snowStorm.setDrift(xp);
        })
        .resize(function() {
          resize(cvs, ps);
        });

      resize(cvs, ps);

      var data = randomParticles(24, 30);
      console.log("data: ", data);
      initParticles(ps, data);
      ps.fps(25);

    });
});
