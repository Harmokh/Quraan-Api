const { success, warning, error, MessageType } = require("../utils/response");
const authenticate = require("../middleware/authorize");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs/promises");
const { PDFDocument } = require("pdf-lib");
const rootDir = path.resolve(__dirname, "../../");
const fsSync = require("fs");

// Avoids a DB hit on every page request — BookVersion.totalPages rarely changes
const versionCache = new Map(); // versionId → { data, expiry }
const CACHE_TTL = 10 * 60 * 1000; // 10 min

// Prevents concurrent generation of all-pages.pdf for the same version
const generationLocks = new Map();

async function getVersionCached(models, versionId) {
  const cached = versionCache.get(versionId);
  if (cached && cached.expiry > Date.now()) return cached.data;

  const version = await models.BookVersion.findByPk(versionId, {
    attributes: ["id", "totalPages"],
  });
  if (version) {
    versionCache.set(versionId, { data: version, expiry: Date.now() + CACHE_TTL });
  }
  return version;
}

// Builds all-pages.pdf from individual page files (for books uploaded before this optimization)
async function generateFullPdf(versionDir, totalPages, destPath) {
  const fileBytes = await Promise.all(
    Array.from({ length: totalPages }, (_, i) =>
      fs.readFile(path.join(versionDir, `page-${i + 1}.pdf`))
    )
  );
  const newPdf = await PDFDocument.create();
  for (const bytes of fileBytes) {
    const doc = await PDFDocument.load(bytes);
    const [page] = await newPdf.copyPages(doc, [0]);
    newPdf.addPage(page);
  }
  await fs.writeFile(destPath, Buffer.from(await newPdf.save({ useObjectStreams: true })));
}

// Returns path to all-pages.pdf, generating it on first call if needed
async function ensureFullPdf(versionDir, totalPages) {
  const fullPath = path.join(versionDir, "all-pages.pdf");

  try {
    await fs.access(fullPath);
    return fullPath; // already exists — fast path
  } catch {}

  if (!generationLocks.has(versionDir)) {
    const lock = generateFullPdf(versionDir, totalPages, fullPath)
      .finally(() => generationLocks.delete(versionDir));
    generationLocks.set(versionDir, lock);
  }

  await generationLocks.get(versionDir);
  return fullPath;
}

module.exports = (models, router) => {
  const bookRouter = router.Router();

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
            await deleteFolderSafe(
              path.join(process.cwd(), "public/book", String(old.id))
            );
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
              {
                versionName: v.versionName,
                author: v.author,
                description: v.description,
                publishedYear: v.publishedYear,
                isbn: v.isbn,
                image: v.image,
              },
              { transaction: t }
            );

            if (v.isPdfChanged) {
              const versionDir = path.join(
                process.cwd(), "public/book", String(version.id)
              );
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
              {
                bookId: book.id,
                versionName: v.versionName,
                author: v.author,
                description: v.description,
                publishedYear: v.publishedYear,
                isbn: v.isbn,
                image: v.image,
                pdfPath: v.pdfPath,
              },
              { transaction: t }
            );

            const versionDir = path.join(
              process.cwd(), "public/book", String(version.id)
            );
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
      if (!query || query.trim() === "") {
        return warning(res, "Search query is required", MessageType.Warning);
      }
      const searchTerm = `%${query}%`;
      const books = await models.Book.findAll({
        where: {
          isDeleted: false,
          [Op.or]: [{ title: { [Op.iLike]: searchTerm } }],
        },
        include: [
          {
            model: models.BookVersion,
            as: "Versions",
            required: false,
            where: {
              [Op.or]: [
                { versionName: { [Op.iLike]: searchTerm } },
                { description: { [Op.iLike]: searchTerm } },
              ],
            },
          },
        ],
        order: [["CreatedAt", "DESC"]],
      });

      if (!books || books.length === 0) {
        return warning(res, "No books found matching your search", MessageType.Warning);
      }
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
        include: [
          {
            model: models.BookVersion,
            as: "Versions",
            required: false,
            where:
              query && query.trim() !== ""
                ? {
                    [Op.or]: [
                      { versionName: { [Op.iLike]: `%${query}%` } },
                      { isbn: { [Op.iLike]: `%${query}%` } },
                      { description: { [Op.iLike]: `%${query}%` } },
                    ],
                  }
                : undefined,
          },
        ],
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

  // 📄 Get pages of a book version
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

      // 🔹 SINGLE PAGE → direct stream (unchanged, already fast)
      if (start === end) {
        const pagePath = path.join(versionDir, `page-${start}.pdf`);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("X-Total-Pages", version.totalPages);
        const stream = fsSync.createReadStream(pagePath);
        stream.on("error", () =>
          res.status(404).json({ success: false, message: "Page not found" })
        );
        return stream.pipe(res);
      }

      // 🔹 FULL BOOK → stream pre-generated all-pages.pdf (generated once, cached forever)
      if (start === 1 && end === version.totalPages) {
        try {
          const fullPath = await ensureFullPdf(versionDir, version.totalPages);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.setHeader("X-Total-Pages", version.totalPages);
          return fsSync.createReadStream(fullPath).pipe(res);
        } catch (e) {
          console.error("ensureFullPdf failed, falling back to merge:", e.message);
          // fall through to partial merge below
        }
      }

      // 🔹 PARTIAL RANGE → parallel reads then merge
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

      const mergedBytes = await newPdf.save({ useObjectStreams: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Total-Pages", version.totalPages);
      res.end(Buffer.from(mergedBytes));
    } catch (err) {
      console.error("GET PAGES ERROR:", err);
      res.status(500).json({ success: false, message: err.message || "Failed to get pages" });
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
        include: [{ model: models.Book, as: "Book", attributes: ["Title", "coverImage"] }],
        order: [["CreatedAt", "DESC"]],
      });
      const flatVersions = versions.map((v) => ({
        id: v.id,
        bookName: v.Book?.dataValues?.Title || null,
        coverImage: v.Book?.dataValues?.coverImage || null,
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

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const deleteFolderSafe = async (dir) => {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {}
  };

  const splitPdfIntoPages = async (pdfPath, outputDir) => {
    try {
      await fs.mkdir(outputDir, { recursive: true });

      const pdfBytes = await fs.readFile(pdfPath);

      // Save the original as all-pages.pdf — eliminates merge cost on first full-book request
      await fs.writeFile(path.join(outputDir, "all-pages.pdf"), pdfBytes);

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const totalPages = pdfDoc.getPageCount();

      // Split pages in parallel batches to control memory pressure
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

  return bookRouter;
};
