module.exports = (sequelize, Sequelize) => {
  const Bookmark = sequelize.define(
    "Bookmark",
    {
      id: {
        field: "BookmarkId",
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: sequelize.literal("gen_random_uuid()"),
      },
      userId: { field: "UserId", type: Sequelize.UUID, allowNull: false },
      bookVersionId: {
        field: "BookVersionId",
        type: Sequelize.UUID,
        allowNull: false,
      },
      pageNumber: {
        field: "PageNumber",
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      // Category colour id chosen in the app (e.g. "green") and an optional note
      color: {
        field: "Color",
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      note: {
        field: "Note",
        type: Sequelize.STRING(500),
        allowNull: true,
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
      tableName: "Bookmarks",
      timestamps: true,
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt",
      // Not unique: a user may keep several (differently coloured) bookmarks on
      // the same page. The old unique index is dropped after sync (models.js).
      indexes: [
        {
          name: "bookmarks_user_version_page_idx",
          fields: ["UserId", "BookVersionId", "PageNumber"],
        },
      ],
    }
  );

  Bookmark.associate = (models) => {
    Bookmark.belongsTo(models.User, {
      foreignKey: "userId",
      targetKey: "id",
      as: "User",
    });
    Bookmark.belongsTo(models.BookVersion, {
      foreignKey: "bookVersionId",
      targetKey: "id",
      as: "BookVersion",
    });
  };

  return Bookmark;
};
