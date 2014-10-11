!!function(){
    function Helpers(){}
    Helpers.FUNCTION_STATICS        = function (){
        return Object.getOwnPropertyNames(Function)
    }();
    Helpers.toArray                 = function (target){
        var result = [];
        for(var i=0;i<target.length;i++){
            result.push(target[i]);
        }
        return result;
    }
    Helpers.isFunction              = function (target){
        return (typeof (target) == 'function');
    }
    Helpers.makeClosure             = function (name,parent,callback) {
        eval(
            'var closure = function '+name+'(){\n' +
            '  var _super = this.super;\n' +
            '  this.super=parent.bind(this);\n' +
            '  var result = callback.apply(this,arguments);\n' +
            '  this.super=_super;\n' +
            '  if(typeof(this.super)!="function"){delete this.super;}\n' +
            '  return result;\n' +
            '}'
        );
        return closure;
    }
    Helpers.makeConstructorClosure  = function (name,parent,callback) {
        eval(
            'var closure = function '+name+'(){\n' +
            '  var _super = this.super;\n' +
            '  this.super=parent.bind(this);\n' +
            '  callback.apply(this,arguments);\n' +
            '  this.super=_super;\n' +
            '  if(typeof(this.super)!="function"){delete this.super;}\n' +
            '}'
        );
        return closure;
    }
    Helpers.setPrototypeOf          = function (instance, proto) {
        instance.__proto__ = proto;
        return instance;
    };
    Helpers.getPrototypeOf          = function (instance) {
        return Object.getPrototypeOf(instance);
    };
    Helpers.defineClassAccessor     = function (target){
        if(target && !target.hasOwnProperty('class')){
            Object.defineProperty(target, 'class', {
                enumerable      : false,
                configurable    : false,
                get             : function getter(){
                    if(typeof(this) == 'function'){
                        return Class.retrieve(this);
                    }else{
                        if(this.constructor && typeof(this.constructor) =='function'){
                            return Class.retrieve(this.constructor)
                        }
                    }
                    return null;
                }
            });
        }
    }
    Helpers.isEmpty                 = function (v){
        return v==null || v==undefined || v=="";
    }
    Helpers.definePatchMethod       = function (target){
        if(target && !target.hasOwnProperty('patch')){
            Object.defineProperty(target, 'patch', {
                enumerable      : false,
                configurable    : false,
                value           : function patch(target){
                    for(var key in target){
                        if(target.hasOwnProperty(key)){
                            if(typeof(this[key]) == 'object' && typeof(target[key])=='object'){
                                if(this[key] instanceof Array && target[key] instanceof Array){
                                    this[key].splice(0,this[key].length);
                                    for(var i=0;i<target[key].length;i++){
                                        this[key].push(target[key][i]);
                                    }
                                } else {
                                    this[key].patch(target[key]);
                                }
                            }else
                            if(Helpers.isEmpty(target[key])){
                                delete this[key];
                            }else{
                                this[key] = target[key];
                            }
                        }
                    }
                    return this;
                }
            });
        }
    }
    Helpers.definePrivateAccessor   = function (target){
        if(target && !target.hasOwnProperty('private')){
            Object.defineProperty(target, 'private', {
                configurable    : false,
                enumerable      : false,
                get             : function(){
                    if(!this.protected){
                        Object.defineProperty(this,'protected',{
                            writable     : false,
                            configurable : false,
                            enumerable   : false,
                            value        : {}
                        })
                    }
                    return this.protected;
                }
            });
        }
    }
    Helpers.defineProperties        = function (target,properties) {
        Object.defineProperties(target,properties)
    }
    Helpers.exportClass             = function (definitions){
        if(typeof(module) !== "undefined"){
            if(Object.keys(module.parent.exports).length>0){
                if(Helpers.isFunction(module.parent.exports)){
                    var Old = module.parent.exports;
                    var Exp = {};
                    Exp[Old.name] = Old;
                    module.parent.exports = Exp;
                }
                module.parent.exports[definitions.name] = definitions;
            }else{
                module.parent.exports = definitions;
            }
        }
    }
    Helpers.exportDefinitions       = function (definitions){
        if (typeof(exports) !== "undefined") {
            module.exports = definitions;
        } else
        if (typeof(define) !== "undefined") { // amd
            define(key,function(){return definitions});
        } else {
            window[definitions.name] = definitions;
        }

    }
    Helpers.getFunctionName         = function (target) {
        return target.name !== undefined && target.name.length ? target.name : 'Anonymous';
    }
    Helpers.methodDescriptor        = function (value) {
        return {
            enumerable      : false,
            confugurable    : false,
            writable        : false,
            value           : value
        }
    }
    Helpers.constantDescriptor      = function (value) {
            return {
                enumerable      : true,
                confugurable    : false,
                writable        : false,
                value           : value
            }
        }
    Helpers.getParentFunction       = function (target) {
        var proto = Object.getPrototypeOf(target.prototype);
        if(proto) {
            return proto;
        }else{
            return null;
        }
    }
    Helpers.getParentClass          = function (target) {
        var proto = Helpers.getParentFunction(target);
        if(proto) {
            return proto.class;
        }else{
            return null;
        }
    }
    Helpers.makeClassMember         = function (descriptor,cls) {
        var member;
        if(Helpers.isFunction(descriptor.value)){
            member = new Helpers.ClassMethod(descriptor,cls);
        }else{
            member = new Helpers.ClassField(descriptor,cls);
        }
        return member;
    }
    Helpers.getClassDefinition      = function (constructor,cls) {
        if(!Helpers.isFunction(constructor)){
            throw new Error('invalid argument, constructor should be a function');
        }
        var i,key,property,definition=[];
        var sFields = Object.getOwnPropertyNames(constructor); // static fields
        var iFields = Object.getOwnPropertyNames(constructor.prototype); // instance fields

        for(i=0;i<sFields.length;i++){
            key = sFields[i];
            if(Helpers.FUNCTION_STATICS.indexOf(key)<0) {
                property = Object.getOwnPropertyDescriptor(constructor, key);
                property.name = key;
                property.static = true;
                definition.push(Helpers.makeClassMember(property,cls));
            }
        }
        for(i=0;i<iFields.length;i++){
            key = iFields[i];
            if(key!='constructor'){
                property        = Object.getOwnPropertyDescriptor(constructor.prototype,key);
                property.name   = key;
                property.static = false;
                definition.push(Helpers.makeClassMember(property,cls));
            }
        }
        return definition;
    }
    Helpers.ClassMethod             = function Method(options,cls){
        Helpers.defineProperties(this, {
            static              : Helpers.constantDescriptor(options.static),
            name                : Helpers.constantDescriptor(options.name),
            type                : Helpers.constantDescriptor('method'),
            enumerable          : Helpers.constantDescriptor(false),
            confugurable        : Helpers.constantDescriptor(true),
            definition          : Helpers.constantDescriptor(cls),
            value               : Helpers.constantDescriptor(options.value),
            toJSON              : Helpers.methodDescriptor(function(){
                var json        = {
                    class       : this.definition.name,
                    static      : this.static,
                    name        : this.name,
                    type        : this.type,
                    value       : this.value.toString()
                }
                return json;
            }),
            overrides           : Helpers.methodDescriptor(function(){
                if(this.definition.parent){
                    return this.definition.parent.get({
                        type        : this.type,
                        name        : this.name,
                        static      : this.static
                    });
                }
                return false;
            }),
            clone               : Helpers.methodDescriptor(function(cls){
                return new (Helpers.ClassMethod)({
                    static          :this.static,
                    name            :this.name,
                    type            :this.type,
                    enumerable      :this.enumerable,
                    confugurable    :this.confugurable,
                    value           :this.value.bind(cls)
                },cls);
            })
        });
    }
    Helpers.ClassField              = function Field(options,cls){
        Helpers.defineProperties(this, {
            static              : Helpers.constantDescriptor(options.static),
            name                : Helpers.constantDescriptor(options.name),
            type                : Helpers.constantDescriptor('field'),
            enumerable          : Helpers.constantDescriptor(true),
            confugurable        : Helpers.constantDescriptor(true),
            value               : Helpers.constantDescriptor(options.value),
            toJSON              : Helpers.methodDescriptor(function(){
                var json        = {
                    static      : this.static,
                    name        : this.name,
                    type        : this.type,
                    value       : this.value,
                }
                return json;
            }),
        });
    }


    function Class(constructor){
        if(constructor.__class__ !== undefined){
            throw new Error('Class Already Defined');
        }
        var base    = constructor;
        var name    = Helpers.getFunctionName(base)
        var parent  = Helpers.getParentClass(base);
        var members = Helpers.getClassDefinition(base,this)
        var id      = Class.classes.push(this)-1;
        var traits  = [];
        Helpers.defineProperties(this, {
            id                          : Helpers.constantDescriptor(id),
            constructor                 : Helpers.methodDescriptor(base),
            name                        : Helpers.constantDescriptor(name),
            members                     : Helpers.constantDescriptor(members),
            parent                      : Helpers.constantDescriptor(parent),
            traits                      : Helpers.constantDescriptor(traits),
            find                        : Helpers.methodDescriptor(function(options){
                var result = [];
                for(var i=0;i<members.length;i++){
                    var member = members[i];
                    var match  = true;
                    for(var key in options){
                        if(!(member[key] == options[key])){
                            match = false;
                            break;
                        }
                    }
                    if(match){
                        result.push(member);
                    }
                }
                return result;
            }),
            get                        : Helpers.methodDescriptor(function(options){
                for(var i=0;i<members.length;i++){
                    var member = members[i];
                    var match  = true;
                    for(var key in options){
                        if(!(member[key] == options[key])){
                            match = false;
                            break;
                        }
                    }
                    if(match){
                        return member;
                    }
                }
                if(this.parent){
                    return parent.get(options);
                }
            }),
            toString            : Helpers.methodDescriptor(function(){
                return '[class '+this.id+':'+this.name+(this.parent?' < '+this.parent.name:'')+']';
            }),
            toJSON              : Helpers.methodDescriptor(function(){
                var json        = {
                    id          : id,
                    name        : name,
                    members     : []
                }
                if(parent){
                    json.parent = parent.toJSON();
                }
                members.forEach(function(member){
                    json.members.push(member.toJSON());
                })
                return json;
            }),
            inspect             : Helpers.methodDescriptor(function(){
                return this.toJSON();
            })
        });
        base.__class__ = this.id;
    }

    // initialization
    Helpers.defineClassAccessor(Object.prototype);
    Helpers.definePatchMethod(Object.prototype);


    Helpers.defineProperties(Class, {
        classes             : Helpers.constantDescriptor([]),
        retrieve            : Helpers.methodDescriptor(function(target){
            if(target instanceof this){
                return target;
            }else
            if(typeof(target) === 'function'){
                if(target.__class__ === undefined){
                    new this(target);
                }
                return this.retrieve(target.__class__)
            }else
            if(typeof(target) === 'number'){
                return this.classes[target];
            }else
            if(typeof(target) === 'string'){
                eval('var _target = '+target);
                return this.retrieve(_target);
            }else
            if(typeof(target) === 'object'){
                if(this.constructor && typeof(this.constructor) =='function'){
                    return this.retrieve(this.constructor)
                }
            } else {
                throw Error('invalid argument type')
            }
        }),
        define              : Helpers.methodDescriptor(function(){
            var construct,fields,scope,key,keys,property,statics=[],member,members={},metadata={};
            var args    = Helpers.toArray(arguments);
            var name    = args.shift();
            var body    = args.pop();
            var traits  = Helpers.toArray(args);
            if(Helpers.isFunction(body)){
                traits.push(body);
                body = {};
            }
            if(traits.length==0){
                traits.push(Object);
            }
            var parent  = traits.shift();

            // extract static members
            if(body.hasOwnProperty('#static')){
                statics = Object.getOwnPropertyNames(body['#static']);
                statics.forEach(function(key){
                    Object.defineProperty(body,key,Object.getOwnPropertyDescriptor(body['#static'], key));
                });
                delete body['#static'];
            }

            // extract instance members
            if(body.hasOwnProperty('#instance')){
                keys = Object.getOwnPropertyNames(body['#instance']);
                keys.forEach(function(key){
                    Object.defineProperty(body,key,Object.getOwnPropertyDescriptor(body['#instance'], key));
                })
                delete body['#instance'];
            }

            construct = body.hasOwnProperty('constructor') ? body.constructor : parent;
            delete body.constructor;

            var closure     = Helpers.makeConstructorClosure(name,parent,construct);
            var prototype   = Helpers.setPrototypeOf(closure.prototype,parent.prototype);


            for(key in body){
                if(body.hasOwnProperty(key)){
                    if(key.charAt(0)=='#'){
                        metadata[key.substring(1)] = body[key];
                    }else {
                        property = Object.getOwnPropertyDescriptor(body, key);
                        property.name = key;
                        property.static = (key == 'static' || statics.indexOf(key) >= 0);
                        members[key] = property;
                    }
                }
            }


            for(key in members){
                member = members[key];
                if(Helpers.isFunction(member.value)){
                    member.type = 'method';
                    var sm = parent.class.get({
                        type    : member.type,
                        name    : member.name,
                        static  : member.static
                    });
                    if(sm){
                        member.value = Helpers.makeClosure(key,sm.value,member.value);
                    }
                }else{
                    member.type = 'field';
                }
                if(member.static){
                    if(Helpers.isFunction(member.value)){
                        //member.value = member.value.bind(closure)
                    }
                    Object.defineProperty(closure,key,member);
                }else{
                    Object.defineProperty(prototype,key,member);
                }
            }

            // adding metadata
            if(metadata){
                keys = Object.getOwnPropertyNames(metadata);
                keys.forEach(function(key){
                    if(!closure.class.hasOwnProperty(key)) {
                        Object.defineProperty(
                            closure.class, key, Object.getOwnPropertyDescriptor(metadata, key)
                        );
                    }
                })
            }

            Helpers.definePrivateAccessor(closure);
            Helpers.definePrivateAccessor(closure.prototype);

            var closureTraits = [];
            if(traits.length>0){
                for(var i=0;i<traits.length;i++){
                    var trait   = traits[i];
                    if(closureTraits.indexOf(trait)<0){
                        var methods = trait.class.find({
                            type    :'method'
                        });
                        for(var s=0;s<methods.length;s++){
                            var method = methods[s];
                            if(method.name!='static') {
                                if (method.static) {
                                    if (!closure.hasOwnProperty(method.name)) {
                                        closure[method.name] = method.value.bind(closure);
                                    }
                                } else {
                                    if (!prototype.hasOwnProperty(method.name)) {
                                        Object.defineProperty(prototype, method.name, method);
                                    }
                                }
                            }
                        }
                        closureTraits.push(trait);
                    }
                }
            }

            if(closureTraits.length>0){
                closureTraits.forEach(function(trait){
                    closure.class.traits.push(trait);
                    if(Helpers.isFunction(trait.static)){
                        trait.static(closure);
                    }
                })
            }



            if(Helpers.isFunction(closure.static)){
                closure.static(closure);
            } else {
                var sm = parent.class.get({
                    type    : 'method',
                    name    : 'static'
                });
                if(sm) {
                    sm.value(closure);
                }
            }

            return closure;
        }),
        inject              : Helpers.methodDescriptor(function(parent,body){
            var statics=[],key,keys,member;
            // extract static members
            if(body.hasOwnProperty('#static')){
                statics = Object.getOwnPropertyNames(body['#static']);
                statics.forEach(function(key){
                    Object.defineProperty(body,key,Object.getOwnPropertyDescriptor(body['#static'], key));
                });
                delete body['#static'];
            }
            // extract instance members
            if(body.hasOwnProperty('#instance')){
                keys = Object.getOwnPropertyNames(body['#instance']);
                keys.forEach(function(key){
                    Object.defineProperty(body,key,Object.getOwnPropertyDescriptor(body['#instance'], key));
                })
                delete body['#instance'];
            }

            for(key in body){
                if(body.hasOwnProperty(key)){
                    member = Object.getOwnPropertyDescriptor(body, key);
                    member.name = key;
                    member.static = statics.indexOf(key)>=0;
                    if(Helpers.isFunction(member.value)){
                        member.type = 'method';
                        var sm = parent.class.get({
                            type    : member.type,
                            name    : member.name,
                            static  : member.static
                        });
                        if(sm){
                            member.value = Helpers.makeClosure(key,sm.value,member.value);
                        }
                    }else{
                        member.type = 'field';
                    }
                    if(member.static){
                        Object.defineProperty(parent,key,member);
                    }else{
                        Object.defineProperty(parent.prototype,key,member);
                    }
                }
            }
        })
    });
    Helpers.exportDefinitions(Class)

}();