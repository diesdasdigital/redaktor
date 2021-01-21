"use strict";
var fs = require("fs-extra");
var child_process = require("child_process");
var path = require("path");
var test = require("tape");
var globby = require("globby");
var redaktor = require("../");

var sourcePatterns = ["**/*.md", "**/*.markdown"].map(function (file) {
  return path.join("test/data", file);
});

var sourceFiles = globby.sync(sourcePatterns, { nodir: true });

test("errors", async function (is) {
  is.plan(2);

  await fs.remove("test/html");

  try {
    await redaktor({
      contentFolder: "test/data",
      publicFolder: "test/html",
      files: sourceFiles,
      renderFile: ""
    });
    is.fail("missing render function doesn’t error");
  } catch (error) {
    is.pass("render !== function throws");
  }

  try {
    await redaktor({
      contentFolder: "test/data",
      publicFolder: "test/html",
      files: sourceFiles,
      renderFile: function () {
        return Promise.resolve("html");
      }
    });
    is.pass("valid render function");
  } catch (error) {
    is.fail("valid parameters are failing");
  }

  await fs.remove("test/html");
});

test("usage", async function (is) {
  is.plan(137);

  await fs.remove("test/html");

  await redaktor({
    contentFolder: "test/data",
    publicFolder: "test/html",
    files: sourceFiles,
    renderFile: render
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
  is.plan(1);
  await fs.remove("test/html");

  child_process.execSync("yarn build ./test");
  const expected = await fs.readFile("test/expected/index.html", "UTF-8");
  const actual = await fs.readFile("test/html/index.html", "UTF-8");

  is.equal(expected, actual, "rendered html equals expected html");

  await fs.remove("test/html");
});
