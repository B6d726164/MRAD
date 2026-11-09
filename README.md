# Bilal Mrad — personal website

Static site (HTML, CSS, vanilla JS). No build step.

- `index.html` — home: work, services, career, contact
- `contact.html` — contact page
- `styles.css`, `script.js`
- `assets/img` — optimised WebP images, favicon, social share image
- `assets/docs/Bilal_Mrad_Resume.pdf` — CV

## Publish with GitHub Pages
Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.

## Custom domain (bilalmrad.com)
1. Settings → Pages → Custom domain → `bilalmrad.com` → Save (this creates a `CNAME` file).
2. At your DNS provider add four `A` records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153,
   and a `CNAME` record `www` → `b6d726164.github.io`.
3. Once the certificate is issued, tick *Enforce HTTPS*.
