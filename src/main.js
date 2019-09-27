'use strict';
// make sure any console statements
window.console = window.console || {
  log: function() {},
};

/**
 * Load libraries and utils
 */
const $ = require('jquery');
const codeMirror = require('codemirror');
const utils = require('./utils/baseUtils.js');
const yutils = require('yasgui-utils');
const prefixUtils = require('./utils/prefixUtils.js');
const tokenUtils = require('./utils/tokenUtils.js');
const syntaxUtils = require('./utils/syntaxUtils.js');
const tooltipUtils = require('./utils/tooltipUtils.js');
const formatUtils = require('./utils/formatUtils.js');
const buttonsUtils = require('./utils/buttonsUtils.js');
const prefixFold = require('./utils/prefixFold.js');
const Clipboard = require('clipboard');

require('../lib/deparam.js');
require('codemirror/addon/fold/foldcode.js');
require('codemirror/addon/fold/foldgutter.js');
require('codemirror/addon/fold/xml-fold.js');
require('codemirror/addon/fold/brace-fold.js');
require('codemirror/addon/hint/show-hint.js');
require('codemirror/addon/search/searchcursor.js');
require('codemirror/addon/edit/matchbrackets.js');
require('codemirror/addon/runmode/runmode.js');
require('codemirror/addon/display/fullscreen.js');
require('../lib/grammar/tokenizer.js');

/**
 * Main YASHE constructor.
 * Pass a DOM element as argument to append the editor to,
 * and (optionally) pass along config settings
 * (see the YASHE.defaults object below,
 * as well as the regular codeMirror documentation,
 * for more information on configurability)
 *
 * @constructor
 * @param {DOM-Element} parent element to append editor to.
 * @param {object} config
 * @class YASHE
 * @return {doc} YASHE document
 */
const root = (module.exports = function(parent, config) {
  const rootEl = $('<div>', {
    class: 'yashe',
  }).appendTo($(parent));
  config = extendConfig(config);
  const yashe = extendCmInstance(codeMirror(rootEl[0], config));
  postProcessCmElement(yashe);
  return yashe;
});


/**
 * Extend config object, which we will pass on to the CM constructor later on.
 * Need this, to make sure our own 'onBlur' etc events do not get overwritten by
 * people who add their own onblur events to the config Additionally, need this
 * to include the CM defaults ourselves. codeMirror has a method for including
 * defaults, but we can't rely on that one: it assumes flat config object, where
 * we have nested objects (e.g. the persistency option)
 *
 * @private
 * @param {object} config
 * @return {extendedConfig} YASHE config
 */
const extendConfig = function(config) {
  const extendedConfig = $.extend(true, {}, root.defaults, config);
  // I know, codemirror deals with  default options as well.
  // However, it does not do this recursively (i.e. the persistency option)

  return extendedConfig;
};
/**
 * Add extra functions to the CM document (i.e. the codemirror instantiated
 * object)
 *
 * @private
 */
const extendCmInstance = function(yashe) {
  // instantiate autocompleters
  yashe.autocompleters = require('./autocompleters/autocompleterBase.js')(root, yashe);
  if (yashe.options.autocompleters) {
    yashe.options.autocompleters.forEach(function(name) {
      if (root.Autocompleters[name]) yashe.autocompleters.init(name, root.Autocompleters[name]);
    });
  }
  yashe.emit = function(event, data) {
    root.signal(yashe, event, data);
  };
  yashe.lastQueryDuration = null;
  yashe.getCompleteToken = function(token, cur) {
    return tokenUtils.getCompleteToken(yashe, token, cur);
  };
  yashe.getPreviousNonWsToken = function(line, token) {
    return tokenUtils.getPreviousNonWsToken(yashe, line, token);
  };
  yashe.getNextNonWsToken = function(lineNumber, charNumber) {
    return tokenUtils.getNextNonWsToken(yashe, lineNumber, charNumber);
  };
  yashe.collapsePrefixes = function(collapse) {
    if (collapse === undefined) collapse = true;
    yashe.foldCode(
        prefixFold.findFirstPrefixLine(yashe),
        root.fold.prefix,
      collapse ? 'fold' : 'unfold'
    );
  };

  yashe.drawButtons = function() {
    return buttonsUtils.drawButtons(yashe);
  };

  /**
	 * Fetch defined prefixes
	 *
	 * @method doc.getDefinedPrefixes
	 * @return object
	 */
  yashe.getDefinedPrefixes = function() {
    return prefixUtils.getDefinedPrefixes(yashe);
  };

  yashe.addPrefixes = function(prefixes) {
    return prefixUtils.addPrefixes(yashe, prefixes);
  };
  yashe.removePrefixes = function(prefixes) {
    return prefixUtils.removePrefixes(yashe, prefixes);
  };


  yashe.setCheckSyntaxErrors = function(isEnabled) {
    yashe.options.syntaxErrorCheck = isEnabled;
    checkSyntax(yashe);
  };

  yashe.enableCompleter = function(name) {
    addCompleterToSettings(yashe.options, name);
    if (root.Autocompleters[name]) yashe.autocompleters.init(name, root.Autocompleters[name]);
  };
  yashe.disableCompleter = function(name) {
    removeCompleterFromSettings(yashe.options, name);
  };
  return yashe;
};

