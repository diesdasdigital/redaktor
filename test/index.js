"use strict";
const fs = require("fs-extra");
const child_process = require("child_process");
const path = require("path");
const test = require("tape");
const globby = require("globby");
const redaktor = require("../");

const sourceFiles = globby.sync("test/data/**/*.json", { nodir: true });

test("errors", async function (is) {
  is.plan(2);

  await fs.remove("test/html");

  try {
    await redaktor({
      dataFolder: "test/data",
      htmlFolder: "test/html",
      cmsFolder: "WRONG",
      files: sourceFiles,
    });
    is.fail("incorrect cms folder doesn’t error");
  } catch (error) {
    is.pass("errors when cms folder cannot be found");
  }

  try {
    await redaktor({
      dataFolder: "test/data",
      htmlFolder: "test/html",
      cmsFolder: "test/cms",
      files: sourceFiles,
    });
    is.pass("valid render function");
  } catch (error) {
    is.fail("valid parameters are failing");
  }

  await fs.remove("test/html");
});

test.skip("usage", async function (is) {
  is.plan(137);

  await fs.remove("test/html");

  await redaktor({
    dataFolder: "test/data",
    htmlFolder: "test/html",
    files: sourceFiles,
    defaultView: render,
  });

  await fs.remove("test/html");

  function render(currentFile, filesInCurrentFolder, allFiles) {
    is.pass("render called");

    is.equal(typeof currentFile, "object", "currentFile is object");
    is.ok("markdown" in currentFile, "currentFile has markdown");
    is.ok("path" in currentFile, "currentFile has path");

    is.ok(Array.isArray(filesInCurrentFolder), "folder collection is array");
    is.ok(
      filesInCurrentFolder.every(function (file) {
        return typeof file === "object";
      }),
      "folder collection contains objects"
    );
    is.ok(
      "markdown" in filesInCurrentFolder[0],
      "first item of folder collection has markdown"
    );
    is.ok(
      "path" in filesInCurrentFolder[0],
      "first item of folder collection has path"
    );

    is.ok(Array.isArray(allFiles), "allFiles is array");
    is.equal(
      allFiles.length,
      sourceFiles.length,
      "allFiles’ length is same as sourceFiles"
    );
    is.ok(
      allFiles.every(function (file) {
        return typeof file === "object";
      }),
      "allFiles contains objects"
    );
    is.ok("markdown" in allFiles[0], "first item of allFiles has markdown");
    is.ok("path" in allFiles[0], "first item of allFiles has path");

    if (currentFile.path === "index") {
      is.equal(filesInCurrentFolder.length, 2, "two other file in test/data");
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "test";
        }),
        'one of the files in test/data is "test"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/index";
        }),
        'one of the files in test/data is "folder/index"'
      );
    }
    if (currentFile.path === "test") {
      is.equal(filesInCurrentFolder.length, 2, "two other file in test/data");
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "index";
        }),
        'one of the files in test/data is "index"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/index";
        }),
        'one of the files in test/data is "folder/index"'
      );
    }
    if (currentFile.path === "folder/another") {
      is.equal(
        filesInCurrentFolder.length,
        4,
        "four other files in test/data/folder"
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/empty";
        }),
        'one of the files in test/data/folder is "empty"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/yaml-only";
        }),
        'one of the files in test/data/folder is "yaml-only"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/index";
        }),
        'one of the files in test/data/folder is "index"'
      );
      is.ok(
        filesInCurrentFolder.some(function (file) {
          return file.path === "folder/another_folder/index";
        }),
        'one of the files in test/data/folder is "another_folder/index"'
      );
    }
    if (currentFile.path === "folder/another_folder/index") {
      is.equal(
        filesInCurrentFolder.length,
        2,
        "two other file in test/data/folder/another_folder"
      );
      is.equal(
        filesInCurrentFolder[0].path,
        "folder/another_folder/another-deeply-nested",
        'other file in test/data/folder/another_folder is "another-deeply-nested"'
      );
      is.equal(
        filesInCurrentFolder[1].path,
        "folder/another_folder/deeply-nested",
        'other file in test/data/folder/another_folder is "deeply-nested"'
      );
    }
    if (currentFile.path === "folder/another_folder/deeply-nested") {
      is.equal(
        filesInCurrentFolder.length,
        2,
        "two other file in test/data/folder/another_folder"
      );
      is.equal(
        filesInCurrentFolder[0].path,
        "folder/another_folder/another-deeply-nested",
        'other file in test/data/folder/another_folder is "another-deeply-nested"'
      );
      is.equal(
        filesInCurrentFolder[1].path,
        "folder/another_folder/index",
        'other file in test/data/folder/another_folder is "index"'
      );
    }
    if (currentFile.path === "folder/another_folder/another-deeply-nested") {
      is.equal(
        filesInCurrentFolder.length,
        2,
        "two other file in test/data/folder/another_folder"
      );
      is.equal(
        filesInCurrentFolder[0].path,
        "folder/another_folder/deeply-nested",
        'other file in test/data/folder/another_folder is "deeply-nested"'
      );
      is.equal(
        filesInCurrentFolder[1].path,
        "folder/another_folder/index",
        'other file in test/data/folder/another_folder is "index"'
      );
    }

    return Promise.resolve(JSON.stringify(currentFile, null, 2));
  }
});

