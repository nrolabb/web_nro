
module.exports = {
    plugins: [
        new ejsBuilder({
            root: __dirname,
            files: [{
              source: {
                name: 'index.ejs',
                dir: './views',
              },
              target: {
                name: 'index.html',
                dir: 'dist/'
              },
              encoding: 'utf8'
            }]
          })
    ]
};