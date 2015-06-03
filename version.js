module.exports = function Version(major, minor, patch) {
  this.major = major || 0
  this.minor = minor || 0
  this.patch = patch || 0

  this.isEqual = function(v) {
    if (arguments.length === 1) {
      return
        v.major === this.major &&
          v.minor === this.minor &&
            v.patch === this.patch;
    }
    else if (arguments.length === 3) {
      return
        arguments[0] === this.major &&
          arguments[1] === this.minor &&
            arguments[2] === this.patch
    }
  }

  this.isGreaterThan = function (v) {
    return v.isEqual(this) ? false : 
      v.major > this.major ? false :
        v.minor > this.minor ? false :
          v.patch > this.patch ? false : true
  }

  this.isLessThan = function (v) {
    return v.isEqual(this) ? false :
      v.major < this.major ? false :
        v.minor < this.minor ? false :
          v.patch < this.patch ? false : true
  }

  this.toString = function () {
    return (this.major + '.' + this.minor + '.' + this.patch)
  }
}
