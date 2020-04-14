const gulp = require("gulp");
const plumber = require("gulp-plumber");
const htmlBeautify = require("gulp-html-beautify");
const pug = require("gulp-pug");
const scss = require("gulp-sass");
const cleanCSS = require("gulp-clean-css");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const argv = require("yargs").argv;
const gulpif = require("gulp-if");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const buffer = require("vinyl-buffer");
const imagemin = require("gulp-imagemin");
const merge = require("merge-stream");
const spritesmith = require("gulp.spritesmith");
const svgSprite = require("gulp-svg-sprite");
const svgmin = require("gulp-svgmin");
const cheerio = require("gulp-cheerio");
const replace = require("gulp-replace");
const rename = require("gulp-rename");
const del = require("del");

const vendorsScripts = [
  "src/libs/jquery-3.3.1.min.js"
];


// =====================================================
function serve(cb) {
  server.init({
    server: "dist",
    port: 3000,
    open: true,
    cors: true,
    notify: false,
  });

  gulp
    .watch("src/img/*/*.{gif,png,jpg,svg,webp}", gulp.series(imageMinify))
    .on("change", server.reload);
  gulp.watch("src/sprites/svg/*.svg", gulp.series(svgSprite)).on("change", server.reload);
  gulp.watch("src/sprites/png/*.png", gulp.series(pngSprite)).on("change", server.reload);
  gulp.watch("src/styles/**/*.scss", gulp.series(styles));
  gulp.watch("src/js/*.js", gulp.series(script)).on("change", server.reload);
  gulp.watch("src/pages/**/*.pug", gulp.series(pug2html)).on("change", server.reload);
  return cb();
}

const server = require("browser-sync").create();


// =====================================================
function pug2html() {
  return gulp
    .src("src/pages/*.pug")
    .pipe(plumber())
    .pipe(pug())
    .pipe(plumber.stop())
    .pipe(htmlBeautify({ indent_size: 2, unformatted: ["a"] }))
    .pipe(gulp.dest("dist"));
}

// =====================================================
function styles() {
  return gulp
    .src("src/styles/main.scss")
    .pipe(plumber())
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(scss())
    .pipe(autoprefixer())
    .pipe(gulpif(!argv.prod, sourcemaps.write()))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename("styles.min.css"))
    .pipe(gulp.dest("dist/css"))
    .pipe(server.stream());
}

// =====================================================
function fonts() {
  return gulp.src("src/fonts/**/*.{ttf,woff,woff2}").pipe(gulp.dest("dist/fonts"));
}

// =====================================================
function imageMinify() {
  return gulp
    .src("src/img/**/*.{gif,png,jpg,svg,webp,ico}")
    .pipe(buffer())
    .pipe(gulpif(argv.prod,
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ]))
    )
    .pipe(gulp.dest("dist/img/"));
}

// =====================================================
function script() {
  return gulp
    .src("src/js/*.js")
    .pipe(babel({ presets: ["@babel/env"] }))
    .pipe(gulpif(argv.prod, uglify()))
    .pipe(gulp.dest("dist/js"))
    .pipe(server.stream());
}

// =====================================================
function vendors(cb) {
  return vendorsScripts.length
    ? gulp
        .src(vendorsScripts)
        .pipe(concat("vendor.js"))
        .pipe(gulp.dest("dist/js"))
    : cb();
}

// =====================================================
function pngSprite() {
  const spriteData = gulp.src("src/sprites/png/*.png").pipe(
    spritesmith({
      imgName: "sprite.png",
      imgPath: "../../img/sprite.png",
      cssName: "sprite.scss",
      padding: 5,
      cssVarMap: function(sprite) {
        sprite.name = "icon-" + sprite.name;
      },
    }),
  );
  
  const imgStream = spriteData.img
    .pipe(buffer())
    .pipe(gulpif(argv.prod, imagemin()))
    .pipe(gulp.dest("dist/img"));

  const cssStream = spriteData.css.pipe(gulp.dest("src/styles/utils/"));

  return merge(imgStream, cssStream);
}


// =====================================================
function spriteSVG() {
  return gulp
    .src("src/sprites/svg/*.svg")
    .pipe(svgmin({ js2svg: { pretty: true } }))
    .pipe(
      cheerio({
        run: function($) {
          $("[fill]").removeAttr("fill");
          $("[stroke]").removeAttr("stroke");
          $("[style]").removeAttr("style");
        },
        parserOptions: { xmlMode: true },
      }),
    )
    .pipe(replace("&gt;", ">"))
    .pipe(svgSprite({ mode: { symbol: { sprite: "../sprite.svg" } } }))
    .pipe(gulp.dest("dist/img"));
}

// =====================================================

function clean(cb) {
  return del("dist").then(() => cb());
}


// =====================================================
const build = gulp.parallel(
  pug2html,
  script,
  vendors,
  styles,
  imageMinify,
  spriteSVG,
  pngSprite,
  fonts,
);

exports.default = gulp.series(clean, build, serve);
