cnn-reader
----------

Scrape a CNN article from CNN.Com


## Install

```
npm install cnn-reader --save
```

## Use

```
   var CNNReader = require('cnn-reader');
   var cnnreader = new CNNReader();

   // Promise
   cnnreader.read('http://www.cnn.com/2015/10/21/middleeast/syria-civil-war/index.html').then(function(article) {
      // Do Something with Article
   });

   // Callback
   cnnreader.read('http://www.cnn.com/2015/10/21/middleeast/syria-civil-war/index.html', function(article) {
      // Do Something with Article
   });
```

## Article

```
var Article = {
   title: '',
   datetime: '',
   body: {
      clean: '',
      minimal: ''
   },
   images: [
      {
         mini: '',
         xsmall: '',
         small: '',
         medium: '',
         large: '',
         full: ''
      }
   ],
   source: ''
};
```

**title**
The title of the Article. What appears in the h1 on the page.

**datetime**
The datetime with timezone of the last update of the article. Format: `YY-mm-dd H:i:s GMT`

**body**
The body of the article. Comes in two formats. *clean* and *minimal*. The clean format removes all html elements and separates paragraphs by two newlines. The minimal format uses `sanitize-html` to remove all html elements except for `'p', 'cite', 'b', 'i', 'em', 'strong', 'a'`.

**images**
An array of image urls found in the body. Comes in sizes `mini`, `xsmall`, `small`, `medium`, `large`, and `full` for each image.

**source**
The url of the cnn article.