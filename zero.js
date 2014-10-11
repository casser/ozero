var Class = require('./class');

Class.inject(String,{
    toClassName : function(){
        var path = this.toString();
        path = path.split('/');
        path = path[path.length-1];
        path = path.split('.')[0].split('-');
        path.forEach(function(item,i,arr){
            arr[i] = item.charAt(0).toUpperCase()+item.substring(1);
        });
        return path.join('');
    }
});

/**
 * Zero class controling module scope definitions
 * exports and requirements
 * @class Zero
 */
var Zero  = Class.define('Zero',Object,{
    constructor : function(scope){
        this.scope = scope;
    },
    import      : function(imports){
        var key,path,content,options,settings = imports,contents = {};
        if(typeof(settings)=='string'){
            settings = {}
            settings[imports] = arguments[1] ? arguments[1] : '*'
        }
        for(path in settings){
            contents[path] = this.scope.module.require(path);
        }

        for(path in contents){
            content = contents[path];
            options = settings[path];
            if(options=='?'){
                this.scope[path.toClassName()] = content;
            }else
            if(options=='*'){
                for(key in content){
                    this.scope[key] = content[key];
                }
            }else
            if(options instanceof Array){
                for(var k=0;k<options.length;k++){
                    key = options[k];
                    this.scope[key] = content[key];
                }
            }else
            if(typeof(options)=='string'){
                this.scope[options] = content;
            }else
            if(typeof(options)=='object'){
                for(key in options){
                    if(typeof(options[key])=='string'){
                        this.scope[options[key]] = content[key];
                    } else
                    if(typeof(options[key])=='boolean'){
                        this.scope[key] = content[key];
                        if(options[key]){
                            this.scope.module.exports[key] =content[key];
                        }
                    } else {
                        this.scope[key] = content[key];
                    }
                }
            }
        }

    },
    export      : function(name,parent,body){
        if(arguments.length>=3){
            var definition = this.define.apply(this,arguments);
            this.scope.module.exports[name] = definition;
            return definition;
        }else
        if(arguments.length==1){
            var object = arguments[0];
            this.define(object);
            if(typeof(object) =='function'){
                this.scope.module.exports[object.name] = object;
            }else
            if(typeof(object) =='object'){
                for(var key in object){
                    this.scope.module.exports[key] = object[key];
                }
            }
        }
    },
    define      : function(name,parent,body){
        if(arguments.length>=3){
            return this.scope[name] = Class.define.apply(Class,arguments);
        }else
        if(arguments.length==1){
            var object = arguments[0];
            if(typeof(object) =='function'){
                this.scope[object.name] = object;
            }else
            if(typeof(object) =='object'){
                for(var key in object){
                    this.scope[key] = object[key];
                }
            }
        }
    },
    inject      : function(parent,body){
        Class.inject.apply(Class,arguments);
    }
});

/**
 * Scope class holding all definitions for current module,
 * the actual module code can be binded to instance of scope
 * with 'with' statement.
 * @class Scope
 */
var Scope = Class.define('Scope',Object,{
    constructor : function(module,imports){
        this.module = module;
        this.O = new Zero(this);
        this.o = this.O;
        this.require = this.o.import.bind(this.o);
        if(imports){
            this.o.import(imports);
        }
    }
});



module.exports = function (module){
    return new Scope(module);
}