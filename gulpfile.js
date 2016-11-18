var ava = require("gulp-ava");
var coveralls = require("gulp-coveralls");
var del = require("del");
var gulp = require("gulp");
var gutil = require("gulp-util");
var merge = require("merge2");
var rename = require("gulp-rename");
var ts = require("gulp-typescript");
var transform = require("gulp-transform");
var typings = require("gulp-typings");
var uglify = require("gulp-uglify");

var sourceGlob = "src/**/*.ts";
var testGlob = "tst/**/*.ts";

var browserOutputDir = "lib";
var sourceOutputDir = "lib/src";
var testOutputDir = "lib/tst";

var compiledTestGlob = "lib/tst/TestCases/**/*.js";

var browserEntry = "lib/src/FastSax.js";
var browserOutputName = "fast-sax.min";
var browserStandaloneName = "FastSax";

var tsSourceProject = ts.createProject({
    "target": "es3",
    "module": "commonjs",
    "declaration": true
});

var tsTestProject = ts.createProject({
    "target": "es6",
    "module": "commonjs",
    "declaration": false
});

gulp.task("typings", function () {
    return gulp.src("./typings.json").pipe(typings());
});

gulp.task("build", ["typings"], function () {
    var tsResult = gulp.src(sourceGlob)
        .pipe(tsSourceProject(ts.reporter.longReporter()));

    return merge([
        tsResult.js.pipe(gulp.dest(sourceOutputDir)),
        tsResult.dts.pipe(gulp.dest(sourceOutputDir))
    ]);
});

gulp.task("watch-build", ["build"], function () {
    gulp.watch(sourceGlob, ["build"]);
});

gulp.task("build-tests", ["typings"], function () {
    var tsResult = gulp.src(testGlob)
        .pipe(tsTestProject(ts.reporter.longReporter()));

    return tsResult.js
        .pipe(gulp.dest(testOutputDir))
});

gulp.task("test", ["build-tests", "build"], function () {
    return gulp.src(compiledTestGlob)
        .pipe(ava({
            nyc: true,
            concurrency: 4,
        }));
});

gulp.task("watch-test", ["test"], function () {
    return gulp.watch([sourceGlob, testGlob], ["test"]);
});

gulp.task("coveralls", function () {
    return gulp.src("./coverage/lcov.info")
        .pipe(coveralls());
});

gulp.task("copy-d-ts", ["build"], function () {
    return gulp.src(`./${browserStandaloneName}.d.ts`)
        .pipe(gulp.dest(browserOutputDir));
});

gulp.task("build-dist", ["build", "copy-d-ts"], function () {
    /*
     * Browserify has overhead which nearly doubles the size of the FastSax bundle. As FastSax is a single self-contained
     * CommonJS file, it is reasonable to instead wrap it in an IIFE and expose it on the window.
     */
    return gulp.src(browserEntry)
        .pipe(transform((contents) => {
            return `(function(){${contents.replace("module.exports", `window["${browserStandaloneName}"]`)}})()`;
        }, {encoding: "utf8"}))
        .pipe(uglify())
        .pipe(rename((path) => {
            path.basename = browserOutputName;
        }))
        .on("error", gutil.log)
        .pipe(gulp.dest(browserOutputDir));
});

gulp.task("clean", function () {
    return del([
        "lib",
        "coverage",
        ".nyc_output",
    ]);
});

gulp.task("default", ["build-dist", "test"]);
