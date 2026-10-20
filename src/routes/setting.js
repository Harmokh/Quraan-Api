const { success, error, warning, MessageType } = require("../utils/response");
const authenticate = require("../middleware/authorize");

// Built-in text for each page, used until an admin edits it
const DEFAULT_PAGES = {
  privacy: {
    title: "Privacy Policy",
    message: "Privacy Policy fetched successfully",
    html: `
        <p>Welcome to <strong>Faydhaane Yusufi</strong>. Your privacy matters to us. As part of 
        <strong>Azhar Academy</strong>, we follow strict ethical and secure data-handling principles.</p>

        <div class="highlight-box">
          We respect your privacy and never sell, misuse, or share your personal data.
        </div>

        <h2>1. Information We Collect</h2>
        <p>We only collect the data necessary for improving your experience.</p>

        <h2>2. How We Use Your Information</h2>
        <p>Your data helps us improve app functionality, personalize your experience, and send relevant updates.</p>

        <h2>3. Data Protection</h2>
        <p>Your information is stored securely and is never shared with third parties except when required by law.</p>

        <h2>4. Your Rights</h2>
        <ul>
          <li>Request access to your data</li>
          <li>Request correction or deletion</li>
          <li>Opt-out of non-essential tracking</li>
        </ul>
      `,
  },
  terms: {
    title: "Terms & Conditions",
    message: "Terms & Conditions fetched successfully",
    html: `
        <p>By using <strong>Faydhaane Yusufi</strong>, a service brought to you by <strong>Azhar Academy</strong>, you agree to the following:</p>

        <h2>1. Acceptance of Terms</h2>
        <p>These terms govern your use of our app.</p>

        <h2>2. Usage Restrictions</h2>
        <ul>
          <li>You may not copy, resell or redistribute content.</li>
          <li>You must not misuse the app or attempt unauthorized access.</li>
        </ul>

        <h2>3. Disclaimer</h2>
        <p>All services are provided "as-is". We do not guarantee uninterrupted availability.</p>

        <h2>4. Liability & Limitations</h2>
        <p>Azhar Academy and Brimij Technologies are not responsible for damages arising from misuse or third-party interference.</p>
      `,
  },
  aboutus: {
    title: "About Us",
    message: "About Us fetched successfully",
    html: `
      <p><strong>Faydhaane Yusufi</strong> is an innovative platform developed under <strong>Azhar Academy</strong>, designed to provide users with educational and Islamic content in a seamless and user-friendly manner.</p>

      <div class="highlight-box">
        Our mission is to make authentic knowledge accessible to everyone while respecting Islamic traditions.
      </div>

      <h2>About Azhar Academy</h2>
      <p><strong>Azhar Academy</strong> is a charitable organisation (Registered Charity Number: 1080849) founded in 1996 under the instruction and guidance of Shaykh al-Hadith Hazrat Maulana Yusuf Motala (Rahmatullah Alayh). The purpose of our charity is to provide Islamic and educational services and other charitable activities.</p>

      <h2>Locations & Properties</h2>
      <ul>
        <li>235a Romford Road, E7 – AAGS and Azhar Masjid (purchased in 2000)</li>
        <li>228a Romford Road, E7 – Offices and Madrasah (purchased in 2013)</li>
        <li>470 Leytonstone High Road, E11 – AAPS and Nursery (purchased in 2011)</li>
        <li>Tennyson Road, E15 4DR – purchased in 2021</li>
      </ul>

      <h2>Our Vision</h2>
      <p>We aim to deliver authentic knowledge in a digital format while continuing to grow our charitable and educational activities worldwide.</p>

      <p>Faydhaane Yusufi brings together the works of Islamic scholars under the guidance of Azhar Academy, providing a reliable and beautiful learning platform.</p>
    `,
  },
  contact: {
    title: "Contact Us",
    message: "Contact Us fetched successfully",
    html: `
      <p>If you need help, have questions, or wish to support our charitable activities, you can contact us at:</p>

      <h2>Azhar Academy Office</h2>
      <ul>
        <li>235a Romford Road, E7 – AAGS and Azhar Masjid</li>
        <li>228a Romford Road, E7 – Offices and Madrasah</li>
        <li>470 Leytonstone High Road, E11 – AAPS and Nursery</li>
        <li>Tennyson Road, E15 4DR</li>
      </ul>

      <h2>Contact Details</h2>
      <ul>
        <li><strong>Email:</strong> support@faydhaaneyusufi.com</li>
        <li><strong>Phone:</strong> +91 98765 43210</li>
        <li><strong>Website:</strong> <a href="https://faydhaaneyusufi.com" target="_blank">faydhaaneyusufi.com</a></li>
      </ul>

      <p>Our support team strives to respond within 24 hours.</p>
    `,
  },
  faq: {
    title: "Frequently Asked Questions",
    message: "FAQ fetched successfully",
    html: `
        <h2>1. What is Faydhaane Yusufi?</h2>
        <p>A platform by Azhar Academy delivering educational and spiritual content to users worldwide.</p>

        <h2>2. Is the app free?</h2>
        <p>Yes — Faydhaane Yusufi is free to use for all users.</p>

        <h2>3. How do I reach support?</h2>
        <p>You can contact us via the Contact Us page. We aim to respond promptly.</p>

        <h2>4. Is my data safe?</h2>
        <p>Absolutely. We follow strict security practices and respect user privacy.</p>
      `,
  },
};


