module.exports = (sequelize, Sequelize) => {
  const QuraanAudio = sequelize.define(
    "QuraanAudio",
    {
      id: {
        field: "QuraanAudioId",
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      rects: {
        field: "Rects",
        type: Sequelize.JSONB,
        allowNull: false,
      },
      index: {
        field: "Index",
        type: Sequelize.INTEGER,
      },
      versionId: {
        field: "VersionId",
        type: Sequelize.UUID,
        allowNull: false,
      },
      audioUrl: {
        field: "AudioUrl",
        type: Sequelize.STRING,
        allowNull: true,
      },
      userId: {
        field: "UserId",
        type: Sequelize.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "QuraanAudios",
      timestamps: true,
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt",
    }
  );

  QuraanAudio.associate = (models) => {
    QuraanAudio.belongsTo(models.User, { foreignKey: "userId", as: "User" });
  };

  QuraanAudio.associate = (models) => {
    QuraanAudio.belongsTo(models.BookVersion, {
      foreignKey: "bookVersionId",
      targetKey: "id",
      as: "BookVersion",
    });
  };

  return QuraanAudio;
};
