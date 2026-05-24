const { success, warning, error, MessageType } = require("../utils/response");
const authenticate = require("../middleware/authorize");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const { PDFDocument } = require("pdf-lib");
const { Worker } = require("worker_threads");

const rootDir = path.resolve(__dirname, "../../");
const WORKER_PATH = path.join(__dirname, "../workers/pdfMergeWorker.js");

// ─── GenerationQueue ──────────────────────────────────────────────────────────
// Limits concurrent worker threads and deduplicates identical in-flight jobs.
// If 50 users request the same un-generated book simultaneously, only ONE worker
// spawns; all 50 await the same promise.
class GenerationQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.running = 0;
    this.pending = [];
    this.inFlight = new Map(); // key → Promise
  }

  add(key, fn) {
    if (this.inFlight.has(key)) return this.inFlight.get(key);

    const promise = new Promise((resolve, reject) => {
      const run = async () => {
        this.running++;
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          this.running--;
          this.inFlight.delete(key);
          if (this.pending.length > 0) this.pending.shift()();
        }
      };
      this.running < this.concurrency ? run() : this.pending.push(run);
    });

    this.inFlight.set(key, promise);
    return promise;
  }
}

const genQueue = new GenerationQueue(2);

// ─── BoundedLRUCache ──────────────────────────────────────────────────────────
// Prevents unbounded memory growth. Evicts oldest entry when full.
class BoundedLRUCache {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiry < Date.now()) { this.cache.delete(key); return null; }
    // Refresh position for LRU eviction ordering
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, { value, expiry: Date.now() + ttlMs });
  }

  delete(key) { this.cache.delete(key); }
}

const versionCache = new BoundedLRUCache(500);
const VERSION_TTL = 10 * 60 * 1000; // 10 min

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getVersionCached(models, versionId) {
  const cached = versionCache.get(versionId);
  if (cached) return cached;

  const version = await models.BookVersion.findByPk(versionId, {
    attributes: ["id", "totalPages"],
  });
  if (version) versionCache.set(versionId, version, VERSION_TTL);
  return version;
}

// Spawns a worker thread for the CPU-heavy merge — never blocks the event loop.
function runMergeWorker(versionDir, totalPages, destPath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      workerData: { versionDir, totalPages, destPath },
    });
    worker.once("message", (msg) =>
      msg.ok ? resolve() : reject(new Error(msg.error))
    );
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`PDF worker exited with code ${code}`));
    });
  });
}

// Returns path to all-pages.pdf, generating it exactly once per version.
async function ensureFullPdf(versionDir, totalPages) {
  const dest = path.join(versionDir, "all-pages.pdf");
  try { await fs.access(dest); return dest; } catch {}

  // Queue — concurrent callers share the same promise
  await genQueue.add(`gen:${versionDir}`, () =>
    runMergeWorker(versionDir, totalPages, dest)
  );
  return dest;
}

// Streams a local file with full HTTP cache semantics:
//   ETag, Last-Modified, 304 Not Modified, Range (206 Partial Content), CORS.
// PDF.js uses Range requests to start rendering page 1 before the full file
// is downloaded — critical for fast perceived load on mobile.
function serveFile(req, res, filePath, extraHeaders = {}) {
  let stat;
  try { stat = fsSync.statSync(filePath); }
  catch { return res.status(404).json({ success: false, message: "File not found" }); }

  const etag = `"${stat.mtime.getTime().toString(16)}-${stat.size.toString(16)}"`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("ETag", etag);
  res.setHeader("Last-Modified", stat.mtime.toUTCString());
  res.setHeader("Accept-Ranges", "bytes");
  // CORS required so PDF.js range requests from the WebView succeed
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Range, Accept-Ranges, Content-Length, X-Total-Pages"
  );
  Object.entries(extraHeaders).forEach(([k, v]) => res.setHeader(k, v));

  // Conditional GET — browser/CDN already has the file
  if (req.headers["if-none-match"] === etag) return res.status(304).end();

  const range = req.headers["range"];

  if (!range) {
    res.setHeader("Content-Length", stat.size);
    return fsSync.createReadStream(filePath).pipe(res);
  }

  // Range request (206 Partial Content)
  const m = range.match(/bytes=(\d*)-(\d*)/);
  if (!m) {
    res.setHeader("Content-Range", `bytes */${stat.size}`);
    return res.status(416).end();
  }

  const total = stat.size;
  const rawStart = m[1] ? parseInt(m[1], 10) : NaN;
  const rawEnd   = m[2] ? parseInt(m[2], 10) : NaN;
  const start = isNaN(rawStart) ? total - rawEnd : rawStart;
  const end   = isNaN(rawEnd)   ? total - 1     : Math.min(rawEnd, total - 1);

  if (isNaN(start) || isNaN(end) || start > end || start < 0) {
    res.setHeader("Content-Range", `bytes */${total}`);
    return res.status(416).end();
  }

  res.statusCode = 206;
  res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
  res.setHeader("Content-Length", end - start + 1);
  return fsSync.createReadStream(filePath, { start, end }).pipe(res);
}

