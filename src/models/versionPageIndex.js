module.exports = (sequelize, Sequelize) => {
  // Maps a page of one book version (translation) to the Surah / Parah it belongs to.
  // Every translation paginates differently, so this is captured per version while
  // the admin walks the uploaded PDF page by page.
  const VersionPageIndex = sequelize.define(
    "VersionPageIndex",
    {
      id: {
        field: "VersionPageIndexId",
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: sequelize.literal("gen_random_uuid()"),
      },
      versionId: { field: "VersionId", type: Sequelize.UUID, allowNull: false },
      pageNumber: {
        field: "PageNumber",
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      // 1..114 — null means the page was tagged with a Parah only
      surahNumber: { field: "SurahNumber", type: Sequelize.INTEGER },
      // 1..30 — null means the page was tagged with a Surah only
      juzNumber: { field: "JuzNumber", type: Sequelize.INTEGER },
      // Set when this page is where the Surah/Parah actually begins. The index is
      // still derivable without it (first tagged page wins), but an explicit flag
      // lets the admin correct a mis-detected start.
      isSurahStart: {
        field: "IsSurahStart",
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isJuzStart: {
        field: "IsJuzStart",
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      // Where a Surah/Parah finishes. Usually derivable — one ends where the next
      // begins — but not at the end of the tagged range, across a gap, or where the
      // book carries an appendix after the text. Marking it removes the guesswork.
      isSurahEnd: {
        field: "IsSurahEnd",
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isJuzEnd: {
        field: "IsJuzEnd",
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      updatedBy: { field: "UpdatedBy", type: Sequelize.UUID },
    },
    {
      tableName: "VersionPageIndex",
      timestamps: true,
      createdAt: "CreatedAt",
      updatedAt: "UpdatedAt",
      indexes: [
        { unique: true, fields: ["VersionId", "PageNumber"] },
        { fields: ["VersionId", "SurahNumber"] },
        { fields: ["VersionId", "JuzNumber"] },
      ],
    }
  );

  VersionPageIndex.associate = (models) => {
    VersionPageIndex.belongsTo(models.BookVersion, {
      foreignKey: "versionId",
      targetKey: "id",
      as: "BookVersion",
      onDelete: "CASCADE",
    });
  };

  return VersionPageIndex;
};
