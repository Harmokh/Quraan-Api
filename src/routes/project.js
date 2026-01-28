const { success, warning, error, MessageType } = require("../utils/response");
const authenticate = require("../middleware/authorize");

module.exports = (models, router) => {
  const projectRouter = router.Router();

  // =========================
  // CREATE OR UPDATE PROJECT
  // POST /project/create
  // =========================
  projectRouter.post("/project/create", authenticate, async (req, res) => {
    try {
      const { id, slug, name, location } = req.body;

      if (!slug || !name || !location) {
        return warning(
          res,
          "Slug, name, and location are required",
          MessageType.Warning,
        );
      }

      // -------------------------
      // UPDATE
      // -------------------------
      if (id) {
        const project = await models.Project.findOne({
          where: { id, isDeleted: false },
        });

        if (!project) {
          return warning(res, "Project not found", MessageType.Warning);
        }

        // slug uniqueness check (exclude self)
        const slugExists = await models.Project.findOne({
          where: {
            slug,
            id: { [models.Sequelize.Op.ne]: id },
            isDeleted: false,
          },
        });

        if (slugExists) {
          return warning(res, "Slug already exists", MessageType.Warning);
        }

        await project.update({
          ...req.body,
          coordinates: req.body.coordinates
            ? JSON.stringify(req.body.coordinates)
            : null,
          images: req.body.images ? JSON.stringify(req.body.images) : null,
          clientReviews: req.body.clientReviews
            ? JSON.stringify(req.body.clientReviews)
            : null,
        });

        return success(res, project, "Project updated successfully");
      }

      // -------------------------
      // CREATE
      // -------------------------

      delete req.body.id;
      const exists = await models.Project.findOne({
        where: { slug, isDeleted: false },
      });

      if (exists) {
        return warning(res, "Project already exists", MessageType.Warning);
      }

      const project = await models.Project.create({
        ...req.body,
        coordinates: req.body.coordinates
          ? JSON.stringify(req.body.coordinates)
          : null,
        images: req.body.images ? JSON.stringify(req.body.images) : null,
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

      const rows = result.rows.map((p) => ({
        ...p.toJSON(),
        coordinates: p.coordinates ? JSON.parse(p.coordinates) : null,
        images: p.images ? JSON.parse(p.images) : [],
        clientReviews: p.clientReviews ? JSON.parse(p.clientReviews) : [],
      }));

      return success(
        res,
        { count: result.count, rows },
        "Projects fetched successfully",
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
        //   order: [["createdAt", "DESC"]],
      });

      // Get base URL for static files
      const baseUrl = process.env.STATIC_FILE_URL || "";

      const rows = result.map((p) => {
        const projectData = p.toJSON();

        // Parse JSON strings or use existing values
        let coordinates = null;
        try {
          coordinates = projectData.coordinates
            ? JSON.parse(projectData.coordinates)
            : null;
        } catch (error) {
          console.error("Error parsing coordinates:", error);
          coordinates = null;
        }

        // Handle images - could be string, array, or already parsed
        let images = [];
        try {
          if (projectData.images) {
            if (typeof projectData.images === "string") {
              const parsed = JSON.parse(projectData.images);
              if (Array.isArray(parsed)) {
                images = parsed;
              } else {
                images = [parsed];
              }
            } else if (Array.isArray(projectData.images)) {
              images = projectData.images;
            } else {
              images = [projectData.images];
            }
          }

          // Clean up images array - filter and map
          images = images
            .filter((img) => {
              if (!img) return false;

              // Handle empty objects
              if (typeof img === "object" && img !== null) {
                // Check if it's an empty object
                if (Object.keys(img).length === 0) return false;

                // Check if it has any image properties
                const hasImageProp =
                  img.url ||
                  img.imageUrl ||
                  img.src ||
                  img.path ||
                  img.filename;
                return !!hasImageProp;
              }

              // Handle strings
              if (typeof img === "string") {
                return img.trim() !== "";
              }

              return false;
            })
            .map((img) => {
              if (typeof img === "object" && img !== null) {
                // Extract image path from object
                const imgPath =
                  img.url ||
                  img.imageUrl ||
                  img.src ||
                  img.path ||
                  img.filename ||
                  "";
                // Concatenate with base URL if imgPath doesn't already start with http
                if (imgPath && !imgPath.startsWith("http")) {
                  return baseUrl + imgPath;
                }
                return imgPath;
              }

              // Handle string image paths
              const imgString = img.toString();
              if (imgString && !imgString.startsWith("http")) {
                return baseUrl + imgString;
              }
              return imgString;
            })
            // Remove any empty strings after processing
            .filter((img) => img && img.trim() !== "");
        } catch (error) {
          console.error("Error parsing images:", error);
          images = [];
        }

        // Handle clientReviews - FIXED THIS SECTION
        let clientReviews = [];
        try {
          if (projectData.clientReviews) {
            let parsedReviews = projectData.clientReviews;

            // Parse if it's a string
            if (typeof projectData.clientReviews === "string") {
              try {
                parsedReviews = JSON.parse(projectData.clientReviews);
              } catch (parseError) {
                console.error("Error parsing clientReviews JSON:", parseError);
                parsedReviews = [];
              }
            }

            // Ensure it's an array
            if (!Array.isArray(parsedReviews)) {
              parsedReviews = [parsedReviews];
            }

            // Process each review
            clientReviews = parsedReviews
              .filter(
                (review) =>
                  review &&
                  typeof review === "object" &&
                  Object.keys(review).length > 0,
              )
              .map((review) => {
                // Handle reviewImages - FIXED FIELD NAME
                let reviewImages = [];
                if (review.reviewImages) {
                  let parsedImages = review.reviewImages;

                  // Parse if it's a string
                  if (typeof review.reviewImages === "string") {
                    try {
                      parsedImages = JSON.parse(review.reviewImages);
                    } catch (parseError) {
                      console.error(
                        "Error parsing reviewImages JSON:",
                        parseError,
                      );
                      parsedImages = [];
                    }
                  }

                  // Ensure it's an array
                  if (!Array.isArray(parsedImages)) {
                    parsedImages = [parsedImages];
                  }

                  // Clean up review images and concatenate with base URL
                  reviewImages = parsedImages
                    .filter((img) => {
                      if (!img) return false;

                      // Handle empty objects
                      if (typeof img === "object" && img !== null) {
                        if (Object.keys(img).length === 0) return false;
                        const hasImageProp =
                          img.url ||
                          img.imageUrl ||
                          img.src ||
                          img.path ||
                          img.filename;
                        return !!hasImageProp;
                      }

                      if (typeof img === "string") {
                        return img.trim() !== "";
                      }

                      return false;
                    })
                    .map((img) => {
                      if (typeof img === "object" && img !== null) {
                        // Extract image path from object
                        const imgPath =
                          img.url ||
                          img.imageUrl ||
                          img.src ||
                          img.path ||
                          img.filename ||
                          "";
                        // Concatenate with base URL if imgPath doesn't already start with http
                        if (imgPath && !imgPath.startsWith("http")) {
                          return baseUrl + imgPath;
                        }
                        return imgPath;
                      }

                      // Handle string image paths
                      const imgString = img.toString();
                      if (imgString && !imgString.startsWith("http")) {
                        return baseUrl + imgString;
                      }
                      return imgString;
                    })
                    // Remove any empty strings after processing
                    .filter((img) => img && img.trim() !== "");
                }

                // Return review in the correct format (using 'images' field, not 'reviewImages')
                return {
                  name: review.name || "",
                  designation: review.designation || "",
                  rating: review.rating || 0,
                  comment: review.comment || "",
                  date: review.date || "",
                  images: reviewImages, // Note: using 'images' not 'reviewImages'
                };
              });
          }
        } catch (error) {
          console.error("Error parsing client reviews:", error);
          clientReviews = [];
        }

        // Format the response exactly as specified
        return {
          id: projectData.id,
          slug: projectData.slug || "",
          name: projectData.name || "",
          location: projectData.location || "",
          district: projectData.district || "",
          country: projectData.country || "",
          state: projectData.state || "",
          category: projectData.category || "",
          status: projectData.status || "",
          coordinates: coordinates,
          overview: projectData.overview || "",
          scopeOfWork: projectData.scopeOfWork || "",
          client: projectData.client || "",
          projectManagementConsultancy:
            projectData.projectManagementConsultancy || "",
          images: images,
          clientReviews: clientReviews, // This should now have data
          featured: !!projectData.featured,
        };
      });

      return success(res, rows, "Projects fetched successfully");
    } catch (err) {
      console.error("Error fetching projects for frontend:", err);
      return error(res, err.message);
    }
  });

  // GET ALL PROJECTS (Frontend)
  // GET /project/getallforfrontend
  // =========================
  projectRouter.get("/project/getallforfrontend", async (req, res) => {
    try {
      const result = await models.Project.findAll({
        where: { isDeleted: false },
        //   order: [["createdAt", "DESC"]],
      });

      const rows = result.map((p) => {
        const projectData = p.toJSON();

        // Parse JSON strings or use existing values
        let coordinates = null;
        try {
          coordinates = projectData.coordinates
            ? JSON.parse(projectData.coordinates)
            : null;
        } catch (error) {
          console.error("Error parsing coordinates:", error);
          coordinates = null;
        }

        // Handle images - could be string, array, or already parsed
        let images = [];
        try {
          if (projectData.images) {
            if (typeof projectData.images === "string") {
              const parsed = JSON.parse(projectData.images);
              if (Array.isArray(parsed)) {
                images = parsed;
              } else {
                images = [parsed];
              }
            } else if (Array.isArray(projectData.images)) {
              images = projectData.images;
            } else {
              images = [projectData.images];
            }
          }

          // Clean up images array - filter and map
          images = images
            .filter((img) => {
              if (!img) return false;

              // Handle empty objects
              if (typeof img === "object" && img !== null) {
                // Check if it's an empty object
                if (Object.keys(img).length === 0) return false;

                // Check if it has any image properties
                const hasImageProp =
                  img.url ||
                  img.imageUrl ||
                  img.src ||
                  img.path ||
                  img.filename;
                return !!hasImageProp;
              }

              // Handle strings
              if (typeof img === "string") {
                return img.trim() !== "";
              }

              return false;
            })
            .map((img) => {
              if (typeof img === "object" && img !== null) {
                return (
                  img.url ||
                  img.imageUrl ||
                  img.src ||
                  img.path ||
                  img.filename ||
                  ""
                );
              }
              return img.toString();
            });
        } catch (error) {
          console.error("Error parsing images:", error);
          images = [];
        }

        // Handle clientReviews
        let clientReviews = [];
        try {
          if (projectData.clientReviews) {
            if (typeof projectData.clientReviews === "string") {
              const parsed = JSON.parse(projectData.clientReviews);
              if (Array.isArray(parsed)) {
                clientReviews = parsed;
              } else {
                clientReviews = [parsed];
              }
            } else if (Array.isArray(projectData.clientReviews)) {
              clientReviews = projectData.clientReviews;
            } else {
              clientReviews = [projectData.clientReviews];
            }
          }

          // Clean up clientReviews
          clientReviews = clientReviews
            .filter((review) => review && typeof review === "object")
            .map((review) => {
              // Handle reviewImages
              let reviewImages = [];
              if (review.reviewImages) {
                if (Array.isArray(review.reviewImages)) {
                  reviewImages = review.reviewImages
                    .filter((img) => {
                      if (!img) return false;

                      // Handle empty objects in reviewImages
                      if (typeof img === "object" && img !== null) {
                        if (Object.keys(img).length === 0) return false;
                        const hasImageProp =
                          img.url ||
                          img.imageUrl ||
                          img.src ||
                          img.path ||
                          img.filename;
                        return !!hasImageProp;
                      }

                      if (typeof img === "string") {
                        return img.trim() !== "";
                      }

                      return false;
                    })
                    .map((img) => {
                      if (typeof img === "object" && img !== null) {
                        return (
                          img.url ||
                          img.imageUrl ||
                          img.src ||
                          img.path ||
                          img.filename ||
                          ""
                        );
                      }
                      return img.toString();
                    });
                }
              }

              return {
                name: review.name || "",
                designation: review.designation || "",
                rating: review.rating || 0,
                comment: review.comment || "",
                date: review.date || "",
                images: reviewImages,
              };
            });
        } catch (error) {
          console.error("Error parsing client reviews:", error);
          clientReviews = [];
        }

        // Format the response exactly as specified
        return {
          id: projectData.id,
          slug: projectData.slug || "",
          name: projectData.name || "",
          location: projectData.location || "",
          district: projectData.district || "",
          country: projectData.country || "",
          state: projectData.state || "",
          category: projectData.category || "",
          status: projectData.status || "",
          coordinates: coordinates,
          overview: projectData.overview || "",
          scopeOfWork: projectData.scopeOfWork || "",
          client: projectData.client || "",
          projectManagementConsultancy:
            projectData.projectManagementConsultancy || "",
          images: images,
          clientReviews: clientReviews,
          featured: !!projectData.featured,
        };
      });

      return success(res, rows, "Projects fetched successfully");
    } catch (err) {
      console.error("Error fetching projects for frontend:", err);
      return error(res, err.message);
    }
  });

  // =========================
  // GET PROJECT BY ID (Frontend)
  // GET /project/getbyid/:id
  // =========================
  projectRouter.get("/project/getallforfrontendbyid", async (req, res) => {
    try {
      const { id } = req.query;

      const project = await models.Project.findOne({
        where: {
          id: id,
          isDeleted: false,
        },
      });

      if (!project) {
        return error(res, "Project not found", 404);
      }

      const projectData = project.toJSON();

      // Get base URL for static files
      const baseUrl = process.env.STATIC_FILE_URL || "";

      // Parse JSON strings or use existing values
      let coordinates = null;
      try {
        coordinates = projectData.coordinates
          ? JSON.parse(projectData.coordinates)
          : null;
      } catch (error) {
        console.error("Error parsing coordinates:", error);
        coordinates = null;
      }

      // Handle images - could be string, array, or already parsed
      let images = [];
      try {
        if (projectData.images) {
          if (typeof projectData.images === "string") {
            const parsed = JSON.parse(projectData.images);
            if (Array.isArray(parsed)) {
              images = parsed;
            } else {
              images = [parsed];
            }
          } else if (Array.isArray(projectData.images)) {
            images = projectData.images;
          } else {
            images = [projectData.images];
          }
        }

        // Clean up images array - filter and map
        images = images
          .filter((img) => {
            if (!img) return false;

            // Handle empty objects
            if (typeof img === "object" && img !== null) {
              // Check if it's an empty object
              if (Object.keys(img).length === 0) return false;

              // Check if it has any image properties
              const hasImageProp =
                img.url || img.imageUrl || img.src || img.path || img.filename;
              return !!hasImageProp;
            }

            // Handle strings
            if (typeof img === "string") {
              return img.trim() !== "";
            }

            return false;
          })
          .map((img) => {
            if (typeof img === "object" && img !== null) {
              // Extract image path from object
              const imgPath =
                img.url ||
                img.imageUrl ||
                img.src ||
                img.path ||
                img.filename ||
                "";
              // Concatenate with base URL if imgPath doesn't already start with http
              if (imgPath && !imgPath.startsWith("http")) {
                return baseUrl + imgPath;
              }
              return imgPath;
            }

            // Handle string image paths
            const imgString = img.toString();
            if (imgString && !imgString.startsWith("http")) {
              return baseUrl + imgString;
            }
            return imgString;
          })
          // Remove any empty strings after processing
          .filter((img) => img && img.trim() !== "");
      } catch (error) {
        console.error("Error parsing images:", error);
        images = [];
      }

      // Handle clientReviews
      let clientReviews = [];
      try {
        if (projectData.clientReviews) {
          let parsedReviews = projectData.clientReviews;

          // Parse if it's a string
          if (typeof projectData.clientReviews === "string") {
            try {
              parsedReviews = JSON.parse(projectData.clientReviews);
            } catch (parseError) {
              console.error("Error parsing clientReviews JSON:", parseError);
              parsedReviews = [];
            }
          }

          // Ensure it's an array
          if (!Array.isArray(parsedReviews)) {
            parsedReviews = [parsedReviews];
          }

          // Process each review
          clientReviews = parsedReviews
            .filter(
              (review) =>
                review &&
                typeof review === "object" &&
                Object.keys(review).length > 0,
            )
            .map((review) => {
              // Handle reviewImages
              let reviewImages = [];
              if (review.reviewImages) {
                let parsedImages = review.reviewImages;

                // Parse if it's a string
                if (typeof review.reviewImages === "string") {
                  try {
                    parsedImages = JSON.parse(review.reviewImages);
                  } catch (parseError) {
                    console.error(
                      "Error parsing reviewImages JSON:",
                      parseError,
                    );
                    parsedImages = [];
                  }
                }

                // Ensure it's an array
                if (!Array.isArray(parsedImages)) {
                  parsedImages = [parsedImages];
                }

                // Clean up review images and concatenate with base URL
                reviewImages = parsedImages
                  .filter((img) => {
                    if (!img) return false;

                    // Handle empty objects
                    if (typeof img === "object" && img !== null) {
                      if (Object.keys(img).length === 0) return false;
                      const hasImageProp =
                        img.url ||
                        img.imageUrl ||
                        img.src ||
                        img.path ||
                        img.filename;
                      return !!hasImageProp;
                    }

                    if (typeof img === "string") {
                      return img.trim() !== "";
                    }

                    return false;
                  })
                  .map((img) => {
                    if (typeof img === "object" && img !== null) {
                      // Extract image path from object
                      const imgPath =
                        img.url ||
                        img.imageUrl ||
                        img.src ||
                        img.path ||
                        img.filename ||
                        "";
                      // Concatenate with base URL if imgPath doesn't already start with http
                      if (imgPath && !imgPath.startsWith("http")) {
                        return baseUrl + imgPath;
                      }
                      return imgPath;
                    }

                    // Handle string image paths
                    const imgString = img.toString();
                    if (imgString && !imgString.startsWith("http")) {
                      return baseUrl + imgString;
                    }
                    return imgString;
                  })
                  // Remove any empty strings after processing
                  .filter((img) => img && img.trim() !== "");
              }

              // Return review in the correct format
              return {
                name: review.name || "",
                designation: review.designation || "",
                rating: review.rating || 0,
                comment: review.comment || "",
                date: review.date || "",
                images: reviewImages,
              };
            });
        }
      } catch (error) {
        console.error("Error parsing client reviews:", error);
        clientReviews = [];
      }

      // Format the response
      const response = {
        id: projectData.id,
        slug: projectData.slug || "",
        name: projectData.name || "",
        location: projectData.location || "",
        district: projectData.district || "",
        country: projectData.country || "",
        state: projectData.state || "",
        category: projectData.category || "",
        status: projectData.status || "",
        coordinates: coordinates,
        overview: projectData.overview || "",
        scopeOfWork: projectData.scopeOfWork || "",
        client: projectData.client || "",
        projectManagementConsultancy:
          projectData.projectManagementConsultancy || "",
        images: images,
        clientReviews: clientReviews,
        featured: !!projectData.featured,
        createdAt: projectData.createdAt,
        updatedAt: projectData.updatedAt,
      };

      return success(res, response, "Project fetched successfully");
    } catch (err) {
      console.error("Error fetching project by id:", err);
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
        images: req.body.images ? JSON.stringify(req.body.images) : null,
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
        { where: { id } },
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
