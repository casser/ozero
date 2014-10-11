with(require('../')(module)){
    require('./utils','Utils');
    o.define({
        fireEvent       : function(event){
            if (
                event.target.class.hasOwnProperty('events') &&
                event.target.class.events.hasOwnProperty(event.type)
            ){
                var remove,error=false,emitter=event.target,listener,listeners = findListener(emitter,{event:event.type})
                if(listeners){
                    remove = false;
                    while(listeners.length){
                        listener = listeners.pop();
                        listener.callback.apply(null,[event].concat(event.data));
                        error = error || !!event.error;
                        if(listener.once){
                            remove = listener.remove = true;
                        }
                        if(event.canceled){
                            break;
                        }
                    };

                    if(remove){
                        listeners = [];
                        emitter.listeners.forEach(function(listener){
                            if(!listener.remove){
                                listeners.push(listener);
                            }
                        })
                        emitter.listeners = listeners;
                    }
                }
                return event;
            }else{
                throw Error('invalid event type "'+event.type+'", "'+event.target.class.name+'" support only following events ['+Object.keys(event.target.class.events)+']');
            }

        },
        addListener     : function(emitter,event,callback,once){
            var name = Utils.isObject(event)? event.type : event;
            if (
                emitter.class.hasOwnProperty('events') &&
                emitter.class.events.hasOwnProperty(name)
            ){
                var lis = {
                    event       : name,
                    type        : emitter.class.events[name],
                    callback    : callback,
                    once        : once
                };
                var old = findListener(emitter,lis);
                if(!old){
                    emitter.listeners.push(lis);
                }
                return emitter;
            }else{
                throw Error('invalid event type "'+name+'", "'+event.target.class.name+'" support only following events ['+Object.keys(emitter.class.events)+']');
            }

        },
        removeListener  : function(emitter,listener){
            if(!emitter.listeners){
                emitter.listeners = [];
            }
            var list = [];
            while(emitter.listeners.length){
                var item = emitter.listeners.shift();
                if(!((listener.callback && item.callback == listener.callback) || item.event == listener.event)){
                    list.push(item)
                }
            }
            emitter.listeners = [];
        },
        findListener    : function(emitter,listener){
            if(!emitter.listeners){
                Object.defineProperty(emitter,'listeners',{
                    enumerable  : false,
                    value       : []
                });
            }
            var list = [];
            for(var l=0;l<emitter.listeners.length;l++){
                var item = emitter.listeners[l];
                if(listener.callback){
                    if(listener.callback && item.callback === listener.callback){
                        list.push(item)
                    }
                } else
                if(item.event=='*' || item.event == listener.event){
                    list.push(item)
                }
            }
            if(list.length){
                return list;
            }else{
                return false;
            }
        }
    });

    /**
     * @class Event
     */
    o.export('Event', Object, {
        constructor : function(target,type,data){
            Object.defineProperty(this,'event',{
                enumerable   : true,
                configurable : false,
                value        : this.class.name
            })
            Object.defineProperty(this,'target',{
                enumerable   : false,
                configurable : false,
                value        : target
            })
            Object.defineProperty(this,'type',{
                enumerable   : true,
                configurable : false,
                value        : type
            })
            if(Utils.isDefined(data)){
                if(!Utils.isArray(data)){
                    data = [data];
                }
                if(data.length>0) {
                    Object.defineProperty(this, 'data', {
                        enumerable: true,
                        configurable: false,
                        value: data
                    })
                }
            }
        },
        clone       : function(target,type,data){
            return new (this.constructor)(
                target || this.target,
                type   || this.type,
                data   || this.data
            );
        },
        inspect     : function(){
            return this.toString();
        },
        toString    : function(){
            return '['+this.class.name+' '+this.type+(this.data?' '+JSON.stringify(this.data):'')+']';
        }
    });

    /**
     * @class Emitter
     */
    o.export('Emitter',Object,{
        static  : function(closure){
            if(closure.class != this.class) {
                var parent = closure.class;
                while (parent != this.class) {
                    if(parent.class != Object.class) {
                        parent.class.events = Utils.merge(parent.parent.class.events || {}, parent.class.events || {});
                        parent = parent.parent.class;
                    }else{
                        break;
                    }
                }
                for(var e in closure.class.events){
                    closure['ON_'+e.toUpperCase()]={
                        type    : e,
                        event   : closure.class.events[e]
                    };
                }
            }

        },
        constructor : function(options){
            for(var key in options){
                if(key.indexOf('on:')==0 && Utils.isFunction(options[key])){
                    this.on(key.substring(3),options[key]);
                }else{
                    this[key] = options[key];
                }
            }
        },
        on          : function(event,callback){
            return addListener(this,event,callback,false);
        },
        no          : function(event,callback){
            return removeListener(this,event,callback);
        },
        once        : function(event,callback){
            return addListener(this,event,callback,true);
        },
        emit        : function(event){
            if(Utils.isObject(event) && event.hasOwnProperty('type')){
                event = event.type;
            }
            if(Utils.isString(event)){
                var EventType = this.class.events[event].constructor;
                if(EventType) {
                    event = Utils.toArray(arguments);
                    event = new EventType(this,event.shift(),event);
                }
            }
            if(event instanceof Event){
                return fireEvent(event.clone(this));
            }else{
                throw new Error('invalid event type '+event);
            }
        }
    });
}