// At server start: generate all-pages.pdf for any book that doesn't have one.
// Runs entirely in background worker threads — zero impact on request latency.
async function runStartupMigration(models) {
  try {
    const versions = await models.BookVersion.findAll({
      attributes: ["id", "totalPages"],
    });

    let queued = 0;
    for (const v of versions) {
      if (!v.totalPages) continue;
      const vDir = path.join(rootDir, "public", "book", String(v.id));
      const dest = path.join(vDir, "all-pages.pdf");
      try { await fs.access(dest); continue; } catch {}

      queued++;
      genQueue
        .add(`gen:${vDir}`, () => runMergeWorker(vDir, v.totalPages, dest))
        .catch((e) => console.error(`[PDF Migration] version ${v.id}:`, e.message));
    }

    if (queued > 0)
      console.log(`[PDF Migration] Queued ${queued} book(s) for background generation.`);
  } catch (e) {
    console.error("[PDF Migration] Error:", e.message);
  }
}

// Splits an uploaded PDF into individual page files AND saves the original as
// all-pages.pdf — so the very first user request is always a fast file stream.
const splitPdfIntoPages = async (pdfPath, outputDir) => {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const pdfBytes = await fs.readFile(pdfPath);

    // Save original immediately — enables fast full-book streaming from first request
    await fs.writeFile(path.join(outputDir, "all-pages.pdf"), pdfBytes);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    // Split pages in parallel batches to avoid exhausting memory
    const BATCH = 20;
    for (let batch = 0; batch < totalPages; batch += BATCH) {
      const batchEnd = Math.min(batch + BATCH, totalPages);
      await Promise.all(
        Array.from({ length: batchEnd - batch }, async (_, j) => {
          const i = batch + j;
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(page);
          await fs.writeFile(
            path.join(outputDir, `page-${i + 1}.pdf`),
            await newPdf.save()
          );
        })
      );
    }

    await fs.unlink(pdfPath);
    return totalPages;
  } catch (err) {
    await deleteFolderSafe(outputDir);
    throw err;
  }
};

const deleteFolderSafe = async (dir) => {
  try { await fs.rm(dir, { recursive: true, force: true }); } catch {}
};

// ─── Routes ───────────────────────────────────────────────────────────────────

