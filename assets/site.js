/* Prasanth Sundararajan · Kowsalya Groups — shared behaviour (no cookies, no third parties) */
(function () {
  "use strict";
  var root = document.body.getAttribute("data-root") || "";

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- analytics beacon: page view + first view of each section ---------- */
  var track = navigator.doNotTrack !== "1";
  function beacon(section) {
    if (!track) return;
    new Image().src = root + "pv.gif?p=" + encodeURIComponent(location.pathname) +
      "&s=" + encodeURIComponent(section);
  }
  beacon("load");
  if (track && "IntersectionObserver" in window) {
    var seen = {};
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var id = e.target.id;
        if (!e.isIntersecting || seen[id]) return;
        // 50% of the section, or half the viewport for sections taller than two screens
        if (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= window.innerHeight * 0.5) {
          seen[id] = true;
          so.unobserve(e.target);
          beacon(id);
        }
      });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    document.querySelectorAll("section[id]").forEach(function (s) { so.observe(s); });
  }

  /* ---------- demo videos: show only when assets/videos/<project>.mp4 exists ---------- */
  document.querySelectorAll(".demo").forEach(function (box) {
    var video = box.querySelector("video");
    if (!video) return;
    var src = video.getAttribute("src");
    function hide() { box.hidden = true; }
    video.addEventListener("error", hide);
    if (!src || location.protocol === "file:" || !window.fetch) { hide(); return; }
    fetch(src, { method: "HEAD", cache: "no-store" }).then(function (r) {
      var type = r.headers.get("content-type") || "";
      if (r.ok && type.indexOf("video/") === 0) { box.hidden = false; } else { hide(); }
    }).catch(hide);
  });

  /* ---------- contact form ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;
  var statusEl = form.querySelector(".status");
  var button = form.querySelector("button[type=submit]");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var rules = {
    name: function (v) { return v.length < 2 ? "Please enter your name." : v.length > 100 ? "Name is too long." : ""; },
    email: function (v) { return !emailRe.test(v) ? "Please enter a valid email address." : ""; },
    project_type: function (v) { return v ? "" : "Please choose a project type."; },
    budget: function (v) { return v ? "" : "Please choose a budget range."; },
    message: function (v) {
      return v.length < 20 ? "Tell me a little more (at least 20 characters)." :
        v.length > 5000 ? "Please keep it under 5000 characters." : "";
    }
  };

  function setError(name, msg) {
    var field = form.elements[name];
    var err = document.getElementById("err-" + name);
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg;
  }
  function validate() {
    var firstBad = null;
    Object.keys(rules).forEach(function (name) {
      var msg = rules[name](form.elements[name].value.trim());
      setError(name, msg);
      if (msg && !firstBad) firstBad = form.elements[name];
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  function showStatus(kind, msg) {
    statusEl.className = "status " + kind;
    statusEl.textContent = msg;
  }
  Object.keys(rules).forEach(function (name) {
    form.elements[name].addEventListener("blur", function () {
      if (this.getAttribute("aria-invalid") === "true") setError(name, rules[name](this.value.trim()));
    });
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    showStatus("", "");
    if (!validate()) return;
    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      project_type: form.elements.project_type.value,
      budget: form.elements.budget.value,
      message: form.elements.message.value.trim(),
      website: form.elements.website.value
    };
    var label = button.textContent;
    button.disabled = true;
    button.textContent = "Sending…";
    fetch("/techstack/appointment-booking/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (r.status === 422) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          setError("email", (j && j.error && j.error.message) || "Please check your email address.");
        });
      }
      if (!r.ok) throw new Error("HTTP " + r.status);
      form.reset();
      Object.keys(rules).forEach(function (name) { setError(name, ""); });
      showStatus("ok", "Thanks, " + data.name + "! Your message is in, and I'll get back to you by email.");
    }).catch(function () {
      showStatus("bad", "Sorry, the message could not be sent. Please try again in a minute, or reach me on LinkedIn.");
    }).then(function () {
      button.disabled = false;
      button.textContent = label;
    });
  });
})();

// Project demo videos: honour reduced-motion and only play while visible.
(function () {
  var vids = document.querySelectorAll('.shot video');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  vids.forEach(function (v) { if (reduce) { v.removeAttribute('autoplay'); v.pause(); } });
  if (reduce || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); } else { e.target.pause(); } });
  }, { threshold: 0.25 });
  vids.forEach(function (v) { io.observe(v); });
})();


// Discovery-call booker (guest booking, no account).
(function () {
  var root = document.querySelector('.booker');
  if (!root) return;
  var api = root.dataset.api, biz = root.dataset.business, svc = root.dataset.service, slug = root.dataset.slug;
  var daysEl = root.querySelector('.booker-days'), timesEl = root.querySelector('.booker-times');
  var form = root.querySelector('.booker-form'), msg = root.querySelector('.booker-msg');
  var picked = null;
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  root.querySelector('.booker-tz').textContent = '(your time: ' + tz + ')';
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function select(list, btn) { list.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); }); }
  function fmtTime(iso) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function fmtFull(iso) { return new Date(iso).toLocaleString([], { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }
  function hint(text) { timesEl.innerHTML = ''; var p = document.createElement('p'); p.className = 'booker-hint'; p.textContent = text; timesEl.appendChild(p); }
  function loadTimes(date) {
    picked = null; form.hidden = true;
    hint('Loading open times...');
    fetch(api + '/businesses/' + biz + '/slots?service_id=' + svc + '&date=' + date)
      .then(function (r) { if (!r.ok) throw new Error('slots'); return r.json(); })
      .then(function (d) {
        var slots = Array.isArray(d) ? d : d.slots;
        if (!slots.length) { hint('No open times this day. Please try another day.'); return; }
        timesEl.innerHTML = '';
        slots.forEach(function (s) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = fmtTime(s.start_at); b.setAttribute('role', 'option');
          b.addEventListener('click', function () {
            select(timesEl, b); picked = s.start_at; form.hidden = false; msg.textContent = '';
            root.querySelector('.booker-picked').textContent = 'Selected: ' + fmtFull(s.start_at) + ' (' + tz + ')';
          });
          timesEl.appendChild(b);
        });
      })
      .catch(function () { hint('Could not load times. Please refresh, or use the contact form below.'); });
  }
  var today = new Date();
  for (var i = 0; i < 14; i++) {
    (function (d) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'option');
      var w = document.createElement('span'); w.textContent = d.toLocaleDateString([], { weekday: 'short' });
      var n = document.createElement('b'); n.textContent = d.getDate();
      var m = document.createElement('span'); m.textContent = d.toLocaleDateString([], { month: 'short' });
      b.appendChild(w); b.appendChild(n); b.appendChild(m);
      b.addEventListener('click', function () { select(daysEl, b); loadTimes(ymd(d)); });
      daysEl.appendChild(b);
    })(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form), name = String(f.get('name') || '').trim(), email = String(f.get('email') || '').trim();
    if (!picked) { msg.textContent = 'Please choose a time.'; return; }
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'Please enter your name and a valid email.'; return; }
    var btn = form.querySelector('button[type=submit]'); btn.disabled = true; msg.textContent = 'Booking...';
    fetch(api + '/public/businesses/' + slug + '/guest-bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: Number(svc), start_at: picked, name: name, email: email, topic: String(f.get('topic') || '').trim(), website: String(f.get('website') || '') })
    }).then(function (r) {
      if (r.ok) {
        form.hidden = true; daysEl.parentNode.hidden = true; timesEl.parentNode.hidden = true;
        root.querySelector('.booker-done').hidden = false;
        root.querySelector('.booker-done-text').textContent = 'Your call is confirmed for ' + fmtFull(picked) + ' (' + tz + ').';
        return;
      }
      btn.disabled = false;
      if (r.status === 409) { msg.textContent = 'Sorry, that time was just taken. Please pick another.'; var sel = daysEl.querySelector('[aria-selected="true"]'); if (sel) sel.click(); }
      else if (r.status === 429) { msg.textContent = 'Too many attempts. Please try again later, or use the contact form.'; }
      else if (r.status === 422) { r.json().then(function (j) { msg.textContent = (j && j.error && j.error.message) || 'Please check your details.'; }).catch(function () { msg.textContent = 'Please check your details.'; }); }
      else { msg.textContent = 'Something went wrong. Please try again, or use the contact form below.'; }
    }).catch(function () { btn.disabled = false; msg.textContent = 'Network error. Please try again.'; });
  });
})();
