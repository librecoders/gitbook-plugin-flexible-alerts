const cheerio = require('cheerio');

function findAlertSetting(input, key, fallback, callback) {
  const match = (input || '').match(new RegExp(`${key}:(([^\\r\\n|]*))`));
  if (!match) {
    return callback ? callback(fallback) : fallback;
  }

  return callback ? callback(match[1]) : match[1];
}

module.exports = {
  book: {
    assets: './dist/book',
    // js: [
    //   'plugin.js'
    // ],
    css: [
      'style.css'
    ]
  },
  ebook: {
    assets: './dist/book',
    // js: [
    //   'plugin.js'
    // ],
    css: [
      'style.css'
    ]
  },
  hooks: {
    page: function (page) {
      const bookIns = this;
      const options = bookIns.config.get('pluginsConfig')['flexible-alerts-static'];


      const $ = cheerio.load(page.content);
      $('blockquote').each((i, blockquote) => {
        // define the cheerio elements
        const $blockquote = $(blockquote);
        const origin = $blockquote.html();
        //origin = origin.replace(/(^<p>)|(<\/p>$)/g,'');

        const reg = /(?:<p>\s*)?\[!(\w*)((?:\|\w*:.*)*?)\]/g;
        let lastIndex = 0;
        let matches;
        const rs = [];
        while ((matches = reg.exec(origin)) !== null) {
          const index = matches.index;
          if (lastIndex < index) {
            if (rs.length === 0) {
              rs.push('<blockquote>');
            }
            rs.push(origin.substring(lastIndex, index));
            rs.push('</blockquote>');
          }
          lastIndex = reg.lastIndex;
          const match = matches[0];
          const key = matches[1];
          const settings = matches[2];

          const config = options[key.toLowerCase()];
          if (!config) {
            rs.push('<blockquote>');
            rs.push(match);
            continue;
          }

          // Style configuration
          const style = findAlertSetting(settings, 'style', options.style);
          let isIconVisible = findAlertSetting(settings, 'iconVisibility', 'visible', (value) => value !== 'hidden');
          let isLabelVisible = findAlertSetting(settings, 'labelVisibility', 'visible', (value) => value !== 'hidden');
          let label = findAlertSetting(settings, 'label', config.label);
          const icon = findAlertSetting(settings, 'icon', config.icon);
          const className = findAlertSetting(settings, 'className', config.className);
          // Label can be language specific and could be specified via user configuration
          if (typeof label === 'object') {
            const language = bookIns.innerLanguage;

            if (language && label.hasOwnProperty(language)) {
              label = label[language];
            } else {
              isLabelVisible = false;
              isIconVisible = false;
            }
          }
          const iconTag = `<i class="${icon}"></i>`;

          rs.push(`<blockquote class="alert ${style} ${className}">
                <p class="title">
                    ${isIconVisible ? iconTag : ''}
                    ${isLabelVisible ? label : ''}
                </p>
                <p>`);
        }
        if (rs.length > 0) {
          if (lastIndex < origin.length) {
            rs.push(origin.substring(lastIndex));
          }
          rs.push('</blockquote>');

          const content = rs.join('');
          if (content !== origin) {
            // append the new blockquote (as a div) to the parent
            $blockquote.before(content);
            // remove the old blockquote tag, so we dont get the default styling
            $blockquote.remove();
            // update the page content html with the new html
            page.content = $('body').html();
          }
        }


        // const content = origin.replace(/\[!(\w*)((?:\|\w*:.*)*?)\]([\s\S]*)/g,
        //   (match, key, settings, value) => {
        //     const config = options[key.toLowerCase()];
        //     if (!config) {
        //       return match;
        //     }
        //     // Style configuration
        //     const style = findAlertSetting(settings, 'style', options.style);
        //     let isIconVisible = findAlertSetting(settings, 'iconVisibility', 'visible', (value) => value !== 'hidden');
        //     let isLabelVisible = findAlertSetting(settings, 'labelVisibility', 'visible', (value) => value !== 'hidden');
        //     let label = findAlertSetting(settings, 'label', config.label);
        //     const icon = findAlertSetting(settings, 'icon', config.icon);
        //     const className = findAlertSetting(settings, 'className', config.className);
        //
        //     // Label can be language specific and could be specified via user configuration
        //     if (typeof label === 'object') {
        //       const language = bookIns.innerLanguage;
        //
        //       if (language && label.hasOwnProperty(language)) {
        //         label = label[language];
        //       } else {
        //         isLabelVisible = false;
        //         isIconVisible = false;
        //       }
        //     }
        //
        //     const iconTag = `<i class="${icon}"></i>`;
        //
        //     return (
        //       `<!--blockquote-->
        //       <div class="alert ${style} ${className}">
        //         <p class="title">
        //             ${isIconVisible ? iconTag : ''}
        //             ${isLabelVisible ? label : ''}
        //         </p>
        //         <p>${value}
        //       </div>`
        //     );
        //   });
        // if (content !== origin) {
        //   // append the new blockquote (as a div) to the parent
        //   $blockquote.before(content);
        //   // remove the old blockquote tag, so we dont get the default styling
        //   $blockquote.remove();
        //   // update the page content html with the new html
        //   page.content = $('body').html();
        // }
      });
      return page;
    }
  },
  blocks: {},
  filters: {},
};
