
if (typeof(exports) !== "undefined"){
    Class = require('../class');
}
function assert(message,condition){
    if(condition){
        console.info("Passed: "+ message);
    }else{
        console.error("Failed: "+ message);
    }
}
function Collection(some){
    console.info('Collection Constructor '+some)
    Array.prototype.constructor.apply(this,arguments);
}
Collection.prototype.__proto__ = Array.prototype;
Collection.prototype.constructor = Collection

function Set(){
    console.info('Set Constructor')
    Collection.prototype.constructor.apply(this,arguments);
}
Set.prototype.__proto__ = Collection.prototype;
Set.prototype.constructor = Set

function tests() {
    assert('(new Set()).class instanceof Class', (new Set()).class instanceof Class);
    assert('Collection.class !== {}.class', Collection.class !== {}.class);
    assert('Number.class == Number.class', Number.class === Number.class);
    assert('Number.class == (5).class ', Number.class === (5).class);
    assert('Array.class === [].class', Array.class === [].class);
    assert('Object.class === {}.class', Object.class === {}.class);
    assert('Function.class !== (function(){}).class', Function.class !== (function () {
    }).class);
    assert('Collection.class === (new Collection()).class', Collection.class === (new Collection()).class);


    assert('Object.class instanceof Class', Object.class instanceof Class);
    assert('Class.class instanceof Class', Class.class instanceof Class);

    console.info(Class.class.name, Class.class.keys.sort().join(','));
    console.info(Object.class.name, Object.class.keys.sort().join(','))
    console.info(Function.class.name, Function.class.keys.sort().join(','))
    console.info(String.class.name, String.class.keys.sort().join(','))
    console.info(Set.class.name, Set.class.keys.sort().join(','))

    console.info(JSON.stringify(Class.classes, null, '  '))

}

/**
 * @class Some
 * @extends Set
 */
var Some = Class.define('Some',Object,{
    get name(){
        return this.private.name;
    },
    set name(v){
        this.private.name = v;
    },
    constructor  : function(arg){
        console.info('Some Constructor');
        this.name = arg;
    },
    hello        : function(msg){
        return 'Hello '+this.name+' '+msg;
    },
    toJSON       : function(){
      return     {
          name   : this.name
      };
    }
});
/**
 * @class Some
 * @extends Some
 */
var Middle = Class.define('Other',Some,{
    constructor     : function(v){
        console.info('Middle Constructor');
        this.super(v)
    },
    hello          : function(some){
        return this.super('Other '+some);
    }
});
/**
 * @class Some
 * @extends Some
 */
var Other = Class.define('Other',Middle,{
    constructor     : function(){
        console.info('Other Constructor');
        this.super('Hehe')
    },
     hello          : function(some){
        return this.super('Other '+some);
    }
});
var other = new Other();
console.info(other.hello('Gago'))