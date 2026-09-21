/* SM Workload Net — shared renderer.
   Every page carries its own data in <script type="application/json" id="board-data">.
   Nothing is fetched, so the page renders the same from a file, from Pages, or from a preview. */
(function () {
  "use strict";

  var el = document.getElementById("board-data");
  if (!el) return;
  var DATA;
  try { DATA = JSON.parse(el.textContent); }
  catch (e) { console.error("board-data is not valid JSON", e); return; }

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var put = function (id, html) { var n = document.getElementById(id); if (n) n.innerHTML = html; };
  var text = function (id, s) { var n = document.getElementById(id); if (n) n.textContent = s; };

  var fmtDate = function (iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  var daysOld = function (iso) {
    if (!iso) return null;
    var d = new Date(iso); if (isNaN(d)) return null;
    return Math.max(0, Math.round((Date.now() - d.getTime()) / 86400000));
  };
  var age = function (iso) {
    var n = daysOld(iso);
    if (n === null) return "";
    return n === 0 ? "found today" : n === 1 ? "1 day old" : n + " days old";
  };

  /* ---------- queue definitions: the three gap types from the plan ---------- */
  var QUEUES = [
    { key: "tickets",  sev: "crit", h2: "Needs a ticket",     count: "No Jira CS or Freshservice ticket covers this work yet.",
      empty: "Nothing untracked. Every work item found in mail, Teams, Confluence and meetings maps to a CS issue or a Freshservice ticket." },
    { key: "changes",  sev: "warn", h2: "Should go to CMB",    count: "Touches a production path — route through Change Management before it ships.",
      empty: "No change-management candidates in this pass." },
    { key: "docs",     sev: "info", h2: "Docs going stale",    count: "Runbooks and configs that no longer match what is running.",
      empty: "No stale documentation flagged." }
  ];

  var gapRow = function (g, sev) {
    var links = (g.links || []).map(function (l) {
      return '<a class="act" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>';
    }).join("");
    return '<article class="gap ' + sev + '">' +
      '<div class="gap-head">' +
        '<h3 class="gap-title">' + esc(g.title) + "</h3>" +
        '<span class="gap-age">' + esc(g.found ? age(g.found) : "") + "</span>" +
      "</div>" +
      (g.why ? '<p class="gap-why">' + esc(g.why) + "</p>" : "") +
      (g.evidence ? '<p class="gap-ev">' + esc(g.evidence) + "</p>" : "") +
      (links ? '<div class="gap-foot">' + links + "</div>" : "") +
    "</article>";
  };

  /* ---------- person board ---------- */
  function renderPerson(d) {
    document.title = d.name + " — Workload Net";
    text("who", d.name);
    text("role", d.role || "");
    text("coverage", d.coverage || "");
    text("handle", d.github ? "@" + d.github : "");
    text("asof", fmtDate(d.updated));
    var sp = document.getElementById("samplepill");
    if (sp) sp.hidden = !d.sample;

    var g = d.gaps || {};
    var counts = QUEUES.map(function (q) { return (g[q.key] || []).length; });
    var total = counts.reduce(function (a, b) { return a + b; }, 0);

    put("strip",
      '<div class="tile ' + (counts[0] ? "crit" : "ok") + (counts[0] ? "" : " zero") + '">' +
        '<span class="n">' + counts[0] + '</span><span class="k">Needs a ticket</span>' +
        '<span class="s">' + (counts[0] ? "action required" : "clear") + "</span></div>" +
      '<div class="tile ' + (counts[1] ? "warn" : "ok") + (counts[1] ? "" : " zero") + '">' +
        '<span class="n">' + counts[1] + '</span><span class="k">Should go to CMB</span>' +
        '<span class="s">' + (counts[1] ? "review" : "clear") + "</span></div>" +
      '<div class="tile ' + (counts[2] ? "info" : "ok") + (counts[2] ? "" : " zero") + '">' +
        '<span class="n">' + counts[2] + '</span><span class="k">Docs going stale</span>' +
        '<span class="s">' + (counts[2] ? "queued" : "clear") + "</span></div>" +
      '<div class="tile ' + (total ? "info" : "ok") + (total ? "" : " zero") + '">' +
        '<span class="n">' + total + '</span><span class="k">Open gaps</span>' +
        '<span class="s">this pass</span></div>'
    );

    QUEUES.forEach(function (q, i) {
      var items = g[q.key] || [];
      text("c-" + q.key, counts[i] + (counts[i] === 1 ? " item" : " items"));
      var note = document.getElementById("n-" + q.key);
      if (note) note.textContent = items.length ? q.count : "";
      put("q-" + q.key, items.length
        ? items.map(function (it) { return gapRow(it, q.sev); }).join("")
        : '<p class="empty-q">' + esc(q.empty) + "</p>");
    });

    put("pages", (d.pages || []).map(function (p) {
      var chips = '<span class="chips">' + (p.sources || []).map(function (s) {
        return '<span class="chip">' + esc(s) + "</span>";
      }).join("") + "</span>";
      var inner = '<span class="cadence">' + esc(p.cadence) + "</span>" +
        '<span class="pi-title">' + esc(p.title) + "</span>" + chips;
      return p.url
        ? '<a class="pageitem" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
            inner + '<span class="pi-open">Open &rarr;</span></a>'
        : '<div class="pageitem">' + inner +
            '<span class="pi-open" style="color:var(--ink-3)">Paste your link</span></div>';
    }).join("") || '<p class="empty-q">No pages linked yet. Add them to the <code>pages</code> list at the bottom of this file.</p>');
  }

  /* ---------- team rollup ---------- */
  function renderTeam(d) {
    var seats = d.seats || [];
    var claimed = seats.filter(function (s) { return s.name; });
    var sum = function (k) {
      return claimed.reduce(function (a, s) { return a + ((s.counts || {})[k] || 0); }, 0);
    };
    var t = sum("tickets"), c = sum("changes"), o = sum("docs");

    put("strip",
      '<div class="tile ' + (t ? "crit" : "ok") + (t ? "" : " zero") + '">' +
        '<span class="n">' + t + '</span><span class="k">Needs a ticket</span>' +
        '<span class="s">across the team</span></div>' +
      '<div class="tile ' + (c ? "warn" : "ok") + (c ? "" : " zero") + '">' +
        '<span class="n">' + c + '</span><span class="k">Should go to CMB</span>' +
        '<span class="s">across the team</span></div>' +
      '<div class="tile ' + (o ? "info" : "ok") + (o ? "" : " zero") + '">' +
        '<span class="n">' + o + '</span><span class="k">Docs going stale</span>' +
        '<span class="s">across the team</span></div>' +
      '<div class="tile info"><span class="n">' + claimed.length + "/" + seats.length + "</span>" +
        '<span class="k">Seats claimed</span><span class="s">SM team</span></div>'
    );

    put("seats", seats.map(function (s) {
      if (!s.name) {
        return '<div class="seat vacant">' +
          '<div class="seat-top"><h3 class="seat-name">Open seat</h3></div>' +
          '<p class="seat-role">Copy <code>people/_seat.html</code> and rename it to your handle.</p>' +
          '<div class="seat-counts quiet"><div><b>&mdash;</b><span>tickets</span></div>' +
          '<div><b>&mdash;</b><span>CMB</span></div><div><b>&mdash;</b><span>docs</span></div></div>' +
          '<span class="seat-foot">Unclaimed</span></div>';
      }
      var n = s.counts || {};
      var any = (n.tickets || 0) + (n.changes || 0) + (n.docs || 0);
      return '<a class="seat" href="' + esc(s.page) + '">' +
        '<div class="seat-top"><h3 class="seat-name">' + esc(s.name) + "</h3>" +
        '<span class="seat-hand">@' + esc(s.github) + "</span></div>" +
        '<p class="seat-role">' + esc(s.coverage || "") + "</p>" +
        '<div class="seat-counts' + (any ? "" : " quiet") + '">' +
          "<div><b>" + (n.tickets || 0) + "</b><span>tickets</span></div>" +
          "<div><b>" + (n.changes || 0) + "</b><span>CMB</span></div>" +
          "<div><b>" + (n.docs || 0) + "</b><span>docs</span></div>" +
        "</div>" +
        '<span class="seat-asof">Last pass ' + esc(fmtDate(s.updated)) + "</span>" +
        '<span class="seat-foot">Open board &rarr;</span></a>';
    }).join(""));

    text("asof", fmtDate(d.updated));
    text("seatcount", claimed.length + " of " + seats.length + " seats claimed");
  }

  if (DATA.seats) renderTeam(DATA); else renderPerson(DATA);
})();
