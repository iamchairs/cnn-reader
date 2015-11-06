module.exports = (function() {
   'use strict';

   var request = require('request');
   var xmldom = new require('xmldom');
   var q = require('q');
   var sanitizehtml = require('sanitize-html'); 
   var toMarkdown = require('./markdown');

   return CNNReader;

   function CNNReader() {
      var self = this;

      this.read = read;

      this.DOMParser = new xmldom.DOMParser({
         errorHandler: {
            warning: function() {/* Ignore */},
            error: function() {/* Ignore */}
         }
      });
      this.XMLSerializer = new xmldom.XMLSerializer();

      /* For Clean Text */
      this.cleanTags = [];
      this.cleanAttributes = {};

      /* For Minimal Non-Clean Text */
      this.minimalTags = ['p', 'cite', 'b', 'i', 'em', 'strong', 'a'];
      this.minimalAttributes = false;

      this.monthMap = {
         'January': 1,
         'February': 2,
         'March': 3,
         'April': 4,
         'May': 5,
         'June': 6,
         'July': 7,
         'August': 8,
         'September': 9,
         'October': 10,
         'November': 11,
         'December': 12
      };

      function read(url, cb) {
         var defer = q.defer();

         request(url, function(error, response, body) {
            if(error) {
               return err(error);
            }

            var Article = {
               title: '',
               datetime: '',
               body: {
                  clean: '',
                  markdown: ''
               },
               images: [
               ],
               source: url
            };

            var dom;
            try {
               dom = self.DOMParser.parseFromString(body, 'text/html');
            } catch(e) {}

            if(!dom) {
               return err('wasnt able to read dom');
            }

            var body = dom.getElementById('body-text');
            
            if(!body || !body.getElementsByTagName) {
               return err('wasnt able to find dom body');
            }

            var ps = body.getElementsByTagName('p');

            var bodyCleanStrings = [];
            var bodyMinimalStrings = [];
            for(var i = 0; i < ps.length; i++) {
               var p = ps[i];
               var raw = self.XMLSerializer.serializeToString(p);

               bodyCleanStrings.push(sanitizehtml(raw, {
                  allowedTags: self.cleanTags,
                  allowedAttributes: self.cleanAttributes
               }));
            }

            var markdown = toMarkdown(body);

            Article.body.clean = bodyCleanStrings.join('\n\n');
            Article.body.markdown = markdown;

            var divs = body.getElementsByTagName('div');
            var imgs = [];

            for(var i = 0; i < divs.length; i++) {
               var div = divs[i];
               if(div.getAttribute('class').indexOf('el__embedded') !== -1 ||
                  div.getAttribute('class').indexOf('el__resize') !== -1 ||
                  div.getAttribute('class').indexOf('el__video') !== -1 ||
                  div.getAttribute('class').indexOf('l-container')) {

                  var embImgs = div.getElementsByTagName('img');
                  for(var k = 0; k < embImgs.length; k++) {
                     imgs.push(embImgs[k]);
                  }
               }
            }
            
            for(var i = 0; i < imgs.length; i++) {
               var img = imgs[i];
               var srcMini = img.getAttribute('data-src-mini');
               var srcXSmall = img.getAttribute('data-src-xsmall');
               var srcSmall = img.getAttribute('data-src-small');
               var srcMedium = img.getAttribute('data-src-medium');
               var srcLarge = img.getAttribute('data-src-large');
               var srcFull = img.getAttribute('data-src-full16x9');
               var caption = img.getAttribute('alt');
               if(srcFull) {
                  var found = false;
                  for(var k = 0; k < Article.images.length; k++) {
                     if(Article.images[k].full === srcFull) {
                        found = true;
                     }
                  }

                  if(!found) {
                     Article.images.push({
                        caption: caption,
                        mini: srcMini,
                        xsmall: srcXSmall,
                        small: srcSmall,
                        medium: srcMedium,
                        large: srcLarge,
                        full: srcFull
                     });
                  }
               }
            }

            var h1 = dom.getElementsByTagName('h1');
            var h1Raw = self.XMLSerializer.serializeToString(h1[0]);
            Article.title = sanitizehtml(h1Raw, {
               allowedTags: self.cleanTags,
               allowedAttributes: self.cleanAttributes
            });

            var datetimeRegex = /([\d]+):([\d]+)\s*(AM|PM)\s*([^,]+),\s*[\w]+\s*([\w]+)\s*([\d]+)\s*,\s*([\d]+)/;
            ps = dom.getElementsByTagName('p');

            var datetime;
            for(var i = 0; i < ps.length; i++) {
               var p = ps[i];
               if(p.getAttribute('class') === 'update-time') {
                  datetime = self.XMLSerializer.serializeToString(p);
                  break;
               }
            }

            var regexMatches = datetime.match(datetimeRegex);
            var hour = regexMatches[1];
            var minute = regexMatches[2];
            var AMPM = regexMatches[3];
            var timezone = regexMatches[4];
            var month = self.monthMap[regexMatches[5]];
            var day = regexMatches[6];
            var year = regexMatches[7];
            
            if(AMPM === 'PM') {
               hour += 12;
            }

            Article.datetime = year + '-'+
                               month + '-' +
                               day + ' ' +
                               hour + ':' +
                               minute + ':' +
                               '00 GMT-0000';

            if(cb) {
               cb(Article);
            }

            defer.resolve(Article);
         });

         return defer.promise;

         function err(str) {
            console.error('Error from url: ' + url);
            console.error(str);
            defer.resolve(null);

            if(cb) {
               cb(null);
            }

            return false;
         }
      }
   }
})();