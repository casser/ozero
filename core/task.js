with(require('../')(module)){
    require('./emitter',{
        Emitter : true,
        Event   : true
    });

    /**
     * @class TaskEvent
     */
    o.export('TaskEvent',Event,{
        constructor : function(target,type,data){
            this.super(target,type,data);
            Object.defineProperty(this,'errors',{
                enumerable   : true,
                configurable : false,
                value        : []
            })
        },
        cancel : function(){
            console.info('hello world canceled');
        },
        error  : function(error){
            this.errors.push(error);
        }
    });

    /**
     * @class Action
     */
    o.export('Action',Emitter,{
        '#events'    : {
            'done'   : TaskEvent.class,
            'do'     : TaskEvent.class
        },
        constructor  : function(options){
            this.super(options);
            this.on(Action.ON_DO,function(e,input){
                this.state = 'doing';
                this.input = input;
                this.execute(input);
            }.bind(this));
            this.on(Action.ON_DONE,function(e,output){
                this.state  = 'done';
                this.output = output;
            }.bind(this));
        },
        do           : function(input){
            return this.emit(Action.ON_DO,input).target;
        },
        execute      : function(input){
            return this.emit(Action.ON_DONE,input).target;
        }
    });

    /**
     * @class Sequence
     */
    o.define('Sequence', Action, {
        execute         : function(input){
            this.stack   = [];
            this.results = [];
            this.tasks.forEach(function(task){
                this.stack.push(task);
            }.bind(this))
            this.next()
        },
        next            : function(event,result){
            if(event){
                this.results.push(result);
            }
            if(this.stack.length){
                this.current = this.stack.shift();
                this.current.once(Action.ON_DONE,this.next.bind(this));
                this.current.do();
            } else {
                this.emit(Action.ON_DONE,this.results);
            }
        },
        add             : function(task){
            this.tasks.push(task);
        }
    });

}