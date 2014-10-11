with(require('../')(module)){

    o.define('Some', Object, {
        constructor : function(name){
            this.name = name;
        }
    });

    o.export('Other', Some, {
        constructor : function(name){
            this.super(name);
        }
    });

    console.info(new Other('Other OF Simple Module'));
}