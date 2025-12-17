const { success, warning, error, MessageType } = require("../utils/response");
const authenticate = require("../middleware/authorize");
const { Op } = require("sequelize");
const { Sequelize } = require("../models/models");

module.exports = (models, router) => {
  const quraanAudioRouter = router.Router();

  // quraanAudioRouter.post(
  //   "/quraanaudio/save",
  //   authenticate,
  //   async (req, res) => {
  //     try {
  //       const { id, rects, audioUrl, versionId, index } = req.body;

  //       if (!rects || !Array.isArray(rects) || rects.length === 0)
  //         return warning(res, "Rects array is required", MessageType.Warning);

  //       let quraanAudio;

  //       if (id) {
  //         const existing = await models.QuraanAudio.findOne({
  //           where: { id, userId: req.user.id },
  //         });

  //         if (!existing)
  //           return warning(res, "Quraan Audio not found", MessageType.Warning);

  //         await existing.update({
  //           rects,
  //           audioUrl,
  //           versionId,
  //           index,
  //         });

  //         quraanAudio = existing;
  //       } else {
  //         quraanAudio = await models.QuraanAudio.create({
  //           versionId,
  //           rects,
  //           audioUrl,
  //           userId: req.user.id,
  //           versionId,
  //           index,
  //         });
  //       }

  //       return success(res, quraanAudio, "Quraan Audio saved successfully");
  //     } catch (err) {
  //       return error(res, err.message || "Error saving Quraan Audio");
  //     }
  //   }
  // );

  quraanAudioRouter.post(
    "/quraanaudio/save",
    authenticate,
    async (req, res) => {
      try {
        const {
          id,
          rects,
          audioUrl,
          versionId,
          index: requestedIndex,
        } = req.body;

        if (!Array.isArray(rects) || rects.length === 0)
          return warning(res, "Rects array is required", MessageType.Warning);

        if (!versionId)
          return warning(res, "versionId is required", MessageType.Warning);

        let assignedIndex;

        // Fetch existing indexes for this version & user
        const existingIndexes = await models.QuraanAudio.findAll({
          where: { versionId, userId: req.user.id },
          attributes: ["index"],
          order: [["index", "ASC"]],
        });

        const usedIndexes = existingIndexes.map((e) => e.index);

        if (requestedIndex) {
          // Frontend requested a specific index
          if (usedIndexes.includes(requestedIndex)) {
            return warning(
              res,
              `The slot ${requestedIndex} is not available`,
              MessageType.Warning
            );
          }
          assignedIndex = requestedIndex;
        } else {
          // Auto-assign first empty slot
          assignedIndex = 1;
          while (usedIndexes.includes(assignedIndex)) {
            assignedIndex++;
          }
        }

        let quraanAudio;

        if (id) {
          const existing = await models.QuraanAudio.findOne({
            where: { id, userId: req.user.id },
          });

          if (!existing)
            return warning(res, "Quraan Audio not found", MessageType.Warning);

          await existing.update({
            rects,
            audioUrl,
            versionId,
            index: assignedIndex,
          });

          quraanAudio = existing;
        } else {
          quraanAudio = await models.QuraanAudio.create({
            versionId,
            rects,
            audioUrl,
            userId: req.user.id,
            index: assignedIndex,
          });
        }

        return success(res, quraanAudio, "Quraan Audio saved successfully");
      } catch (err) {
        return error(res, err.message || "Error saving Quraan Audio");
      }
    }
  );

  quraanAudioRouter.post(
    "/quraanaudio/attachaudio",
    authenticate,
    async (req, res) => {
      try {
        const {
          id,
          rects,
          audioUrl,
          versionId,
          index: requestedIndex,
        } = req.body;

        if (!Array.isArray(rects) || rects.length === 0)
          return warning(res, "Rects array is required", MessageType.Warning);

        if (!versionId)
          return warning(res, "versionId is required", MessageType.Warning);

        let quraanAudio;

        if (id) {
          const existing = await models.QuraanAudio.findOne({
            where: { id, userId: req.user.id },
          });

          if (!existing)
            return warning(res, "Quraan Audio not found", MessageType.Warning);

          await existing.update({
            audioUrl,
          });

          quraanAudio = existing;
        } else {
          quraanAudio = await models.QuraanAudio.create({
            versionId,
            rects,
            audioUrl,
            userId: req.user.id,
            index: assignedIndex,
          });
        }

        return success(res, quraanAudio, "Quraan Audio saved successfully");
      } catch (err) {
        return error(res, err.message || "Error saving Quraan Audio");
      }
    }
  );

  quraanAudioRouter.get(
    "/quraanaudio/getall",
    authenticate,
    async (req, res) => {
      try {
        const pageStart = Number(req.query.pageStart);
        const pageEnd = Number(req.query.pageEnd);
        const versionId = req.query.versionId;

        if (!versionId) {
          return warning(res, "versionId is required");
        }

        if (isNaN(pageStart) || isNaN(pageEnd)) {
          return error(res, "Invalid page range");
        }

        // 🧠 Use PostgreSQL JSONB filtering to only fetch relevant records
        const audios = await models.QuraanAudio.findAll({
          where: {
            versionId: versionId,
            [Op.and]: [
              // Only rows having at least one rect with page between the range
              Sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM jsonb_array_elements("Rects") AS rect
                WHERE (rect->>'page')::int BETWEEN ${pageStart} AND ${pageEnd}
              )
            `),
            ],
          },
          attributes: [
            "id",
            "audioUrl",
            "rects",
            "index",
            "CreatedAt",
            "versionId",
          ],
          order: [["CreatedAt", "DESC"]],
          raw: true,
        });

        // 🧩 Adjust the rects (normalize page indices)
        const processedAudios = audios.map((audio) => {
          const rects = (audio.rects || []).filter(
            (r) => r.page >= pageStart && r.page <= pageEnd
          );

          const normalizedRects = rects.map((r) => ({
            ...r,
            page: r.page - pageStart,
          }));

          return {
            ...audio,
            rects: normalizedRects,
          };
        });

        return success(
          res,
          processedAudios,
          "Quraan Audios fetched successfully"
        );
      } catch (err) {
        console.error("Error fetching Quraan Audios:", err);
        return error(res, err.message || "Error fetching Quraan Audios");
      }
    }
  );

  quraanAudioRouter.get(
    "/quraanaudio/getbyid",
    authenticate,
    async (req, res) => {
      try {
        const { id } = req.query;
        if (!id)
          return warning(
            res,
            "Quraan Audio id is required",
            MessageType.Warning
          );

        const audio = await models.QuraanAudio.findOne({
          where: { id, userId: req.user.id },
        });

        if (!audio)
          return warning(res, "Quraan Audio not found", MessageType.Warning);

        return success(res, audio, "Quraan Audio fetched successfully");
      } catch (err) {
        return error(res, err.message || "Error fetching Quraan Audio");
      }
    }
  );

  quraanAudioRouter.delete(
    "/quraanaudio/delete",
    authenticate,
    async (req, res) => {
      try {
        const { id } = req.query;
        if (!id)
          return warning(
            res,
            "Quraan Audio id is required",
            MessageType.Warning
          );

        const deleted = await models.QuraanAudio.destroy({
          where: { id, userId: req.user.id },
        });

        if (!deleted)
          return warning(res, "Quraan Audio not found", MessageType.Warning);

        return success(res, null, "Quraan Audio deleted successfully");
      } catch (err) {
        return error(res, err.message || "Error deleting Quraan Audio");
      }
    }
  );

  return quraanAudioRouter;
};
