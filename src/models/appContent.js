// Admin-edited text for the app's information pages (About Us, FAQ, Privacy
// Policy, Terms, Contact Us). A page without a row here falls back to the
// built-in default in routes/setting.js.
module.exports = (sequelize, Sequelize) => {
  const AppContent = sequelize.define(
    "AppContent",
    {
      key: {
        field: "Key",
        type: Sequelize.STRING(40),
        primaryKey: true,
      },
      title: {
        field: "Title",
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      html: {
        field: "Html",
        type: Sequelize.TEXT,
        allowNull: false,
      },
      updatedBy: {
        field: "UpdatedBy",
        type: Sequelize.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "AppContents",
      timestamps: true,
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt",
    }
  );

  return AppContent;
};
