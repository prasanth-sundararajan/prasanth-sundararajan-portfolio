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
