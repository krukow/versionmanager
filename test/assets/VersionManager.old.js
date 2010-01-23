var VersionManager = (function() {
		var object = (function() {
		function F() {}
		return function(o) {
			F.prototype = o;
			return new F();
		};
		})();

		var proxy = function(basename, Base) {
			function F(a) {
				return (this instanceof F) ? new Base(a) : Base.call(this, a); 
			}
            
			F.prototype = F.pprototype = object(Base.prototype);
			
			var m;
			for (p in BuiltInFunctions[basename]) {
				m = BuiltInFunctions[basename][p];
				F[m] = Base[m];
			}
			return F;
		};

		var apply = function(tgt, src) {
			for (var p in src) if (src.hasOwnProperty(p)) {
				tgt[p] = src[p];
			}
			return tgt;
		};

		var assignDispatchToPrototype = function(Base, Basename, property) {
			Base.prototype[property] = function() {
				if (VersionManager.currentVersion[Basename].pprototype.hasOwnProperty(property)) {
					return VersionManager.currentVersion[Basename].pprototype[property].apply(this, arguments);
				}
				throw new Error(property+" is not defined on "+Basename+".prototype [" + VersionManager.currentVersion.version + "]");

			};
		};

		var defineGlobalNames = function(tgt, names) {
			for (var i = 0, N = names.length; i < N; i++) {
				tgt[names[i]] = null;
			}
			return tgt;
		};

		var definePrototypeExtensions = function(tgt, basename, Base, names) {
			tgt[basename] = tgt[basename] || proxy(basename, Base);
			
			for (var i = 0, N = names.length; i < N; i++) {
				assignDispatchToPrototype(Base,basename,names[i]);
			}
			
			return tgt;
		};

		var BaseTypes = {
			Array: Array,
			Boolean: Boolean,
			Date: Date,
			Error: Error,
			EvalError: EvalError,
			Math: Math,
			Number: Number,
			String: String,
			Function: Function,
			Object: Object,
			TypeError: TypeError
		};
		
		//RegExp: ['compile', 'exec', 'test'] <- do not add since these are methods on prototype and not the type obj
		
		var BuiltInFunctions = {
			Array: ['concat', 'join', 'pop', 'push', 'reverse', 'shift', 'slice', 'sort', 'splice', 'toSource', 'toString', 'unshift', 'valueOf'],
			Boolean: ['toSource', 'toString', 'valueOf'],
			Date: ['Date', 'getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds', 'getTime', 'getTimezoneOffset', 'getUTCDate', 'getUTCDay', 'getUTCMonth', 'getUTCFullYear', 'getUTCHours', 'getUTCMinutes', 'getUTCSeconds', 'getUTCMilliseconds', 'getYear', 'parse', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCMonth', 'setUTCFullYear', 'setUTCHours', 'setUTCMinutes', 'setUTCSeconds', 'setUTCMilliseconds', 'setYear', 'toDateString', 'toGMTString', 'toLocaleDateString', 'toLocaleTimeString', 'toLocaleString', 'toSource', 'toString', 'toTimeString', 'toUTCString', 'UTC', 'valueOf'],
			Math: ['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan', 'toSource', 'valueOf', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'PI', 'SQRT1_2', 'SQRT2'],
			Number: ['toExponential', 'toFixed', 'toPrecision', 'toString', 'valueOf', 'NaN'],
			String: ['anchor', 'big', 'blink', 'bold', 'charAt', 'charCodeAt', 'concat', 'fixed', 'fontcolor', 'fontsize', 'fromCharCode', 'indexOf', 'italics', 'lastIndexOf', 'link', 'match', 'replace', 'search', 'slice', 'small', 'split', 'strike', 'sub', 'substr', 'substring', 'sup', 'toLowerCase', 'toUpperCase', 'toSource', 'valueOf'],
		};

		return {
			version : function(v) { //with (VersionManager.version("1.1.1") {})
			return this.currentVersion = this.sandboxes[v];
		},
		define: function(spec) {
			var sig = defineGlobalNames({}, spec.Global || []);
			for (var p in BaseTypes)  if (BaseTypes.hasOwnProperty(p)) {
				if (spec.hasOwnProperty(p)) {
					definePrototypeExtensions(sig, p, BaseTypes[p], spec[p]);
				} else {
					sig[p] = proxy(p, BaseTypes[p]);
				}
			}
			this.sandboxes[spec.version] = sig;
			return this.version(spec.version); 
		},
		sandboxes: {},
		currentVersion : null,
		complete: function(v) {
				var sig = this.sandboxes[v];
				for (var p in BaseTypes)  if (BaseTypes.hasOwnProperty(p)) {
						sig[p].prototype = BaseTypes[p].prototype;
					}
		}
	};
	})();