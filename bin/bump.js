#!/usr/bin/env node

const { exec } = require("child_process");
const plist = require("simple-plist");
const fs = require("fs");
const path = require("path");

const packageJson = require(process.cwd() + "/package.json");

var version = "unset";

const newVersion = process.argv[2];

const increaseVersion = version => {
  let versionArray = version.split(".").map(i => parseInt(i));
  versionArray[versionArray.length - 1]++;
  return versionArray.join(".");
};

plist.readFile(`ios/${packageJson.name}/Info.plist`, async (err, data) => {
  if (err) throw err;
  let d = data;
  let increasedVersion = increaseVersion(d.CFBundleShortVersionString);

  d.CFBundleVersion = `${++d.CFBundleVersion}`;
  d.CFBundleShortVersionString = newVersion || increasedVersion;

  plist.writeFile(`ios/${packageJson.name}/Info.plist`, d, err => {
    if (err) throw err;
    console.log(
      `=== BUMPED IOS TO VERSION ${d.CFBundleShortVersionString}b${d.CFBundleVersion} ===`
    );
    version = d.CFBundleShortVersionString + "b" + d.CFBundleVersion;

    fs.readFile("android/app/build.gradle", "utf8", async (err, data) => {
      if (err) throw err;
      let [versionNameText, versionName] = data.match(
        /versionName ["'](\d+.\d+.\d+)["']/
      );
      let [versionCodeText, versionCode] = data.match(/versionCode (\d+)/);
      versionName = newVersion || increaseVersion(versionName);
      versionCode = parseInt(versionCode);
      versionCode++;

      let newData = data.replace(
        versionNameText,
        `versionName "${versionName}"`
      );
      newData = newData.replace(versionCodeText, `versionCode ${versionCode}`);

      fs.writeFile("android/app/build.gradle", newData, err => {
        if (err) throw err;
        console.log(
          `=== BUMPED ANDROID TO VERSION ${versionName}b${versionCode} ===`
        );
      });

      console.log("bump");

      version = versionName + "b" + versionCode;

      exec(
        "git add android/app/build.gradle ios/" +
          packageJson.name +
          "/Info.plist",
        err => {
          console.log(version);
          if (err) {
            console.log(err);
            console.log("Couldn't execute command");
          }
          exec('git commit -m "bump version to "' + version);
        }
      );
    });
  });
});
