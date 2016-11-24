$(function() {

  var bgImageURL = "i/background.jpg";
  var bgImage = null;
  var snowStorm = null;
  var snowFlake = null;
  var offScreenCanvas = null;
  var currentDay = 1;
  var activeDay = 1;

  var images = {
    background: "i/background.jpg",
    redball: "i/red-ball.png",
    greenball: "i/green-ball.png",
  };

  var imageStore = {};

  function getQuery() {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    var query = {};
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return query;
  }

  function randomParticles(nodeCount, edgeCount) {
    var nodes = {};
    var edges = [];

    for (var n = 0; n < nodeCount; n++) {
      var name = "day" + (n + 1);
      nodes[name] = {
        day: (n + 1),
        r: 20 + Math.random() * 30
      };
    }

    if (1) {
      for (var n = 0; n < nodeCount - 1; n++) {
        var nm1 = "day" + (n + 1);
        var nm2 = "day" + (n + 2);
        edges.push({
          link: [nm1, nm2],
          length: Math.random() * 10 + 10
        });
      }
    } else {
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

  function rgba(r, g, b, a) {
    return "rgba(" + [].slice.call(arguments).join(", ") + ")";
  }

  var Renderer = function(canvas, click) {
    var ctx = canvas.getContext("2d");
    var ps;

    var that = {
      init: function(system) {
        ps = system;
        ps.screenSize(canvas.width, canvas.height);
        ps.screenPadding(100);
        that.initMouseHandling();
      },

      drawGraph: function(ctx, past) {
        var alphaPast = 1;
        var alphaFuture = 0.4;
        var radiusPast = (canvas.width + canvas.height) / 30;
        var radiusFuture = radiusPast / 3;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);

        ps.eachEdge(function(edge, pt1, pt2) {
          var edgeDay = Math.max(edge.source.data.day, edge.target.data.day);
          var inPast = edgeDay <= activeDay;
          if (past !== inPast) return;

          ctx.strokeStyle = rgba(255, 255, 255, inPast ? alphaPast : alphaFuture);

          var dx = pt2.x - pt1.x;
          var dy = pt2.y - pt1.y;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        })

        ctx.restore();

        ctx.save();
        ctx.lineWidth = 2;

        ps.eachNode(function(node, pt) {
          var age = activeDay - node.data.day;
          var inPast = age >= 0;
          if (past != inPast) return;

          var nw = age >= 0 ? radiusPast / (1 + Math.sqrt(age / 3)) : radiusFuture;
          ctx.strokeStyle = rgba(255, 255, 255, inPast ? alphaPast : alphaFuture);

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
          if (inPast) {
            ctx.save();
            var rr = nw * 2 / 3;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pt.x + rr, pt.y);
            ctx.arc(pt.x, pt.y, rr, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
          }
        });

        ctx.restore();
      },

      drawOverlay: function(ctx) {
        ctx.save();
        snowStorm.redraw(ctx);
        ctx.restore();
      },

      redraw: function() {
        ctx.save();

        if (Math.abs(currentDay - activeDay) < 0.1) {
          activeDay = currentDay;
        } else if (activeDay < currentDay)
          activeDay += 0.1;
        else if (activeDay > currentDay)
          activeDay -= 0.1;

        if (imageStore.background) {
          fillBox(ctx, imageStore.background);
        } else {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        var octx = offScreenCanvas.getContext("2d");
        octx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
        that.drawOverlay(octx);
        that.drawGraph(octx, false);
        that.drawGraph(octx, true);
        ctx.drawImage(offScreenCanvas, 0, 0);
        if (0 && snowFlake) {
          snowFlake.render(ctx);
          snowFlake.spinBy(0.01);
        }

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

  query = getQuery();
  if (query.day !== undefined)
    currentDay = Math.max(1, Math.min(parseInt(query.day), 24));

  $("#date-slider").slider({
    value: currentDay,
    min: 1,
    max: 24,
    slide: function(ev, ui) {
      currentDay = ui.value;
    },
  });

  $("#advent")
    .each(function() {
      var cvs = this;

      snowFlake = new SnowFlake();

      snowStorm = new SnowStorm({
        flakes: 1000,
        gravity: 1.01,
        birthRate: 3
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
