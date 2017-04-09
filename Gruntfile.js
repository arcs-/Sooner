module.exports = function(grunt) {

	grunt.initConfig({

		'uglify': {
			build: {
				files: {
					'dist/sooner.min.js': ['src/sooner.js']
				}
			}
		},

		'handlebars': {
			compile: {
				options: {
					namespace: 'MyApp.Templates',
					processName: function(filePath) {
						var name = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length - 11)
						return name
					}
				},
				files: {
				  'test/public/js/templates.min.js' : [ 'test/views/*.handlebars']
				}
			}
		},

		'watch': {
			css: {
				files: ['src/*.js', 'test/views/*.handlebars', 'Gruntfile.js'],
				tasks: ['uglify', 'handlebars'],
				options: {
					spawn: false,
					atBegin: true
				},
			},
		}

	})

	grunt.loadNpmTasks('grunt-contrib-watch')
	grunt.loadNpmTasks('grunt-contrib-uglify')
	grunt.loadNpmTasks('grunt-contrib-handlebars')

	grunt.registerTask('default', ['uglify', 'handlebars', 'watch'])

}