module.exports = (models, router) => {
  const settingRouter = router.Router();

  
  const getHtmlTemplate = (title, content) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Faydhaane Yusufi</title>

      <style>
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.7;
          color: #2d3436;
          max-width: 900px;
          margin: 0 auto;
          padding: 30px;
          background: #eef2f3;
        }

        .container {
          background: #ffffff;
          padding: 40px 50px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-top: 5px solid #2e86de;
        }

        h1 {
          font-size: 32px;
          color: #2c3e50;
          margin-bottom: 10px;
        }

        h2 {
          margin-top: 30px;
          margin-bottom: 10px;
          color: #34495e;
          font-size: 22px;
        }

        p {
          margin-bottom: 15px;
          font-size: 16px;
        }

        ul {
          margin-top: 5px;
          margin-bottom: 20px;
          padding-left: 20px;
        }

        li {
          margin-bottom: 8px;
        }

        .highlight-box {
          background: #f1f7ff;
          border-left: 4px solid #3498db;
          padding: 12px 18px;
          border-radius: 5px;
          margin: 20px 0;
        }

        .parent-box {
          background: #fff4d6;
          border-left: 4px solid #f39c12;
          padding: 12px 18px;
          border-radius: 5px;
          margin: 25px 0;
        }

        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 0.9em;
          color: #777;
        }

        .footer a {
          color: #2e86de;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>

        <div class="parent-box">
          <strong>Faydhaane Yusufi</strong> — a project by <strong>Azhar Academy</strong>
        </div>

        ${content}

        <div class="footer">
          <hr style="border:0; border-top: 1px solid #eee; margin: 30px 0;">
          &copy; ${new Date().getFullYear()} <strong>Azhar Academy</strong>. All rights reserved.<br/>
          App built &amp; designed by 
          <a href="https://brimij.com/" target="_blank">Brimij Technologies Pvt. Ltd.</a>
        </div>
      </div>
    </body>
    </html>
  `;

  // ================================================================
  // 📄 Privacy Policy
  // Page text: the admin-edited version if there is one, else the default
  const loadPage = async (key) => {
    const fallback = DEFAULT_PAGES[key];
    let saved = null;
    try {
      saved = models.AppContent ? await models.AppContent.findByPk(key) : null;
    } catch (e) {
      // table not created yet / DB hiccup: serve the default rather than fail
    }
    return {
      key,
      title: saved?.title || fallback.title,
      html: saved?.html || fallback.html,
      isCustom: !!saved,
      updatedAt: saved?.UpdatedAt || null,
    };
  };

  // Public pages shown in the app (same URLs and response shape as before)
  for (const key of Object.keys(DEFAULT_PAGES)) {
    settingRouter.get(`/setting/${key}`, async (req, res) => {
      try {
        const page = await loadPage(key);
        return success(res, getHtmlTemplate(page.title, page.html), DEFAULT_PAGES[key].message);
      } catch (err) {
        return error(res, err.message);
      }
    });
  }

  // ---- Admin: edit the pages ----
  const requireAdmin = (req, res, next) =>
    req.user?.roleId === 1
      ? next()
      : warning(res, "Only administrators can edit app pages", MessageType.WARNING);

  // GET /setting/content — every page with its current text, for the editor
  settingRouter.get("/setting/content", authenticate, requireAdmin, async (req, res) => {
    try {
      const pages = await Promise.all(Object.keys(DEFAULT_PAGES).map(loadPage));
      return success(res, pages, "App pages fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  // POST /setting/content/save — { key, title, html }; reset: true restores the default
  settingRouter.post("/setting/content/save", authenticate, requireAdmin, async (req, res) => {
    try {
      const { key, reset } = req.body;
      if (!DEFAULT_PAGES[key]) return warning(res, "Unknown page", MessageType.WARNING);

      if (reset) {
        await models.AppContent.destroy({ where: { key } });
        return success(res, await loadPage(key), "Page restored to the default text");
      }

      const title = String(req.body.title || "").trim().slice(0, 200);
      // The app renders this with react-native-render-html (no scripts), but
      // strip script/style/event handlers anyway so nothing unexpected is stored.
      const html = String(req.body.html || "")
        .replace(/<\s*(script|style|iframe)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .trim();
      if (!title) return warning(res, "Title is required", MessageType.WARNING);
      if (!html || html.replace(/<[^>]*>/g, "").trim().length === 0)
        return warning(res, "The page text is empty", MessageType.WARNING);
      if (html.length > 200000) return warning(res, "The page text is too long", MessageType.WARNING);

      await models.AppContent.upsert({ key, title, html, updatedBy: req.user.id });
      return success(res, await loadPage(key), "Page saved");
    } catch (err) {
      return error(res, err.message);
    }
  });

  return settingRouter;
};
