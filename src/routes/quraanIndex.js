const { success, warning, error, MessageType } = require("../utils/response");
const authenticate = require("../middleware/authorize");
const {
  SURAHS,
  JUZ,
  TOTAL_SURAHS,
  TOTAL_JUZ,
  getSurah,
  getJuz,
  getJuzNumbersForSurah,
  isJuzValidForSurah,
  getJuzAtSurahStart,
  getSurahJuzMap,
} = require("../data/quraanReference");

// ─── Index computation ────────────────────────────────────────────────────────
// The admin tags pages while walking the uploaded translation. From those tags we
// derive the reader index: for each Surah / Parah, the page it starts on and the
// page it ends on.
//
// Start page  — an explicitly flagged start page wins; otherwise the lowest page
//               tagged with that Surah/Parah.
// End page    — an explicitly flagged end page wins. Failing that it is inferred, in
//               order, from where the NEXT Surah/Parah begins, from how far this one's
//               own tagged pages reach, or — for the final one only — the last page of
//               the book. When none of those apply the end is left null rather than
//               guessed, because an invented end reads as fact to the reader.
function buildIndex(rows, totalPages, { numberKey, startFlagKey, endFlagKey, lookup, total, includeUntagged }) {
  const explicitStart = new Map(); // number → explicitly flagged start page
  const implicitStart = new Map(); // number → lowest page merely tagged with it
  const explicitEnd = new Map();   // number → explicitly flagged end page
  const lastTagged = new Map();    // number → highest page tagged with it

  for (const row of rows) {
    const number = row[numberKey];
    if (!number) continue;

    const page = row.pageNumber;

    const startTarget = row[startFlagKey] ? explicitStart : implicitStart;
    if (!startTarget.has(number) || page < startTarget.get(number))
      startTarget.set(number, page);

    if (row[endFlagKey] && (!explicitEnd.has(number) || page > explicitEnd.get(number)))
      explicitEnd.set(number, page);

    if (!lastTagged.has(number) || page > lastTagged.get(number))
      lastTagged.set(number, page);
  }

  const startOf = (number) =>
    explicitStart.get(number) ?? implicitStart.get(number) ?? null;

  const entries = [];
  for (let number = 1; number <= total; number++) {
    const startPage = startOf(number);
    if (startPage === null && !includeUntagged) continue;

    const meta = lookup(number);
    entries.push({
      number,
      nameArabic: meta?.nameArabic || null,
      nameEnglish: meta?.nameEnglish || null,
      meaningEnglish: meta?.meaningEnglish ?? null,
      ayahCount: meta?.ayahCount ?? null,
      revelationType: meta?.revelationType ?? null,
      startPage,
      endPage: null,
      // How the end was arrived at, so the admin can tell a fact from an inference:
      //   explicit  — marked "ends here"
      //   next      — the following Surah/Parah begins on the next page
      //   tagged    — the last page actually carrying this number
      //   book-end  — the final Surah/Parah, so it runs to the last page
      //   null      — genuinely not known yet
      endPageSource: null,
      isExplicitStart: explicitStart.has(number),
    });
  }

  for (const entry of entries) {
    if (entry.startPage === null) continue;

    const marked = explicitEnd.get(entry.number);
    if (marked != null) {
      entry.endPage = Math.max(entry.startPage, marked);
      entry.endPageSource = "explicit";
      continue;
    }

    // The one that follows it by NUMBER — not merely the next one in page order.
    // Using page order let an untagged run get absorbed into the previous entry.
    const nextStart = startOf(entry.number + 1);
    if (nextStart !== null && nextStart > entry.startPage) {
      entry.endPage = nextStart - 1;
      entry.endPageSource = "next";
      continue;
    }

    // Pages tagged with this number are evidence of how far it reaches.
    const furthest = lastTagged.get(entry.number);
    if (furthest != null && furthest > entry.startPage) {
      entry.endPage = furthest;
      entry.endPageSource = "tagged";
      continue;
    }

    // Only the final Surah / Parah may be assumed to run to the last page.
    if (entry.number === total && totalPages) {
      entry.endPage = totalPages;
      entry.endPageSource = "book-end";
      continue;
    }

    // Nothing after it has been described yet — say so rather than stretching it
    // to the end of the book, which is what made Al-Baqarah look like pages 2-610.
    entry.endPage = null;
  }

  return entries;
}

