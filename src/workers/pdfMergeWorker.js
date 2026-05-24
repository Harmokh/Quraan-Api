/**
 * Worker thread for CPU-heavy PDF merging.
 * Runs off the main event loop so concurrent users stay responsive.
 *
 * workerData: { versionDir, totalPages, destPath }
 * posts:      { ok: true } | { ok: false, error: string }
 */
const { workerData, parentPort } = require("worker_threads");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs/promises");
const path = require("path");

async function run() {
  const { versionDir, totalPages, destPath } = workerData;

  // Read all page files concurrently
  const allBytes = await Promise.all(
    Array.from({ length: totalPages }, (_, i) =>
      fs.readFile(path.join(versionDir, `page-${i + 1}.pdf`))
    )
  );

  // Merge into one document
  const merged = await PDFDocument.create();
  for (const bytes of allBytes) {
    const src = await PDFDocument.load(bytes);
    const [page] = await merged.copyPages(src, [0]);
    merged.addPage(page);
  }

  // Atomic write: temp file then rename — no corrupt file served on crash
  const tmp = destPath + ".tmp";
  await fs.writeFile(tmp, Buffer.from(await merged.save({ useObjectStreams: true })));
  await fs.rename(tmp, destPath);

  parentPort.postMessage({ ok: true });
}

run().catch((err) => parentPort.postMessage({ ok: false, error: err.message }));
