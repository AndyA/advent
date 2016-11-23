$(function() {

  var bgImageURL = "i/background.jpg";
  var bgImage = null;
  var snowStorm = null;
  var offScreenCanvas = null;

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
        r: 20 + Math.random() * 30
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

  function scaleVector(dx, dy, len) {
    var curLen = Math.sqrt(dx * dx + dy * dy);
    return {
      dx: dx * len / curLen,
      dy: dy * len / curLen
    };
  }

  var Renderer = function(canvas, click) {
    var ctx = canvas.getContext("2d");
    var ps;

    var that = {
      init: function(system) {
        ps = system;
        ps.screenSize(canvas.width, canvas.height);
        ps.screenPadding(80);
        that.initMouseHandling();
      },

      drawOverlay: function(ctx) {
        ctx.save();
        snowStorm.redraw(ctx);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);

        ps.eachEdge(function(edge, pt1, pt2) {

          var dx = pt2.x - pt1.x;
          var dy = pt2.y - pt1.y;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        })

        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;

        ps.eachNode(function(node, pt) {
          var nw = node.data.r;

          // Outer circle
          ctx.beginPath();
          ctx.moveTo(pt.x + nw, pt.y);
          ctx.arc(pt.x, pt.y, nw, 0, 2 * Math.PI);
          ctx.save();
          ctx.globalCompositeOperation = "destination-out";
          ctx.fill();
          ctx.restore();
          ctx.stroke();

          // Inner circle
          ctx.save();
          var rr = nw * 2 / 3;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(pt.x + rr, pt.y);
          ctx.arc(pt.x, pt.y, rr, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.restore();
        });

        ctx.restore();
      },

      redraw: function() {
        ctx.save();

        if (imageStore.background) {
          fillBox(ctx, imageStore.background);
        } else {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        var octx = offScreenCanvas.getContext("2d");
        octx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
        that.drawOverlay(octx);
        ctx.drawImage(offScreenCanvas, 0, 0);

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

    // Create offscreen canvas
    offScreenCanvas = document.createElement("canvas");
    offScreenCanvas.width = cvs.width;
    offScreenCanvas.height = cvs.height;
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
