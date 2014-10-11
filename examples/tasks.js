with(require('../')(module)){

    require('../core/task');


    /**
     * @class SimpleTask
     */
    o.export('SimpleTask',Task,{
        '#events'    : {
            'done'   : Event.class,
            'jan'    : Event.class
        },
        constructor:function(data){
            this.super(data);
        },
        execute  : function(){
            setTimeout(this.done.bind(this,'Simple Task Executed'),1000);
        }
    });

    new Sequence({
        settings    : {},
        tasks       : [
            new RestRequest({
                settings    : {
                    method  : 'GET',
                    url     : 'http://registry.npmjs.org/ozero'
                },
                'on:done'   : function(event,result){
                    console.info(result);
                }
            }),
            new RestRequest({
                settings    : {
                    method  : 'GET',
                    url     : 'http://registry.npmjs.org/ozero'
                },
                'on:done'   : function(event,result){
                    console.info(result);
                }
            })
        ]
    }).do();

}