test("CLI", async function (is) {
  is.plan(9);
  await fs.remove("test/html");

  child_process.execSync("yarn build ./test");

  const expected1 = await fs.readFile("test/expected/index.html", "utf-8");
  const actual1 = await fs.readFile("test/html/index.html", "utf-8");
  is.equal(actual1, expected1, "rendered html equals expected html");

  const expected2 = await fs.readFile("test/expected/test.html", "utf-8");
  const actual2 = await fs.readFile("test/html/test.html", "utf-8");
  is.equal(actual2, expected2, "rendered html equals expected html");

  const expected3 = await fs.readFile(
    "test/expected/folder/index.html",
    "utf-8"
  );
  const actual3 = await fs.readFile("test/html/folder/index.html", "utf-8");
  is.equal(actual3, expected3, "rendered html equals expected html");

  const expected4 = await fs.readFile(
    "test/expected/folder/another.html",
    "utf-8"
  );
  const actual4 = await fs.readFile("test/html/folder/another.html", "utf-8");
  is.equal(actual4, expected4, "rendered html equals expected html");

  const expected5 = await fs.readFile(
    "test/expected/folder/another_folder/index.html",
    "utf-8"
  );
  const actual5 = await fs.readFile(
    "test/html/folder/another_folder/index.html",
    "utf-8"
  );
  is.equal(actual5, expected5, "rendered html equals expected html");

  const expected6 = await fs.readFile(
    "test/expected/folder/another_folder/deeply-nested.html",
    "utf-8"
  );
  const actual6 = await fs.readFile(
    "test/html/folder/another_folder/deeply-nested.html",
    "utf-8"
  );
  is.equal(actual6, expected6, "rendered html equals expected html");

  const expected7 = await fs.readFile(
    "test/expected/folder/another_folder/another-deeply-nested.html",
    "utf-8"
  );
  const actual7 = await fs.readFile(
    "test/html/folder/another_folder/another-deeply-nested.html",
    "utf-8"
  );
  is.equal(actual7, expected7, "rendered html equals expected html");

  const expected8 = await fs.readFile("test/expected/components.html", "utf-8");
  const actual8 = await fs.readFile("test/html/components.html", "utf-8");
  is.equal(actual8, expected8, "rendered html with components is as expected");

  const expected9 = await fs.readFile(
    "test/expected/custom-components.html",
    "utf-8"
  );
  const actual9 = await fs.readFile(
    "test/html/custom-components.html",
    "utf-8"
  );
  is.equal(
    actual9,
    expected9,
    "rendered html with custom components is as expected"
  );

  await fs.remove("test/html");
});
