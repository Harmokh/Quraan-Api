module.exports = (sequelize, Sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        field: "Id",
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: sequelize.literal("gen_random_uuid()"),
      },

      slug: {
        field: "Slug",
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      name: {
        field: "Name",
        type: Sequelize.STRING,
        allowNull: false,
      },

      city: {
        field: "City",
        type: Sequelize.STRING,
        allowNull: false,
      },

      location: {
        field: "Location",
        type: Sequelize.STRING,
        allowNull: false,
      },

      location: {
        field: "Location",
        type: Sequelize.STRING,
      },

      district: {
        field: "District",
        type: Sequelize.STRING,
      },

      country: {
        field: "Country",
        type: Sequelize.STRING,
      },

      state: {
        field: "State",
        type: Sequelize.STRING,
      },

      category: {
        field: "Category",
        type: Sequelize.STRING,
      },

      status: {
        field: "Status",
        type: Sequelize.STRING,
      },

      coordinates: {
        field: "Coordinates",
        type: Sequelize.TEXT, // JSON.stringify({lat, lng})
      },

      overview: {
        field: "Overview",
        type: Sequelize.TEXT,
      },

      scopeOfWork: {
        field: "ScopeOfWork",
        type: Sequelize.TEXT,
      },

      client: {
        field: "Client",
        type: Sequelize.TEXT,
      },

      projectManagementConsultancy: {
        field: "PMC",
        type: Sequelize.STRING,
      },

      images: {
        field: "Images",
        type: Sequelize.TEXT, // JSON.stringify([...])
      },

      clientReviews: {
        field: "ClientReviews",
        type: Sequelize.TEXT, // JSON.stringify([...])
      },

      featured: {
        field: "Featured",
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      isActive: {
        field: "IsActive",
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      isDeleted: {
        field: "IsDeleted",
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "Projects",
      timestamps: true,
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt",
    },
  );

  return Project;
};
