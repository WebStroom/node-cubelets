var fs = require('fs')
var test = require('tape')
var cubelets = require('../index')
var Program = cubelets.Program
 
test('program', function (t) {
    t.plan(2)
    var hex = fs.readFileSync(__dirname + '/flash/mini-bargraph.hex')
    var program = new Program(hex)
    fs.writeFileSync(__dirname + '/flash/mini-bargraph.js.bin', program.data)
    t.pass('wrote')
    t.equal(program.data.length / 18, program.lineCount)
})
