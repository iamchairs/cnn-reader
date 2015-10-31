var CNNReader = require('./index');
var toMarkdown = require('./markdown');
var reader = new CNNReader();

var sampleDom = '<p>test text node <a href="http://google.com"><p>this whole 2 par is link</p><p>im serious</p></a></p>';

var xmldom = new require('xmldom');
DOMParser = new xmldom.DOMParser({
   errorHandler: {
      warning: function() {/* Ignore */},
      error: function() {/* Ignore */}
   }
});
var dom = DOMParser.parseFromString(sampleDom);

reader.read('http://www.cnn.com/2015/10/30/politics/syria-troops-special-operations-forces/index.html');