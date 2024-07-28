// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
	mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
	define(["../../lib/codemirror"], mod);
	else // Plain browser env
	mod(CodeMirror);
})(function(CodeMirror) {
	"use strict";
	
	CodeMirror.defineMode('mllike', function(_config, parserConfig) {
		var after_cmp = false;
		var words = {
			'global': 'builtin',
			'pattern': 'builtin',
			'without': 'builtin',
			'with': 'builtin',
		};
		
		function tokenBase(stream, state) {
			var ch = stream.next();
			
			if (ch === '"') {
				state.tokenize = tokenString;
				return state.tokenize(stream, state);
			}
			if (ch === '/' && after_cmp) {
				state.tokenize = pcreString;
				return state.tokenize(stream, state);
			}
			
			if (ch === '%' ) {
				stream.skipToEnd();
				return 'comment';
			}
			
			if (ch === '=' ) {
				after_cmp = true;
				return 'quote';
			}
			
			if (ch === '<') {
				if (stream.eat('>')) {
					after_cmp = true;
					return 'quote';
				}
			}
			
			if (ch === '-') {
				var next_ch = stream.next();
				if (next_ch === '[') {
					return 'quote';
				}
				if (next_ch === ">") {
					if (stream.eat(">")) {
						return 'quote';
					} else {
					  return 'quote';
					}
				}
			}
			
			if (ch === ']') {
				if (stream.eat('-') && stream.eat(">")) {
					return 'quote';
				}
			}
			
			
			
			if (/\d/.test(ch)) {
				stream.eatWhile(/[\d]/);
				if (stream.eat('.')) {
					stream.eatWhile(/[\d]/);
				}
				return 'number';
			}
			if ( /[+\-*&%=<>!?|]/.test(ch)) {
				return 'operator';
			}
			stream.eatWhile(/\w/);
			var cur = stream.current();
			after_cmp = false;
			return words[cur] || 'variable';
		}
		
		function tokenString(stream, state) {
			var next, end = false, escaped = false;
			while ((next = stream.next()) != null) {
				if (next === '"' && !escaped) {
					end = true;
					break;
				}
				escaped = !escaped && next === '\\';
			}
			if (end && !escaped) {
				state.tokenize = tokenBase;
			}
			after_cmp = false;
			return 'string';
		}

		function pcreString(stream, state) {
			var next, end = false, escaped = false;
			while ((next = stream.next()) != null) {
				if (next === '/' && !escaped) {
					end = true;
					break;
				}
				escaped = !escaped && next === '\\';
			}
			if (end && !escaped) {
				state.tokenize = tokenBase;
			}
			return 'string';
		}
		
		return {
			startState: function() {return {tokenize: tokenBase, commentLevel: 0};},
			token: function(stream, state) {
				if (stream.eatSpace()) return null;
				return state.tokenize(stream, state);
			},
			lineComment: "%"
		};
	});
	
	CodeMirror.defineMIME("text/grew", "grew");
});
