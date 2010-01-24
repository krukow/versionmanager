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
 * @package VersionManager
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
	 * 
	 * @see http://groups.google.com/group/comp.lang.javascript/msg/e04726a66face2a2
	 * @param {Object}
	 *            origin
	 * @return object with origin as its prototype
	 */
	var object = (function() {
		function F() {
		}
		return function(o) {
			F.prototype = o;
			return new F();
		};
	})();

	/**
	 * create a proxyConstructor of a given ConstructorFn type
	 * 
	 * @param ConstructorFnName
	 * @param ConstructorFn
	 * @return
	 */
	var proxyConstructor = function(ConstructorFnName, ConstructorFn) {
		function F() {
			if (this instanceof F) {
				if (!arguments.length) {
					return new ConstructorFn();
				}
				if (arguments.length == 1) {
					return new ConstructorFn(arguments[0]);
				}
				if (arguments.length == 2) {
					return new ConstructorFn(arguments[0], arguments[1]);
				}
				if (arguments.length == 3) {
					return new ConstructorFn(arguments[0], arguments[1],
							arguments[2]);
				}
				if (arguments.length == 4) {
					return new ConstructorFn(arguments[0], arguments[1],
							arguments[2], arguments[3]);
				}
				if (arguments.length == 5) {
					return new ConstructorFn(arguments[0], arguments[1],
							arguments[2], arguments[3], arguments[4]);
				}
				// ... more if needed..
			} else {
				return ConstructorFn.apply(this, arguments);
			}
		}

		F.prototype = F._proxyprototype = object(ConstructorFn.prototype);

		var name, sig = globalsSignatures[ConstructorFnName], i;
		if (sig && sig.length) {
			i = sig.length;
			while (--i >= 0) {
				name = sig[i];
				F[name] = ConstructorFn[name];
			}
		}
		return F;
	};

	var proxyGlobalProperties = function(tgt, props) {
		var i;
		if (props && props.length > 0) {
			i = props.length;
			while (--i >= 0) {
				tgt[props[i]] = null;
			}
			return tgt;
		}
		return tgt;
	};

	var createDelegateToVersionFn = function(ConstructorFnName, property) {
		return function() {
			var version = VersionManager.currentVersion;
			if (!version) {
				throw "attempt call to delegate with no version defined (see documentation)";
			}
			var target = version[ConstructorFnName]._proxyprototype[property];
			if (target) {
				return target.apply(this, arguments);
			}
			throw "property: " + property + " is not defined on "+ ConstructorFnName + ".prototype in version [" + VersionManager.currentVersion.version + "]";
		};
	};
	var definePrototypeExtensions = function(ConstructorFnName, ConstructorFn, props) {
		var realProto, prop, i;
		if (props && props.length > 0) {
			realProto = ConstructorFn.prototype;
			i = props.length;
			while (--i >= 0) {
				prop = props[i];
				realProto[prop] = createDelegateToVersionFn(ConstructorFnName,
						prop);
			}
		}
	};
	
	var globalObject = (function(){return this;})();

	var globalObjectProperties = [
	        "Object",
	        "Function",
	        "Array",
	        "String",
	        "Boolean",
	        "Number",
	        "Date",
	        "RegExp",
	        "Error",
	        "EvalError",
	        "RangeError",
	        "ReferenceError",
	        "SyntaxError",
	        "TypeError",
	        "URIError",
	        "Math",
	        "JSON"
	];
	

	var globalsSignatures = {
		Object: ['getPrototypeOf','getOwnPropertyDescriptor','getOwnPropertyNames','create',
		         'defineProperty','defineProperties','seal','freeze','preventExtensions',
		         'isSealed','isFrozen','isExtensible','keys'],
        Function: ['length'],
        Array : [ 'isArray'],
		String : [ 'fromCharCode'],
		Number : [ 'MAX_VALUE', 'MIN_VALUE', 'NaN', 'NEGATIVE_INFINITY',
					'POSITIVE_INFINITY'],
		Math : [ 'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp',
				'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin',
				'sqrt', 'tan', 'E', 'LN2', 'LN10',
				'LOG2E', 'LOG10E', 'PI', 'SQRT1_2', 'SQRT2' ],
		Date : [ 'parse ','UTC','now'],
		JSON: ['parse', 'stringify']
	};

	return {
		version : function(v) {
			if (!this.sandboxes[v]) {
				throw "version: " + v + " is not defined.";
			}
			return (this.currentVersion = this.sandboxes[v]);
		},
		define : function(spec) {
			if (!spec || !spec.version) {
				throw "bad specification: define must be called with a correct specification object (see documentation)";
			}
			var sig = proxyGlobalProperties( {}, spec.global || []), 
				i = globalObjectProperties.length, name, specForName, Cons;
			while (--i >= 0) {
				name = globalObjectProperties[i];
				Cons = globalObject[name];
				if (Cons) {
					sig[name] = sig[name] || proxyConstructor(name, Cons);
					specForName = spec[name];
					if (specForName) {
						definePrototypeExtensions(name, Cons, specForName);
					}
				}
			}
			this.sandboxes[spec.version] = sig;
			return this.version(spec.version);
		},
		sandboxes : {},
		currentVersion : null,
		clear : function() {
			this.currentVersion = null;
		},
		complete : function(v) {
			if (!this.sandboxes[v]) {
				throw "cannot complete: version '" + v + "' is not defined.";
			}
			var sig = this.sandboxes[v],
				i = globalObjectProperties.length, name;
			while (--i >= 0) {
				name = globalObjectProperties[i];
				if (sig[name]) {
					sig[name].prototype = globalObject[name].prototype;
				}
			}
		},
		globalObjectProperties : globalObjectProperties,
		globalsSignatures : globalsSignatures
	};
})();