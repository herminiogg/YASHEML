"use strict";
var CodeMirror = require("codemirror");
let $ = require('jquery');

CodeMirror.defineMode("shex", function(config, parserConfig) {
 // var indentUnit = config.indentUnit;

  var grammar = require("./_tokenizer-table.js");
  var ll1_table = grammar.table;

  var DIGIT = "[0-9]";
  var LETTER = "[A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]";
  var ALLOWED_CHARACTERS = "\\||\\*|_|\\/|%|-|\\(|\\)" +
   "|\\?|=|&|#|\\^|[|]|[\\\\]|'";

  var URLBEGINNING = "(http|https|file):\\/\\/"
  var JDBCURLBEGINNING = "jdbc:"+"("+LETTER+"|"+DIGIT+")"+"*"+":(\\/\\/)?" 
  var URL = "("+URLBEGINNING+"|"+JDBCURLBEGINNING+")" + "("+LETTER+"|"+DIGIT+"|"+ALLOWED_CHARACTERS+"|\\.|:)*";
  var DIGITS = DIGIT + "+";
  var STRING_OPERATOR = '\\"' + "(" + URLBEGINNING + ")?" + "("+LETTER+"|"+DIGIT+"|"+ALLOWED_CHARACTERS+'|\\.| )+\\"' ;
  //var STRINGOPERATOR_AUTOINCREMENT = STRING_OPERATOR ;
  var STRING_OR_VAR = "("+LETTER+"|"+DIGIT+"|"+ALLOWED_CHARACTERS+"|_|-|%2E)+" ;
  var JSONPATH = "jsonpath:";
  var XMLPATH = "xpath:";
  var CSVPERROW = "csvperrow";
  var SQL = "sql:";
  //var URI_VAR = "("+LETTER+"|"+DIGIT+"| '_' | '-' | '\\.' | '%2E')* ':'";
  //var URI_VAR_QUERY = "("+LETTER+"|"+DIGIT+"| '_')* ':'";
  //var STRING_OR_VAR_QUERY = LETTER + "("+LETTER+"|"+DIGIT+"| '_')*";
  //var STRING_OR_VAR_AUTOINCREMENT = LETTER + "("+LETTER+"|"+DIGIT+"| '_')*";


  //var XMLSCHEMADATATYPEPREFIX = "(xs|xsd)";
  /**var ALLOWEDTYPES = "(string|boolean|decimal|integer|double|float|date|time"+
  "dateTime|dateTimeStamp|gYear|gMonth|gDay|gYearMonth|gMonthDay|duration"+
  "yearMonthDuration|dayTimeDuration|byte|short|int|long|unsignedByte|unsignedShort"+
  "unsignedInt|unsignedLong|positiveInteger|nonNegativeInteger|negativeInteger"+
  "nonPositiveInteger|hexBinary|base64Binary|anyURI|language|normalizedString|token"+
  "NMTOKEN|Name|NCName)";*/


  var IRI_REF = '<[^<>"`\|\{\}\^\\\x00-\x20]*>';

  //var RDF_TYPE = 'a';


  var PN_CHARS_BASE = "[A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]";
  var PN_CHARS_U = PN_CHARS_BASE + "|_";

  var PN_CHARS = "(" + PN_CHARS_U + "|-|[0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040])";
  

 var OR = "OR"
 var AND = "AND"
 var NOT = "NOT"


  var PN_PREFIX = "(" + PN_CHARS_BASE + ")(((" + PN_CHARS + ")|\\.)*(" + PN_CHARS + "))?";

  var HEX = "[0-9A-Fa-f]";
  var PERCENT = "(%" + HEX + HEX + ")";
  var PN_LOCAL_ESC = "(\\\\[_~\\.\\-!\\$&'\\(\\)\\*\\+,;=/\\?#@%])";
  var PLX = "(" + PERCENT + "|" + PN_LOCAL_ESC + ")";
  var PN_LOCAL = "(" +
    PN_CHARS_U +
    "|:|[0-9]|" +
    PLX +
    ")((" +
    PN_CHARS +
    "|\\.|:|" +
    PLX +
    ")*(" +
    PN_CHARS +
    "|:|" +
    PLX +
    "))?";
  var BLANK_NODE_LABEL = "_:(" + PN_CHARS_U + "|[0-9])((" + PN_CHARS + "|\\.)*" + PN_CHARS + ")?";
  var PNAME_NS = "(" + PN_PREFIX + ")?:";
  var PNAME_LN = PNAME_NS + PN_LOCAL;

 // var ATPNAME_NS = "@[a-zA-Z]*:";
  var ATPNAME_LN = "@"+PNAME_LN +'|'+ "@"+IRI_REF +'|'+ "@"+BLANK_NODE_LABEL; 



  var LANGTAG = "@[a-zA-Z]+(-[a-zA-Z0-9]+)*";

  var EXPONENT = "[eE][\\+-]?[0-9]+";
  var INTEGER = "[0-9]+";
  var DECIMAL = "(([0-9]+\\.[0-9]*)|(\\.[0-9]+))";
  var DOUBLE = "(([0-9]+\\.[0-9]*" + EXPONENT + ")|" + "(\\.[0-9]+" + EXPONENT + ")|" + "([0-9]+" + EXPONENT + "))";

  

  var ECHAR = "\\\\[tbnrf\\\\\"']";

  var REPEAT_RANGE = "{"+INTEGER+"(\\,("+INTEGER+"|\\*)?)?}"

  var UCHAR = "\\u "+HEX+HEX+HEX+HEX+"| \\U "+HEX+HEX+HEX+HEX+HEX+HEX+HEX+HEX
  var CODE = "{ ([^%\\\\] | \\\\ [%\\\\] | "+UCHAR+")*%}"
  var REGEXP = "\\~\\/ ([^\\x2f\\x5C\\xA\\xD] | \\\\ [tbnrf\\\\/] | "+UCHAR+")* \\/ [smix]*"


  //IMPORTANT: this unicode rule is not in the official grammar.
  //Reason: https://github.com/YASGUI/YASQE/issues/49
  //unicode escape sequences (which the sparql spec considers part of the pre-processing of sparql queries)
  //are marked as invalid. We have little choice (other than adding a layer of complixity) than to modify the grammar accordingly
  //however, for now only allow these escape sequences in literals (where actually, this should be allows in e.g. prefixes as well)
  var hex4 = HEX + "{4}";
  var unicode = "(\\\\u" + hex4 + "|\\\\U00(10|0" + HEX + ")" + hex4 + ")";
  var LINE_BREAK = "\n";
  var STRING_LITERAL1 = "'(([^\\x27\\x5C\\x0A\\x0D])|" + ECHAR + "|" + unicode + ")*'";
  var STRING_LITERAL2 = '"(([^\\x22\\x5C\\x0A\\x0D])|' + ECHAR + "|" + unicode + ')*"';

  var STRING_LITERAL_LONG = {
    SINGLE: {
      CAT: "STRING_LITERAL_LONG1",
      QUOTES: "'''",
      CONTENTS: "(('|'')?([^'\\\\]|" + ECHAR + "|" + unicode + "))*"
    },
    DOUBLE: {
      CAT: "STRING_LITERAL_LONG2",
      QUOTES: '"""',
      CONTENTS: '(("|"")?([^"\\\\]|' + ECHAR + "|" + unicode + "))*"
    }
  };
  for (var key in STRING_LITERAL_LONG) {
    STRING_LITERAL_LONG[key].COMPLETE = STRING_LITERAL_LONG[key].QUOTES +
      STRING_LITERAL_LONG[key].CONTENTS +
      STRING_LITERAL_LONG[key].QUOTES;
  }


  //some regular expressions not used in regular terminals, because this is used accross lines
  var stringLiteralLongRegex = {};
  for (var key in STRING_LITERAL_LONG) {
    stringLiteralLongRegex[key] = {
      complete: {
        name: "STRING_LITERAL_LONG_" + key,
        regex: new RegExp("^" + STRING_LITERAL_LONG[key].COMPLETE),
        style: "string"
      },
      contents: {
        name: "STRING_LITERAL_LONG_" + key,
        regex: new RegExp("^" + STRING_LITERAL_LONG[key].CONTENTS),
        style: "string"
      },
      closing: {
        name: "STRING_LITERAL_LONG_" + key,
        regex: new RegExp("^" + STRING_LITERAL_LONG[key].CONTENTS + STRING_LITERAL_LONG[key].QUOTES),
        style: "string"
      },
      quotes: {
        name: "STRING_LITERAL_LONG_QUOTES_" + key,
        regex: new RegExp("^" + STRING_LITERAL_LONG[key].QUOTES),
        style: "string"
      }
    };  
  }

  var WS = "[\\x20\\x09\\x0D\\x0A]";
  // Careful! Code mirror feeds one line at a time with no \n
  // ... but otherwise comment is terminated by \n
  var COMMENT = "#([^\\n\\r]*[\\n\\r]|[^\\n\\r]*$)";
  //var WS_OR_COMMENT_STAR = "(" + WS + "|(" + COMMENT + "))*";
  //var NIL = "\\(" + WS_OR_COMMENT_STAR + "\\)";
  //var ANON = "\\[" + WS_OR_COMMENT_STAR + "\\]";
  var terminals = [
    {
      name: "WS",
      regex: new RegExp("^" + WS + "+"),
      style: "ws"
    },

    {
      name: "COMMENT",
      regex: new RegExp("^" + COMMENT),
      style: "comment"
    },

    
 /**   {
      name: "OR",
      regex: new RegExp("^" + OR),
      style: "logical"
    },  */

    {
      name: "AND",
      regex: new RegExp("^" + AND),
      style: "logical"
    },

 /**   {
      name: "NOT",
      regex: new RegExp("^" + NOT),
      style: "logical"
    },

   

    {
      name: "IRI_REF",
      regex: new RegExp("^" + IRI_REF),
      style: "variable-3"
    },
   
    {
      name: "DOUBLE",
      regex: new RegExp("^" + DOUBLE),
      style: "number"
    },

    {
      name: "DECIMAL",
      regex: new RegExp("^" + DECIMAL),
      style: "number"
    },

    {
      name: "INTEGER",
      regex: new RegExp("^" + INTEGER),
      style: "number"
    },

    {
      name: "STRING_LITERAL1",
      regex: new RegExp("^" + STRING_LITERAL1),
      style: "string"
    },

    {
      name: "STRING_LITERAL2",
      regex: new RegExp("^" + STRING_LITERAL2),
      style: "string"
    },

  
    {
      name: "PNAME_LN",
      regex: new RegExp("^" + PNAME_LN),
      style: "string-2"
    },

    {
      name: "PNAME_NS",
      regex: new RegExp("^" + PNAME_NS),
      style: "string-2"
    },

    {
      name: "BLANK_NODE_LABEL",
      regex: new RegExp("^" + BLANK_NODE_LABEL),
      style: "string-2"
    },

    {
      name: "ATPNAME_LN",
      regex: new RegExp("^" + ATPNAME_LN),
      style: "at"
    },

    {
      name: "REPEAT_RANGE",
      regex: new RegExp("^" + REPEAT_RANGE),
      style: "at"
    }

    ,

    {
      name: "REPEAT_RANGE",
      regex: new RegExp("^" + REPEAT_RANGE),
      style: "at"
    }

    ,

    {
      name: "UCHAR",
      regex: new RegExp("^" + UCHAR),
      style: "at"
    }
    ,

    {
      name: "CODE",
      regex: new RegExp("^" + CODE),
      style: "at"
    }
    ,

    {
      name: "REGEXP",
      regex: new RegExp("^" + REGEXP),
      style: "at"
    }  */
    //,

    {
      name: "LANGTAG",
      regex: new RegExp("^" + LANGTAG),
      style: "at"
    },
    {
      name: "DIGITS",
      regex: new RegExp("^" + DIGITS),
      style: "number"
    },
    {
      name: "JSONPATH",
      regex: new RegExp("^" + JSONPATH),
      style: "variable-2"
    },
    {
      name: "XMLPATH",
      regex: new RegExp("^" + XMLPATH),
      style: "variable-2"
    },
    {
      name: "SQL",
      regex: new RegExp("^" + SQL),
      style: "variable-2"
    },
    {
      name: "CSVPERROW",
      regex: new RegExp("^" + CSVPERROW),
      style: "variable-2"
    },
    /**{
      name: "STRINGOPERATOR_AUTOINCREMENT",
      regex: new RegExp("^" + STRINGOPERATOR_AUTOINCREMENT),
      style: "at"
    },
    {
      name: "XMLSCHEMADATATYPEPREFIX",
      regex: new RegExp("^" + XMLSCHEMADATATYPEPREFIX),
      style: "at"
    },
    {
      name: "ALLOWEDTYPES",
      regex: new RegExp("^" + ALLOWEDTYPES),
      style: "at"
    },
    {
      name: "URI_VAR_QUERY",
      regex: new RegExp("^" + URI_VAR_QUERY),
      style: "string"
    },
    {
      name: "STRING_OR_VAR_QUERY",
      regex: new RegExp("^" + STRING_OR_VAR_QUERY),
      style: "string"
    },
    {
      name: "STRING_OR_VAR_AUTOINCREMENT",
      regex: new RegExp("^" + STRING_OR_VAR_AUTOINCREMENT),
      style: "string"
    }, 
    {
      name: "URI_VAR",
      regex: new RegExp("^" + URI_VAR),
      style: "string"
    }, */
    {
      name: "URL",
      regex: new RegExp("^" + URL),
      style: "string"
    },
    {
      name: "STRING_OR_VAR",
      regex: new RegExp("^" + STRING_OR_VAR),
      style: "variable"
    },
    {
      name: "STRINGOPERATOR",
      regex: new RegExp("^" + STRING_OPERATOR),
      style: "string"
    }
    

  ];

  function getPossibles(symbol) {
    var possibles = [], possiblesOb = ll1_table[symbol];
    if (possiblesOb != undefined) {
      for (var property in possiblesOb) {
        possibles.push(property.toString());
      }
    } else {
      possibles.push(symbol);
    }
    return possibles;
  }

  function tokenBase(stream, state) {
    function nextToken() {
      var consumed = null;
      if (state.inLiteral) {
        var closingQuotes = false;
        //multi-line literal. try to parse contents.
        consumed = stream.match(stringLiteralLongRegex[state.inLiteral].contents.regex, true, false);
        if (consumed && consumed[0].length == 0) {
          //try seeing whether we can consume closing quotes, to avoid stopping
          consumed = stream.match(stringLiteralLongRegex[state.inLiteral].closing.regex, true, false);
          closingQuotes = true;
        }

        if (consumed && consumed[0].length > 0) {
          //some string content here.
          var returnObj = {
            quotePos: closingQuotes ? "end" : "content",
            cat: STRING_LITERAL_LONG[state.inLiteral].CAT,
            style: stringLiteralLongRegex[state.inLiteral].complete.style,
            text: consumed[0],
            start: stream.start
          };
          if (closingQuotes) state.inLiteral = false;
          return returnObj;
        }
      }

      //Multiline literals
      for (var quoteType in stringLiteralLongRegex) {
        consumed = stream.match(stringLiteralLongRegex[quoteType].quotes.regex, true, false);
        if (consumed) {
          var quotePos;
          if (state.inLiteral) {
            //end of literal. everything is fine
            state.inLiteral = false;
            quotePos = "end";
          } else {
            state.inLiteral = quoteType;
            quotePos = "start";
          }
          return {
            cat: STRING_LITERAL_LONG[quoteType].CAT,
            style: stringLiteralLongRegex[quoteType].quotes.style,
            text: consumed[0],
            quotePos: quotePos,
            start: stream.start
          };
        }
      }

      // Keywords
      consumed = stream.match(grammar.keywords, true, false);
      if (consumed){
        return {
          cat: stream.current().toUpperCase(),
          style: "keyword",
          text: consumed[0],
          start: stream.start
        };
      }

      // Punctuation
      consumed = stream.match(grammar.punct, true, false);

      if(stream.current() == 'a') {
        return {
          cat: stream.current(),
          style: "variable",
          text: consumed[0],
          start: stream.start
        }
      }

      if(stream.current() == 'xs' || stream.current() == 'xsd') {
        return {
          cat: stream.current(),
          style: "variable",
          text: consumed[0],
          start: stream.start
        }
      }

      if (consumed && stream.pos <= stream.string.length) {
        if(stream.current()!='*' 
          && stream.current()!='+'
          && stream.current()!='?'){

          return {
            cat: stream.current(),
            style: "punc",
            text: consumed[0],
            start: stream.start
          };
        }

        return {
          cat: stream.current(),
          style: "card",
          text: consumed[0],
          start: stream.start
        };

      
      }


    
      // Tokens defined by individual regular expressions
      for (var i = 0; i < terminals.length; ++i) {

        consumed = stream.match(terminals[i].regex, true, false);
        if (consumed) {
   
          let lastPos = $.trim(stream.string).length-1;
          let lastToken = $.trim(stream.string)[lastPos];
          let token = stream.current();
          //Is a shapeExprLabel?
          /**if(lastToken == '{'  && (token.includes(':') || token.includes('<') )){
             return {
              cat: terminals[i].name,
              style: 'shape',
              text: consumed[0],
              start: stream.start
             };
          }*/

      

          return {
            cat: terminals[i].name,
            style: terminals[i].style,
            text: consumed[0],
            start: stream.start
          };

        }
        
      
        
      }



      // Token is invalid
      // better consume something anyway, or else we're stuck
      consumed = stream.match(/^.[A-Za-z0-9]*/, true, false);
      return {
        cat: "<invalid_token>",
        style: "error",
        text: consumed[0],
        start: stream.start
      };
    }

    function recordFailurePos() {
      // tokenOb.style= "sp-invalid";
      var col = stream.column();
      state.errorStartPos = col;
      state.errorEndPos = col + tokenOb.text.length;
    }

    // Some fake non-terminals are just there to have side-effect on state
    // - i.e. allow or disallow variables and bnodes in certain non-nesting
    // contexts
    function setSideConditions(topSymbol) {
      if (topSymbol === "prefix") {
        state.inPrefixDecl = true;
      } else {
        state.inPrefixDecl = false;
      }
      switch (topSymbol) {
        case "disallowVars":
          state.allowVars = false;
          break;
        case "allowVars":
          state.allowVars = true;
          break;
        case "disallowBnodes":
          state.allowBnodes = false;
          break;
        case "allowBnodes":
          state.allowBnodes = true;
          break;
        case "storeProperty":
          state.storeProperty = true;
          break;
      }
    }

    function checkSideConditions(topSymbol) {
      return (state.allowVars || topSymbol != "var") &&
        (state.allowBnodes ||
          (topSymbol != "blankNode" &&
            topSymbol != "blankNodePropertyList" &&
            topSymbol != "blankNodePropertyListPath"));
    }

    // CodeMirror works with one line at a time,
    // but newline should behave like whitespace
    // - i.e. a definite break between tokens (for autocompleter)
    if (stream.pos == 0) state.possibleCurrent = state.possibleNext;

    var tokenOb = nextToken();

    if (tokenOb.cat == "<invalid_token>") {
      // set error state, and
      if (state.OK == true) {
        state.OK = false;
        recordFailurePos();
      }
      state.complete = false;
      // alert("Invalid:"+tokenOb.text);
      return tokenOb.style;
    }
  
    if (tokenOb.cat == "WS" || tokenOb.cat == "COMMENT" || (tokenOb.quotePos && tokenOb.quotePos != "end")) {
      state.possibleCurrent = state.possibleNext;
      return tokenOb.style;
    }
    // Otherwise, run the parser until the token is digested
    // or failure
    var finished = false;
    var topSymbol;
    var token = tokenOb.cat;

    if (!tokenOb.quotePos || tokenOb.quotePos == "end") {
      // Incremental LL1 parse
      while (state.stack.length > 0 && token && state.OK && !finished) {
        topSymbol = state.stack.pop();
        var nextToken = stream.string[stream.pos];
        if (topSymbol === 'allowedIdentifiers' && tokenOb.text && nextToken == ' ') state.variables[tokenOb.text] = tokenOb.text;
        if (!ll1_table[topSymbol]) {
          // Top symbol is a terminal
          if (topSymbol == token) {
            if (state.inPrefixDecl) {
              if (topSymbol === "PREFIX" /**&& yashe.getPreviousNonWsToken(stream.line(), token) == "PREFIX"*/) {
                var prefixName = stream.string.replace(/<.*>|PREFIX|prefix| /g, "")
                var prefixURI = stream.string.match(/<.*>/g);
                //state.currentPnameNs = prefixName.slice(0, -1);
                if(prefixURI)
                  state.prefixes[prefixName.slice(0, -1)] = prefixURI[0].slice(1, -1);
              /**} else if (state.currentPnameNs !== undefined && tokenOb.text.length > 2) {
                state.prefixes[state.currentPnameNs] = tokenOb.text.slice(1, -1);
                //reset current pname ns
                state.currentPnameNs = undefined;
              } */
              }
            }
            // Matching terminals
            // - consume token from input stream
            finished = true;
            //setQueryType(topSymbol);
            // Check whether $ (end of input token) is poss next
            // for everything on stack
            var allNillable = true;
            for (var sp = state.stack.length; sp > 0; --sp) {
              var item = ll1_table[state.stack[sp - 1]];
              if (!item || !item["$"]) allNillable = false;
            }
            state.complete = allNillable;
            if (state.storeProperty && token.cat != "punc") {
              state.lastProperty = tokenOb.text;
              state.storeProperty = false;
            }

            //check whether a used prefix is actually defined
            if (!state.inPrefixDecl && (token === "PNAME_NS" || token === "PNAME_LN")) {
              var colonIndex = tokenOb.text.indexOf(":");
              if (colonIndex >= 0) {
                var prefNs = tokenOb.text.slice(0, colonIndex);
                //avoid warnings for missing bif prefixes (yuck, virtuoso-specific)
                if (!state.prefixes[prefNs] && ["bif", "xsd", "sql"].indexOf(prefNs) < 0) {
                  state.OK = false;
                  recordFailurePos();
                  state.errorMsg = "Prefix '" + prefNs + "' is not defined";
                }
              }
            }
          } else {
            state.OK = false;
            state.complete = false;
            recordFailurePos();
          }
        } else {
          // topSymbol is nonterminal
          // - see if there is an entry for topSymbol
          // and nextToken in table
          var nextSymbols = ll1_table[topSymbol][token];
          if (nextSymbols != undefined && checkSideConditions(topSymbol)) {
            // Match - copy RHS of rule to stack
            for (var i = nextSymbols.length - 1; i >= 0; --i) {
              state.stack.push(nextSymbols[i]);
            }
            // Peform any non-grammatical side-effects
            setSideConditions(topSymbol);
          } else {
            // No match in table - fail
            state.OK = false;
            state.complete = false;
            recordFailurePos();
            state.stack.push(topSymbol); // Shove topSymbol back on stack
          }
        }
      }
    }
    if (!finished && state.OK) {
      state.OK = false;
      state.complete = false;
      recordFailurePos();
    }

    if (state.possibleCurrent.indexOf("a") >= 0) {
      state.lastPredicateOffset = tokenOb.start;
    }
    state.possibleCurrent = state.possibleNext;

    state.possibleNext = getPossibles(state.stack[state.stack.length - 1]);

    return tokenOb.style;
  }

  var indentTop = {
    "*[,, object]": 3,
    "*[(,),object]": 3,
    "*[(,),objectPath]": 3,
    "*[/,pathEltOrInverse]": 2,
    object: 2,
    objectPath: 2,
    objectList: 2,
    objectListPath: 2,
    storeProperty: 2,
    pathMod: 2,
    "?pathMod": 2,
    propertyListNotEmpty: 1,
    propertyList: 1,
    propertyListPath: 1,
    propertyListPathNotEmpty: 1,
    "?[verb,objectList]": 1
    //		"?[or([verbPath, verbSimple]),objectList]": 1,
  };

  var indentTable = {
    "}": 1,
    "]": 0.5,
 //   ")": 1,
    "{": -1,
 //   "(": -1,
    "[": -0.5
    //		"*[;,?[or([verbPath,verbSimple]),objectList]]": 1,
  };

  function indent(state, textAfter) {
    //just avoid we don't indent multi-line  literals
    if (state.inLiteral) return 0;
    if (state.stack.length && state.stack[state.stack.length - 1] == "?[or([verbPath,verbSimple]),objectList]") {
      //we are after a semi-colon. I.e., nicely align this line with predicate position of previous line
      return state.lastPredicateOffset;
    } else {
      var n = 0; // indent level
      var i = state.stack.length - 1;
      if (/^[\}\]\)]/.test(textAfter)) {
        // Skip stack items until after matching bracket
        var closeBracket = textAfter.substr(0, 1);
        for (; i >= 0; --i) {
          if (state.stack[i] == closeBracket) {
            --i;
            break;
          }
        }
      } else {
        // Consider nullable non-terminals if at top of stack
        var dn = indentTop[state.stack[i]];
        if (dn) {
          n += dn;
          --i;
        }
      }
      for (; i >= 0; --i) {
        var dn = indentTable[state.stack[i]];
        if (dn) {
          n += dn;
        }
      }
      return n * config.indentUnit;
    }
  }


  return {
    token: tokenBase,
    startState: function(base) {
      return {
        tokenize: tokenBase,
        OK: true,
        complete: grammar.acceptEmpty,
        errorStartPos: null,
        errorEndPos: null,
        queryType: null,
        possibleCurrent: getPossibles(grammar.startSymbol),
        possibleNext: getPossibles(grammar.startSymbol),
        allowVars: true,
        allowBnodes: true,
        storeProperty: false,
        lastProperty: "",
        inLiteral: false,
        stack: [grammar.startSymbol],
        lastPredicateOffset: config.indentUnit,
        prefixes: {},
        variables: {}
      };
    },
    indent: indent,
    electricChars: "}])"
  };
});
CodeMirror.defineMIME("application/x-shexML", "shexML");
