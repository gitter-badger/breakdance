'use strict';

var util = require('snapdragon-util');
var merge = require('mixin-deep');
var utils = require('../utils');

module.exports = function(options) {
  return function(node, nodes, i) {
    var opts = merge({}, this.options, options);
    var state = this.state;

    // if whitespace handling is disabled, or we're inside
    // a <pre> or <code> tag, just emit the string
    if (opts.whitespace === false || util.isInside(state, node, ['code', 'pre'])) {
      return this.emit(node.val, node);
    }

    node.val = node.val.replace(/\&#\xA0;/g, ' ');
    var type = node.parent.type;
    var val = node.val;

    var lastChar = this.output.slice(-1);
    if (/\s/.test(lastChar)) {
      val = utils.trimLeft(val);
    }

    if (util.isInside(state, node, 'a') || type === 'a') {
      this.output = this.output.replace(/\[\s+$/, '[');
      val = val.replace(/^\[\s+/, '[');
    }

    switch (type) {
      case 'string':
      case 'doctype':
      case 'base':
      case 'body':
      case 'head':
      case 'html':
      case 'link':
      case 'meta':
      case 'style':
      case 'script':
      case 'noscript':
      case 'title':
      case 'comment':
        val = val.split(/[ \t]+/).join(' ');
        if (/[\w>`*._)\]]/.test(lastChar) && /[.`*_\w]/.test(val.charAt(0))) {
          this.emit(' ');
        }
        return this.emit(val, node);

      // sections
      case 'address':
      case 'article':
      case 'aside':
      case 'footer':
      case 'main':
      case 'nav':
      case 'section':
        val = utils.trimLeft(utils.stripNewlines(val));
        if (this.output && this.output.slice(-1) !== '\n') {
          this.emit(' ');
        }
        return this.emit(val, node);

      // headings
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        this.output = this.output.replace(/\s+$/, '');
        if (/[\w>`*_).?!:;,\]]/.test(lastChar) && /[.`*_\w]/.test(val.charAt(0))) {
          this.emit(' ');
        }
        val = ' ' + val.trim() + ' ';
        return this.emit(val.split(/[ \t]+/).join(' '), node);

      // heading wrappers
      case 'header':
      case 'hgroup':
        return this.emit(val, node);

      // content grouping
      case 'div':
      case 'figure':
      case 'figcaption':
        this.output = utils.trimRight(this.output);
        val = val.replace(/^\s+/, '');
        val = val.replace(/\n\s+$/, '\n');

        if (val && needsSpace(this.output, val)) {
          this.emit(' ');
        }
        return this.emit(val, node);

      // paragraph text
      case 'p':
        return this.emit(val.replace(/^\n[ \t]+/, '\n'), node);

      // code and pre-formatted text
      case 'code':
      case 'pre':
        return this.emit(node.val, node);

      // keyboard and computer output
      case 'kbd':
      case 'samp':
      case 'var':
        return this.emit(val, node);

      // inline quoted text
      case 'q':
        return this.emit(val, node);

      // blockqutes
      case 'blockquote':
        return this.emit(val.trim(), node);

      // cited title of a work
      case 'cite':
        return this.emit(val, node);

      // lists and list items
      case 'ol':
      case 'ul':
      case 'li':
        val = utils.stripNewlines(val);
        val = utils.trimRight(val);
        return this.emit(val, node);

      case 'table':
      case 'caption':
      case 'col':
      case 'colgroup':
      case 'thead':
      case 'tbody':
      case 'tfoot':
      case 'tr':
      case 'th':
      case 'td':
        if (val === '<br>' || type === 'caption') {
          return this.emit(val, node);
        }

        if (!/\|\s+$/.test(this.output)) {
          this.output = this.output.replace(/\n[ \t]+$/, '\n');
        }

        val = val.replace(/^\s+/, '');
        if (val && needsSpace(this.output, val)) {
          this.emit(' ');
        }
        return this.emit(val, node);

      // anchor
      case 'a':
        val = utils.stripNewlines(val);
        if (lastChar === '[') {
          val = val.replace(/^\s+/, '');
        }
        return this.emit(val, node);

      // span
      case 'span':
        return this.emit(val, node);

      // emphasis
      case 'em':
      case 'strong':
        this.output = this.output.replace(/\s+$/, '');
        val = val.replace(/\n/, '').trim();
        var ch = this.output.slice(-1);
        var isStart = (type === 'em' && ch === '_')
          || (type === 'strong' && ch === '*');

        if (!isStart && !/^\s/.test(val)) {
          if (val && needsSpace(this.output, val)) {
            this.emit(' ');
          }
        }
        return this.emit(val, node);

      // definition lists
      case 'dl':
      case 'dt':
      case 'dd':
        return this.emit(val.trim(), node);

      // small print, subscript and superscript
      case 'small':
      case 'sub':
      case 'sup':
        return this.emit(val.trim(), node);

      // italics (offset text conventionally styled in italic)
      case 'i':
        return this.emit(val.trim(), node);

      // bold (offset text conventionally styled in bold)
      case 'b':
        return this.emit(val.trim(), node);

      // underline (offset text conventionally styled with an underline)
      case 'u':
        return this.emit(val.trim(), node);

      // insert and delete
      case 'ins':
      case 'del':
        return this.emit(val.trim(), node);

      // strike (struck text)
      case 'strike':
      case 's':
        return this.emit(val.trim(), node);

      // abbreviations
      case 'abbr':
        return this.emit(utils.trimLeft(val), node);

      // bidi isolate and override
      case 'bdi':
      case 'bdo':
        return this.emit(val.trim(), node);

      // defining instance
      case 'dfn':
        return this.emit(val.trim(), node);

      // highlighted text
      case 'mark':
        return this.emit(val.trim(), node);

      // time
      case 'time':
        return this.emit(val.trim(), node);

      // form-related elements
      case 'fieldset':
      case 'label':
      case 'legend':
      case 'optgroup':
      case 'option':
      case 'output':
      case 'select':
      case 'textarea':
        if (val && needsSpace(lastChar, val.charAt(0))) {
          this.emit(' ');
        }
        return this.emit(val, node);

      // interactive elements
      case 'details':
      case 'menu':
      case 'menuitem':
        return this.emit(val.trim(), node);

      default: {
        return this.emit(val.split(/\s+/).join(' '), node);
      }
    }
  };
};

/**
 * a => ending character
 * b => starting character
 */

function needsSpace(a, b) {
  var aa = a.slice(-1);
  var bb = b.charAt(0);

  if (bb === '.' && /\w/.test(b.charAt(1)) && aa !== '\n') {
    return true;
  }

  if (utils.isEndingChar(bb)) {
    return false;
  }

  if (aa === '`' && !/\s/.test(a.charAt(a.length - 2))) {
    return true;
  }

  if (/[*_]/.test(aa) && /\w/.test(bb)) {
    return true;
  }

  if (utils.isOpeningChar(aa)) {
    return false;
  }

  if (utils.isTightSeparator(aa) || utils.isTightSeparator(bb)) {
    return false;
  }

  if ((utils.isLooseSeparator(aa) || utils.isLooseSeparator(bb)) && !/\s/.test(aa)) {
    return true;
  }

  if (/\s/.test(aa) && utils.isStartingChar(bb)) {
    return false;
  }

  if (utils.isWrappingChar(aa) && utils.isStartingChar(bb)) {
    return true;
  }

  if (utils.isEndingChar(aa) && !/<br>$/.test(a) && !/\s/.test(bb) && !utils.isEndingChar(bb)) {
    return true;
  }

  if ((utils.isStartingChar(bb) || utils.isWrappingChar(bb) || utils.isWrappingChar(aa)) && !utils.isStartingChar(aa)) {
    return true;
  }

  if (utils.isWordChar(aa) && utils.isWordChar(bb)) {
    return true;
  }

  if (/\W/.test(bb) && !utils.isStartingChar(bb) && !utils.isOpeningChar(bb) && !utils.isEndingChar(bb) && !utils.isSpecialChar(bb) && !utils.isSeparator(bb) && !utils.isStartingChar(aa)) {
    return true;
  }

  return false;
}
