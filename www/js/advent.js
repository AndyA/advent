const adventDate = dt => {
  const mo = dt.getMonth();
  if (mo < 6) return 24;
  if (mo < 11) return 0;
  return Math.min(dt.getDate(), 24);
};

function nth(x) {
  switch (Math.round(x % 20)) {
    default:
      return "th";
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
  }
}

const easer = (from, to, steps, step) => {
  if (step >= steps) return to;
  const inc = Math.pow(to / from, 1 / steps);
  return from * Math.pow(inc, step);
};

const mediaElement = data => {
  const type = data.type || "image";

  if (type === "image")
    return $("<img>").attr({
      src: data.image_url,
      alt: data.title,
      title: data.title
    });

  if (type === "video")
    return $("<video>")
      .attr({ autoplay: true, controls: true, loop: true, width: 300 })
      .append(
        $("<source>").attr({
          src: data.image_url,
          type: "video/mp4"
        })
      );

  throw new Error(`unknown media type ${type}`);
};

const showPopup = data => {
  if (data.url) {
    $("#popup .day-image a, #popup .view-media a, #popup .title a").attr({
      href: data.url
    });
    $("#popup .view-media").show();
  } else {
    $("#popup .day-image a, #popup .view-media a, #popup .title a").removeAttr(
      "href"
    );
    $("#popup .view-media").hide();
  }

  $("#popup .date .day-num").text(data.day + nth(data.day));
  $("#popup .title").html(data.title);
  $("#popup .synopsis .description").text(data.synopsis);

  $("#popup .day-image").empty().append(mediaElement(data));

  $("#popup").show();
};

const hidePopup = () => {
  $("#popup").hide();
};