module.exports = (models, router) => {
  const quraanIndexRouter = router.Router();

  // ── Master reference: 114 Surahs + 30 Parahs, English and Arabic ──────────
  // Static data — used to populate the admin dropdowns and to label the reader list.
  quraanIndexRouter.get("/quraanindex/reference", authenticate, async (req, res) => {
    try {
      return success(
        res,
        {
          surahs: SURAHS,
          juz: JUZ,
          totalSurahs: TOTAL_SURAHS,
          totalJuz: TOTAL_JUZ,
          // Which Parahs each Surah can belong to. The admin's Parah dropdown filters
          // itself with this, so a Parah that cannot occur in the current Surah is
          // never offered — that is what keeps the two selections in step.
          surahJuzMap: getSurahJuzMap(),
        },
        "Quraan reference fetched successfully"
      );
    } catch (err) {
      return error(res, err.message);
    }
  });

  // ── Page tags for a range of pages (admin, while paging through the PDF) ──
  quraanIndexRouter.get("/quraanindex/pages", authenticate, async (req, res) => {
    try {
      const { versionId, startPage, endPage } = req.query;
      if (!versionId) return warning(res, "versionId is required", MessageType.WARNING);

      const where = { versionId };
      const start = Number(startPage);
      const end = Number(endPage ?? startPage);
      if (Number.isInteger(start) && Number.isInteger(end)) {
        where.pageNumber = { [models.Sequelize.Op.between]: [start, end] };
      }

      const rows = await models.VersionPageIndex.findAll({
        where,
        order: [["pageNumber", "ASC"]],
      });

      const pages = rows.map((row) => ({
        id: row.id,
        pageNumber: row.pageNumber,
        surahNumber: row.surahNumber,
        juzNumber: row.juzNumber,
        isSurahStart: row.isSurahStart,
        isJuzStart: row.isJuzStart,
        isSurahEnd: row.isSurahEnd,
        isJuzEnd: row.isJuzEnd,
        surah: getSurah(row.surahNumber),
        juz: getJuz(row.juzNumber),
      }));

      return success(res, pages, "Page index fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  // ── Save the Surah / Parah description of one page, or a batch of pages ───
  // Body: { versionId, pageNumber, surahNumber, juzNumber, isSurahStart, isJuzStart }
  //   or: { versionId, entries: [{ pageNumber, surahNumber, juzNumber, ... }, ...] }
  // A page whose Surah and Parah are both cleared is removed from the index.
  quraanIndexRouter.post("/quraanindex/pages/save", authenticate, async (req, res) => {
    try {
      const { versionId } = req.body;
      if (!versionId) return warning(res, "versionId is required", MessageType.WARNING);

      const version = await models.BookVersion.findByPk(versionId, {
        attributes: ["id", "totalPages"],
      });
      if (!version) return warning(res, "Book version not found", MessageType.WARNING);

      const entries = Array.isArray(req.body.entries) ? req.body.entries : [req.body];
      if (entries.length === 0)
        return warning(res, "No pages to save", MessageType.WARNING);

      for (const entry of entries) {
        const pageNumber = Number(entry.pageNumber);
        if (!Number.isInteger(pageNumber) || pageNumber < 1)
          return warning(res, `Invalid page number: ${entry.pageNumber}`, MessageType.WARNING);
        if (version.totalPages && pageNumber > version.totalPages)
          return warning(
            res,
            `Page ${pageNumber} is beyond this version (${version.totalPages} pages)`,
            MessageType.WARNING
          );

        const surahNumber = entry.surahNumber ? Number(entry.surahNumber) : null;
        const juzNumber = entry.juzNumber ? Number(entry.juzNumber) : null;

        if (surahNumber !== null && (surahNumber < 1 || surahNumber > TOTAL_SURAHS))
          return warning(res, `Invalid Surah number: ${surahNumber}`, MessageType.WARNING);
        if (juzNumber !== null && (juzNumber < 1 || juzNumber > TOTAL_JUZ))
          return warning(res, `Invalid Parah number: ${juzNumber}`, MessageType.WARNING);

        // The Surah↔Parah relationship is fixed by the text itself, so a page whose
        // two selections cannot coexist is a data-entry slip — almost always a Parah
        // left over from an earlier page. Refuse it rather than storing a contradiction.
        if (!isJuzValidForSurah(surahNumber, juzNumber)) {
          const surah = getSurah(surahNumber);
          const allowed = getJuzNumbersForSurah(surahNumber);
          return warning(
            res,
            `Page ${pageNumber}: ${surah?.nameEnglish || `Surah ${surahNumber}`} is never part of Parah ${juzNumber}. ` +
              `It falls in Parah ${allowed.join(" or ")}.`,
            MessageType.WARNING
          );
        }

        entry._parsed = {
          pageNumber,
          surahNumber,
          juzNumber,
          isSurahStart: !!entry.isSurahStart && surahNumber !== null,
          isJuzStart: !!entry.isJuzStart && juzNumber !== null,
          isSurahEnd: !!entry.isSurahEnd && surahNumber !== null,
          isJuzEnd: !!entry.isJuzEnd && juzNumber !== null,
        };
      }

      // A Surah or Parah begins on exactly one page. Marking a start somewhere else
      // MOVES it — previously the second start was accepted and then silently ignored,
      // because the index builder resolved competing starts by taking the lowest page.
      const moves = [];

      await models.sequelize.transaction(async (t) => {
        for (const entry of entries) {
          const parsed = entry._parsed;

          const markers = [
            { kind: "surah", numberField: "surahNumber", flagField: "isSurahStart", noun: "" },
            { kind: "juz", numberField: "juzNumber", flagField: "isJuzStart", noun: "Parah " },
            { kind: "surah", numberField: "surahNumber", flagField: "isSurahEnd", noun: "", end: true },
            { kind: "juz", numberField: "juzNumber", flagField: "isJuzEnd", noun: "Parah ", end: true },
          ];

          for (const { kind, numberField, flagField, noun, end } of markers) {
            if (!parsed[flagField]) continue;

            const previous = await models.VersionPageIndex.findAll({
              where: {
                versionId,
                [numberField]: parsed[numberField],
                [flagField]: true,
                pageNumber: { [models.Sequelize.Op.ne]: parsed.pageNumber },
              },
              transaction: t,
            });

            for (const row of previous) {
              await row.update({ [flagField]: false }, { transaction: t });
              const meta =
                kind === "surah"
                  ? getSurah(parsed[numberField])
                  : getJuz(parsed[numberField]);
              moves.push(
                `${noun}${meta?.nameEnglish || parsed[numberField]}` +
                  ` now ${end ? "ends" : "starts"} on page ${parsed.pageNumber}` +
                  ` (moved from page ${row.pageNumber})`
              );
            }
          }

          const existing = await models.VersionPageIndex.findOne({
            where: { versionId, pageNumber: parsed.pageNumber },
            transaction: t,
          });

          // Clearing both fields means "this page is no longer described"
          if (parsed.surahNumber === null && parsed.juzNumber === null) {
            if (existing) await existing.destroy({ transaction: t });
            continue;
          }

          const values = { ...parsed, versionId, updatedBy: req.user?.id || null };
          if (existing) await existing.update(values, { transaction: t });
          else await models.VersionPageIndex.create(values, { transaction: t });
        }
      });

      return success(
        res,
        { saved: entries.length, moves },
        moves.length > 0 ? moves.join(". ") : "Page index saved successfully"
      );
    } catch (err) {
      console.error("QURAAN INDEX SAVE ERROR:", err);
      return error(res, err.message || "Failed to save page index");
    }
  });

  // ── Remove the description of a single page ───────────────────────────────
  quraanIndexRouter.delete("/quraanindex/pages/delete", authenticate, async (req, res) => {
    try {
      const { versionId, pageNumber } = req.query;
      if (!versionId || !pageNumber)
        return warning(res, "versionId and pageNumber are required", MessageType.WARNING);

      const deleted = await models.VersionPageIndex.destroy({
        where: { versionId, pageNumber: Number(pageNumber) },
      });

      if (!deleted) return warning(res, "Page is not indexed", MessageType.WARNING);
      return success(res, null, "Page index removed successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  // ── The reader index: Surah and Parah lists with their page ranges ────────
  // Used by the mobile app when a Quraan version is opened, and by the admin
  // "Full index" dialog (?includeUntagged=true also returns the not-yet-tagged ones).
  quraanIndexRouter.get("/quraanindex/version", authenticate, async (req, res) => {
    try {
      const { versionId, includeUntagged } = req.query;
      if (!versionId) return warning(res, "versionId is required", MessageType.WARNING);

      const version = await models.BookVersion.findByPk(versionId, {
        attributes: ["id", "versionName", "totalPages"],
      });
      if (!version) return warning(res, "Book version not found", MessageType.WARNING);

      const rows = await models.VersionPageIndex.findAll({
        where: { versionId },
        order: [["pageNumber", "ASC"]],
      });

      const wantAll = includeUntagged === "true" || includeUntagged === true;

      const surahs = buildIndex(rows, version.totalPages, {
        numberKey: "surahNumber",
        startFlagKey: "isSurahStart",
        endFlagKey: "isSurahEnd",
        lookup: getSurah,
        total: TOTAL_SURAHS,
        includeUntagged: wantAll,
      });

      const juz = buildIndex(rows, version.totalPages, {
        numberKey: "juzNumber",
        startFlagKey: "isJuzStart",
        endFlagKey: "isJuzEnd",
        lookup: getJuz,
        total: TOTAL_JUZ,
        includeUntagged: wantAll,
      });

      // Pages whose Surah and Parah cannot both be true. Shown in the admin index so
      // an out-of-step Parah is visible instead of quietly skewing the reader's list.
      const conflicts = rows
        .filter((row) => !isJuzValidForSurah(row.surahNumber, row.juzNumber))
        .map((row) => ({
          pageNumber: row.pageNumber,
          surahNumber: row.surahNumber,
          juzNumber: row.juzNumber,
          message:
            `Page ${row.pageNumber}: ${getSurah(row.surahNumber)?.nameEnglish || `Surah ${row.surahNumber}`}` +
            ` is not part of Parah ${row.juzNumber} — expected Parah ` +
            `${getJuzNumbersForSurah(row.surahNumber).join(" or ")}.`,
        }));

      // An end that lands before its own start, or that overlaps the next one, is a
      // mis-tag the admin should see rather than a range the reader silently inherits.
      for (const [list, noun] of [[surahs, ""], [juz, "Parah "]]) {
        for (const entry of list) {
          if (entry.startPage === null || entry.endPage === null) continue;

          const label = `${noun}${entry.nameEnglish || entry.number}`;
          if (entry.endPage < entry.startPage) {
            conflicts.push({
              pageNumber: entry.endPage,
              message: `${label} is marked as ending on page ${entry.endPage}, before it starts on page ${entry.startPage}.`,
            });
          }

          const next = list.find((e) => e.number === entry.number + 1);
          if (next && next.startPage !== null && entry.endPage >= next.startPage) {
            conflicts.push({
              pageNumber: entry.endPage,
              message:
                `${label} is marked as ending on page ${entry.endPage}, but ` +
                `${noun}${next.nameEnglish || next.number} already starts on page ${next.startPage}.`,
            });
          }
        }
      }

      return success(
        res,
        {
          versionId: version.id,
          versionName: version.versionName,
          totalPages: version.totalPages,
          taggedPages: rows.length,
          hasIndex: surahs.some((s) => s.startPage !== null),
          surahs,
          juz,
          conflicts,
        },
        "Version index fetched successfully"
      );
    } catch (err) {
      console.error("QURAAN INDEX FETCH ERROR:", err);
      return error(res, err.message || "Failed to fetch version index");
    }
  });

  return quraanIndexRouter;
};
