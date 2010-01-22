var VersionManager = (function() {

	var object = (function() {
		function F() {
		}
		return function(o) {
			F.prototype = o;
			return new F();
		};
	})();

	var proxy = function(type) {
		function F(a) {
			return (this instanceof F) ? new type(a) : type.call(this, a);
		}
		F.prototype = object(type.prototype);
		return F;
	};

	var apply = function(tgt, src) {
		for (var p in src)
			if (src.hasOwnProperty(p)) {
				tgt[p] = src[p];
			}
		return tgt;
	};

	var assignDispatchToPrototype = function(Base, Basename, property) {
		Base.prototype[property] = function() {
			if (VersionManager.currentVersion[Basename].prototype
					.hasOwnProperty(property)) {
				return VersionManager.currentVersion[Basename].prototype[property]
						.apply(this, arguments);
			}
			throw new Error(property + " is not defined on " + Basename
					+ ".prototype");

		};
	};

	var defineGlobalNames = function(tgt, names) {
		for (var i = 0, N = names.length; i < N; i++) {
			tgt[names[i]] = null;
		}
		return tgt;
	};

	var definePrototypeExtensions = function(tgt, basename, Base, names) {
		tgt[basename] = tgt[basename] || proxy(Base);
		for (var i = 0, N = names.length; i < N; i++) {
			assignDispatchToPrototype(Base, basename, names[i]);
		}
		return tgt;
	};

	var BaseTypes = {
		Function : Function,
		Object : Object,
		String : String,
		Number : Number,
		Date : Date,
		Array : Array
		/* Math: Math */
	};

	return {
		version : function(v) { // with (VersionManager.version("1.1.1") {})
			return this.currentVersion = this.sandboxes[v];
		},
		define : function(spec) {
			var sig = defineGlobalNames({}, spec.Global || []);
			for (var p in BaseTypes)
				if (BaseTypes.hasOwnProperty(p)) {
					if (spec.hasOwnProperty(p)) {
						definePrototypeExtensions(sig, p, BaseTypes[p], spec[p]);
					} else {
						sig[p] = proxy(BaseTypes[p]);
					}
				}
			this.sandboxes[spec.version] = sig;
			return this.version(spec.version);
		},
		sandboxes : {},
		currentVersion : null
	};
})();