const getQuery = () => {
  const queryString = window.location.search.substring(1);
  const vars = queryString.split("&");
  const query = {};
  for (const variable of vars) {
    const pair = variable.split("=");
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return query;
};

const fillBox = (ctx, img) => {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const iw = img.width;
  const ih = img.height;

  if (cw / ch < iw / ih) {
    const sc = ch / ih;
    ctx.drawImage(img, (iw - cw / sc) / 2, 0, cw / sc, ih, 0, 0, cw, ch);
  } else {
    const sc = cw / iw;
    ctx.drawImage(img, 0, (ih - ch / sc) / 2, iw, ch / sc, 0, 0, cw, ch);
  }

  // translucent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, cw, ch);
};

const rgba = (r, g, b, a) => {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

$(() => {
  let snowStorm = null;
  let snowFlake = null;
  let offScreenCanvas = null;

  let currentDay = adventDate(new Date());

  let activeDay = -2;

  const imageStore = {};

  let snowStep;
  let snowSteps;
  let snowStartY;
  let snowStartScale;
  let snowEndScale;
  let snowEndX;
  let snowEndY;

  const scaleSnow = (width, height) => {
    snowStartX = width / 2;
    snowStartY = height / 2;
    snowStartScale = Math.min(snowStartX, snowStartY) * 3;
    snowEndScale = (width + height) / 50;
  };

  const Renderer = (canvas, click) => {
    const ctx = canvas.getContext("2d");
    let ps;

    snowStep = 0;
    snowSteps = currentDay * 10 + 20;
    snowEndX = null;
    snowEndY = null;
    scaleSnow(canvas.width, canvas.height);

    const graph = {
      init(system) {
        ps = system;
        ps.screenSize(canvas.width, canvas.height);
        ps.screenPadding(canvas.height / 10, canvas.width / 10);
        this.initMouseHandling();
      },

      drawGraph(ctx, past) {
        const alphaPast = 1;
        const alphaFuture = 0.4;
        const radiusPast = (canvas.width + canvas.height) / 30;
        const radiusFuture = radiusPast / 3;

        ctx.save();
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);

        ps.eachEdge((edge, pt1, pt2) => {
          const edgeDay = Math.max(edge.source.data.day, edge.target.data.day);
          const inPast = edgeDay <= activeDay;
          if (past !== inPast) return;
          const white = rgba(255, 255, 255, inPast ? alphaPast : alphaFuture);
          // const pink = rgba(230, 6, 132, inPast ? alphaPast : alphaFuture);

          ctx.strokeStyle = white;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        });

        ctx.restore();

        ctx.save();
        ctx.lineWidth = 2;

        ps.eachNode((node, pt) => {
          const age = activeDay - node.data.day;
          const inPast = age >= 0;
          if (past != inPast) return;
          const white = rgba(255, 255, 255, inPast ? alphaPast : alphaFuture);

          const isToday = node.data.day == currentDay;

          const nw =
            age >= 0 ? radiusPast / (1 + Math.sqrt(age / 3)) : radiusFuture;
          node.data.radius = nw; // cached for later

          // Outer circle
          ctx.strokeStyle = white;
          ctx.beginPath();
          ctx.moveTo(pt.x + nw, pt.y);
          ctx.arc(pt.x, pt.y, nw, 0, 2 * Math.PI);
          ctx.save();
          ctx.globalCompositeOperation = "destination-out";
          ctx.fill();
          ctx.restore();
          ctx.stroke();

          // Inner circle
          if (age >= 1) {
            ctx.save();
            ctx.strokeStyle = white;
            const rr = (nw * 2) / 3;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pt.x + rr, pt.y);
            ctx.arc(pt.x, pt.y, rr, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
          }

          if (isToday) {
            snowEndX = pt.x;
            snowEndY = pt.y;
          }
        });

        ctx.restore();
      },

      drawOverlay(ctx) {
        ctx.save();
        snowStorm.redraw(ctx);
        ctx.restore();
      },

      redraw() {
        ctx.save();

        if (Math.abs(currentDay - activeDay) < 0.1) {
          activeDay = currentDay;
        } else if (activeDay < currentDay) {
          activeDay += 0.1;
        } else if (activeDay > currentDay) {
          activeDay -= 0.1;
        }

        if (imageStore.background) {
          fillBox(ctx, imageStore.background);
        } else {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const octx = offScreenCanvas.getContext("2d");
        octx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
        graph.drawOverlay(octx);
        if (currentDay > 0) {
          graph.drawGraph(octx, false);
          graph.drawGraph(octx, true);
        }

        ctx.drawImage(offScreenCanvas, 0, 0);

        if (
          currentDay > 0 &&
          snowFlake &&
          activeDay >= 0 &&
          snowEndX !== null
        ) {
          ctx.save();

          const snowX = easer(snowStartX, snowEndX, snowSteps, snowStep);
          const snowY = easer(snowStartY, snowEndY, snowSteps, snowStep);
          const snowScale = easer(
            snowStartScale,
            snowEndScale,
            snowSteps,
            snowStep
          );
          ctx.strokeStyle = rgba(
            255,
            255,
            255,
            easer(0.01, 1, snowSteps, snowStep)
          );

          ctx.translate(snowX, snowY);
          ctx.scale(snowScale, snowScale);
          snowFlake.render(ctx);
          ctx.restore();
          snowFlake.spinBy(0.01);
          snowStep++;
        }

        ctx.restore();
      },

      initMouseHandling() {
        $(canvas)
          .click(e => {
            const pos = $(canvas).offset();
            const mp = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);
            const hit = ps.nearest(mp);
            if (hit) click(hit);
            if (
              hit &&
              hit.distance <= hit.node.data.radius &&
              hit.node.data.day <= activeDay
            ) {
              showPopup(hit.node.data);
            }
          })
          .mousemove(e => {
            const pos = $(canvas).offset();
            const mp = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);
            const hit = ps.nearest(mp);
            if (hit) click(hit);
            if (
              hit &&
              hit.distance <= hit.node.data.radius &&
              hit.node.data.day <= activeDay
            ) {
              $(canvas).addClass("clicky");
            } else {
              $(canvas).removeClass("clicky");
            }
          });
      }
    };
    return graph;
  };

  const resize = (cvs, ps) => {
    cvs.width = $(window).width();
    cvs.height = $(window).height();
    ps.screenSize(cvs.width, cvs.height);
    ps.screenPadding(cvs.height / 10, cvs.width / 10);

    // Create offscreen canvas
    offScreenCanvas = document.createElement("canvas");
    offScreenCanvas.width = cvs.width;
    offScreenCanvas.height = cvs.height;
    scaleSnow(cvs.width, cvs.height);
  };

  const query = getQuery();
  if (query.day !== undefined)
    currentDay = Math.max(1, Math.min(parseInt(query.day), 24));

  $(document).on("keypress", event => {
    if (event.which == 27) hidePopup();
  });

  $("#popup").click(() => {
    hidePopup();
  });

  $("#advent").each(function () {
    const cvs = this;

    snowFlake = new SnowFlake();

    snowStorm = new SnowStorm({
      flakes: 1000,
      gravity: 1.01,
      birthRate: 3
    });

    $(window)
      .mousemove(ev => {
        const xp = ev.pageX / cvs.width - 0.5;
        snowStorm.setDrift(xp);
      })
      .resize(() => {
        resize(cvs, ps);
      });

    const ps = arbor.ParticleSystem(1000, 400, 1);

    resize(cvs, ps);

    ps.parameters({
      gravity: true
    });

    ps.renderer = Renderer(cvs, () => {});

    $.get("data.json")
      .then(data => {
        console.log("Data loaded", data);
        for (let i = 0; i < data.length; i++) {
          const info = data[i];
          info.day = i + 1;
          ps.addNode("day" + info.day, info);
        }
        let len = 1;
        for (let i = 1; i < data.length; i++) {
          ps.addEdge("day" + i, "day" + (i + 1), {
            length: len
          });
          len *= 1.1;
        }

        // Data loaded
        var images = {
          background:
            data[currentDay - 1]?.background_url || "i/hh-nailsworth-church.png"
        };

        $.each(images, (tag, url) => {
          const img = $("<img>")
            .attr({
              src: url
            })
            .load(() => {
              imageStore[tag] = img[0];
            });
        });
      })
      .fail(() => {});

    ps.fps(25);
  });
});
