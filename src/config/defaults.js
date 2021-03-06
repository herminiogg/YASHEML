/**
 * The default options of YASHE (check the CodeMirror documentation for even
 * more options, such as disabling line numbers, or changing keyboard shortcut
 * keys). Either change the default options by setting YASHE.defaults, or by
 * passing your own options as second argument to the YASHE constructor
 */
var $ = require("jquery"), YASHE = require("../main.js");

YASHE.defaults = $.extend(true, {}, YASHE.defaults, {
  mode: "shex",

  /**
	 *  Default shape 
	 */
  value: `PREFIX : <http://example.com/>
SOURCE films_xml_file <https://rawgit.com/herminiogg/ShExML/master/src/test/resources/films.xml>
SOURCE films_json_file <https://rawgit.com/herminiogg/ShExML/master/src/test/resources/films.json>
ITERATOR film_xml <xpath: //film> {
  FIELD id <@id>
  FIELD name <name>
  FIELD year <year>
  FIELD country <country>
  FIELD directors <directors/director>
}
ITERATOR film_json <jsonpath: $.films[*]> {
  FIELD id <id>
  FIELD name <name>
  FIELD year <year>
  FIELD country <country>
  FIELD directors <director>
}
EXPRESSION films <films_xml_file.film_xml UNION films_json_file.film_json>

:Films :[films.id] {
  :name [films.name] ;
  :year [films.year] ;
  :country [films.country] ;
  :director [films.directors] ;
}`,

  highlightSelectionMatches: {
    showToken: /\w/
  },
  theme:"wiki",
  tabMode: "indent",
  lineNumbers: true,
  lineWrapping: true,
  foldGutter: {
    rangeFinder: new YASHE.fold.combine(YASHE.fold.brace, YASHE.fold.prefix)
  },
  collapsePrefixesOnLoad: false,
  gutters: ["gutterErrorBar", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  matchBrackets: true,
  fixedGutter: true,
  syntaxErrorCheck: true,
  showTooltip:true,
  onQuotaExceeded: function(e) {
    //fail silently
    console.warn("Could not store in localstorage. Skipping..", e);
  },
  /**
	 * Extra shortcut keys. Check the CodeMirror manual on how to add your own
	 *
	 * @property extraKeys
	 * @type object
	 */
  extraKeys: {
    "Ctrl-Space": YASHE.autoComplete,
    "Cmd-Space": YASHE.autoComplete,
    "Ctrl-D": YASHE.deleteLine,
    "Cmd-K": YASHE.deleteLine,
    "Ctrl-/": YASHE.commentLines,
    "Cmd-/": YASHE.commentLines,
    "Ctrl-Down": YASHE.copyLineDown,
    "Ctrl-Up": YASHE.copyLineUp,
    "Cmd-Down": YASHE.copyLineDown,
    "Cmd-Up": YASHE.copyLineUp,
    "Shift-Ctrl-F": YASHE.doAutoFormat,
    "Shift-Cmd-F": YASHE.doAutoFormat,
    "Ctrl-S": YASHE.storeContent,
    "Cmd-S": YASHE.storeConten,
    "Ctrl-Enter": YASHE.executeQuery,
    "Cmd-Enter": YASHE.executeQuery,
    F11: function(yashe) {
      yashe.setOption("fullScreen", !yashe.getOption("fullScreen"));
    },
    Esc: function(yashe) {
      if (yashe.getOption("fullScreen")) yashe.setOption("fullScreen", false);
    }
  },
  cursorHeight: 0.9,

  
  /**
	 * Change persistency settings for the YASHE value. Setting the values
	 * to null, will disable persistancy: nothing is stored between browser
	 * sessions Setting the values to a string (or a function which returns a
	 * string), will store the ShEx doc in localstorage using the specified string.
	 * By default, the ID is dynamically generated using the closest dom ID, to avoid collissions when using multiple YASHE items on one
	 * page
	 *
	 * @type function|string
	 */
  persistent: function(yashe) {
    return "yashe_" + $(yashe.getWrapperElement()).closest("[id]").attr("id") + "_queryVal";
  },

});