module.exports = (models, router) => {
  const bookRouter = router.Router();

  // CORS preflight for the PDF streaming endpoints (PDF.js range requests)
  bookRouter.options("/book/version/pdf", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Range");
    res.end();
  });

  // ── NEW: Full-book PDF endpoint ───────────────────────────────────────────
  // Serves all-pages.pdf with Range + ETag support.
  // PDF.js uses range requests to render page 1 while the rest downloads.
  // X-Total-Pages lets the client know page count without a separate DB call.
  bookRouter.get("/book/version/pdf", async (req, res) => {
    try {
      const { versionId } = req.query;
      if (!versionId) {
        return res.status(400).json({ success: false, message: "versionId is required" });
      }

      const version = await getVersionCached(models, versionId);
      if (!version) {
        return res.status(404).json({ success: false, message: "Book version not found" });
      }

      const versionDir = path.join(rootDir, "public", "book", String(versionId));

      // ensureFullPdf generates via worker if missing; deduplicates concurrent calls
      const fullPath = await ensureFullPdf(versionDir, version.totalPages);

      return serveFile(req, res, fullPath, { "X-Total-Pages": version.totalPages });
    } catch (err) {
      console.error("GET /book/version/pdf ERROR:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to serve PDF" });
    }
  });

  // ── Legacy: per-page / range endpoint (kept for backward compatibility) ───
  bookRouter.get("/book/version/getpages", async (req, res) => {
    try {
      let { versionId, startPage, endPage } = req.query;

      if (!versionId || !startPage) {
        return res.status(400).json({ success: false, message: "versionId and startPage are required" });
      }

      const start = Number(startPage);
      let end = endPage ? Number(endPage) : start;

      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || start > end) {
        return res.status(400).json({ success: false, message: "Invalid page range" });
      }

      const version = await getVersionCached(models, versionId);
      if (!version) {
        return res.status(404).json({ success: false, message: "Book version not found" });
      }
      if (end > version.totalPages) end = version.totalPages;

      const versionDir = path.join(rootDir, "public", "book", String(versionId));

      // Single page — direct stream
      if (start === end) {
        const pagePath = path.join(versionDir, `page-${start}.pdf`);
        return serveFile(req, res, pagePath, { "X-Total-Pages": version.totalPages });
      }

      // Full book — redirect to the optimised endpoint
      if (start === 1 && end === version.totalPages) {
        return res.redirect(307, `/api/book/version/pdf?versionId=${versionId}`);
      }

      // Partial range — parallel reads then merge
      let pageBytes;
      try {
        pageBytes = await Promise.all(
          Array.from({ length: end - start + 1 }, (_, i) =>
            fs.readFile(path.join(versionDir, `page-${start + i}.pdf`))
          )
        );
      } catch {
        return res.status(404).json({ success: false, message: "One or more pages not found" });
      }

      const newPdf = await PDFDocument.create();
      for (const bytes of pageBytes) {
        const doc = await PDFDocument.load(bytes);
        const [page] = await newPdf.copyPages(doc, [0]);
        newPdf.addPage(page);
      }

      const merged = Buffer.from(await newPdf.save({ useObjectStreams: true }));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Total-Pages", version.totalPages);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(merged);
    } catch (err) {
      console.error("GET PAGES ERROR:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to get pages" });
    }
  });

  // ── Book CRUD (unchanged logic, cache invalidation added) ─────────────────

  bookRouter.post("/book/save", authenticate, async (req, res) => {
    const { id, title, coverImage, versions = [] } = req.body;
    try {
      const result = await models.sequelize.transaction(async (t) => {
        let book = id
          ? await models.Book.findByPk(id, {
              include: [{ model: models.BookVersion, as: "Versions" }],
              transaction: t,
            })
          : await models.Book.create({ title, coverImage }, { transaction: t });

        if (!book) throw new Error("Book not found");
        if (id) await book.update({ title, coverImage }, { transaction: t });

        const existingVersions = book.Versions || [];
        const incomingIds = versions.filter((v) => v.id).map((v) => v.id);

        for (const old of existingVersions) {
          if (!incomingIds.includes(old.id)) {
            await deleteFolderSafe(path.join(process.cwd(), "public/book", String(old.id)));
            versionCache.delete(String(old.id));
            await old.destroy({ transaction: t });
          }
        }

        for (const v of versions) {
          let version;
          if (v.id) {
            version = await models.BookVersion.findByPk(v.id, { transaction: t });
            if (!version) continue;

            await version.update(
              { versionName: v.versionName, author: v.author, description: v.description,
                publishedYear: v.publishedYear, isbn: v.isbn, image: v.image },
              { transaction: t }
            );

            if (v.isPdfChanged) {
              const versionDir = path.join(process.cwd(), "public/book", String(version.id));
              await deleteFolderSafe(versionDir);
              versionCache.delete(String(version.id));

              const totalPages = await splitPdfIntoPages(
                path.join(process.cwd(), "public", v.pdfPath),
                versionDir
              );
              await version.update({ pdfPath: `book/${version.id}`, totalPages }, { transaction: t });
            }
          } else {
            version = await models.BookVersion.create(
              { bookId: book.id, versionName: v.versionName, author: v.author,
                description: v.description, publishedYear: v.publishedYear,
                isbn: v.isbn, image: v.image, pdfPath: v.pdfPath },
              { transaction: t }
            );

            const versionDir = path.join(process.cwd(), "public/book", String(version.id));
            const totalPages = await splitPdfIntoPages(
              path.join(process.cwd(), "public", v.pdfPath),
              versionDir
            );
            await version.update({ pdfPath: `book/${version.id}`, totalPages }, { transaction: t });
          }
        }

        return models.Book.findByPk(book.id, {
          include: [{ model: models.BookVersion, as: "Versions" }],
          transaction: t,
        });
      });

      return success(res, result, id ? "Book updated" : "Book created");
    } catch (err) {
      console.error("BOOK SAVE ERROR:", err);
      return error(res, err.message || "Book save failed");
    }
  });

  bookRouter.get("/book/getbyid", authenticate, async (req, res) => {
    try {
      const book = await models.Book.findByPk(req.query.id, {
        include: [{ model: models.BookVersion, as: "Versions" }],
      });
      if (!book) return warning(res, "Book not found", MessageType.Warning);
      return success(res, book, "Book fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  bookRouter.get("/book/search", authenticate, async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || query.trim() === "")
        return warning(res, "Search query is required", MessageType.Warning);

      const searchTerm = `%${query}%`;
      const books = await models.Book.findAll({
        where: { isDeleted: false, [Op.or]: [{ title: { [Op.iLike]: searchTerm } }] },
        include: [{
          model: models.BookVersion, as: "Versions", required: false,
          where: { [Op.or]: [{ versionName: { [Op.iLike]: searchTerm } }, { description: { [Op.iLike]: searchTerm } }] },
        }],
        order: [["CreatedAt", "DESC"]],
      });

      if (!books || books.length === 0)
        return warning(res, "No books found matching your search", MessageType.Warning);

      return success(res, books, "Search results fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  bookRouter.get("/book/getall", authenticate, async (req, res) => {
    try {
      let { pageSize = 10, currentPage = 1, query } = req.query;
      const whereClause = {};
      if (query && query.trim() !== "") {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${query}%` } },
          { author: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
        ];
      }
      const result = await models.Book.findAndCountAll({
        where: whereClause,
        include: [{
          model: models.BookVersion, as: "Versions", required: false,
          where: query && query.trim() !== ""
            ? { [Op.or]: [{ versionName: { [Op.iLike]: `%${query}%` } }, { isbn: { [Op.iLike]: `%${query}%` } }, { description: { [Op.iLike]: `%${query}%` } }] }
            : undefined,
        }],
        limit: parseInt(pageSize),
        offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
        order: [["CreatedAt", "DESC"]],
      });
      return success(res, result, "Books fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  bookRouter.get("/book/getmaster", authenticate, async (req, res) => {
    try {
      const books = await models.Book.findAll({
        where: { isDeleted: false },
        include: [{ model: models.BookVersion, as: "versions" }],
        order: [["CreatedAt", "DESC"]],
      });
      return success(res, books, "Books fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  bookRouter.delete("/book/delete", authenticate, async (req, res) => {
    try {
      const { id } = req.query;
      const updated = await models.Book.destroy({ where: { id } });
      if (updated) return success(res, null, "Book deleted successfully");
      else return warning(res, "Book not found", MessageType.Warning);
    } catch (err) {
      return error(res, err.message);
    }
  });

  bookRouter.get("/book/getbookmaster", authenticate, async (req, res) => {
    try {
      const result = await models.Book.findAll({ order: [["CreatedAt", "DESC"]] });
      return success(res, result, "Books fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  bookRouter.get("/book/versions/getbybook", authenticate, async (req, res) => {
    try {
      const { bookId } = req.query;
      if (!bookId) return warning(res, "bookId is required", MessageType.Warning);
      const versions = await models.BookVersion.findAll({
        where: { bookId },
        order: [["CreatedAt", "DESC"]],
      });
      return success(res, versions, "Book versions fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  bookRouter.get("/book/getallversions", authenticate, async (req, res) => {
    try {
      const { pageSize = 10, currentPage = 1 } = req.query;
      const versions = await models.BookVersion.findAll({
        limit: parseInt(pageSize),
        offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
        include: [{ model: models.Book, as: "Book", attributes: ["Title"] }],
        order: [["CreatedAt", "DESC"]],
      });
      const flatVersions = versions.map((v) => ({
        id: v.id,
        bookName: v.Book?.dataValues?.Title || null,
        coverImage: v.image || null,
        versionName: v.versionName,
        description: v.description,
        author: v.author,
      }));
      return success(res, flatVersions, "Book versions fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  bookRouter.get("/book/versions/getversiontotalpages", authenticate, async (req, res) => {
    try {
      const { versionId } = req.query;
      const version = await models.BookVersion.findOne({
        where: { id: versionId },
        attributes: ["id", "totalPages"],
      });
      return success(res, version, "Book versions fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  // Kick off background generation for any book missing all-pages.pdf.
  // Runs after a short delay so it doesn't slow down server startup.
  setTimeout(() => runStartupMigration(models), 5000);

  return bookRouter;
};
