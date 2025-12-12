module.exports = (sequelize, Sequelize) => {
  const UserNote = sequelize.define(
    "UserNote",
    {
      id: {
        field: "UserNoteId",
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      page: {
        field: "Page",
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      x: {
        field: "X",
        type: Sequelize.DECIMAL(50, 30),
        allowNull: false,
      },
      y: {
        field: "Y",
        type: Sequelize.DECIMAL(50, 30),
        allowNull: false,
      },
      width: {
        field: "Width",
        type: Sequelize.DECIMAL(50, 30),
        allowNull: false,
      },
      height: {
        field: "Height",
        type: Sequelize.DECIMAL(50, 30),
        allowNull: false,
      },
      userId: {
        field: "UserId",
        type: Sequelize.UUID,
        allowNull: false,
      },
      audioUrl: {
        field: "AudioUrl",
        type: Sequelize.STRING,
        allowNull: true,
      },
      note: {
        field: "Note",
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "UserNotes",
      timestamps: true,
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt",
    }
  );

  UserNote.associate = (models) => {
    UserNote.belongsTo(models.User, { foreignKey: "userId", as: "User" });
  };

  return UserNote;
};
