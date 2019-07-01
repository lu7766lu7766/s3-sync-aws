var s3sync = require('./s3sync.js')

var path = require('path'),
	level = require('level'),
	readdirp = require('readdirp'),
	moment = require('moment'),
	es = require('event-stream')

var resolve = dir => {
	return path.join(process.cwd(), dir)
}

module.exports = async (dir, options) => {
	var db = level(resolve(dir + '/cache'))

	var files = readdirp(resolve(dir), {
		directoryFilter: ['!.git', '!cache']
	})

	let index = 0
	var conf = {
		key: options.access,
		secret: options.secret,
		bucket: options.bucket,
		concurrency: 100
	}
	options.dest && (conf.dest = options.dest)

	var uploader = s3sync(db, conf).on('data', function(file) {
		if (file.fresh) {
			console.log(`${file.fullPath}\n->${file.url}\nindex:${index++}\n`)
		}
	})

	files.pipe(uploader).pipe(
		es.wait(function(err, body) {
			console.log('start_time: ' + moment().format('YYYY-MM-DD HH:mm:ss'))
		})
	)
}
