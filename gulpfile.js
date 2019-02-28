const gulp = require("gulp");
const server = require("browser-sync");

const htmlBeautify = require("gulp-html-beautify");
const ejs = require("gulp-ejs");

const babel = require("gulp-babel");
const uglify = require("gulp-uglify");

const spritesmith = require("gulp.spritesmith");
const svgSprite = require("gulp-svg-sprite");
const cheerio = require("gulp-cheerio");
const imagemin = require("gulp-imagemin");
const svgmin = require("gulp-svgmin");

const sass = require("gulp-sass");
const cleanCSS = require("gulp-clean-css");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const sourcemaps = require("gulp-sourcemaps");

const rename = require("gulp-rename");
const concat = require("gulp-concat");
const replace = require("gulp-replace");
const del = require("del");

// ------------------------ server and watcher----------------------

gulp.task("serve", () => {
  server({
    server: { baseDir: "./build" },
    port: 3000,
    notify: false,
  });
  gulp.watch("src/html/**/*.ejs", gulp.series("html", reload));
  gulp.watch("src/styles/**/*.scss", gulp.series("styles"));
  gulp.watch("src/js/main.js", gulp.series("js:main", reload));
});

function reload(done) {
  server.reload();
  done();
}

// --------- TASKS CLEAN ---------

gulp.task("clean", () => del("./build"));

// --------- TASKS HTML ---------

gulp.task("html", () => {
  return gulp
    .src("src/html/*.ejs")
    .pipe(ejs({}, {}, { ext: ".html" }))
    .pipe(htmlBeautify({ indent_size: 2, unformatted: ["a"] }))
    .pipe(gulp.dest("./build"));
});

// --------- TASK STYLES ---------

gulp.task("styles", () => {
  return gulp
    .src("src/styles/main.scss")
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: "expand" }))
    .pipe(
      postcss([
        autoprefixer({
          browsers: [
            "last 2 version",
            "last 7 Chrome versions",
            "last 10 Opera versions",
            "last 7 Firefox versions",
          ],
        }),
      ]),
    )
    .pipe(rename("styles.css"))
    .pipe(sourcemaps.write("/"))
    .pipe(gulp.dest("./build/css"))
    .pipe(server.stream())
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename("styles.min.css"))
    .pipe(gulp.dest("./build/css"));
});

// --------- TASK JS:LIBS ---------

gulp.task("js:libs", () =>
  gulp
    .src([
      "src/libs/jquery/dist/jquery.min.js",
      // "src/libs/waypoints/lib/jquery.waypoints.min.js",
      // "src/libs/bxslider/dist/jquery.bxslider.min.js",
      // "src/libs/owl.carousel/dist/owl.carousel.min.js",
      // "src/libs/magnific-popup/dist/jquery.magnific-popup.min.js",
      // "src/libs/animateNumber/jquery.animateNumber.min.js",
    ])
    .pipe(concat("vendor.js"))
    .pipe(gulp.dest("./build/js")),
);

// --------- TASK JS:MAIN ---------

gulp.task("js:main", () =>
  gulp
    .src("src/js/main.js")
    .pipe(babel())
    .pipe(gulp.dest("./build/js"))
    .pipe(server.stream()),
);

// --------- TASK JS:BUNDLE ---------

gulp.task(
  "js:bundle",
  gulp.series(
    function wrap() {
      return gulp
        .src(["./build/js/vendor.js", "./build/js/main.js"])
        .pipe(concat("scripts.min.js"))
        .pipe(uglify())
        .pipe(gulp.dest("./build/js"));
    },
    function clear() {
      return del(["./build/js/vendor.js", "./build/js/main.js"]);
    },
  ),
);

// --------- TASK FONTS ---------

gulp.task("fonts", () => {
  return gulp.src("src/fonts/**").pipe(gulp.dest("./build/fonts"));
});

gulp.task("img", () => {
  return gulp.src("src/img/**").pipe(gulp.dest("./build/img"));
});

// --------- TASK JS:BUNDLE ---------

gulp.task("img:opt", () => {
  return gulp
    .src(["src/img/**/*.{png,jpg,gif,svg,ico}"])
    .pipe(
      imagemin([
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.svgo(),
      ]),
    )
    .pipe(gulp.dest("./build/img"));
});

// --------- TASK SPRITE:SVG ---------

gulp.task("sprite:svg", () => {
  return gulp
    .src("src/sprites/svg/icon-*.svg")
    .pipe(svgmin({ js2svg: { pretty: true } }))
    .pipe(
      cheerio({
        run: $ => {
          $("[fill]").removeAttr("fill");
          $("[stroke]").removeAttr("stroke");
          $("[style]").removeAttr("style");
        },
        parserOptions: { xmlMode: true },
      }),
    )
    .pipe(replace("&gt;", ">"))
    .pipe(
      svgSprite({
        shape: {
          dimension: { maxWidth: 32, maxHeight: 32 },
        },
        mode: {
          symbol: { sprite: "../sprite.svg" },
        },
      }),
    )
    .pipe(gulp.dest("./build/img"));
});

// --------- TASK SPRITE:PNG ---------

gulp.task("sprite:png", done => {
  const data = gulp.src("src//sprites/png/icon-*.png").pipe(
    spritesmith({
      imgName: "sprite.png",
      cssName: "sprite-png.css",
      imgPath: "../img/sprite.png",
      padding: 4,
    }),
  );

  data.img.pipe(gulp.dest(`src/img`));
  data.css.pipe(gulp.dest(`src/styles/includes`));
  done();
});

// --------- BUILD ---------

gulp.task(
  "build",
  gulp.series(
    "clean",
    "html",
    "fonts",
    "styles",
    "img",
    // "img:opt",
    "sprite:svg",
    "js:libs",
    "js:main",
    // "js:bundle",
  ),
);

gulp.task("default", gulp.series("build", "serve"));
