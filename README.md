# Prasanth Sundararajan Portfolio

Portfolio of Prasanth S.P (Kowsalya Groups). It tells the story of four live products.

🌐 **Live:** https://www.kowsalyagroups.com/prasanth/portfolio/

| Project | Type | Live |
|---|---|---|
| SlotEase | Full-stack SaaS booking (FastAPI, React, Dodo Payments) | [open](https://www.kowsalyagroups.com/techstack/appointment-booking/) |
| ReviewLens | Generative AI, LangChain | [open](https://www.kowsalyagroups.com/techstack/ReviewLens/) |
| DataPilot | Agentic AI, AutoGen | [open](https://www.kowsalyagroups.com/techstack/datapilot/) |
| LaunchScout | Agentic AI, CrewAI | [open](https://www.kowsalyagroups.com/techstack/launchscout/) |

## Stack
A single static `index.html` (HTML, CSS and a few lines of JS), served by `nginx:alpine` behind Caddy on the VPS.

## Add a testimonial
In `index.html`, copy a `.quote` block inside `#voices`. Put the client's exact words in `<p>` and their name and role in `<footer>`.

## Deploy
```bash
scp -r index.html assets root@<vps>:/opt/portfolio/site/
```
