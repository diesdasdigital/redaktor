/* eslint no-console: 0 */
"use strict";
const path = require("path");

const fs = require("fs-extra");
const chalk = require("chalk");
const { cloneDeep } = require("lodash");

const DEFAULT_LANGUAGE = "en";

const REGEX_NO_FOLDER = /^[^\/]+(\/index)?$/;
async function redaktor(cliParams) {
  const fileContents = await Promise.all(
    (cliParams.files || []).map(getFileContents(cliParams.dataFolder))
  );

  const withoutSkippedFiles = fileContents.filter(Boolean);

  const renderedFiles = await Promise.all(
    withoutSkippedFiles.map(
      renderEachFile(
        cliParams.htmlFolder,
        cliParams.viewFolder,
        cliParams.documentFolder
      )
    )
  );

  console.log(chalk.green(`✅ rendered ${renderedFiles.length} files`));
}

function getFileContents(dataFolder) {
  return async (filePath) => {
    try {
      const extension = path.extname(filePath);
      const relativePath = path
        .relative(dataFolder, filePath)
        .replace(new RegExp(extension + "$"), "");

      console.log(chalk.blue("👓 reading " + filePath));
      const data = await fs.readJSON(filePath);

      return { data, path: relativePath };
    } catch (error) {
      console.error(`⏩ skipped ${filePath}: ${error}`);
      return false;
    }
  };
}

function renderEachFile(htmlFolder, viewFolder, documentFolder) {
  return async (file, _, allFiles) => {
    const currentFolder = path.join(file.path, "..");
    const folderPattern =
      currentFolder === "."
        ? REGEX_NO_FOLDER
        : new RegExp("^" + currentFolder + "/[^/]+(/index)?$");

    const filesInCurrentFolder = allFiles.filter(function (testedFile) {
      return (
        folderPattern.test(testedFile.path) && testedFile.path !== file.path
      );
    });

    const destinationPath = path.join(htmlFolder, file.path + ".html");
    const clonedFile = cloneDeep(file);

    console.log(chalk.cyan("⚙️ rendering " + file.path));
    const documentFunction = require(path.resolve(documentFolder, "default"));
    const viewFunction = require(path.resolve(
      viewFolder,
      file.data.default.required.pageType || "default"
    ));

    const renderedView = await viewFunction(
      clonedFile,
      cloneDeep(filesInCurrentFolder),
      cloneDeep(allFiles)
    );

    console.log(clonedFile);

    const renderedHtml = await documentFunction(clonedFile, renderedView);

    console.log(chalk.yellow("🖨 writing " + clonedFile.path));
    await fs.outputFile(destinationPath, renderedHtml);
    clonedFile.renderedPath = destinationPath;

    return clonedFile;
  };
}

module.exports = redaktor;