const addCompleterToSettings = function(settings, name) {
  if (!settings.autocompleters) settings.autocompleters = [];
  settings.autocompleters.push(name);
};
const removeCompleterFromSettings = function(settings, name) {
  if (typeof settings.autocompleters == 'object') {
    const index = $.inArray(name, settings.autocompleters);
    if (index >= 0) {
      settings.autocompleters.splice(index, 1);
      removeCompleterFromSettings(settings, name); // just in case. suppose 1 completer is listed twice
    }
  }
};

const postProcessCmElement = function(yashe) {
  root.drawButtons(yashe);

  // Trigger of the button with id='copy'
  // Copies the contents of the editor in the clipboard
  new Clipboard('#copyBtn', {
    text: function(trigger) {
      return yashe.getValue();
    },
  });


  /**
	 * Set doc value if option storeShape is activated
	 */
  const storageId = utils.getPersistencyId(yashe, yashe.options.persistent);
  if (storageId) {
    const valueFromStorage = yutils.storage.get(storageId);
    if (valueFromStorage) yashe.setValue(valueFromStorage);
  }


  /**
	 * Add event handlers
	 */
  yashe.on('blur', function(yashe, eventInfo) {
    root.storeContent(yashe);
  });


  yashe.on('change', function(yashe, eventInfo) {
    checkSyntax(yashe);
  });
  yashe.on('changes', function() {
    checkSyntax(yashe);
  });

  yashe.on('scroll', function() {
    tooltipUtils.removeToolTip();
  });


  // Wikidata Tooltip Listener
  root.on( yashe.getWrapperElement(), 'mouseover', debounce(function( e ) {
    tooltipUtils.removeToolTip();
    tooltipUtils.triggerTooltip( e );
  }, 300 ));


  yashe.prevQueryValid = false;
  checkSyntax(yashe); // on first load, check as well (our stored or default query might be incorrect)

  if (yashe.options.collapsePrefixesOnLoad) yashe.collapsePrefixes(true);
};


root.storeContent = function(yashe) {
  const storageId = utils.getPersistencyId(yashe, yashe.options.persistent);
  if (storageId) {
    yutils.storage.set(storageId, yashe.getValue(), 'month', yashe.options.onQuotaExceeded);
  }
};


const checkSyntax = function(yashe, deepcheck) {
  return syntaxUtils.checkSyntax(yashe, deepcheck);
};


/**
 *
      REMEMBRER: COMMENT THIS FUNCTION
 */
const debounce = function(func, wait, immediate) {
  let timeout; let result;
  return function() {
    const context = this; const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) result = func.apply(context, args);
    return result;
  };
};

/**
 * Draw the editor buttons
 */
root.drawButtons = function(yashe) {
  buttonsUtils.drawButtons(yashe);
};


/**
 * Static Utils
 */
// first take all codeMirror references and store them in the YASHE object
$.extend(root, codeMirror);

// add registrar for autocompleters
root.Autocompleters = {};
root.registerAutocompleter = function(name, constructor) {
  root.Autocompleters[name] = constructor;
  addCompleterToSettings(root.defaults, name);
};

root.autoComplete = function(yashe) {
  // this function gets called when pressing the keyboard shortcut. I.e., autoShow = false
  yashe.autocompleters.autoComplete(false);
};
// include the autocompleters we provide out-of-the-box
root.registerAutocompleter('prefixDefinition', require('./autocompleters/prefixDefinition.js'));
root.registerAutocompleter('wikidata', require('./autocompleters/wikidata.js'));
root.registerAutocompleter('prefixesAndKeywords', require('./autocompleters/prefixesAndKeywords.js'));


/**
 * Initialize YASHE from an existing text area (see http://codemirror.net/doc/manual.html#fromTextArea for more info)
 *
 * @method YASHE.fromTextArea
 * @param textArea {DOM element}
 * @param config {object}
 * @return {doc} YASHE document
 */
root.fromTextArea = function(textAreaEl, config) {
  config = extendConfig(config);
  // add yashe div as parent (needed for styles to be manageable and scoped).
  // In this case, I -also- put it as parent el of the text area. This is wrapped in a div now

  const rootEl = $('<div>', {
    class: 'yashe',
  })
      .insertBefore($(textAreaEl))
      .append($(textAreaEl));


  const yashe = extendCmInstance(codeMirror.fromTextArea(textAreaEl, config));
  postProcessCmElement(yashe);

  return yashe;
};


/** *
 * Format utils
 */
root.commentLines = function(yashe) {
  return formatUtils.commentLines(yashe);
};

root.copyLineUp = function(yashe) {
  return formatUtils.copyLineUp(yashe);
};

root.copyLineDown = function(yashe) {
  return formatUtils.copyLineDown(yashe);
};
root.doAutoFormat = function(yashe) {
  return formatUtils.doAutoFormat(yashe);
};


require('./config/defaults.js');
root.$ = $;
root.version = {
  'codeMirror': codeMirror.version,
  'YASHE': require('../package.json').version,
  'jquery': $.fn.jquery,
  'yasgui-utils': yutils.version,
};

