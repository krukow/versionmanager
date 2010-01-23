/*!
 * @license
 * @preserve,
 * The MIT License
 * --
 * Copyright (c) <2010> Karl Krukow <kkr@trifork.com> and Jimmy Juncker <jju@trifork.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * --
 *
 * @package JSMin
 * @author Karl Krukow <kkr@trifork.com> 
 * @author Jimmy Juncker <jju@trifork.com>
 * @copyright 2010 Karl Krukow <kkr@trifork.com>
 * @copyright 2010 Jimmy Juncker <jju@trifork.com>
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @link http://github.com/krukow/versionmanager
 * @version 0.1 (alpha)
 */
var VersionManager = (function() {
		/**
		 * Crockford/Cornford/Lasse Reichstein Nielsen's object function
		 * @see http://groups.google.com/group/comp.lang.javascript/msg/e04726a66face2a2
		 * @param {Object} origin
		 * @return object with origin as its prototype
		 */
		var object = (function() {
			function F() {}
			return function(o) {
				F.prototype = o;
				return new F();
			};
		})();

		/**
		 * create a proxyConstructor of a given ConstructorFn type
		 * @param ConstructorFnName
		 * @param ConstructorFn
		 * @return
		 */
		var proxyConstructor = function(ConstructorFnName, ConstructorFn) {
			function F(a) {
				return (this instanceof F) ? new ConstructorFn(a) : ConstructorFn.call(this, a); 
			}
            
			F.prototype = F._proxyprototype = object(ConstructorFn.prototype);
			
			var name, consProtoSig = prototypeSignatures[ConstructorFnName];
			for (p in consProtoSig) {
				name = consProtoSig[p];
				F[name] = ConstructorFn[name];
			}
			return F;
		};
		
		var proxyGlobalProperties = function(tgt, props) {
			if (!props || !props.length > 0) {return tgt;}
			var i = props.length;
			while (--i >= 0) tgt[props[i]] = null;
	        tgt[props[0]] = null; 
			return tgt;
		};
		
		var createDelegateToVersionFn = function(ConstructorFnName, property) {
			return function() {
				var version = VersionManager.currentVersion; 
				if (!version) {
					throw new "attempt call to delegate with no version defined (see documentation)";
				}
				var target = version[ConstructorFnName]._proxyprototype[property];
				if (target) {
					return target.apply(this, arguments);
				}
				throw "property: "+property+" is not defined on "+ConstructorFnName+".prototype in version [" + VersionManager.currentVersion.version + "]";
			};
		};
		var definePrototypeExtensions = function(ConstructorFnName, ConstructorFn, props) {
			if (!props || props.length <= 0) return;
			var realProto = ConstructorFn.prototype,
				prop,
				i = props.length;
	        while (--i >= 0) {
	        	prop = props[i];
	        	realProto[prop] = createDelegateToVersionFn(ConstructorFnName, prop);
	     	}
		};

		var globalObjectProperties = {
			//Constructors
			Object: Object,
			Function: Function,
			Array: Array,
			String: String,
			Boolean: Boolean,
			Number: Number,
			Date: Date,
			RegExp: RegExp,
			Error: Error,
			EvalError: EvalError,
			RangeError: RangeError,
			ReferenceError: ReferenceError,
			SyntaxError: SyntaxError,
			TypeError: TypeError,
			URIError:URIError,
			//Other
			Math: Math,
			JSON: JSON
		};

		//Not updated yet... todo
		var prototypeSignatures = {
			Array: ['concat', 'join', 'pop', 'push', 'reverse', 'shift', 'slice', 'sort', 'splice', 'toSource', 'toString', 'unshift', 'valueOf'],
			Boolean: ['toSource', 'toString', 'valueOf'],
			Date: ['Date', 'getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds', 'getTime', 'getTimezoneOffset', 'getUTCDate', 'getUTCDay', 'getUTCMonth', 'getUTCFullYear', 'getUTCHours', 'getUTCMinutes', 'getUTCSeconds', 'getUTCMilliseconds', 'getYear', 'parse', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCMonth', 'setUTCFullYear', 'setUTCHours', 'setUTCMinutes', 'setUTCSeconds', 'setUTCMilliseconds', 'setYear', 'toDateString', 'toGMTString', 'toLocaleDateString', 'toLocaleTimeString', 'toLocaleString', 'toSource', 'toString', 'toTimeString', 'toUTCString', 'UTC', 'valueOf'],
			Math: ['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan', 'toSource', 'valueOf', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'PI', 'SQRT1_2', 'SQRT2'],
			Number: ['toExponential', 'toFixed', 'toPrecision', 'toString', 'valueOf', 'NaN'],
			String: ['anchor', 'big', 'blink', 'bold', 'charAt', 'charCodeAt', 'concat', 'fixed', 'fontcolor', 'fontsize', 'fromCharCode', 'indexOf', 'italics', 'lastIndexOf', 'link', 'match', 'replace', 'search', 'slice', 'small', 'split', 'strike', 'sub', 'substr', 'substring', 'sup', 'toLowerCase', 'toUpperCase', 'toSource', 'valueOf']
		};

		return {
			version : function(v) {
				if (!this.sandboxes[v]) {throw "version: "+v+" is not defined.";}
				return this.currentVersion = this.sandboxes[v];
			},
			define: function(spec) {
				if (!spec || !spec.version) {throw "bad specification: define must be called with a correct specification object (see documentation)";}
				var sig = proxyGlobalProperties({}, spec.global || []),
					p, spec_p, Cons;
				for (p in globalObjectProperties) {
					Cons = globalObjectProperties[p];
					sig[p] = sig[p] || proxyConstructor(p, Cons);
					spec_p = spec[p];
					if (spec_p) {
						definePrototypeExtensions(p, Cons, spec_p);
					} 
				}
				this.sandboxes[spec.version] = sig;
				return this.version(spec.version); 
			},
			sandboxes: {},
			currentVersion : null,
			clear: function() {
				this.currentVersion = null;
			},
			complete: function(v) {
					if (!this.sandboxes[v]) {throw "cannot complete: version '"+v+"' is not defined.";}
					var sig = this.sandboxes[v];
					for (var p in globalObjectProperties) {
						sig[p].prototype = globalObjectProperties[p].prototype;
					}
			},
			globalObjectProperties: globalObjectProperties,
			prototypeSignatures: prototypeSignatures
		};
})();