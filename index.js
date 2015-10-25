module.exports = (function() {
   'use strict';

   var request = require('request');
   var xmldom = new require('xmldom');
   var q = require('q');
   var sanitizehtml = require('sanitize-html'); 

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
               defer.reject(error);
               if(cb) {
                  cb(error);
               }
            }

            var Article = {
               title: '',
               datetime: '',
               body: {
                  clean: '',
                  minimal: ''
               },
               images: [
               ],
               source: url
            };

            var dom;
            try {
               dom = self.DOMParser.parseFromString(body, 'text/html');
            } catch(e) {}

            var body = dom.getElementById('body-text');
            if(!body) {
               if(cb) {
                  cb(null);
               } else {
                  defer.resolve(null);
               }

               return false;
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

               bodyMinimalStrings.push(sanitizehtml(raw, {
                  allowedTags: self.minimalTags,
                  allowedAttributes: self.minimalAttributes
               }));
            }

            Article.body.clean = bodyCleanStrings.join('\n\n');
            Article.body.minimal = bodyMinimalStrings.join('');

            var imgs = body.getElementsByTagName('img');
            for(var i = 0; i < imgs.length; i++) {
               var img = imgs[i];
               var srcMini = img.getAttribute('data-src-mini');
               var srcXSmall = img.getAttribute('data-src-xsmall');
               var srcSmall = img.getAttribute('data-src-small');
               var srcMedium = img.getAttribute('data-src-medium');
               var srcLarge = img.getAttribute('data-src-large');
               var srcFull = img.getAttribute('data-src-full16x9');
               if(srcFull) {
                  Article.images.push({
                     mini: srcMini,
                     xsmall: srcXSmall,
                     small: srcSmall,
                     medium: srcMedium,
                     large: srcLarge,
                     full: srcFull
                  });
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
      }
   }
})();