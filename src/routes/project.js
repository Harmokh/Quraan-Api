const { success, warning, error, MessageType } = require("../utils/response");
const authenticate = require("../middleware/authorize");

module.exports = (models, router) => {
  const projectRouter = router.Router();

  // =========================
  // CREATE PROJECT
  // POST /project/create
  // =========================
  projectRouter.post("/project/create", authenticate, async (req, res) => {
    try {
      const { slug, name, location } = req.body;
      delete req.body.id
      if (!slug || !name || !location)
        return warning(res, "Slug, name, and location are required", MessageType.Warning);

      const exists = await models.Project.findOne({
        where: { slug, isDeleted: false },
      });

      if (exists)
        return warning(res, "Project already exists", MessageType.Warning);

      const project = await models.Project.create({
        ...req.body,
        coordinates: req.body.coordinates
          ? JSON.stringify(req.body.coordinates)
          : null,
        images: req.body.images
          ? JSON.stringify(req.body.images)
          : null,
        clientReviews: req.body.clientReviews
          ? JSON.stringify(req.body.clientReviews)
          : null,
      });

      return success(res, project, "Project created successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  // =========================
  // GET ALL PROJECTS
  // GET /project/getall
  // =========================
  projectRouter.get("/project/getall", async (req, res) => {
    try {
      const { pageSize = 10, currentPage = 1 } = req.query;

      const result = await models.Project.findAndCountAll({
        where: { isDeleted: false },
        limit: parseInt(pageSize),
        offset: (parseInt(currentPage) - 1) * parseInt(pageSize),
        order: [["CreatedAt", "DESC"]],
      });

      const rows = result.rows.map(p => ({
        ...p.toJSON(),
        coordinates: p.coordinates ? JSON.parse(p.coordinates) : null,
        images: p.images ? JSON.parse(p.images) : [],
        clientReviews: p.clientReviews
          ? JSON.parse(p.clientReviews)
          : [],
      }));

      return success(
        res,
        { count: result.count, rows },
        "Projects fetched successfully"
      );
    } catch (err) {
      return error(res, err.message);
    }
  });

   // =========================
// GET ALL PROJECTS (Frontend)
// GET /project/getallforfrontend
// =========================
projectRouter.get("/project/getallforfrontend", async (req, res) => {
  try {
    const result = await models.Project.findAll({
      where: { isDeleted: false },
      order: [["CreatedAt", "DESC"]],
    });

    const rows = result.map(p => ({
      ...p.toJSON(),
      coordinates: p.coordinates ? JSON.parse(p.coordinates) : null,
      images: p.images ? JSON.parse(p.images) : [],
      clientReviews: p.clientReviews
        ? JSON.parse(p.clientReviews)
        : [],
    }));

    return success(
      res,
      rows,
      "Projects fetched successfully"
    );
  } catch (err) {
    return error(res, err.message);
  }
});


  // =========================
  // GET PROJECT BY ID
  // GET /project/getbyid?id=
  // =========================
  projectRouter.get("/project/getbyid", async (req, res) => {
    try {
      const { id } = req.query;

      if (!id)
        return warning(res, "Project id is required", MessageType.Warning);

      const project = await models.Project.findOne({
        where: { id, isDeleted: false },
      });

      if (!project)
        return warning(res, "Project not found", MessageType.Warning);

      const data = {
        ...project.toJSON(),
        coordinates: project.coordinates
          ? JSON.parse(project.coordinates)
          : null,
        images: project.images ? JSON.parse(project.images) : [],
        clientReviews: project.clientReviews
          ? JSON.parse(project.clientReviews)
          : [],
      };

      return success(res, data, "Project fetched successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  // =========================
  // UPDATE PROJECT
  // PUT /project/update
  // =========================
  projectRouter.put("/project/update", authenticate, async (req, res) => {
    try {
      const { id, location } = req.body;

      if (!id)
        return warning(res, "Project id is required", MessageType.Warning);
      
      if (!location)
        return warning(res, "Location is required", MessageType.Warning);

      const payload = {
        ...req.body,
        coordinates: req.body.coordinates
          ? JSON.stringify(req.body.coordinates)
          : null,
        images: req.body.images
          ? JSON.stringify(req.body.images)
          : null,
        clientReviews: req.body.clientReviews
          ? JSON.stringify(req.body.clientReviews)
          : null,
      };

      // Remove id from payload to avoid updating it
      delete payload.id;

      const [updated] = await models.Project.update(payload, {
        where: { id, isDeleted: false },
      });

      if (!updated)
        return warning(res, "Project not found", MessageType.Warning);

      return success(res, null, "Project updated successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  // =========================
  // DELETE PROJECT (SOFT)
  // DELETE /project/delete?id=
  // =========================
  projectRouter.delete("/project/delete", authenticate, async (req, res) => {
    try {
      const { id } = req.query;

      if (!id)
        return warning(res, "Project id is required", MessageType.Warning);

      const [updated] = await models.Project.update(
        { isDeleted: true },
        { where: { id } }
      );

      if (!updated)
        return warning(res, "Project not found", MessageType.Warning);

      return success(res, null, "Project deleted successfully");
    } catch (err) {
      return error(res, err.message);
    }
  });

  return projectRouter;
};