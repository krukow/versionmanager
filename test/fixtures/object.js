with (VersionManager.version("1.6.1")) {

var Person = function(name){
    this.name = name;
};

Person.prototype.toJSON = function() {
  return '-' + this.name;
};
}