import gulp from "gulp"
import sourcemaps from "gulp-sourcemaps"
import concat from "gulp-concat"
import { BrowserifyObject } from "browserify"
import uglify from "gulp-uglify"
import rename from "gulp-rename"
import gulpIf from "gulp-if"
import bro from "gulp-bro"
const sass = require("gulp-sass")(require("sass"))

function tsifyBabelify(b: BrowserifyObject, opts: { debug: boolean }) {
	b.plugin("tsify")
	b.transform("babelify", {
		presets: ["@babel/preset-typescript", "@babel/preset-react"],
		extensions: [".ts", ".tsx"],
		sourceMaps: opts.debug,
	})
}

function css(debug?: boolean) {
	return gulp
		.src("src/ui/index.scss")
		.pipe(gulpIf(debug, sourcemaps.init()))
		.pipe(
			sass
				.sync({ outputStyle: debug ? "expanded" : "compressed" })
				.on("error", sass.logError)
		)
		.pipe(concat("webserial.css"))
		.pipe(gulpIf(debug, sourcemaps.write(".")))
		.pipe(gulp.dest("dist/"))
}

function resCopy() {
	return gulp.src("src/ui/*.html").pipe(gulp.dest("dist/"))
}

function js(debug?: boolean, src?: string) {
	const sources = {
		"background": "webserial.background",
		"content": "webserial.content",
		"polyfill": "webserial.polyfill",
		"ui": "webserial.ui",
	}

	return gulp
		.src(src || Object.keys(sources).map((s) => `src/${s}.ts`))
		.pipe(
			bro({
				debug: debug,
				cacheFile: "browserify-cache.json",
				plugin: [[tsifyBabelify, { debug }]],
			})
		)
		.pipe(gulpIf(debug, sourcemaps.init({ loadMaps: true })))
		.pipe(gulpIf(!debug, uglify()))
		.pipe(
			rename((opt) => {
				opt.basename = sources[opt.basename]
				opt.extname = ".js"
			})
		)
		.pipe(gulpIf(debug, sourcemaps.write(".")))
		.pipe(gulp.dest("dist/"))
}

gulp.task("css", () => {
	return css(false)
})

gulp.task("css:dev", () => {
	return css(true)
})

gulp.task("css:watch", () => {
	return gulp.watch(
		["src/**/*.scss"],
		{ ignoreInitial: false },
		gulp.task("css:dev")
	)
})

gulp.task("html", () => {
	return resCopy()
})

gulp.task("html:dev", () => {
	return resCopy()
})

gulp.task("html:watch", () => {
	return gulp.watch(
		["src/ui/*.html"],
		{ ignoreInitial: false },
		gulp.task("html:dev")
	)
})

gulp.task("js", () => {
	return js(false)
})

gulp.task("js:dev", () => {
	return js(true)
})

gulp.task("js:watch", () => {
	gulp.series(gulp.task("js:dev"))(null)
	return gulp.watch(["src/**/*.ts", "src/**/*.tsx"]).on("change", (file) => {
		gulp.series(gulp.task("js:dev"))(null)
	})
})

gulp.task("build", gulp.parallel("css", "js", "html"))
gulp.task("build:dev", gulp.parallel("css:dev", "js:dev", "html:dev"))
gulp.task("watch", gulp.parallel("css:watch", "js:watch", "html:watch"))
